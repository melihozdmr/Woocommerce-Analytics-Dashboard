import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../database/prisma.service';
import { ConfigService } from '@nestjs/config';
import { WooCommerceClient } from './woocommerce.client';
import { decrypt } from '../../common/utils/crypto.util';
import { StoreStatus } from '@prisma/client';

@Injectable()
export class SyncSchedulerService {
  private readonly logger = new Logger(SyncSchedulerService.name);
  private readonly encryptionKey: string;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    this.encryptionKey = this.configService.get<string>('encryption.key') || 'default-encryption-key-change-in-production';
  }

  /**
   * Her saat başı aktif mağazaları senkronize et
   */
  @Cron(CronExpression.EVERY_HOUR)
  async handleHourlySync() {
    this.logger.log('Otomatik senkronizasyon başlatılıyor...');

    try {
      // Aktif ve senkronize olmayan mağazaları bul
      const activeStores = await this.prisma.store.findMany({
        where: { status: StoreStatus.ACTIVE, isSyncing: false },
      });

      this.logger.log(`${activeStores.length} aktif mağaza bulundu`);

      for (const store of activeStores) {
        await this.syncStore(store);
      }

      this.logger.log('Otomatik senkronizasyon tamamlandı');
    } catch (error: any) {
      this.logger.error('Otomatik senkronizasyon hatası:', error.message);
    }
  }

  /**
   * Tek bir mağazayı senkronize et
   */
  private async syncStore(store: any) {
    this.logger.log(`Mağaza senkronize ediliyor: ${store.name}`);

    try {
      // Credentials'ı çöz
      const consumerKey = decrypt(store.consumerKey, this.encryptionKey);
      const consumerSecret = decrypt(store.consumerSecret, this.encryptionKey);

      const client = new WooCommerceClient({
        url: store.url,
        consumerKey,
        consumerSecret,
      });

      // Ürünleri senkronize et
      const products = await client.getAllProducts();
      let variationsCount = 0;

      for (const product of products) {
        const savedProduct = await this.prisma.product.upsert({
          where: {
            storeId_wcProductId: {
              storeId: store.id,
              wcProductId: product.id,
            },
          },
          update: {
            name: product.name,
            sku: product.sku || null,
            productType: product.type || 'simple',
            price: parseFloat(product.price) || 0,
            stockQuantity: product.stock_quantity || 0,
            stockStatus: product.stock_status,
            manageStock: product.manage_stock || false,
            isActive: product.status === 'publish',
            syncedAt: new Date(),
          },
          create: {
            storeId: store.id,
            wcProductId: product.id,
            name: product.name,
            sku: product.sku || null,
            productType: product.type || 'simple',
            price: parseFloat(product.price) || 0,
            stockQuantity: product.stock_quantity || 0,
            stockStatus: product.stock_status,
            manageStock: product.manage_stock || false,
            isActive: product.status === 'publish',
          },
        });

        // Eğer variable ürünse, varyasyonları da çek
        if (product.type === 'variable') {
          const variations = await client.getProductVariations(product.id);

          for (const variation of variations) {
            const attributeString = variation.attributes
              .map((attr) => attr.option)
              .join(' / ');

            const attributesJson: Record<string, string> = {};
            variation.attributes.forEach((attr) => {
              attributesJson[attr.name] = attr.option;
            });

            await this.prisma.productVariation.upsert({
              where: {
                productId_wcVariationId: {
                  productId: savedProduct.id,
                  wcVariationId: variation.id,
                },
              },
              update: {
                sku: variation.sku || null,
                price: parseFloat(variation.price) || 0,
                stockQuantity: variation.stock_quantity || 0,
                stockStatus: variation.stock_status,
                manageStock: variation.manage_stock || false,
                attributes: attributesJson,
                attributeString: attributeString || null,
                isActive: true,
                syncedAt: new Date(),
              },
              create: {
                productId: savedProduct.id,
                wcVariationId: variation.id,
                sku: variation.sku || null,
                price: parseFloat(variation.price) || 0,
                stockQuantity: variation.stock_quantity || 0,
                stockStatus: variation.stock_status,
                manageStock: variation.manage_stock || false,
                attributes: attributesJson,
                attributeString: attributeString || null,
                isActive: true,
              },
            });

            variationsCount++;
          }
        }
      }

      // Siparişleri senkronize et (son 30 gün)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const orders = await client.getAllOrders(thirtyDaysAgo);

      for (const order of orders) {
        const itemsCount = order.line_items.reduce((sum, item) => sum + item.quantity, 0);

        await this.prisma.order.upsert({
          where: {
            storeId_wcOrderId: {
              storeId: store.id,
              wcOrderId: order.id,
            },
          },
          update: {
            status: order.status,
            total: parseFloat(order.total) || 0,
            subtotal: parseFloat(order.subtotal) || 0,
            totalTax: parseFloat(order.total_tax) || 0,
            shippingTotal: parseFloat(order.shipping_total) || 0,
            discountTotal: parseFloat(order.discount_total) || 0,
            itemsCount,
            syncedAt: new Date(),
          },
          create: {
            storeId: store.id,
            wcOrderId: order.id,
            orderNumber: order.number,
            status: order.status,
            total: parseFloat(order.total) || 0,
            subtotal: parseFloat(order.subtotal) || 0,
            totalTax: parseFloat(order.total_tax) || 0,
            shippingTotal: parseFloat(order.shipping_total) || 0,
            discountTotal: parseFloat(order.discount_total) || 0,
            paymentMethod: order.payment_method || null,
            customerEmail: order.billing?.email || null,
            customerName: order.billing
              ? `${order.billing.first_name} ${order.billing.last_name}`.trim()
              : null,
            itemsCount,
            orderDate: new Date(order.date_created),
          },
        });
      }

      // Sync durumunu güncelle
      await this.prisma.store.update({
        where: { id: store.id },
        data: {
          lastSyncAt: new Date(),
          syncError: null,
        },
      });

      this.logger.log(`Mağaza senkronize edildi: ${store.name} - ${products.length} ürün, ${variationsCount} varyasyon, ${orders.length} sipariş`);
    } catch (error: any) {
      this.logger.error(`Mağaza senkronizasyon hatası (${store.name}):`, error.message);

      // Hata durumunu kaydet
      await this.prisma.store.update({
        where: { id: store.id },
        data: {
          status: StoreStatus.ERROR,
          syncError: error.message || 'Senkronizasyon hatası',
        },
      });
    }
  }
}
