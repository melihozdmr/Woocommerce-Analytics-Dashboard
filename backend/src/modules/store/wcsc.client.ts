import axios, { AxiosInstance, AxiosError } from 'axios';

export interface WCSCConfig {
  url: string;
  apiKey: string;
  apiSecret: string;
}

export interface WCSCProduct {
  id: number;
  name: string;
  sku: string;
  type: string;
  price: number;
  regular_price: number;
  purchase_price: number;
  stock_quantity: number | null;
  stock_status: string;
  manage_stock: boolean;
  image: string | null;
  variations?: WCSCVariation[];
}

export interface WCSCVariation {
  id: number;
  sku: string;
  attributes: Record<string, string>;
  price: number;
  purchase_price: number;
  stock_quantity: number | null;
  stock_status: string;
  manage_stock: boolean;
}

export interface WCSCVerifyResponse {
  success: boolean;
  site_name: string;
  site_url: string;
  currency: string;
  products_count: number;
  wc_version: string;
  plugin_version: string;
}

export interface WCSCStockUpdateItem {
  product_id?: number;
  variation_id?: number;
  quantity: number;
  stock_status?: 'instock' | 'outofstock' | 'onbackorder';
}

export interface WCSCPurchasePriceUpdateItem {
  product_id?: number;
  variation_id?: number;
  purchase_price: number;
}

/**
 * WC Stock Connector Client
 * WordPress eklentisi ile iletişim kurar
 */
export class WCSCClient {
  private client: AxiosInstance;
  private config: WCSCConfig;

  constructor(config: WCSCConfig) {
    this.config = config;

    let baseURL = config.url.replace(/\/+$/, '');
    if (!baseURL.includes('/wp-json/wcsc/v1')) {
      baseURL = `${baseURL}/wp-json/wcsc/v1`;
    }

    this.client = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': config.apiKey,
        'X-API-Secret': config.apiSecret,
      },
    });
  }

  /**
   * Bağlantıyı doğrula
   */
  async verify(): Promise<{ success: boolean; data?: WCSCVerifyResponse; error?: string }> {
    try {
      const response = await this.client.get('/verify');
      return { success: true, data: response.data };
    } catch (error) {
      const axiosError = error as AxiosError;

      if (axiosError.response?.status === 401) {
        return { success: false, error: 'Geçersiz API anahtarları' };
      }
      if (axiosError.response?.status === 404) {
        return { success: false, error: 'WC Stock Connector eklentisi bulunamadı. Eklentiyi kurun ve aktif edin.' };
      }
      if (axiosError.code === 'ENOTFOUND') {
        return { success: false, error: 'Site bulunamadı' };
      }

      return { success: false, error: axiosError.message };
    }
  }

  /**
   * Ürünleri getir
   */
  async getProducts(page = 1, perPage = 100, search?: string): Promise<{ products: WCSCProduct[] }> {
    const params: Record<string, any> = { page, per_page: perPage };
    if (search) params.search = search;

    const response = await this.client.get('/products', { params });
    return response.data;
  }

  /**
   * Tüm ürünleri getir
   */
  async getAllProducts(): Promise<WCSCProduct[]> {
    const allProducts: WCSCProduct[] = [];
    let page = 1;

    while (true) {
      const result = await this.getProducts(page, 100);
      if (result.products.length === 0) break;
      allProducts.push(...result.products);
      if (result.products.length < 100) break;
      page++;
    }

    return allProducts;
  }

  /**
   * Tekli stok güncelle
   */
  async updateStock(
    productId: number,
    quantity: number,
    isVariation = false,
  ): Promise<{ success: boolean; id: number; stock_quantity: number }> {
    const body = isVariation
      ? { variation_id: productId, quantity }
      : { product_id: productId, quantity };

    const response = await this.client.post('/stock/update', body);
    return response.data;
  }

  /**
   * Toplu stok güncelle
   */
  async bulkUpdateStock(items: WCSCStockUpdateItem[]): Promise<{
    success: boolean;
    message: string;
    results: { success: any[]; failed: any[] };
  }> {
    const response = await this.client.post('/stock/update', { items });
    return response.data;
  }

  /**
   * Tekli alış fiyatı güncelle
   */
  async updatePurchasePrice(
    productId: number,
    purchasePrice: number,
    isVariation = false,
  ): Promise<{ success: boolean; id: number; purchase_price: number }> {
    const body = isVariation
      ? { variation_id: productId, purchase_price: purchasePrice }
      : { product_id: productId, purchase_price: purchasePrice };

    const response = await this.client.post('/purchase-price/update', body);
    return response.data;
  }

  /**
   * Toplu alış fiyatı güncelle
   */
  async bulkUpdatePurchasePrice(items: WCSCPurchasePriceUpdateItem[]): Promise<{
    success: boolean;
    message: string;
    results: { success: any[]; failed: any[] };
  }> {
    const response = await this.client.post('/purchase-price/update', { items });
    return response.data;
  }
}
