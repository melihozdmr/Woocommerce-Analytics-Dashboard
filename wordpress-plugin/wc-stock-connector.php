<?php
/**
 * Plugin Name: WC Stock Connector
 * Plugin URI: https://github.com/your-repo
 * Description: WooCommerce mağazanızı merkezi stok yönetim panelinize bağlayın. Stok ve alış fiyatı senkronizasyonu.
 * Version: 1.0.0
 * Author: Your Company
 * Text Domain: wc-stock-connector
 * Requires at least: 5.8
 * Requires PHP: 7.4
 * WC requires at least: 5.0
 */

if (!defined('ABSPATH')) {
    exit;
}

// WooCommerce kontrolü
if (!in_array('woocommerce/woocommerce.php', apply_filters('active_plugins', get_option('active_plugins')))) {
    add_action('admin_notices', function() {
        echo '<div class="error"><p><strong>WC Stock Connector</strong> için WooCommerce gereklidir.</p></div>';
    });
    return;
}

class WC_Stock_Connector {

    private static $instance = null;

    public static function get_instance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct() {
        add_action('admin_menu', array($this, 'add_admin_menu'));
        add_action('admin_init', array($this, 'register_settings'));
        add_action('rest_api_init', array($this, 'register_rest_routes'));

        // Ürün sayfasına alış fiyatı alanı ekle
        add_action('woocommerce_product_options_pricing', array($this, 'add_purchase_price_field'));
        add_action('woocommerce_process_product_meta', array($this, 'save_purchase_price_field'));
        add_action('woocommerce_variation_options_pricing', array($this, 'add_variation_purchase_price_field'), 10, 3);
        add_action('woocommerce_save_product_variation', array($this, 'save_variation_purchase_price_field'), 10, 2);

        // Ürün listesine alış fiyatı kolonu
        add_filter('manage_edit-product_columns', array($this, 'add_purchase_price_column'));
        add_action('manage_product_posts_custom_column', array($this, 'display_purchase_price_column'), 10, 2);

        // Stok değişikliği webhook'ları
        add_action('woocommerce_product_set_stock', array($this, 'on_stock_change'), 10, 1);
        add_action('woocommerce_variation_set_stock', array($this, 'on_variation_stock_change'), 10, 1);
        add_action('woocommerce_order_status_completed', array($this, 'on_order_completed'), 10, 1);
        add_action('woocommerce_order_status_processing', array($this, 'on_order_processing'), 10, 1);
    }

    public function add_admin_menu() {
        add_submenu_page(
            'woocommerce',
            'Stock Connector',
            'Stock Connector',
            'manage_woocommerce',
            'wc-stock-connector',
            array($this, 'admin_page')
        );
    }

    public function register_settings() {
        register_setting('wc_stock_connector', 'wcsc_api_key');
        register_setting('wc_stock_connector', 'wcsc_api_secret');
        register_setting('wc_stock_connector', 'wcsc_dashboard_url');
        register_setting('wc_stock_connector', 'wcsc_webhook_enabled');
        register_setting('wc_stock_connector', 'wcsc_webhook_secret');
    }

    public function admin_page() {
        $api_key = get_option('wcsc_api_key');
        $api_secret = get_option('wcsc_api_secret');
        $dashboard_url = get_option('wcsc_dashboard_url', '');
        $webhook_enabled = get_option('wcsc_webhook_enabled', '0');
        $webhook_secret = get_option('wcsc_webhook_secret', '');

        // İlk kurulumda API anahtarları oluştur
        if (empty($api_key)) {
            $api_key = 'wcsc_' . wp_generate_password(24, false);
            update_option('wcsc_api_key', $api_key);
        }
        if (empty($api_secret)) {
            $api_secret = wp_generate_password(48, false);
            update_option('wcsc_api_secret', $api_secret);
        }
        if (empty($webhook_secret)) {
            $webhook_secret = wp_generate_password(64, false);
            update_option('wcsc_webhook_secret', $webhook_secret);
        }

        // Anahtar yenileme
        if (isset($_POST['regenerate_keys']) && wp_verify_nonce($_POST['_wpnonce'], 'wcsc_regenerate')) {
            $api_key = 'wcsc_' . wp_generate_password(24, false);
            $api_secret = wp_generate_password(48, false);
            update_option('wcsc_api_key', $api_key);
            update_option('wcsc_api_secret', $api_secret);
            echo '<div class="updated"><p>API anahtarları yenilendi!</p></div>';
        }

        // Webhook ayarları kaydetme
        if (isset($_POST['save_webhook_settings']) && wp_verify_nonce($_POST['_wpnonce'], 'wcsc_webhook_settings')) {
            $dashboard_url = sanitize_url($_POST['wcsc_dashboard_url']);
            $webhook_enabled = isset($_POST['wcsc_webhook_enabled']) ? '1' : '0';
            update_option('wcsc_dashboard_url', $dashboard_url);
            update_option('wcsc_webhook_enabled', $webhook_enabled);
            echo '<div class="updated"><p>Webhook ayarları kaydedildi!</p></div>';
        }

        // Webhook testi
        if (isset($_POST['test_webhook']) && wp_verify_nonce($_POST['_wpnonce'], 'wcsc_test_webhook')) {
            $test_result = $this->send_test_webhook();
            if ($test_result['success']) {
                echo '<div class="updated"><p>Webhook testi başarılı!</p></div>';
            } else {
                echo '<div class="error"><p>Webhook testi başarısız: ' . esc_html($test_result['error']) . '</p></div>';
            }
        }
        ?>
        <div class="wrap">
            <h1>WC Stock Connector</h1>

            <div class="card" style="max-width: 700px; padding: 20px; margin-top: 20px;">
                <h2>Bağlantı Bilgileri</h2>
                <p>Bu bilgileri stok yönetim panelinize mağaza eklerken kullanın:</p>

                <table class="form-table">
                    <tr>
                        <th>Site URL</th>
                        <td>
                            <input type="text" class="regular-text" value="<?php echo esc_url(get_site_url()); ?>" readonly onclick="this.select();" style="width: 100%;">
                        </td>
                    </tr>
                    <tr>
                        <th>API Key</th>
                        <td>
                            <input type="text" class="regular-text" value="<?php echo esc_attr($api_key); ?>" readonly onclick="this.select();" style="width: 100%;">
                        </td>
                    </tr>
                    <tr>
                        <th>API Secret</th>
                        <td>
                            <input type="password" class="regular-text" value="<?php echo esc_attr($api_secret); ?>" readonly onclick="this.select(); this.type='text';" style="width: 100%;">
                            <p class="description">Tıklayınca görünür. Kimseyle paylaşmayın!</p>
                        </td>
                    </tr>
                </table>

                <form method="post" style="margin-top: 15px;">
                    <?php wp_nonce_field('wcsc_regenerate'); ?>
                    <button type="submit" name="regenerate_keys" class="button" onclick="return confirm('Anahtarları yenilemek istediğinize emin misiniz?');">
                        Anahtarları Yenile
                    </button>
                </form>
            </div>

            <div class="card" style="max-width: 700px; padding: 20px; margin-top: 20px;">
                <h2>API Endpoint'leri</h2>
                <table class="widefat striped">
                    <thead>
                        <tr>
                            <th>Endpoint</th>
                            <th>Method</th>
                            <th>Açıklama</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><code>/wp-json/wcsc/v1/verify</code></td>
                            <td>GET</td>
                            <td>Bağlantıyı doğrula</td>
                        </tr>
                        <tr>
                            <td><code>/wp-json/wcsc/v1/products</code></td>
                            <td>GET</td>
                            <td>Ürünleri listele (alış fiyatı dahil)</td>
                        </tr>
                        <tr>
                            <td><code>/wp-json/wcsc/v1/stock/update</code></td>
                            <td>POST</td>
                            <td>Stok güncelle (tekli/toplu)</td>
                        </tr>
                        <tr>
                            <td><code>/wp-json/wcsc/v1/purchase-price/update</code></td>
                            <td>POST</td>
                            <td>Alış fiyatı güncelle</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div class="card" style="max-width: 700px; padding: 20px; margin-top: 20px;">
                <h2>Webhook Ayarları</h2>
                <p>Stok değişikliklerini otomatik olarak dashboard'a bildirmek için webhook'u etkinleştirin.</p>

                <form method="post">
                    <?php wp_nonce_field('wcsc_webhook_settings'); ?>
                    <table class="form-table">
                        <tr>
                            <th>Dashboard URL</th>
                            <td>
                                <input type="url" name="wcsc_dashboard_url" class="regular-text"
                                       value="<?php echo esc_attr($dashboard_url); ?>"
                                       placeholder="https://dashboard.example.com" style="width: 100%;">
                                <p class="description">Stok yönetim panelinizin URL'si (örn: https://app.siteniz.com)</p>
                            </td>
                        </tr>
                        <tr>
                            <th>Webhook Secret</th>
                            <td>
                                <input type="text" class="regular-text" value="<?php echo esc_attr($webhook_secret); ?>" readonly onclick="this.select();" style="width: 100%;">
                                <p class="description">Bu secret'ı dashboard'daki mağaza ayarlarına girin.</p>
                            </td>
                        </tr>
                        <tr>
                            <th>Webhook Durumu</th>
                            <td>
                                <label>
                                    <input type="checkbox" name="wcsc_webhook_enabled" value="1" <?php checked($webhook_enabled, '1'); ?>>
                                    Stok değişikliklerinde webhook gönder
                                </label>
                                <p class="description">Etkinleştirildiğinde, stok değişiklikleri anında dashboard'a bildirilir.</p>
                            </td>
                        </tr>
                    </table>
                    <p class="submit">
                        <button type="submit" name="save_webhook_settings" class="button button-primary">Ayarları Kaydet</button>
                    </p>
                </form>

                <?php if ($webhook_enabled === '1' && !empty($dashboard_url)): ?>
                <hr style="margin: 20px 0;">
                <h3>Webhook Testi</h3>
                <p>Dashboard'a test webhook'u göndererek bağlantıyı doğrulayın.</p>
                <form method="post" style="margin-top: 10px;">
                    <?php wp_nonce_field('wcsc_test_webhook'); ?>
                    <button type="submit" name="test_webhook" class="button">Test Webhook Gönder</button>
                </form>
                <?php endif; ?>
            </div>

            <div class="card" style="max-width: 700px; padding: 20px; margin-top: 20px;">
                <h2>İstatistikler</h2>
                <?php
                $total = wp_count_posts('product')->publish;
                $with_price = $this->count_products_with_purchase_price();
                ?>
                <p><strong>Toplam Ürün:</strong> <?php echo $total; ?></p>
                <p><strong>Alış Fiyatı Girilen:</strong> <?php echo $with_price; ?></p>
            </div>
        </div>
        <?php
    }

    private function count_products_with_purchase_price() {
        global $wpdb;
        return (int) $wpdb->get_var(
            "SELECT COUNT(DISTINCT post_id) FROM {$wpdb->postmeta}
             WHERE meta_key = '_purchase_price' AND meta_value != '' AND meta_value > 0"
        );
    }

    // === ÜRÜN ALIM FİYATI ALANLARI ===

    public function add_purchase_price_field() {
        woocommerce_wp_text_input(array(
            'id' => '_purchase_price',
            'label' => 'Alış Fiyatı (' . get_woocommerce_currency_symbol() . ')',
            'description' => 'Ürünün maliyet/alış fiyatı',
            'desc_tip' => true,
            'type' => 'text',
            'data_type' => 'price',
            'class' => 'wc_input_price short',
        ));
    }

    public function save_purchase_price_field($post_id) {
        if (isset($_POST['_purchase_price'])) {
            update_post_meta($post_id, '_purchase_price', wc_format_decimal($_POST['_purchase_price']));
        }
    }

    public function add_variation_purchase_price_field($loop, $variation_data, $variation) {
        woocommerce_wp_text_input(array(
            'id' => '_purchase_price_' . $variation->ID,
            'name' => '_variation_purchase_price[' . $variation->ID . ']',
            'label' => 'Alış Fiyatı (' . get_woocommerce_currency_symbol() . ')',
            'value' => get_post_meta($variation->ID, '_purchase_price', true),
            'type' => 'text',
            'data_type' => 'price',
            'class' => 'wc_input_price short',
            'wrapper_class' => 'form-row form-row-first',
        ));
    }

    public function save_variation_purchase_price_field($variation_id, $i) {
        if (isset($_POST['_variation_purchase_price'][$variation_id])) {
            update_post_meta($variation_id, '_purchase_price', wc_format_decimal($_POST['_variation_purchase_price'][$variation_id]));
        }
    }

    public function add_purchase_price_column($columns) {
        $new = array();
        foreach ($columns as $key => $val) {
            $new[$key] = $val;
            if ($key === 'price') {
                $new['purchase_price'] = 'Alış Fiyatı';
            }
        }
        return $new;
    }

    public function display_purchase_price_column($column, $post_id) {
        if ($column === 'purchase_price') {
            $price = get_post_meta($post_id, '_purchase_price', true);
            echo $price ? wc_price($price) : '—';
        }
    }

    // === REST API ===

    public function register_rest_routes() {
        // Bağlantı doğrulama
        register_rest_route('wcsc/v1', '/verify', array(
            'methods' => 'GET',
            'callback' => array($this, 'api_verify'),
            'permission_callback' => array($this, 'check_api_permission'),
        ));

        // Ürünleri listele
        register_rest_route('wcsc/v1', '/products', array(
            'methods' => 'GET',
            'callback' => array($this, 'api_get_products'),
            'permission_callback' => array($this, 'check_api_permission'),
        ));

        // Stok güncelle
        register_rest_route('wcsc/v1', '/stock/update', array(
            'methods' => 'POST',
            'callback' => array($this, 'api_update_stock'),
            'permission_callback' => array($this, 'check_api_permission'),
        ));

        // Alış fiyatı güncelle
        register_rest_route('wcsc/v1', '/purchase-price/update', array(
            'methods' => 'POST',
            'callback' => array($this, 'api_update_purchase_price'),
            'permission_callback' => array($this, 'check_api_permission'),
        ));
    }

    public function check_api_permission($request) {
        $key = $request->get_header('X-API-Key');
        $secret = $request->get_header('X-API-Secret');

        if ($key !== get_option('wcsc_api_key') || $secret !== get_option('wcsc_api_secret')) {
            return new WP_Error('unauthorized', 'Geçersiz API anahtarları', array('status' => 401));
        }
        return true;
    }

    public function api_verify($request) {
        return array(
            'success' => true,
            'site_name' => get_bloginfo('name'),
            'site_url' => get_site_url(),
            'currency' => get_woocommerce_currency(),
            'products_count' => wp_count_posts('product')->publish,
            'wc_version' => WC()->version,
            'plugin_version' => '1.0.0',
        );
    }

    public function api_get_products($request) {
        $page = $request->get_param('page') ?: 1;
        $per_page = $request->get_param('per_page') ?: 100;
        $search = $request->get_param('search');

        $args = array(
            'limit' => $per_page,
            'page' => $page,
            'status' => 'publish',
        );

        if ($search) {
            $args['s'] = $search;
        }

        $products = wc_get_products($args);
        $data = array();

        foreach ($products as $product) {
            $item = $this->format_product($product);

            // Varyasyonları ekle
            if ($product->is_type('variable')) {
                $item['variations'] = array();
                foreach ($product->get_available_variations() as $var) {
                    $var_product = wc_get_product($var['variation_id']);
                    $item['variations'][] = array(
                        'id' => $var['variation_id'],
                        'sku' => $var_product->get_sku(),
                        'attributes' => $var['attributes'],
                        'price' => (float) $var_product->get_price(),
                        'purchase_price' => (float) get_post_meta($var['variation_id'], '_purchase_price', true),
                        'stock_quantity' => $var_product->get_stock_quantity(),
                        'stock_status' => $var_product->get_stock_status(),
                        'manage_stock' => $var_product->get_manage_stock(),
                    );
                }
            }

            $data[] = $item;
        }

        return array(
            'products' => $data,
            'page' => (int) $page,
            'per_page' => (int) $per_page,
        );
    }

    private function format_product($product) {
        return array(
            'id' => $product->get_id(),
            'name' => $product->get_name(),
            'sku' => $product->get_sku(),
            'type' => $product->get_type(),
            'price' => (float) $product->get_price(),
            'regular_price' => (float) $product->get_regular_price(),
            'purchase_price' => (float) get_post_meta($product->get_id(), '_purchase_price', true),
            'stock_quantity' => $product->get_stock_quantity(),
            'stock_status' => $product->get_stock_status(),
            'manage_stock' => $product->get_manage_stock(),
            'image' => wp_get_attachment_url($product->get_image_id()),
        );
    }

    /**
     * Stok güncelle - TEK veya TOPLU
     *
     * Tekli: { "product_id": 123, "quantity": 10 }
     * Tekli varyasyon: { "variation_id": 456, "quantity": 5 }
     * Toplu: { "items": [{ "product_id": 123, "quantity": 10 }, { "variation_id": 456, "quantity": 5 }] }
     */
    public function api_update_stock($request) {
        $body = $request->get_json_params();
        $results = array('success' => array(), 'failed' => array());

        // Toplu güncelleme
        if (isset($body['items']) && is_array($body['items'])) {
            foreach ($body['items'] as $item) {
                $result = $this->update_single_stock($item);
                if ($result['success']) {
                    $results['success'][] = $result;
                } else {
                    $results['failed'][] = $result;
                }
            }
            return array(
                'success' => true,
                'message' => count($results['success']) . ' güncellendi, ' . count($results['failed']) . ' başarısız',
                'results' => $results,
            );
        }

        // Tekli güncelleme
        $result = $this->update_single_stock($body);
        return $result;
    }

    private function update_single_stock($data) {
        $product_id = $data['product_id'] ?? null;
        $variation_id = $data['variation_id'] ?? null;
        $quantity = $data['quantity'] ?? null;
        $stock_status = $data['stock_status'] ?? null; // instock, outofstock, onbackorder

        $id = $variation_id ?: $product_id;

        if (!$id) {
            return array('success' => false, 'error' => 'product_id veya variation_id gerekli');
        }

        $product = wc_get_product($id);
        if (!$product) {
            return array('success' => false, 'id' => $id, 'error' => 'Ürün bulunamadı');
        }

        // Stok yönetimini aktif et
        if ($quantity !== null) {
            $product->set_manage_stock(true);
            $product->set_stock_quantity((int) $quantity);

            // Stok durumunu otomatik ayarla
            if ((int) $quantity <= 0) {
                $product->set_stock_status('outofstock');
            } else {
                $product->set_stock_status('instock');
            }
        }

        if ($stock_status) {
            $product->set_stock_status($stock_status);
        }

        $product->save();

        return array(
            'success' => true,
            'id' => $id,
            'name' => $product->get_name(),
            'stock_quantity' => $product->get_stock_quantity(),
            'stock_status' => $product->get_stock_status(),
        );
    }

    /**
     * Alış fiyatı güncelle
     *
     * Tekli: { "product_id": 123, "purchase_price": 50.00 }
     * Toplu: { "items": [{ "product_id": 123, "purchase_price": 50 }, { "variation_id": 456, "purchase_price": 45 }] }
     */
    public function api_update_purchase_price($request) {
        $body = $request->get_json_params();
        $results = array('success' => array(), 'failed' => array());

        // Toplu güncelleme
        if (isset($body['items']) && is_array($body['items'])) {
            foreach ($body['items'] as $item) {
                $result = $this->update_single_purchase_price($item);
                if ($result['success']) {
                    $results['success'][] = $result;
                } else {
                    $results['failed'][] = $result;
                }
            }
            return array(
                'success' => true,
                'message' => count($results['success']) . ' güncellendi',
                'results' => $results,
            );
        }

        // Tekli güncelleme
        return $this->update_single_purchase_price($body);
    }

    private function update_single_purchase_price($data) {
        $product_id = $data['product_id'] ?? null;
        $variation_id = $data['variation_id'] ?? null;
        $purchase_price = $data['purchase_price'] ?? null;

        $id = $variation_id ?: $product_id;

        if (!$id || $purchase_price === null) {
            return array('success' => false, 'error' => 'product_id/variation_id ve purchase_price gerekli');
        }

        $product = wc_get_product($id);
        if (!$product) {
            return array('success' => false, 'id' => $id, 'error' => 'Ürün bulunamadı');
        }

        update_post_meta($id, '_purchase_price', wc_format_decimal($purchase_price));

        return array(
            'success' => true,
            'id' => $id,
            'name' => $product->get_name(),
            'purchase_price' => (float) $purchase_price,
        );
    }

    // === WEBHOOK GÖNDERİMİ ===

    /**
     * Basit ürün stok değişikliğinde webhook gönder
     */
    public function on_stock_change($product) {
        if (!$this->is_webhook_enabled()) {
            return;
        }

        // Varyasyon ise bu hook'u atla (variation hook kullanılacak)
        if ($product->is_type('variation')) {
            return;
        }

        $this->send_webhook('stock.updated', array(
            'product_id' => $product->get_id(),
            'sku' => $product->get_sku(),
            'stock_quantity' => $product->get_stock_quantity(),
            'stock_status' => $product->get_stock_status(),
            'purchase_price' => (float) get_post_meta($product->get_id(), '_purchase_price', true),
        ));
    }

    /**
     * Varyasyon stok değişikliğinde webhook gönder
     */
    public function on_variation_stock_change($variation) {
        if (!$this->is_webhook_enabled()) {
            return;
        }

        $parent_id = $variation->get_parent_id();

        $this->send_webhook('stock.updated', array(
            'product_id' => $parent_id,
            'variation_id' => $variation->get_id(),
            'sku' => $variation->get_sku(),
            'stock_quantity' => $variation->get_stock_quantity(),
            'stock_status' => $variation->get_stock_status(),
            'purchase_price' => (float) get_post_meta($variation->get_id(), '_purchase_price', true),
        ));
    }

    /**
     * Sipariş tamamlandığında webhook gönder
     */
    public function on_order_completed($order_id) {
        if (!$this->is_webhook_enabled()) {
            return;
        }

        $order = wc_get_order($order_id);
        if (!$order) {
            return;
        }

        $items = array();
        foreach ($order->get_items() as $item) {
            $product = $item->get_product();
            if (!$product) continue;

            $items[] = array(
                'product_id' => $product->is_type('variation') ? $product->get_parent_id() : $product->get_id(),
                'variation_id' => $product->is_type('variation') ? $product->get_id() : null,
                'sku' => $product->get_sku(),
                'quantity' => $item->get_quantity(),
                'stock_quantity' => $product->get_stock_quantity(),
                'stock_status' => $product->get_stock_status(),
            );
        }

        $this->send_webhook('order.completed', array(
            'order_id' => $order_id,
            'order_status' => $order->get_status(),
            'items' => $items,
        ));
    }

    /**
     * Sipariş işleme alındığında webhook gönder
     */
    public function on_order_processing($order_id) {
        if (!$this->is_webhook_enabled()) {
            return;
        }

        $order = wc_get_order($order_id);
        if (!$order) {
            return;
        }

        $items = array();
        foreach ($order->get_items() as $item) {
            $product = $item->get_product();
            if (!$product) continue;

            $items[] = array(
                'product_id' => $product->is_type('variation') ? $product->get_parent_id() : $product->get_id(),
                'variation_id' => $product->is_type('variation') ? $product->get_id() : null,
                'sku' => $product->get_sku(),
                'quantity' => $item->get_quantity(),
                'stock_quantity' => $product->get_stock_quantity(),
                'stock_status' => $product->get_stock_status(),
            );
        }

        $this->send_webhook('order.processing', array(
            'order_id' => $order_id,
            'order_status' => $order->get_status(),
            'items' => $items,
        ));
    }

    /**
     * Webhook gönder
     */
    private function send_webhook($event, $data) {
        $dashboard_url = get_option('wcsc_dashboard_url');
        $webhook_secret = get_option('wcsc_webhook_secret');

        if (empty($dashboard_url) || empty($webhook_secret)) {
            error_log('WCSC: Webhook gönderilemedi - Dashboard URL veya secret eksik');
            return false;
        }

        // Webhook endpoint
        $webhook_url = rtrim($dashboard_url, '/') . '/api/webhook/stock-sync';

        // Payload oluştur
        $timestamp = gmdate('c');
        $payload = array(
            'event' => $event,
            'store_url' => get_site_url(),
            'timestamp' => $timestamp,
            'data' => $data,
        );

        $payload_json = json_encode($payload);

        // HMAC-SHA256 signature oluştur
        $signature = hash_hmac('sha256', $payload_json, $webhook_secret);
        $payload['signature'] = $signature;

        // HTTP isteği gönder
        $response = wp_remote_post($webhook_url, array(
            'headers' => array(
                'Content-Type' => 'application/json',
                'X-WCSC-Signature' => $signature,
                'X-WCSC-Event' => $event,
            ),
            'body' => json_encode($payload),
            'timeout' => 15,
            'sslverify' => true,
        ));

        if (is_wp_error($response)) {
            error_log('WCSC Webhook Error: ' . $response->get_error_message());
            return false;
        }

        $status_code = wp_remote_retrieve_response_code($response);

        if ($status_code !== 200) {
            error_log('WCSC Webhook Error: HTTP ' . $status_code . ' - ' . wp_remote_retrieve_body($response));
            return false;
        }

        return true;
    }

    /**
     * Test webhook gönder
     */
    public function send_test_webhook() {
        $dashboard_url = get_option('wcsc_dashboard_url');
        $webhook_secret = get_option('wcsc_webhook_secret');

        if (empty($dashboard_url)) {
            return array('success' => false, 'error' => 'Dashboard URL ayarlanmamış');
        }

        if (empty($webhook_secret)) {
            return array('success' => false, 'error' => 'Webhook secret ayarlanmamış');
        }

        // Webhook endpoint
        $webhook_url = rtrim($dashboard_url, '/') . '/api/webhook/stock-sync';

        // Test payload
        $timestamp = gmdate('c');
        $payload = array(
            'event' => 'test',
            'store_url' => get_site_url(),
            'timestamp' => $timestamp,
            'data' => array(
                'message' => 'Test webhook from WC Stock Connector',
                'site_name' => get_bloginfo('name'),
                'products_count' => wp_count_posts('product')->publish,
            ),
        );

        $payload_json = json_encode($payload);

        // HMAC-SHA256 signature
        $signature = hash_hmac('sha256', $payload_json, $webhook_secret);
        $payload['signature'] = $signature;

        // HTTP isteği
        $response = wp_remote_post($webhook_url, array(
            'headers' => array(
                'Content-Type' => 'application/json',
                'X-WCSC-Signature' => $signature,
                'X-WCSC-Event' => 'test',
            ),
            'body' => json_encode($payload),
            'timeout' => 15,
            'sslverify' => true,
        ));

        if (is_wp_error($response)) {
            return array('success' => false, 'error' => $response->get_error_message());
        }

        $status_code = wp_remote_retrieve_response_code($response);
        $body = json_decode(wp_remote_retrieve_body($response), true);

        if ($status_code === 200) {
            return array('success' => true, 'response' => $body);
        }

        return array(
            'success' => false,
            'error' => 'HTTP ' . $status_code . ': ' . ($body['message'] ?? 'Unknown error'),
        );
    }

    /**
     * Webhook etkin mi kontrol et
     */
    private function is_webhook_enabled() {
        return get_option('wcsc_webhook_enabled') === '1' && !empty(get_option('wcsc_dashboard_url'));
    }
}

// Başlat
WC_Stock_Connector::get_instance();

// Aktivasyon
register_activation_hook(__FILE__, function() {
    if (!get_option('wcsc_api_key')) {
        update_option('wcsc_api_key', 'wcsc_' . wp_generate_password(24, false));
    }
    if (!get_option('wcsc_api_secret')) {
        update_option('wcsc_api_secret', wp_generate_password(48, false));
    }
    flush_rewrite_rules();
});

register_deactivation_hook(__FILE__, function() {
    flush_rewrite_rules();
});
