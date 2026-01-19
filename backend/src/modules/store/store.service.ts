import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
  OnModuleInit,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import { CreateStoreDto, UpdateStoreDto } from './dto';
import { encrypt, decrypt } from '../../common/utils/crypto.util';
import { WooCommerceClient } from './woocommerce.client';
import { StoreStatus, CompanyRole, InviteStatus } from '@prisma/client';

@Injectable()
export class StoreService implements OnModuleInit {
  private readonly logger = new Logger(StoreService.name);
  private readonly encryptionKey: string;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    this.encryptionKey = this.configService.get<string>('encryption.key') || 'default-encryption-key-change-in-production';
  }

  /**
   * WooCommerce meta_data'dan alış fiyatını çıkar
   * _purchase_price veya _cost gibi yaygın meta field'lerini kontrol eder
   */
  private extractPurchasePrice(metaData?: Array<{ key: string; value: string }>): number | null {
    if (!metaData || metaData.length === 0) return null;

    // Yaygın alış fiyatı meta key'leri
    const purchasePriceKeys = ['_purchase_price', '_cost', '_wc_cog_cost', '_alg_wc_cog_cost'];

    for (const key of purchasePriceKeys) {
      const meta = metaData.find((m) => m.key === key);
      if (meta && meta.value) {
        const price = parseFloat(meta.value);
        if (!isNaN(price) && price > 0) {
          return price;
        }
      }
    }

    return null;
  }

  /**
   * Uygulama başladığında takılı kalan sync işlemlerini resetle
   */
  async onModuleInit() {
    const result = await this.prisma.store.updateMany({
      where: { isSyncing: true },
      data: { isSyncing: false, syncStep: null },
    });

    if (result.count > 0) {
      this.logger.warn(`Reset ${result.count} stuck syncing store(s) on startup`);
    }
  }

  /**
   * Kullanıcının şirkete erişim yetkisini kontrol et
   */
  private async checkCompanyAccess(companyId: string, userId: string) {
    const membership = await this.prisma.companyMember.findFirst({
      where: {
        companyId,
        userId,
        inviteStatus: InviteStatus.ACCEPTED,
      },
    });

    if (!membership) {
      throw new ForbiddenException('Bu şirkete erişim yetkiniz yok');
    }

    return membership;
  }

  /**
   * Plan bazlı mağaza limitini kontrol et
   */
  private async checkStoreLimit(companyId: string, userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { plan: true },
    });

    const storeLimit = user?.plan?.storeLimit || 2; // Default FREE plan: 2 stores

    const currentStoreCount = await this.prisma.store.count({
      where: { companyId },
    });

    if (currentStoreCount >= storeLimit) {
      throw new BadRequestException(
        `Mağaza limitinize (${storeLimit}) ulaştınız. Daha fazla mağaza eklemek için planınızı yükseltin.`,
      );
    }
  }

  /**
   * Yeni mağaza oluştur
   */
  async createStore(companyId: string, userId: string, dto: CreateStoreDto) {
    await this.checkCompanyAccess(companyId, userId);
    await this.checkStoreLimit(companyId, userId);

    // URL'i normalize et
    let url = dto.url.toLowerCase().trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`;
    }
    url = url.replace(/\/+$/, ''); // Sondaki slash'ları kaldır

    // Aynı URL'li mağaza var mı kontrol et
    const existingStore = await this.prisma.store.findFirst({
      where: { companyId, url },
    });

    if (existingStore) {
      throw new ConflictException('Bu URL ile zaten bir mağaza bağlı');
    }

    // Bağlantıyı test et
    const client = new WooCommerceClient({
      url,
      consumerKey: dto.consumerKey,
      consumerSecret: dto.consumerSecret,
    });

    const connectionTest = await client.testConnection();

    if (!connectionTest.success) {
      throw new BadRequestException(connectionTest.error || 'Bağlantı kurulamadı');
    }

    // Credentials'ı şifrele
    const encryptedKey = encrypt(dto.consumerKey, this.encryptionKey);
    const encryptedSecret = encrypt(dto.consumerSecret, this.encryptionKey);

    // Mağazayı oluştur
    const store = await this.prisma.store.create({
      data: {
        companyId,
        name: dto.name,
        url,
        consumerKey: encryptedKey,
        consumerSecret: encryptedSecret,
        status: StoreStatus.ACTIVE,
      },
    });

    return {
      id: store.id,
      name: store.name,
      url: store.url,
      status: store.status,
      lastSyncAt: store.lastSyncAt,
      createdAt: store.createdAt,
    };
  }

  /**
   * Şirketin mağazalarını listele
   */
  async getStores(companyId: string, userId: string) {
    await this.checkCompanyAccess(companyId, userId);

    const stores = await this.prisma.store.findMany({
      where: { companyId },
      select: {
        id: true,
        name: true,
        url: true,
        status: true,
        isSyncing: true,
        syncStep: true,
        syncProductsCount: true,
        syncVariationsCount: true,
        syncOrdersCount: true,
        lastSyncAt: true,
        syncError: true,
        currency: true,
        commissionRate: true,
        shippingCost: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return stores;
  }

  /**
   * Mağaza detayı
   */
  async getStore(companyId: string, storeId: string, userId: string) {
    await this.checkCompanyAccess(companyId, userId);

    const store = await this.prisma.store.findFirst({
      where: { id: storeId, companyId },
      select: {
        id: true,
        name: true,
        url: true,
        status: true,
        lastSyncAt: true,
        syncError: true,
        currency: true,
        commissionRate: true,
        shippingCost: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            products: true,
            orders: true,
          },
        },
      },
    });

    if (!store) {
      throw new NotFoundException('Mağaza bulunamadı');
    }

    return store;
  }

  /**
   * Mağaza güncelle
   */
  async updateStore(companyId: string, storeId: string, userId: string, dto: UpdateStoreDto) {
    await this.checkCompanyAccess(companyId, userId);

    const store = await this.prisma.store.findFirst({
      where: { id: storeId, companyId },
    });

    if (!store) {
      throw new NotFoundException('Mağaza bulunamadı');
    }

    const updateData: any = {};
    const settingsLogs: { field: string; oldValue: string; newValue: string }[] = [];

    if (dto.name) updateData.name = dto.name;
    if (dto.url) {
      let url = dto.url.toLowerCase().trim();
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = `https://${url}`;
      }
      url = url.replace(/\/+$/, '');
      updateData.url = url;
    }
    if (dto.consumerKey) {
      updateData.consumerKey = encrypt(dto.consumerKey, this.encryptionKey);
    }
    if (dto.consumerSecret) {
      updateData.consumerSecret = encrypt(dto.consumerSecret, this.encryptionKey);
    }
    if (dto.commissionRate !== undefined) {
      // Audit log for commission rate change
      if (Number(store.commissionRate) !== dto.commissionRate) {
        settingsLogs.push({
          field: 'commissionRate',
          oldValue: String(store.commissionRate),
          newValue: String(dto.commissionRate),
        });
      }
      updateData.commissionRate = dto.commissionRate;
    }
    if (dto.shippingCost !== undefined) {
      // Audit log for shipping cost change
      if (Number(store.shippingCost) !== dto.shippingCost) {
        settingsLogs.push({
          field: 'shippingCost',
          oldValue: String(store.shippingCost),
          newValue: String(dto.shippingCost),
        });
      }
      updateData.shippingCost = dto.shippingCost;
    }
    if (dto.status) {
      updateData.status = dto.status;
    }

    const updatedStore = await this.prisma.store.update({
      where: { id: storeId },
      data: updateData,
      select: {
        id: true,
        name: true,
        url: true,
        status: true,
        lastSyncAt: true,
        currency: true,
        commissionRate: true,
        shippingCost: true,
        updatedAt: true,
      },
    });

    // Create audit logs for settings changes
    if (settingsLogs.length > 0) {
      await this.prisma.storeSettingsLog.createMany({
        data: settingsLogs.map((log) => ({
          storeId,
          userId,
          field: log.field,
          oldValue: log.oldValue,
          newValue: log.newValue,
        })),
      });
    }

    return updatedStore;
  }

  /**
   * Mağaza sil
   */
  async deleteStore(companyId: string, storeId: string, userId: string) {
    const membership = await this.checkCompanyAccess(companyId, userId);

    // Sadece OWNER ve ADMIN silebilir
    if (membership.role === CompanyRole.MEMBER) {
      throw new ForbiddenException('Mağaza silme yetkiniz yok');
    }

    const store = await this.prisma.store.findFirst({
      where: { id: storeId, companyId },
    });

    if (!store) {
      throw new NotFoundException('Mağaza bulunamadı');
    }

    await this.prisma.store.delete({
      where: { id: storeId },
    });

    return { message: 'Mağaza silindi' };
  }

  /**
   * Bağlantıyı test et (credentials ile, mağaza oluşturmadan)
   */
  async testConnectionWithCredentials(
    companyId: string,
    userId: string,
    dto: { url: string; consumerKey: string; consumerSecret: string },
  ) {
    await this.checkCompanyAccess(companyId, userId);

    // URL'i normalize et
    let url = dto.url.toLowerCase().trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`;
    }
    url = url.replace(/\/+$/, '');

    const client = new WooCommerceClient({
      url,
      consumerKey: dto.consumerKey,
      consumerSecret: dto.consumerSecret,
    });

    return client.testConnection();
  }

  /**
   * Bağlantıyı test et
   */
  async testConnection(companyId: string, storeId: string, userId: string) {
    await this.checkCompanyAccess(companyId, userId);

    const store = await this.prisma.store.findFirst({
      where: { id: storeId, companyId },
    });

    if (!store) {
      throw new NotFoundException('Mağaza bulunamadı');
    }

    // Credentials'ı çöz
    const consumerKey = decrypt(store.consumerKey, this.encryptionKey);
    const consumerSecret = decrypt(store.consumerSecret, this.encryptionKey);

    const client = new WooCommerceClient({
      url: store.url,
      consumerKey,
      consumerSecret,
    });

    const result = await client.testConnection();

    // Durumu güncelle
    await this.prisma.store.update({
      where: { id: storeId },
      data: {
        status: result.success ? StoreStatus.ACTIVE : StoreStatus.ERROR,
        syncError: result.success ? null : result.error,
      },
    });

    return result;
  }

  /**
   * Manuel senkronizasyon başlat (async - hemen döner, arka planda çalışır)
   */
  async syncStore(companyId: string, storeId: string, userId: string) {
    await this.checkCompanyAccess(companyId, userId);

    const store = await this.prisma.store.findFirst({
      where: { id: storeId, companyId },
    });

    if (!store) {
      throw new NotFoundException('Mağaza bulunamadı');
    }

    // Zaten senkronize ediliyorsa hata ver
    if (store.isSyncing) {
      throw new BadRequestException('Mağaza zaten senkronize ediliyor');
    }

    // Senkronizasyon başladı - Bağlantı kontrol ediliyor
    await this.prisma.store.update({
      where: { id: storeId },
      data: { isSyncing: true, syncStep: 'connection', syncError: null },
    });

    // Arka planda senkronizasyonu başlat (await kullanmıyoruz)
    this.runSyncInBackground(store);

    // Hemen yanıt dön
    return {
      success: true,
      message: 'Senkronizasyon başlatıldı',
      started: true,
    };
  }

  /**
   * Arka planda senkronizasyonu çalıştır
   */
  private async runSyncInBackground(store: any) {
    // Credentials'ı çöz
    let consumerKey: string;
    let consumerSecret: string;

    try {
      consumerKey = decrypt(store.consumerKey, this.encryptionKey);
      consumerSecret = decrypt(store.consumerSecret, this.encryptionKey);
    } catch (decryptError: any) {
      console.error('Decrypt error:', decryptError.message);
      await this.prisma.store.update({
        where: { id: store.id },
        data: { isSyncing: false, syncStep: null, syncError: 'Kimlik bilgileri çözülemedi' },
      });
      return;
    }

    const client = new WooCommerceClient({
      url: store.url,
      consumerKey,
      consumerSecret,
    });

    try {
      // Ürünleri senkronize et (tüm ürünleri çek, upsert ile güncelle/ekle)
      await this.prisma.store.update({
        where: { id: store.id },
        data: { syncStep: 'products', syncProductsCount: 0, syncVariationsCount: 0, syncOrdersCount: 0 },
      });

      // Tüm ürünleri çek - upsert mevcut olanları günceller, yenileri ekler
      const products = await client.getAllProducts();

      // Ürün sayısını güncelle
      await this.prisma.store.update({
        where: { id: store.id },
        data: { syncProductsCount: products.length },
      });

      // 1. ADIM: Önce TÜM ürünleri kaydet
      const savedProducts: Map<number, string> = new Map(); // wcProductId -> savedProductId
      const variableProductIds: number[] = [];

      for (const product of products) {
        // Alış fiyatını meta_data'dan çıkar
        const purchasePrice = this.extractPurchasePrice(product.meta_data);
        // İlk görseli al
        const imageUrl = product.images && product.images.length > 0 ? product.images[0].src : null;

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
            imageUrl: imageUrl,
            productType: product.type || 'simple',
            price: parseFloat(product.price) || 0,
            purchasePrice: purchasePrice,
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
            imageUrl: imageUrl,
            productType: product.type || 'simple',
            price: parseFloat(product.price) || 0,
            purchasePrice: purchasePrice,
            stockQuantity: product.stock_quantity || 0,
            stockStatus: product.stock_status,
            manageStock: product.manage_stock || false,
            isActive: product.status === 'publish',
          },
        });

        savedProducts.set(product.id, savedProduct.id);

        // Variable ürünleri kaydet, sonra varyasyonlarını çekeceğiz
        if (product.type === 'variable') {
          variableProductIds.push(product.id);
        }
      }

      // 2. ADIM: Şimdi varyasyonları çek (tüm ürünler kaydedildikten sonra)
      let variationsCount = 0;

      if (variableProductIds.length > 0) {
        await this.prisma.store.update({
          where: { id: store.id },
          data: { syncStep: 'variations' },
        });

        for (const wcProductId of variableProductIds) {
          const savedProductId = savedProducts.get(wcProductId);
          if (!savedProductId) continue;

          const variations = await client.getProductVariations(wcProductId);
          variationsCount += variations.length;

          // Varyasyon sayısını güncelle
          await this.prisma.store.update({
            where: { id: store.id },
            data: { syncVariationsCount: variationsCount },
          });

          for (const variation of variations) {
            // Attribute string oluştur (örn: "XL / Kırmızı")
            const attributeString = variation.attributes
              .map((attr) => attr.option)
              .join(' / ');

            // Attributes JSON olarak kaydet
            const attributesJson: Record<string, string> = {};
            variation.attributes.forEach((attr) => {
              attributesJson[attr.name] = attr.option;
            });

            await this.prisma.productVariation.upsert({
              where: {
                productId_wcVariationId: {
                  productId: savedProductId,
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
                productId: savedProductId,
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
          }
        }
      }

      // Siparişleri senkronize et (son 30 gün - upsert ile güncelle/ekle)
      await this.prisma.store.update({
        where: { id: store.id },
        data: { syncStep: 'orders' },
      });

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const orders = await client.getAllOrders(thirtyDaysAgo);

      // Sipariş sayısını güncelle
      await this.prisma.store.update({
        where: { id: store.id },
        data: { syncOrdersCount: orders.length },
      });

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

      // Verileri kaydediyor
      await this.prisma.store.update({
        where: { id: store.id },
        data: { syncStep: 'saving' },
      });

      // Sync durumunu güncelle
      await this.prisma.store.update({
        where: { id: store.id },
        data: {
          status: StoreStatus.ACTIVE,
          isSyncing: false,
          syncStep: null,
          lastSyncAt: new Date(),
          syncError: null,
        },
      });

      this.logger.log(`Sync completed for ${store.name}: ${products.length} products, ${variationsCount} variations, ${orders.length} orders`);
    } catch (error: any) {
      console.error('Sync error:', {
        message: error.message,
        code: error.code,
        response: error.response?.data,
        status: error.response?.status,
        stack: error.stack,
      });

      // WooCommerce API hatası için daha detaylı mesaj
      let errorMessage = 'Senkronizasyon başarısız';

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.code) {
        errorMessage = `WooCommerce hatası: ${error.response.data.code}`;
      } else if (error.response?.status === 401) {
        errorMessage = 'Kimlik doğrulama başarısız. API anahtarlarını kontrol edin.';
      } else if (error.response?.status === 403) {
        errorMessage = 'Erişim reddedildi. API anahtarı izinlerini kontrol edin.';
      } else if (error.response?.status === 404) {
        errorMessage = 'WooCommerce API bulunamadı. URL\'yi kontrol edin.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      // Hata durumunu kaydet
      await this.prisma.store.update({
        where: { id: store.id },
        data: {
          status: StoreStatus.ERROR,
          isSyncing: false,
          syncStep: null,
          syncError: errorMessage,
        },
      });

      this.logger.error(`Sync failed for ${store.name}: ${errorMessage}`);
    }
  }
}
