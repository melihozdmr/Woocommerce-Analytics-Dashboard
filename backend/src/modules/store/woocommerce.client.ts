import axios, { AxiosInstance, AxiosError } from 'axios';
import * as crypto from 'crypto';

export interface WooCommerceConfig {
  url: string;
  consumerKey: string;
  consumerSecret: string;
}

export interface WooCommerceProduct {
  id: number;
  name: string;
  sku: string;
  type: string; // simple, variable, grouped, external
  price: string;
  regular_price: string;
  stock_quantity: number | null;
  stock_status: string;
  manage_stock: boolean;
  status: string;
  variations?: number[]; // IDs of variations for variable products
  images?: Array<{
    id: number;
    src: string;
  }>;
  meta_data?: Array<{
    id: number;
    key: string;
    value: string;
  }>;
}

export interface WooCommerceVariation {
  id: number;
  sku: string;
  price: string;
  regular_price: string;
  stock_quantity: number | null;
  stock_status: string;
  manage_stock: boolean;
  attributes: Array<{
    id: number;
    name: string;
    option: string;
  }>;
}

export interface WooCommerceOrder {
  id: number;
  number: string;
  status: string;
  total: string;
  subtotal: string;
  total_tax: string;
  shipping_total: string;
  discount_total: string;
  payment_method: string;
  billing: {
    email: string;
    first_name: string;
    last_name: string;
  };
  line_items: Array<{ quantity: number }>;
  date_created: string;
}

export class WooCommerceClient {
  private client: AxiosInstance;
  private config: WooCommerceConfig;

  constructor(config: WooCommerceConfig) {
    this.config = config;

    // URL'i normalize et
    let baseURL = config.url.replace(/\/+$/, '');
    if (!baseURL.includes('/wp-json/wc/v3')) {
      baseURL = `${baseURL}/wp-json/wc/v3`;
    }

    this.client = axios.create({
      baseURL,
      timeout: 30000, // 30 saniye timeout
      auth: {
        username: config.consumerKey,
        password: config.consumerSecret,
      },
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Ebrar/1.0',
      },
    });
  }

  /**
   * Bağlantıyı test et
   */
  async testConnection(): Promise<{ success: boolean; storeName?: string; error?: string }> {
    try {
      // Use products endpoint with limit 1 to test connection
      await this.client.get('/products', {
        params: { per_page: 1 },
      });

      // If we get here, connection is successful
      return {
        success: true,
        storeName: 'WooCommerce Store',
      };
    } catch (error) {
      const axiosError = error as AxiosError;

      console.error('WooCommerce connection error:', {
        code: axiosError.code,
        status: axiosError.response?.status,
        statusText: axiosError.response?.statusText,
        data: axiosError.response?.data,
        message: axiosError.message,
      });

      if (axiosError.response) {
        const status = axiosError.response.status;
        const data = axiosError.response.data as any;

        if (status === 401) {
          return { success: false, error: 'Kimlik doğrulama başarısız. API anahtarlarınızı kontrol edin.' };
        }
        if (status === 403) {
          return { success: false, error: 'Erişim reddedildi. API anahtarı izinlerini kontrol edin.' };
        }
        if (status === 404) {
          return { success: false, error: 'WooCommerce API bulunamadı. URL\'yi ve WooCommerce kurulumunu kontrol edin.' };
        }

        // WooCommerce specific error
        if (data?.code === 'woocommerce_rest_cannot_view') {
          return { success: false, error: 'API anahtarı okuma izni yok. Yeni anahtar oluşturun.' };
        }

        return { success: false, error: data?.message || `Sunucu hatası: ${status}` };
      }

      if (axiosError.code === 'ENOTFOUND') {
        return { success: false, error: 'Site bulunamadı. URL\'yi kontrol edin.' };
      }

      if (axiosError.code === 'ECONNREFUSED') {
        return { success: false, error: 'Bağlantı reddedildi. Site erişilebilir değil.' };
      }

      if (axiosError.code === 'ETIMEDOUT' || axiosError.message.includes('timeout')) {
        return { success: false, error: 'Bağlantı zaman aşımına uğradı.' };
      }

      if (axiosError.code === 'CERT_HAS_EXPIRED' || axiosError.code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE') {
        return { success: false, error: 'SSL sertifika hatası. Site güvenlik ayarlarını kontrol edin.' };
      }

      return { success: false, error: `Bağlantı kurulamadı: ${axiosError.message}` };
    }
  }

  /**
   * Ürünleri çek (pagination ile)
   */
  async getProducts(page = 1, perPage = 100, modifiedAfter?: Date): Promise<{ products: WooCommerceProduct[]; totalPages: number }> {
    const params: Record<string, any> = {
      page,
      per_page: perPage,
      status: 'any',
    };

    if (modifiedAfter) {
      params.modified_after = modifiedAfter.toISOString();
    }

    const response = await this.client.get('/products', { params });

    const totalPages = parseInt(response.headers['x-wp-totalpages'] || '1', 10);

    return {
      products: response.data,
      totalPages,
    };
  }

  /**
   * Tüm ürünleri çek (opsiyonel: sadece belirli tarihten sonra güncellenenler)
   */
  async getAllProducts(modifiedAfter?: Date): Promise<WooCommerceProduct[]> {
    const allProducts: WooCommerceProduct[] = [];
    let page = 1;
    let totalPages = 1;

    do {
      const result = await this.getProducts(page, 100, modifiedAfter);
      allProducts.push(...result.products);
      totalPages = result.totalPages;
      page++;
    } while (page <= totalPages);

    return allProducts;
  }

  /**
   * Siparişleri çek (pagination ile)
   * Sadece belirli durumları çeker: processing (onaylanan), completed (tamamlanan), cancelled (iptal)
   */
  async getOrders(page = 1, perPage = 100, after?: Date, status?: string): Promise<{ orders: WooCommerceOrder[]; totalPages: number }> {
    const params: Record<string, any> = {
      page,
      per_page: perPage,
      orderby: 'date',
      order: 'desc',
    };

    if (after) {
      params.after = after.toISOString();
    }

    if (status) {
      params.status = status;
    }

    const response = await this.client.get('/orders', { params });

    const totalPages = parseInt(response.headers['x-wp-totalpages'] || '1', 10);

    return {
      orders: response.data,
      totalPages,
    };
  }

  /**
   * Tüm siparişleri çek (belirli bir tarihten sonra)
   * Sadece onaylanan (processing, completed) ve iptal edilen (cancelled) siparişleri çeker
   */
  async getAllOrders(after?: Date): Promise<WooCommerceOrder[]> {
    const allOrders: WooCommerceOrder[] = [];

    // Sadece bu durumları çek: processing (onaylanan), completed (tamamlanan), cancelled (iptal), refunded (iade)
    const statuses = ['processing', 'completed', 'cancelled', 'refunded'];

    for (const status of statuses) {
      let page = 1;
      let totalPages = 1;

      do {
        const result = await this.getOrders(page, 100, after, status);
        allOrders.push(...result.orders);
        totalPages = result.totalPages;
        page++;
      } while (page <= totalPages);
    }

    return allOrders;
  }

  /**
   * Ürün varyasyonlarını çek
   */
  async getProductVariations(productId: number): Promise<WooCommerceVariation[]> {
    try {
      const response = await this.client.get(`/products/${productId}/variations`, {
        params: { per_page: 100 },
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching variations for product ${productId}:`, error);
      return [];
    }
  }

  /**
   * Ürün stok miktarını güncelle
   */
  async updateProductStock(productId: number, stockQuantity: number): Promise<WooCommerceProduct> {
    try {
      const response = await this.client.put(`/products/${productId}`, {
        stock_quantity: stockQuantity,
        manage_stock: true,
      });
      return response.data;
    } catch (error) {
      // Basic Auth başarısız olursa query string auth dene
      const axiosError = error as AxiosError;
      if (axiosError.response?.status === 401) {
        const response = await this.client.put(
          `/products/${productId}`,
          {
            stock_quantity: stockQuantity,
            manage_stock: true,
          },
          {
            params: {
              consumer_key: this.config.consumerKey,
              consumer_secret: this.config.consumerSecret,
            },
            auth: undefined,
          }
        );
        return response.data;
      }
      throw error;
    }
  }

  /**
   * Varyasyon stok miktarını güncelle
   */
  async updateVariationStock(productId: number, variationId: number, stockQuantity: number): Promise<WooCommerceVariation> {
    console.log('Updating variation stock:', { productId, variationId, stockQuantity });
    console.log('Using URL:', this.config.url);
    console.log('Consumer Key starts with:', this.config.consumerKey.substring(0, 10));

    try {
      const response = await this.client.put(`/products/${productId}/variations/${variationId}`, {
        stock_quantity: stockQuantity,
        manage_stock: true,
      });
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      console.error('WooCommerce update error:', {
        status: axiosError.response?.status,
        statusText: axiosError.response?.statusText,
        data: axiosError.response?.data,
        headers: axiosError.response?.headers,
      });

      // Basic Auth başarısız olursa query string auth dene
      if (axiosError.response?.status === 401) {
        console.log('Trying query string auth...');
        try {
          const response = await this.client.put(
            `/products/${productId}/variations/${variationId}`,
            {
              stock_quantity: stockQuantity,
              manage_stock: true,
            },
            {
              params: {
                consumer_key: this.config.consumerKey,
                consumer_secret: this.config.consumerSecret,
              },
              auth: undefined,
            }
          );
          return response.data;
        } catch (retryError) {
          const retryAxiosError = retryError as AxiosError;
          console.error('Query string auth also failed:', {
            status: retryAxiosError.response?.status,
            data: retryAxiosError.response?.data,
          });
          throw retryError;
        }
      }
      throw error;
    }
  }
}
