import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import { WCSCClient } from '../store/wcsc.client';
import { createHmac, randomBytes } from 'crypto';
import { decrypt } from '../../common/utils/crypto.util';

export interface WebhookPayload {
  event: string;
  store_url: string;
  timestamp: string;
  signature: string;
  data: {
    product_id?: number;
    variation_id?: number;
    sku?: string;
    stock_quantity?: number;
    order_id?: number;
    purchase_price?: number;
  };
}

export interface StockUpdateResult {
  success: boolean;
  productId?: string;
  wcProductId?: number;
  newStock?: number;
  error?: string;
}

@Injectable()
export class StockSyncService {
  private readonly logger = new Logger(StockSyncService.name);
  private readonly encryptionKey: string;

  // Döngüsel güncelleme önleme cache'i (5 dakika)
  private recentUpdates: Map<string, number> = new Map();
  private readonly UPDATE_COOLDOWN_MS = 5 * 60 * 1000; // 5 dakika

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.encryptionKey = this.configService.get<string>('encryption.key') || 'default-encryption-key-change-in-production';
  }

  /**
   * Webhook'tan gelen stok değişikliğini işle
   */
  async handleStockWebhook(
    payload: WebhookPayload,
  ): Promise<{ processed: boolean; synced: number }> {
    this.logger.log(`Processing webhook: ${payload.event} from ${payload.store_url}`);

    // Store'u URL'den bul
    const store = await this.findStoreByUrl(payload.store_url);
    if (!store) {
      this.logger.warn(`Store not found for URL: ${payload.store_url}`);
      return { processed: false, synced: 0 };
    }

    // Webhook log oluştur
    const webhookLog = await this.prisma.webhookLog.create({
      data: {
        storeId: store.id,
        eventType: payload.event,
        direction: 'inbound',
        payload: payload as any,
        status: 'pending',
        wcProductId: payload.data.product_id || payload.data.variation_id,
      },
    });

    try {
      // Döngüsel güncelleme kontrolü
      const isVariation = !!payload.data.variation_id;
      const updateKey = `${store.id}:${isVariation ? 'v' : 'p'}:${payload.data.variation_id || payload.data.product_id}`;
      const lastUpdate = this.recentUpdates.get(updateKey);
      if (lastUpdate && Date.now() - lastUpdate < this.UPDATE_COOLDOWN_MS) {
        this.logger.debug(`Skipping update - cooldown active for ${updateKey}`);
        await this.updateWebhookLog(webhookLog.id, 'success', 'Skipped - cooldown active');
        return { processed: true, synced: 0 };
      }

      // Varyasyon mu yoksa basit ürün mü?
      if (isVariation) {
        // Varyasyon güncelleme
        const variation = await this.prisma.productVariation.findFirst({
          where: {
            wcVariationId: payload.data.variation_id,
            product: { storeId: store.id },
          },
          include: { product: true },
        });

        if (!variation) {
          this.logger.warn(`Variation not found: ${payload.data.variation_id}`);
          await this.updateWebhookLog(webhookLog.id, 'failed', 'Variation not found');
          return { processed: false, synced: 0 };
        }

        if (payload.data.stock_quantity !== undefined) {
          await this.prisma.productVariation.update({
            where: { id: variation.id },
            data: {
              stockQuantity: payload.data.stock_quantity,
              stockStatus: payload.data.stock_quantity > 0 ? 'instock' : 'outofstock',
            },
          });

          // Parent product'ın syncedAt'ini de güncelle
          await this.prisma.product.update({
            where: { id: variation.productId },
            data: { syncedAt: new Date() },
          });

          await this.updateWebhookLog(webhookLog.id, 'success', undefined, variation.productId);
          this.recentUpdates.set(updateKey, Date.now());

          // Eşleşen ürünlere sync et (parent product üzerinden)
          const syncedCount = await this.syncVariationToMappedStores(
            store.companyId,
            variation.productId,
            payload.data.variation_id!,
            variation.sku,
            payload.data.stock_quantity,
            store.id,
          );

          await this.prisma.store.update({
            where: { id: store.id },
            data: { wcscLastSyncAt: new Date() },
          });

          return { processed: true, synced: syncedCount };
        }
      } else {
        // Basit ürün güncelleme
        const wcProductId = payload.data.product_id;
        if (!wcProductId) {
          await this.updateWebhookLog(webhookLog.id, 'failed', 'No product_id');
          return { processed: false, synced: 0 };
        }

        const product = await this.findProductByWcId(store.id, wcProductId);

        if (!product) {
          this.logger.warn(`Product not found: ${wcProductId}`);
          await this.updateWebhookLog(webhookLog.id, 'failed', 'Product not found');
          return { processed: false, synced: 0 };
        }

        if (payload.data.stock_quantity !== undefined) {
          await this.prisma.product.update({
            where: { id: product.id },
            data: {
              stockQuantity: payload.data.stock_quantity,
              stockStatus: payload.data.stock_quantity > 0 ? 'instock' : 'outofstock',
              syncedAt: new Date(),
            },
          });

          await this.updateWebhookLog(webhookLog.id, 'success', undefined, product.id);
          this.recentUpdates.set(updateKey, Date.now());

          // Eşleşen ürünlere sync et
          const syncedCount = await this.syncToMappedStores(
            store.companyId,
            product.id,
            payload.data.stock_quantity,
            store.id,
          );

          await this.prisma.store.update({
            where: { id: store.id },
            data: { wcscLastSyncAt: new Date() },
          });

          return { processed: true, synced: syncedCount };
        }
      }

      return { processed: true, synced: 0 };
    } catch (error) {
      this.logger.error(`Webhook processing error: ${error.message}`);
      await this.updateWebhookLog(webhookLog.id, 'failed', error.message);
      return { processed: false, synced: 0 };
    }
  }

  /**
   * Eşleşen ürünleri bul ve diğer sitelere sync et
   */
  async syncToMappedStores(
    companyId: string,
    productId: string,
    newStock: number,
    excludeStoreId?: string,
  ): Promise<number> {
    // Bu ürünün dahil olduğu mapping'i bul
    const mappingItem = await this.prisma.productMappingItem.findFirst({
      where: { productId },
      include: {
        mapping: {
          include: {
            items: {
              include: {
                product: true,
                store: true,
              },
            },
          },
        },
      },
    });

    if (!mappingItem) {
      this.logger.debug(`No mapping found for product ${productId}`);
      return 0;
    }

    // Kaynak mağaza kontrolü - sadece kaynak mağazadan gelen güncelleme diğerlerine yayılır
    if (!mappingItem.isSource) {
      this.logger.debug(`Product ${productId} is not source, skipping sync to other stores`);
      return 0;
    }

    let syncedCount = 0;

    // Diğer mağazalardaki eşleşen ürünlere sync et
    for (const item of mappingItem.mapping.items) {
      // Aynı ürünü ve kaynak store'u atla
      if (item.productId === productId) continue;
      if (excludeStoreId && item.storeId === excludeStoreId) continue;

      // WCSC bağlantısı kontrolü
      if (!item.store.hasWcscPlugin || !item.store.wcscApiKey) {
        this.logger.debug(`Store ${item.store.name} has no WCSC plugin configured`);
        continue;
      }

      try {
        await this.updateRemoteStock(
          item.storeId,
          item.product.wcProductId,
          newStock,
        );
        syncedCount++;
        this.logger.log(
          `Synced stock to ${item.store.name}: Product ${item.product.wcProductId} = ${newStock}`,
        );
      } catch (error) {
        this.logger.error(
          `Failed to sync to ${item.store.name}: ${error.message}`,
        );
      }
    }

    return syncedCount;
  }

  /**
   * Varyasyon stok değişikliğini eşleşen mağazalara sync et
   * SKU eşleşmesi ile doğru varyasyonu bulur
   */
  async syncVariationToMappedStores(
    companyId: string,
    productId: string,
    wcVariationId: number,
    variationSku: string | null,
    newStock: number,
    excludeStoreId?: string,
  ): Promise<number> {
    // Bu ürünün dahil olduğu mapping'i bul
    const mappingItem = await this.prisma.productMappingItem.findFirst({
      where: { productId },
      include: {
        mapping: {
          include: {
            items: {
              include: {
                product: {
                  include: {
                    variations: true,
                  },
                },
                store: true,
              },
            },
          },
        },
      },
    });

    if (!mappingItem) {
      this.logger.debug(`No mapping found for product ${productId}`);
      return 0;
    }

    // Kaynak mağaza kontrolü
    if (!mappingItem.isSource) {
      this.logger.debug(`Product ${productId} is not source, skipping sync`);
      return 0;
    }

    let syncedCount = 0;

    // Diğer mağazalardaki eşleşen ürünlere sync et
    for (const item of mappingItem.mapping.items) {
      if (item.productId === productId) continue;
      if (excludeStoreId && item.storeId === excludeStoreId) continue;

      if (!item.store.hasWcscPlugin || !item.store.wcscApiKey) {
        this.logger.debug(`Store ${item.store.name} has no WCSC plugin configured`);
        continue;
      }

      // SKU ile eşleşen varyasyonu bul
      let targetVariation = null;
      if (variationSku) {
        targetVariation = item.product.variations.find(
          (v) => v.sku && v.sku.toLowerCase() === variationSku.toLowerCase()
        );
      }

      if (!targetVariation) {
        this.logger.warn(
          `No matching variation found in ${item.store.name} for SKU: ${variationSku}`
        );
        continue;
      }

      try {
        await this.updateRemoteStock(
          item.storeId,
          targetVariation.wcVariationId,
          newStock,
          true, // isVariation = true
        );

        // Yerel varyasyonu da güncelle
        await this.prisma.productVariation.update({
          where: { id: targetVariation.id },
          data: {
            stockQuantity: newStock,
            stockStatus: newStock > 0 ? 'instock' : 'outofstock',
          },
        });

        syncedCount++;
        this.logger.log(
          `Synced variation stock to ${item.store.name}: Variation ${targetVariation.wcVariationId} = ${newStock}`
        );
      } catch (error) {
        this.logger.error(
          `Failed to sync variation to ${item.store.name}: ${error.message}`
        );
      }
    }

    return syncedCount;
  }

  /**
   * Uzak siteye stok güncelleme gönder
   */
  async updateRemoteStock(
    storeId: string,
    wcProductId: number,
    stock: number,
    isVariation = false,
  ): Promise<StockUpdateResult> {
    const store = await this.prisma.store.findUnique({
      where: { id: storeId },
    });

    if (!store || !store.wcscApiKey || !store.wcscApiSecret) {
      throw new Error('Store not found or WCSC not configured');
    }

    const client = new WCSCClient({
      url: store.url,
      apiKey: decrypt(store.wcscApiKey, this.encryptionKey),
      apiSecret: decrypt(store.wcscApiSecret, this.encryptionKey),
    });

    // Webhook log oluştur
    const webhookLog = await this.prisma.webhookLog.create({
      data: {
        storeId,
        eventType: 'stock.push',
        direction: 'outbound',
        payload: { wcProductId, stock, isVariation },
        status: 'pending',
        wcProductId,
      },
    });

    try {
      const result = await client.updateStock(wcProductId, stock, isVariation);

      // Yerel ürünü de güncelle
      await this.prisma.product.updateMany({
        where: { storeId, wcProductId },
        data: {
          stockQuantity: stock,
          stockStatus: stock > 0 ? 'instock' : 'outofstock',
          syncedAt: new Date(),
        },
      });

      await this.updateWebhookLog(webhookLog.id, 'success');

      return {
        success: true,
        wcProductId,
        newStock: result.stock_quantity,
      };
    } catch (error) {
      await this.updateWebhookLog(webhookLog.id, 'failed', error.message);
      return {
        success: false,
        wcProductId,
        error: error.message,
      };
    }
  }

  /**
   * Uzak siteye alış fiyatı güncelleme gönder
   */
  async updateRemotePurchasePrice(
    storeId: string,
    wcProductId: number,
    price: number,
    isVariation = false,
  ): Promise<StockUpdateResult> {
    const store = await this.prisma.store.findUnique({
      where: { id: storeId },
    });

    if (!store || !store.wcscApiKey || !store.wcscApiSecret) {
      throw new Error('Store not found or WCSC not configured');
    }

    const client = new WCSCClient({
      url: store.url,
      apiKey: decrypt(store.wcscApiKey, this.encryptionKey),
      apiSecret: decrypt(store.wcscApiSecret, this.encryptionKey),
    });

    // Webhook log oluştur
    const webhookLog = await this.prisma.webhookLog.create({
      data: {
        storeId,
        eventType: 'purchase_price.push',
        direction: 'outbound',
        payload: { wcProductId, price, isVariation },
        status: 'pending',
        wcProductId,
      },
    });

    try {
      const result = await client.updatePurchasePrice(wcProductId, price, isVariation);

      // Yerel ürünü de güncelle
      await this.prisma.product.updateMany({
        where: { storeId, wcProductId },
        data: {
          purchasePrice: price,
          syncedAt: new Date(),
        },
      });

      await this.updateWebhookLog(webhookLog.id, 'success');

      return {
        success: true,
        wcProductId,
      };
    } catch (error) {
      await this.updateWebhookLog(webhookLog.id, 'failed', error.message);
      return {
        success: false,
        wcProductId,
        error: error.message,
      };
    }
  }

  /**
   * Dashboard'dan stok güncelleme (tek ürün)
   */
  async updateStockFromDashboard(
    productId: string,
    newStock: number,
    syncToRemote = true,
  ): Promise<StockUpdateResult> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: { store: true },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Yerel stoğu güncelle
    await this.prisma.product.update({
      where: { id: productId },
      data: {
        stockQuantity: newStock,
        stockStatus: newStock > 0 ? 'instock' : 'outofstock',
      },
    });

    // Uzak siteye sync et
    if (syncToRemote && product.store.hasWcscPlugin && product.store.wcscApiKey) {
      const result = await this.updateRemoteStock(
        product.storeId,
        product.wcProductId,
        newStock,
      );

      if (!result.success) {
        return result;
      }
    }

    return {
      success: true,
      productId,
      wcProductId: product.wcProductId,
      newStock,
    };
  }

  /**
   * Dashboard'dan alış fiyatı güncelleme
   */
  async updatePurchasePriceFromDashboard(
    productId: string,
    newPrice: number,
    syncToRemote = true,
  ): Promise<StockUpdateResult> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: { store: true },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Yerel fiyatı güncelle
    await this.prisma.product.update({
      where: { id: productId },
      data: { purchasePrice: newPrice },
    });

    // Uzak siteye sync et
    if (syncToRemote && product.store.hasWcscPlugin && product.store.wcscApiKey) {
      const result = await this.updateRemotePurchasePrice(
        product.storeId,
        product.wcProductId,
        newPrice,
      );

      if (!result.success) {
        return result;
      }
    }

    return {
      success: true,
      productId,
      wcProductId: product.wcProductId,
    };
  }

  /**
   * HMAC-SHA256 signature doğrula
   */
  verifyWebhookSignature(
    payload: string,
    signature: string,
    secret: string,
  ): boolean {
    const expectedSignature = createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
    return signature === expectedSignature;
  }

  /**
   * Webhook secret oluştur
   */
  generateWebhookSecret(): string {
    return randomBytes(32).toString('hex');
  }

  /**
   * Webhook loglarını getir
   */
  async getWebhookLogs(storeId: string, limit = 50) {
    return this.prisma.webhookLog.findMany({
      where: { storeId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Webhook istatistikleri
   */
  async getWebhookStats(storeId: string, days = 7) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const [total, successful, failed, byEvent] = await Promise.all([
      this.prisma.webhookLog.count({
        where: { storeId, createdAt: { gte: since } },
      }),
      this.prisma.webhookLog.count({
        where: { storeId, status: 'success', createdAt: { gte: since } },
      }),
      this.prisma.webhookLog.count({
        where: { storeId, status: 'failed', createdAt: { gte: since } },
      }),
      this.prisma.webhookLog.groupBy({
        by: ['eventType'],
        where: { storeId, createdAt: { gte: since } },
        _count: true,
      }),
    ]);

    return {
      total,
      successful,
      failed,
      successRate: total > 0 ? Math.round((successful / total) * 100) : 0,
      byEvent: byEvent.map((e) => ({
        event: e.eventType,
        count: e._count,
      })),
    };
  }

  // === Private helpers ===

  private async findStoreByUrl(url: string) {
    // URL'i normalize et
    const normalizedUrl = url.replace(/\/+$/, '').toLowerCase();

    return this.prisma.store.findFirst({
      where: {
        OR: [
          { url: normalizedUrl },
          { url: normalizedUrl + '/' },
          { url: { contains: new URL(normalizedUrl).hostname } },
        ],
      },
    });
  }

  private async findProductByWcId(storeId: string, wcProductId: number) {
    return this.prisma.product.findFirst({
      where: { storeId, wcProductId },
    });
  }

  private async updateWebhookLog(
    id: string,
    status: string,
    errorMessage?: string,
    productId?: string,
  ) {
    return this.prisma.webhookLog.update({
      where: { id },
      data: { status, errorMessage, productId },
    });
  }
}
