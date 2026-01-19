# Feature 15: WordPress Entegrasyonu (WC Stock Connector)

## Amaç
1. **Dashboard → WooCommerce**: Dashboard'dan stok ve alış fiyatı düzenleme, değişikliklerin WooCommerce sitelerine otomatik sync'i
2. **WooCommerce → Dashboard**: WooCommerce sitelerinden webhook ile stok değişikliklerini alma
3. **Site A ↔ Site B**: İki farklı WooCommerce sitesinde eşleşen ürünlerin stoklarını otomatik senkronize etme

---

## İlgili Fonksiyonel Gereksinim
- Ürün eşleştirmesi yapılan ürünlerin stokları otomatik senkronize olmalı
- Dashboard'dan stok ve alış fiyatı güncellenebilmeli
- Bir sitede satış olduğunda diğer sitedeki stok da güncellenmeli

---

## Kabul Kriterleri
- [ ] WC Stock Connector eklentisi WooCommerce sitelerine kurulabilmeli
- [ ] Eklenti dashboard'a API key ile bağlanabilmeli
- [ ] Dashboard'dan stok düzenlenince WooCommerce'e yansımalı
- [ ] Dashboard'dan alış fiyatı düzenlenince WooCommerce'e yansımalı
- [ ] WooCommerce'de stok değişince (sipariş vs) dashboard'a webhook ile bildirilmeli
- [ ] Eşleşen ürünlerin stokları otomatik senkronize olmalı

---

## Yapılacaklar

### Faz 1: WordPress Eklentisi Temel Yapısı

#### 1.1. Eklenti Çerçevesi
- [ ] `wordpress-plugin/wc-stock-connector/` klasör yapısı
- [ ] Ana eklenti dosyası (`wc-stock-connector.php`)
- [ ] WooCommerce aktif kontrolü
- [ ] Aktivasyon/deaktivasyon hooks

#### 1.2. Eklenti Ayarları Sayfası
- [ ] WooCommerce → Settings → WC Stock Connector sekmesi
- [ ] API Key input alanı
- [ ] Dashboard URL input alanı
- [ ] Bağlantı durumu göstergesi
- [ ] "Bağlantıyı Test Et" butonu
- [ ] Ayarları kaydetme

#### 1.3. API Key Doğrulama
- [ ] API key ile dashboard'a bağlantı testi
- [ ] Site URL'i ile mağaza eşleştirme
- [ ] Bağlantı durumu kaydetme (connected/disconnected)
- [ ] Hata mesajları gösterimi

### Faz 2: Dashboard'dan WooCommerce'e Güncelleme (Outbound)

#### 2.1. Eklenti Tarafı - Güncelleme Alma
- [ ] REST API endpoint: `POST /wp-json/wcsc/v1/stock/update`
- [ ] REST API endpoint: `POST /wp-json/wcsc/v1/purchase-price/update`
- [ ] API key doğrulama middleware
- [ ] Tekli ve toplu güncelleme desteği
- [ ] Varyasyon desteği
- [ ] İşlem logları

#### 2.2. Backend - Güncelleme Gönderme
- [ ] `StockSyncService.updateRemoteStock(storeId, productId, quantity)`
- [ ] `StockSyncService.updateRemotePurchasePrice(storeId, productId, price)`
- [ ] Store credentials yönetimi (API key, site URL)
- [ ] Hata yönetimi ve retry mekanizması
- [ ] İşlem logları

#### 2.3. Frontend - Stok ve Fiyat Düzenleme
- [ ] Ürün listesinde inline stok düzenleme (kalem ikonu)
- [ ] Ürün listesinde inline alış fiyatı düzenleme
- [ ] Düzenleme sonrası otomatik WooCommerce sync
- [ ] Toplu düzenleme seçimi ve modal
- [ ] Sync durumu göstergesi (syncing/synced/failed)

### Faz 3: WooCommerce'den Dashboard'a Bildirim (Inbound)

#### 3.1. Eklenti Tarafı - Webhook Gönderimi
- [ ] `woocommerce_order_status_completed` hook - sipariş tamamlandığında
- [ ] `woocommerce_product_set_stock` hook - stok değiştiğinde
- [ ] `woocommerce_variation_set_stock` hook - varyasyon stoğu değiştiğinde
- [ ] Webhook payload oluşturma
- [ ] HMAC-SHA256 signature oluşturma
- [ ] Async webhook gönderimi (wp_remote_post)

#### 3.2. Webhook Payload Formatı
```json
{
  "event": "stock.updated",
  "store_url": "https://site.com",
  "timestamp": "2024-01-19T12:00:00Z",
  "signature": "HMAC-SHA256 hash",
  "data": {
    "product_id": 123,
    "variation_id": 456,
    "sku": "SZ4590",
    "stock_quantity": 10,
    "order_id": 789
  }
}
```

#### 3.3. Backend - Webhook Receiver
- [ ] `POST /api/webhook/stock-sync` endpoint
- [ ] Signature doğrulama
- [ ] Event işleme (stock.updated, order.completed)
- [ ] Store eşleştirme (URL'den)
- [ ] Ürün eşleştirme (SKU/product_id'den)
- [ ] Stok güncelleme
- [ ] Rate limiting

### Faz 4: Çapraz Site Stok Senkronizasyonu

#### 4.1. Senkronizasyon Mantığı
```
Site A'da Satış Yapıldı
        ↓
WC Stock Connector webhook gönderiyor
        ↓
Backend webhook alıyor
        ↓
Product Mapping'den eşleşen ürünleri buluyor
        ↓
Site B'nin WC Stock Connector API'sine güncelleme gönderiyor
        ↓
Site B stoğu güncellendi
```

#### 4.2. Backend - Sync Service
```typescript
// stock-sync.service.ts
class StockSyncService {
  // Webhook'tan gelen stok değişikliğini işle
  async handleStockWebhook(payload: WebhookPayload): Promise<void>

  // Eşleşen ürünleri bul ve diğer sitelere sync et
  async syncToMappedStores(companyId: string, productId: string, newStock: number): Promise<void>

  // Uzak siteye stok güncelleme gönder
  async updateRemoteStock(storeId: string, productId: number, stock: number): Promise<void>

  // Uzak siteye alış fiyatı güncelleme gönder
  async updateRemotePurchasePrice(storeId: string, productId: number, price: number): Promise<void>
}
```

#### 4.3. Senkronizasyon Kuralları
- Kaynak site (is_source=true) değişiklik yaparsa → diğer sitelere sync
- Hedef site değişiklik yaparsa → sadece dashboard'a bildir (opsiyonel sync)
- Döngüsel güncelleme önleme (son 5dk içinde aynı ürün güncellenmiş mi?)

### Faz 5: Güvenlik ve Kimlik Doğrulama

#### 5.1. API Key Yönetimi
- [ ] Store başına unique API key oluşturma
- [ ] API key hash ile saklama (SHA-256)
- [ ] API key görüntüleme (sadece oluşturulurken)
- [ ] API key yenileme (rotation)
- [ ] API key iptal etme

#### 5.2. Webhook Güvenliği
- [ ] HMAC-SHA256 signature doğrulama
- [ ] Timestamp kontrolü (5dk tolerance)
- [ ] Rate limiting (100 req/dk per store)
- [ ] IP whitelist (opsiyonel)

### Faz 6: Frontend - Bağlantı Yönetimi

#### 6.1. Mağaza Ayarlarında WC Stock Connector Bölümü
- [ ] Bağlantı durumu göstergesi (bağlı/bağlı değil)
- [ ] API key gösterme/kopyalama butonu
- [ ] Webhook URL gösterimi
- [ ] "Yeni API Key Oluştur" butonu
- [ ] Son bağlantı zamanı
- [ ] Hata logları

#### 6.2. Eklenti Kurulum Rehberi
- [ ] Modal ile adım adım kurulum talimatları
- [ ] Eklenti indirme linki
- [ ] API key kopyalama
- [ ] Test bağlantısı

#### 6.3. Senkronizasyon Durumu
- [ ] Son senkronizasyon zamanı
- [ ] Başarılı/başarısız webhook sayısı
- [ ] Son 24 saat aktivite grafiği
- [ ] Hata logları tablosu

### Faz 7: Eklenti Ayarları ve Loglar

#### 7.1. Eklenti Admin Sayfası
- [ ] Bağlantı durumu dashboard
- [ ] Son 50 işlem logu
- [ ] Manuel sync butonu
- [ ] Debug modu toggle

#### 7.2. Eklenti Loglama
- [ ] wp_options'a log kaydetme
- [ ] Log rotation (max 1000 kayıt)
- [ ] Error/info/debug seviyeleri
- [ ] Log temizleme butonu

### Faz 8: Test ve Dağıtım

#### 8.1. Testler
- [ ] API key doğrulama testleri
- [ ] Webhook gönderimi testleri
- [ ] Stok güncelleme testleri
- [ ] Signature doğrulama testleri
- [ ] Rate limiting testleri

#### 8.2. Eklenti Dağıtımı
- [ ] readme.txt dosyası
- [ ] Versiyon yönetimi (version.txt)
- [ ] ZIP paketi oluşturma script'i
- [ ] GitHub releases

---

## Database Schema Eklemeleri

```sql
-- Store'a eklenti bağlantı bilgileri ekle
ALTER TABLE stores ADD COLUMN wcsc_api_key_hash VARCHAR(64);
ALTER TABLE stores ADD COLUMN wcsc_webhook_secret VARCHAR(64);
ALTER TABLE stores ADD COLUMN wcsc_connected_at TIMESTAMP;
ALTER TABLE stores ADD COLUMN wcsc_last_sync_at TIMESTAMP;

-- Webhook logları tablosu
CREATE TABLE webhook_logs (
  id CUID PRIMARY KEY,
  store_id CUID REFERENCES stores(id),
  event_type VARCHAR(50) NOT NULL,
  direction VARCHAR(10) NOT NULL, -- 'inbound' | 'outbound'
  payload JSONB,
  status VARCHAR(20) NOT NULL, -- 'success' | 'failed' | 'pending'
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_webhook_logs_store ON webhook_logs(store_id, created_at DESC);
```

---

## API Endpoints

### Eklenti Bağlantı
```
POST /api/v1/wcsc/register      - Eklenti ilk bağlantı kaydı
POST /api/v1/wcsc/verify        - Bağlantı doğrulama
GET  /api/v1/wcsc/status        - Bağlantı durumu
```

### Stok Yönetimi
```
POST /api/v1/wcsc/stock/update       - Tekli stok güncelle
POST /api/v1/wcsc/stock/bulk-update  - Toplu stok güncelle
GET  /api/v1/wcsc/stock/:sku         - Stok bilgisi al
```

### Alış Fiyatı Yönetimi
```
POST /api/v1/wcsc/purchase-price/update       - Tekli alış fiyatı güncelle
POST /api/v1/wcsc/purchase-price/bulk-update  - Toplu alış fiyatı güncelle
GET  /api/v1/wcsc/purchase-price/:sku         - Alış fiyatı al
```

### Webhook
```
POST /api/webhook/stock-sync    - WooCommerce'den gelen webhook'ları al
```

---

## WordPress Eklenti REST API Endpoints

```
POST /wp-json/wcsc/v1/stock/update           - Stok güncelle
POST /wp-json/wcsc/v1/purchase-price/update  - Alış fiyatı güncelle
POST /wp-json/wcsc/v1/test                   - Bağlantı testi
```

---

## Notlar

- WordPress eklentisi PHP 7.4+ ile yazılacak
- WooCommerce 5.0+ gerekli
- Eklenti WordPress.org'a yüklenmeyecek, manuel kurulum
- HPOS (High-Performance Order Storage) uyumlu olmalı
- Çoklu dil desteği (WordPress i18n)

---

## İlişkili Feature'lar

- **Feature 11 - Ürün Eşleştirme**: Stok senkronizasyonu için ürün eşleştirmesi kullanılır
- **Feature 15 - External API**: API key yönetimi ve güvenlik altyapısı paylaşılır

---

## Proje Kuralları

> **Detaylı kurallar için bkz:** [RULES.md](../../RULES.md)

### Feature Tamamlama Checklist
- [ ] TypeScript strict mode hataları yok (backend)
- [ ] PHP strict types kullanılıyor (eklenti)
- [ ] Kod modüler ve tekrar yok
- [ ] Unit testler yazıldı
- [ ] Testler başarılı geçiyor
- [ ] Git commit atıldı
