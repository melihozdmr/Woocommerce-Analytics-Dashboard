import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';
import { WooCommerceClient } from '../store/woocommerce.client';
import { WCSCClient } from '../store/wcsc.client';
import { decrypt } from '../../common/utils/crypto.util';

export interface InventorySummary {
  totalStock: number;
  totalStockValue: number;
  netProfit: number;
  criticalStockCount: number;
  outOfStockCount: number;
  productsWithoutPurchasePrice: number;
  lastSyncAt: Date | null;
}

export interface StoreInventory {
  storeId: string;
  storeName: string;
  totalStock: number;
  totalStockValue: number;
  netProfit: number;
  criticalStockCount: number;
  productCount: number;
}

export interface CriticalProduct {
  id: string;
  name: string;
  sku: string | null;
  stockQuantity: number;
  price: number;
  purchasePrice: number | null;
  storeId: string;
  storeName: string;
  storeUrl: string;
  wcProductId: number;
  productType: string;
  variationInfo?: string;
}

@Injectable()
export class InventoryService {
  private readonly encryptionKey: string;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    this.encryptionKey = this.configService.get<string>('encryption.key') || 'default-encryption-key-change-in-production';
  }

  async getSummary(companyId: string, criticalThreshold: number = 5): Promise<InventorySummary> {
    // Get all stores for this company with commission and shipping info
    const stores = await this.prisma.store.findMany({
      where: { companyId, status: 'ACTIVE' },
      select: { id: true, lastSyncAt: true, commissionRate: true, shippingCost: true },
    });

    const storeIds = stores.map((s) => s.id);
    const storeMap = new Map(stores.map((s) => [s.id, { commissionRate: Number(s.commissionRate) || 0, shippingCost: Number(s.shippingCost) || 0 }]));

    if (storeIds.length === 0) {
      return {
        totalStock: 0,
        totalStockValue: 0,
        netProfit: 0,
        criticalStockCount: 0,
        outOfStockCount: 0,
        productsWithoutPurchasePrice: 0,
        lastSyncAt: null,
      };
    }

    // Get all products with variations
    const products = await this.prisma.product.findMany({
      where: {
        storeId: { in: storeIds },
        isActive: true,
      },
      select: {
        id: true,
        storeId: true,
        stockQuantity: true,
        price: true,
        purchasePrice: true,
        productType: true,
        variations: {
          where: { isActive: true },
          select: { stockQuantity: true, price: true, purchasePrice: true },
        },
      },
    });

    // Get all mappings for this company to identify mapped products
    const mappings = await this.prisma.productMapping.findMany({
      where: { companyId },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                storeId: true,
                stockQuantity: true,
                price: true,
                purchasePrice: true,
                productType: true,
                variations: {
                  where: { isActive: true },
                  select: { stockQuantity: true, price: true },
                },
              },
            },
          },
          orderBy: { createdAt: 'asc' }, // İlk eklenen kaynak
        },
      },
    });

    // Create a map of productId -> mappingId and source product info
    const productToMappingId = new Map<string, string>();
    const mappingSourceStock = new Map<string, { stock: number; price: number; purchasePrice: number; storeId: string }>();

    for (const mapping of mappings) {
      // İlk item kaynak (source)
      const sourceItem = mapping.items.find((i) => i.isSource) || mapping.items[0];
      if (sourceItem) {
        let sourceStock = sourceItem.product.stockQuantity;
        let sourcePrice = Number(sourceItem.product.price);
        const sourcePurchasePrice = sourceItem.product.purchasePrice ? Number(sourceItem.product.purchasePrice) : 0;

        if (sourceItem.product.productType === 'variable' && sourceItem.product.variations.length > 0) {
          sourceStock = sourceItem.product.variations.reduce((sum, v) => sum + v.stockQuantity, 0);
          sourcePrice = sourceItem.product.variations.reduce((sum, v) => sum + Number(v.price), 0) / sourceItem.product.variations.length;
        }

        mappingSourceStock.set(mapping.id, {
          stock: sourceStock,
          price: sourcePrice,
          purchasePrice: sourcePurchasePrice,
          storeId: sourceItem.product.storeId,
        });
      }

      for (const item of mapping.items) {
        productToMappingId.set(item.productId, mapping.id);
      }
    }

    // Calculate totals - for mapped products, use source stock only (not combined)
    let totalStock = 0;
    let totalStockValue = 0;
    let netProfit = 0;
    let criticalStockCount = 0;
    let outOfStockCount = 0;
    let productsWithoutPurchasePrice = 0;

    const processedMappings = new Set<string>();

    for (const product of products) {
      // Calculate effective stock for this product (including variations)
      let effectiveStock: number;
      let effectivePrice: number;
      let effectivePurchasePrice: number;
      let effectiveStoreId: string = product.storeId;

      if (product.productType === 'variable' && product.variations.length > 0) {
        effectiveStock = product.variations.reduce((sum, v) => sum + v.stockQuantity, 0);
        // Use average price from variations
        effectivePrice = product.variations.reduce((sum, v) => sum + Number(v.price), 0) / product.variations.length;
        effectivePurchasePrice = product.purchasePrice ? Number(product.purchasePrice) : 0;
      } else {
        effectiveStock = product.stockQuantity;
        effectivePrice = Number(product.price);
        effectivePurchasePrice = product.purchasePrice ? Number(product.purchasePrice) : 0;
      }

      const mappingId = productToMappingId.get(product.id);

      if (mappingId) {
        // This product is part of a mapping
        if (processedMappings.has(mappingId)) {
          // Already processed this mapping, skip entirely (same physical product in multiple sites)
          continue;
        }
        processedMappings.add(mappingId);

        // Use source stock for this mapping (gerçek stok)
        const sourceInfo = mappingSourceStock.get(mappingId);
        if (sourceInfo) {
          effectiveStock = sourceInfo.stock;
          effectivePrice = sourceInfo.price;
          effectivePurchasePrice = sourceInfo.purchasePrice;
          effectiveStoreId = sourceInfo.storeId;
        }
      }

      // Get store commission and shipping
      const storeInfo = storeMap.get(effectiveStoreId) || { commissionRate: 0, shippingCost: 0 };
      const commissionAmount = effectivePrice * (storeInfo.commissionRate / 100);

      // Net profit per unit = sale price - purchase price - commission - shipping
      const profitPerUnit = effectivePrice - effectivePurchasePrice - commissionAmount - storeInfo.shippingCost;

      // Add to totals
      totalStock += effectiveStock;
      totalStockValue += effectivePurchasePrice * effectiveStock;
      netProfit += profitPerUnit * effectiveStock;

      // Count critical/out of stock
      if (effectiveStock === 0) outOfStockCount++;
      else if (effectiveStock <= criticalThreshold) criticalStockCount++;

      if (!product.purchasePrice) productsWithoutPurchasePrice++;
    }

    // Get last sync time
    const lastSyncAt = stores.reduce((latest, store) => {
      if (!store.lastSyncAt) return latest;
      if (!latest) return store.lastSyncAt;
      return store.lastSyncAt > latest ? store.lastSyncAt : latest;
    }, null as Date | null);

    return {
      totalStock,
      totalStockValue: Math.round(totalStockValue * 100) / 100,
      netProfit: Math.round(netProfit * 100) / 100,
      criticalStockCount,
      outOfStockCount,
      productsWithoutPurchasePrice,
      lastSyncAt,
    };
  }

  async getByStore(companyId: string, criticalThreshold: number = 5): Promise<StoreInventory[]> {
    const stores = await this.prisma.store.findMany({
      where: { companyId, status: 'ACTIVE' },
      select: {
        id: true,
        name: true,
        commissionRate: true,
        shippingCost: true,
        products: {
          where: { isActive: true },
          select: {
            stockQuantity: true,
            price: true,
            purchasePrice: true,
            productType: true,
            variations: {
              where: { isActive: true },
              select: {
                stockQuantity: true,
                price: true,
                purchasePrice: true,
              },
            },
          },
        },
      },
    });

    return stores.map((store) => {
      let totalStock = 0;
      let totalStockValue = 0;
      let netProfit = 0;
      let criticalStockCount = 0;

      const commissionRate = Number(store.commissionRate) || 0;
      const shippingCost = Number(store.shippingCost) || 0;

      for (const product of store.products) {
        let effectiveStock: number;
        let effectivePrice: number;
        let effectivePurchasePrice: number;

        // Variable ürünler için varyasyonların stok toplamını al
        if (product.productType === 'variable' && product.variations.length > 0) {
          effectiveStock = product.variations.reduce((sum, v) => sum + v.stockQuantity, 0);
          effectivePrice = product.variations.reduce((sum, v) => sum + Number(v.price), 0) / product.variations.length;
          // Varyasyonlarda purchasePrice varsa onu kullan, yoksa ürünün purchasePrice'ını
          const variationsWithPurchasePrice = product.variations.filter(v => v.purchasePrice);
          if (variationsWithPurchasePrice.length > 0) {
            effectivePurchasePrice = variationsWithPurchasePrice.reduce((sum, v) => sum + Number(v.purchasePrice), 0) / variationsWithPurchasePrice.length;
          } else {
            effectivePurchasePrice = product.purchasePrice ? Number(product.purchasePrice) : 0;
          }
        } else {
          // Simple ürünler veya varyasyonsuz variable ürünler
          effectiveStock = product.stockQuantity;
          effectivePrice = Number(product.price);
          effectivePurchasePrice = product.purchasePrice ? Number(product.purchasePrice) : 0;
        }

        const commission = effectivePrice * (commissionRate / 100);
        const profitPerUnit = effectivePrice - effectivePurchasePrice - commission - shippingCost;

        totalStock += effectiveStock;
        totalStockValue += effectivePurchasePrice * effectiveStock;
        netProfit += profitPerUnit * effectiveStock;

        if (effectiveStock > 0 && effectiveStock <= criticalThreshold) criticalStockCount++;
      }

      return {
        storeId: store.id,
        storeName: store.name,
        totalStock,
        totalStockValue: Math.round(totalStockValue * 100) / 100,
        netProfit: Math.round(netProfit * 100) / 100,
        criticalStockCount,
        productCount: store.products.length,
      };
    });
  }

  async getCriticalProducts(
    companyId: string,
    criticalThreshold: number = 5,
    storeId?: string,
  ): Promise<CriticalProduct[]> {
    const stores = await this.prisma.store.findMany({
      where: {
        companyId,
        status: 'ACTIVE',
        ...(storeId && { id: storeId }),
      },
      select: { id: true, name: true, url: true },
    });

    const storeIds = stores.map((s) => s.id);
    const storeMap = new Map(stores.map((s) => [s.id, { name: s.name, url: s.url }]));

    if (storeIds.length === 0) return [];

    // Get critical simple products
    const criticalProducts = await this.prisma.product.findMany({
      where: {
        storeId: { in: storeIds },
        isActive: true,
        productType: 'simple',
        stockQuantity: { lte: criticalThreshold },
      },
      orderBy: { stockQuantity: 'asc' },
      select: {
        id: true,
        name: true,
        sku: true,
        stockQuantity: true,
        price: true,
        purchasePrice: true,
        storeId: true,
        wcProductId: true,
        productType: true,
      },
    });

    // Get critical variations
    const criticalVariations = await this.prisma.productVariation.findMany({
      where: {
        product: {
          storeId: { in: storeIds },
          isActive: true,
          productType: 'variable',
        },
        isActive: true,
        stockQuantity: { lte: criticalThreshold },
      },
      orderBy: { stockQuantity: 'asc' },
      select: {
        id: true,
        sku: true,
        stockQuantity: true,
        price: true,
        attributeString: true,
        product: {
          select: {
            id: true,
            name: true,
            storeId: true,
            wcProductId: true,
            purchasePrice: true,
          },
        },
      },
    });

    const result: CriticalProduct[] = [];

    // Add simple products
    for (const product of criticalProducts) {
      const store = storeMap.get(product.storeId);
      result.push({
        id: product.id,
        name: product.name,
        sku: product.sku,
        stockQuantity: product.stockQuantity,
        price: Number(product.price),
        purchasePrice: product.purchasePrice ? Number(product.purchasePrice) : null,
        storeId: product.storeId,
        storeName: store?.name || '',
        storeUrl: store?.url || '',
        wcProductId: product.wcProductId,
        productType: 'simple',
      });
    }

    // Add variations
    for (const variation of criticalVariations) {
      const store = storeMap.get(variation.product.storeId);
      result.push({
        id: variation.id,
        name: `${variation.product.name}${variation.attributeString ? ` - ${variation.attributeString}` : ''}`,
        sku: variation.sku,
        stockQuantity: variation.stockQuantity,
        price: Number(variation.price),
        purchasePrice: variation.product.purchasePrice ? Number(variation.product.purchasePrice) : null,
        storeId: variation.product.storeId,
        storeName: store?.name || '',
        storeUrl: store?.url || '',
        wcProductId: variation.product.wcProductId,
        productType: 'variation',
        variationInfo: variation.attributeString || undefined,
      });
    }

    // Sort by stock quantity
    return result.sort((a, b) => a.stockQuantity - b.stockQuantity);
  }

  async getProducts(
    companyId: string,
    options: {
      page?: number;
      limit?: number;
      storeId?: string;
      search?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
      stockStatus?: 'instock' | 'outofstock' | 'critical';
      mappingStatus?: 'mapped' | 'unmapped';
      criticalThreshold?: number;
      consolidateMappings?: boolean;
    } = {},
  ) {
    const { page = 1, limit = 20, storeId, search, sortBy = 'name', sortOrder = 'asc', stockStatus, mappingStatus, criticalThreshold = 5, consolidateMappings = true } = options;

    const stores = await this.prisma.store.findMany({
      where: {
        companyId,
        status: 'ACTIVE',
        ...(storeId && { id: storeId }),
      },
      select: { id: true, name: true },
    });

    const storeIds = stores.map((s) => s.id);
    const storeMap = new Map(stores.map((s) => [s.id, s.name]));

    if (storeIds.length === 0) {
      return { products: [], total: 0, page, limit, totalPages: 0 };
    }

    // Base where clause
    const baseWhere: any = {
      storeId: { in: storeIds },
      isActive: true,
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { sku: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    };

    // Filter by mapping status
    if (mappingStatus) {
      if (mappingStatus === 'mapped') {
        baseWhere.productMappingItems = { some: {} };
      } else if (mappingStatus === 'unmapped') {
        baseWhere.productMappingItems = { none: {} };
      }
    }

    // For stock filtering, we need to handle variable products differently
    // Variable products' stock is in variations, simple products' stock is in the product itself
    if (stockStatus) {
      // Get all products with variations to calculate total stock
      const allProducts = await this.prisma.product.findMany({
        where: baseWhere,
        select: {
          id: true,
          productType: true,
          stockQuantity: true,
          variations: {
            where: { isActive: true },
            select: { stockQuantity: true },
          },
        },
      });

      // Calculate effective stock for each product
      const productStockMap = new Map<string, number>();
      for (const product of allProducts) {
        let effectiveStock: number;
        if (product.productType === 'variable' && product.variations.length > 0) {
          effectiveStock = product.variations.reduce((sum, v) => sum + v.stockQuantity, 0);
        } else {
          effectiveStock = product.stockQuantity;
        }
        productStockMap.set(product.id, effectiveStock);
      }

      // Filter product IDs based on stock status
      const filteredIds: string[] = [];
      for (const [id, stock] of productStockMap) {
        if (stockStatus === 'outofstock' && stock === 0) {
          filteredIds.push(id);
        } else if (stockStatus === 'critical' && stock > 0 && stock <= criticalThreshold) {
          filteredIds.push(id);
        } else if (stockStatus === 'instock' && stock > criticalThreshold) {
          filteredIds.push(id);
        }
      }

      // Add ID filter to where clause
      baseWhere.id = { in: filteredIds };
    }

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where: baseWhere,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          name: true,
          sku: true,
          imageUrl: true,
          productType: true,
          stockQuantity: true,
          price: true,
          purchasePrice: true,
          storeId: true,
          wcProductId: true,
          syncedAt: true,
          isActive: true,
          variations: {
            where: { isActive: true },
            select: { stockQuantity: true },
          },
          _count: {
            select: { variations: true },
          },
        },
      }),
      this.prisma.product.count({ where: baseWhere }),
    ]);

    // Map products with effective stock calculation
    const mappedProducts = products.map((p) => {
      const effectiveStock = p.productType === 'variable' && p.variations.length > 0
        ? p.variations.reduce((sum, v) => sum + v.stockQuantity, 0)
        : p.stockQuantity;

      return {
        id: p.id,
        name: p.name,
        sku: p.sku,
        imageUrl: p.imageUrl,
        productType: p.productType,
        stockQuantity: effectiveStock,
        price: Number(p.price),
        purchasePrice: p.purchasePrice ? Number(p.purchasePrice) : null,
        storeId: p.storeId,
        wcProductId: p.wcProductId,
        syncedAt: p.syncedAt,
        isActive: p.isActive,
        storeName: storeMap.get(p.storeId) || '',
        variationCount: p._count.variations,
        mappingId: null as string | null,
        isMapped: false,
        mappedStoreCount: 0,
        totalMappedStock: 0,
      };
    });

    // If consolidation is enabled, merge mapped products
    if (consolidateMappings) {
      // Get all mappings for this company
      const mappings = await this.prisma.productMappingItem.findMany({
        where: {
          mapping: { companyId },
          productId: { in: mappedProducts.map((p) => p.id) },
        },
        include: {
          mapping: {
            include: {
              items: {
                include: {
                  product: {
                    include: {
                      variations: { select: { stockQuantity: true } },
                    },
                  },
                },
                orderBy: { createdAt: 'asc' }, // İlk eklenen kaynak
              },
            },
          },
        },
      });

      // Create a map of productId -> mapping info
      const productToMapping = new Map<string, { mappingId: string; masterSku: string; allProductIds: string[] }>();

      for (const item of mappings) {
        const allProductIds = item.mapping.items.map((i) => i.productId);
        productToMapping.set(item.productId, {
          mappingId: item.mappingId,
          masterSku: item.mapping.masterSku,
          allProductIds,
        });
      }

      // Consolidate mapped products
      const consolidatedProducts: typeof mappedProducts = [];
      const seenMappings = new Set<string>();

      for (const product of mappedProducts) {
        const mappingInfo = productToMapping.get(product.id);

        if (mappingInfo) {
          // This product is part of a mapping
          if (seenMappings.has(mappingInfo.mappingId)) {
            // Skip - we already added this mapping's representative
            continue;
          }

          seenMappings.add(mappingInfo.mappingId);

          // Find the mapping item to get source stock (gerçek stok)
          const mappingItem = mappings.find((m) => m.mappingId === mappingInfo.mappingId);
          if (mappingItem) {
            const storeNames: string[] = [];

            // Find source item (isSource = true or first item)
            const sourceItem = mappingItem.mapping.items.find((i) => i.isSource) || mappingItem.mapping.items[0];
            let realStock = 0;

            if (sourceItem) {
              realStock = sourceItem.product.stockQuantity;
              if (sourceItem.product.variations && sourceItem.product.variations.length > 0) {
                realStock = sourceItem.product.variations.reduce((sum, v) => sum + v.stockQuantity, 0);
              }
            }

            // Collect store names
            for (const mi of mappingItem.mapping.items) {
              const storeName = storeMap.get(mi.storeId);
              if (storeName && !storeNames.includes(storeName)) {
                storeNames.push(storeName);
              }
            }

            consolidatedProducts.push({
              ...product,
              mappingId: mappingInfo.mappingId,
              isMapped: true,
              mappedStoreCount: mappingItem.mapping.items.length,
              totalMappedStock: realStock, // Gerçek stok = kaynak sitenin stoğu
              stockQuantity: realStock,
              storeName: storeNames.join(', '),
            });
          }
        } else {
          // Not mapped, add as-is
          consolidatedProducts.push(product);
        }
      }

      return {
        products: consolidatedProducts,
        total: total - (mappedProducts.length - consolidatedProducts.length),
        page,
        limit,
        totalPages: Math.ceil((total - (mappedProducts.length - consolidatedProducts.length)) / limit),
      };
    }

    return {
      products: mappedProducts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getProduct(companyId: string, productId: string) {
    // First verify the product belongs to a store in this company
    const product = await this.prisma.product.findFirst({
      where: {
        id: productId,
        store: {
          companyId,
          status: 'ACTIVE',
        },
      },
      include: {
        store: {
          select: {
            id: true,
            name: true,
            url: true,
          },
        },
        variations: {
          where: { isActive: true },
          select: {
            id: true,
            wcVariationId: true,
            sku: true,
            price: true,
            stockQuantity: true,
            stockStatus: true,
            attributes: true,
            attributeString: true,
          },
          orderBy: { attributeString: 'asc' },
        },
        productMappingItems: {
          include: {
            mapping: {
              include: {
                items: {
                  include: {
                    store: {
                      select: {
                        id: true,
                        name: true,
                        url: true,
                      },
                    },
                    product: {
                      select: {
                        id: true,
                        wcProductId: true,
                        stockQuantity: true,
                        variations: {
                          select: { stockQuantity: true },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!product) {
      return null;
    }

    // Build mapping info if product is mapped
    let mapping = null;
    if (product.productMappingItems.length > 0) {
      const mappingData = product.productMappingItems[0].mapping;
      mapping = {
        id: mappingData.id,
        masterSku: mappingData.masterSku,
        name: mappingData.name,
        stores: mappingData.items.map((item) => {
          // Calculate stock including variations
          let stock = item.product.stockQuantity;
          if (item.product.variations && item.product.variations.length > 0) {
            stock = item.product.variations.reduce((sum, v) => sum + v.stockQuantity, 0);
          }
          return {
            storeId: item.store.id,
            storeName: item.store.name,
            storeUrl: item.store.url,
            productId: item.product.id,
            wcProductId: item.product.wcProductId,
            isSource: item.isSource,
            stockQuantity: stock,
          };
        }),
      };
    }

    return {
      id: product.id,
      name: product.name,
      sku: product.sku,
      imageUrl: product.imageUrl,
      productType: product.productType,
      stockQuantity: product.stockQuantity,
      stockStatus: product.stockStatus,
      price: Number(product.price),
      purchasePrice: product.purchasePrice ? Number(product.purchasePrice) : null,
      manageStock: product.manageStock,
      isActive: product.isActive,
      wcProductId: product.wcProductId,
      syncedAt: product.syncedAt,
      store: {
        id: product.store.id,
        name: product.store.name,
        url: product.store.url,
      },
      variations: product.variations.map((v) => ({
        id: v.id,
        wcVariationId: v.wcVariationId,
        sku: v.sku,
        price: Number(v.price),
        stockQuantity: v.stockQuantity,
        stockStatus: v.stockStatus,
        attributes: v.attributes,
        attributeString: v.attributeString,
      })),
      mapping,
    };
  }

  async updateProductStock(companyId: string, productId: string, stockQuantity: number) {
    // Verify the product belongs to a store in this company
    const product = await this.prisma.product.findFirst({
      where: {
        id: productId,
        store: {
          companyId,
          status: 'ACTIVE',
        },
      },
      include: {
        store: true,
      },
    });

    if (!product) {
      throw new BadRequestException('Ürün bulunamadı');
    }

    // Check if WCSC plugin is connected - prefer WCSC over WooCommerce API
    if (product.store.hasWcscPlugin && product.store.wcscApiKey && product.store.wcscApiSecret) {
      // Use WCSC plugin to update stock
      const wcscClient = new WCSCClient({
        url: product.store.url,
        apiKey: decrypt(product.store.wcscApiKey, this.encryptionKey),
        apiSecret: decrypt(product.store.wcscApiSecret, this.encryptionKey),
      });

      try {
        await wcscClient.updateStock(product.wcProductId, stockQuantity);
      } catch (error: any) {
        throw new BadRequestException('WCSC stok güncellemesi başarısız: ' + (error.message || 'Bilinmeyen hata'));
      }
    } else {
      // Fall back to WooCommerce REST API
      const wcClient = new WooCommerceClient({
        url: product.store.url,
        consumerKey: decrypt(product.store.consumerKey, this.encryptionKey),
        consumerSecret: decrypt(product.store.consumerSecret, this.encryptionKey),
      });

      try {
        await wcClient.updateProductStock(product.wcProductId, stockQuantity);
      } catch (error: any) {
        if (error.response?.status === 401) {
          throw new BadRequestException(
            'WooCommerce API anahtarı yazma yetkisine sahip değil. Lütfen "Read/Write" yetkili yeni bir API anahtarı oluşturun veya WC Stock Connector eklentisini bağlayın.'
          );
        }
        throw new BadRequestException('WooCommerce stok güncellemesi başarısız: ' + (error.message || 'Bilinmeyen hata'));
      }
    }

    // Update local database
    const updatedProduct = await this.prisma.product.update({
      where: { id: productId },
      data: {
        stockQuantity,
        stockStatus: stockQuantity > 0 ? 'instock' : 'outofstock',
      },
    });

    return {
      id: updatedProduct.id,
      stockQuantity: updatedProduct.stockQuantity,
      stockStatus: updatedProduct.stockStatus,
    };
  }

  async updateVariationStock(companyId: string, variationId: string, stockQuantity: number) {
    // Verify the variation belongs to a product in this company
    const variation = await this.prisma.productVariation.findFirst({
      where: {
        id: variationId,
        product: {
          store: {
            companyId,
            status: 'ACTIVE',
          },
        },
      },
      include: {
        product: {
          include: {
            store: true,
          },
        },
      },
    });

    if (!variation) {
      throw new BadRequestException('Varyasyon bulunamadı');
    }

    const store = variation.product.store;

    // Check if WCSC plugin is connected - prefer WCSC over WooCommerce API
    if (store.hasWcscPlugin && store.wcscApiKey && store.wcscApiSecret) {
      // Use WCSC plugin to update stock
      const wcscClient = new WCSCClient({
        url: store.url,
        apiKey: decrypt(store.wcscApiKey, this.encryptionKey),
        apiSecret: decrypt(store.wcscApiSecret, this.encryptionKey),
      });

      try {
        await wcscClient.updateStock(variation.wcVariationId, stockQuantity, true);
      } catch (error: any) {
        throw new BadRequestException('WCSC varyasyon stok güncellemesi başarısız: ' + (error.message || 'Bilinmeyen hata'));
      }
    } else {
      // Fall back to WooCommerce REST API
      const wcClient = new WooCommerceClient({
        url: store.url,
        consumerKey: decrypt(store.consumerKey, this.encryptionKey),
        consumerSecret: decrypt(store.consumerSecret, this.encryptionKey),
      });

      try {
        await wcClient.updateVariationStock(
          variation.product.wcProductId,
          variation.wcVariationId,
          stockQuantity,
        );
      } catch (error: any) {
        if (error.response?.status === 401) {
          throw new BadRequestException(
            'WooCommerce API anahtarı yazma yetkisine sahip değil. Lütfen "Read/Write" yetkili yeni bir API anahtarı oluşturun veya WC Stock Connector eklentisini bağlayın.'
          );
        }
        throw new BadRequestException('WooCommerce stok güncellemesi başarısız: ' + (error.message || 'Bilinmeyen hata'));
      }
    }

    // Update local database
    const updatedVariation = await this.prisma.productVariation.update({
      where: { id: variationId },
      data: {
        stockQuantity,
        stockStatus: stockQuantity > 0 ? 'instock' : 'outofstock',
      },
    });

    return {
      id: updatedVariation.id,
      stockQuantity: updatedVariation.stockQuantity,
      stockStatus: updatedVariation.stockStatus,
    };
  }

  async updateProductPurchasePrice(companyId: string, productId: string, purchasePrice: number) {
    // Verify the product belongs to a store in this company
    const product = await this.prisma.product.findFirst({
      where: {
        id: productId,
        store: {
          companyId,
          status: 'ACTIVE',
        },
      },
      include: {
        store: true,
      },
    });

    if (!product) {
      throw new BadRequestException('Ürün bulunamadı');
    }

    // If store has WCSC plugin, sync to WooCommerce
    if (product.store.hasWcscPlugin && product.store.wcscApiKey && product.store.wcscApiSecret) {
      try {
        const wcscClient = new WCSCClient({
          url: product.store.url,
          apiKey: decrypt(product.store.wcscApiKey, this.encryptionKey),
          apiSecret: decrypt(product.store.wcscApiSecret, this.encryptionKey),
        });
        await wcscClient.updatePurchasePrice(product.wcProductId, purchasePrice);
      } catch (error: any) {
        console.error('WCSC sync failed:', error.message);
        // Continue with local update even if sync fails
      }
    }

    // Update local database
    const updatedProduct = await this.prisma.product.update({
      where: { id: productId },
      data: { purchasePrice },
    });

    return {
      id: updatedProduct.id,
      purchasePrice: Number(updatedProduct.purchasePrice),
    };
  }

  async updateVariationPurchasePrice(companyId: string, variationId: string, purchasePrice: number) {
    // Verify the variation belongs to a product in this company
    const variation = await this.prisma.productVariation.findFirst({
      where: {
        id: variationId,
        product: {
          store: {
            companyId,
            status: 'ACTIVE',
          },
        },
      },
      include: {
        product: {
          include: { store: true },
        },
      },
    });

    if (!variation) {
      throw new BadRequestException('Varyasyon bulunamadı');
    }

    // Update local database
    const updatedVariation = await this.prisma.productVariation.update({
      where: { id: variationId },
      data: { purchasePrice },
    });

    return {
      id: updatedVariation.id,
      purchasePrice: Number(updatedVariation.purchasePrice),
    };
  }

  async bulkUpdate(
    companyId: string,
    items: Array<{
      productId: string;
      variationId?: string;
      stockQuantity?: number;
      purchasePrice?: number;
    }>,
    syncToStore = true,
  ) {
    const results = {
      success: [] as Array<{ id: string; type: string }>,
      failed: [] as Array<{ id: string; type: string; error: string }>,
    };

    // Group items by store for batch processing
    const storeItems = new Map<string, typeof items>();

    for (const item of items) {
      let storeId: string | null = null;

      if (item.variationId) {
        const variation = await this.prisma.productVariation.findFirst({
          where: {
            id: item.variationId,
            product: { store: { companyId } },
          },
          select: { product: { select: { storeId: true } } },
        });
        storeId = variation?.product.storeId || null;
      } else if (item.productId) {
        const product = await this.prisma.product.findFirst({
          where: {
            id: item.productId,
            store: { companyId },
          },
          select: { storeId: true },
        });
        storeId = product?.storeId || null;
      }

      if (storeId) {
        if (!storeItems.has(storeId)) {
          storeItems.set(storeId, []);
        }
        storeItems.get(storeId)!.push(item);
      }
    }

    // Process each store's items
    for (const [storeId, storeItemList] of storeItems) {
      const store = await this.prisma.store.findUnique({
        where: { id: storeId },
      });

      if (!store) continue;

      // Process each item
      for (const item of storeItemList) {
        try {
          if (item.variationId) {
            // Update variation
            if (item.stockQuantity !== undefined) {
              await this.updateVariationStock(companyId, item.variationId, item.stockQuantity);
            }
            if (item.purchasePrice !== undefined) {
              await this.updateVariationPurchasePrice(companyId, item.variationId, item.purchasePrice);
            }
            results.success.push({ id: item.variationId, type: 'variation' });
          } else if (item.productId) {
            // Update product
            if (item.stockQuantity !== undefined) {
              await this.updateProductStock(companyId, item.productId, item.stockQuantity);
            }
            if (item.purchasePrice !== undefined) {
              await this.updateProductPurchasePrice(companyId, item.productId, item.purchasePrice);
            }
            results.success.push({ id: item.productId, type: 'product' });
          }
        } catch (error: any) {
          results.failed.push({
            id: item.variationId || item.productId,
            type: item.variationId ? 'variation' : 'product',
            error: error.message || 'Bilinmeyen hata',
          });
        }
      }
    }

    return {
      success: true,
      message: `${results.success.length} öğe güncellendi, ${results.failed.length} başarısız`,
      results,
    };
  }

  async syncPurchasePricesFromStore(companyId: string, storeId: string) {
    // Verify the store belongs to this company
    const store = await this.prisma.store.findFirst({
      where: {
        id: storeId,
        companyId,
        status: 'ACTIVE',
      },
    });

    if (!store) {
      throw new BadRequestException('Mağaza bulunamadı');
    }

    if (!store.hasWcscPlugin || !store.wcscApiKey || !store.wcscApiSecret) {
      throw new BadRequestException('Bu mağazada WC Stock Connector eklentisi kurulu değil');
    }

    const wcscClient = new WCSCClient({
      url: store.url,
      apiKey: decrypt(store.wcscApiKey, this.encryptionKey),
      apiSecret: decrypt(store.wcscApiSecret, this.encryptionKey),
    });

    // Get all products from WCSC
    const wcscProducts = await wcscClient.getAllProducts();

    let updatedCount = 0;
    let skippedCount = 0;

    for (const wcProd of wcscProducts) {
      if (wcProd.purchase_price > 0) {
        // Find the product in our database
        const product = await this.prisma.product.findFirst({
          where: {
            storeId,
            wcProductId: wcProd.id,
          },
        });

        if (product) {
          await this.prisma.product.update({
            where: { id: product.id },
            data: { purchasePrice: wcProd.purchase_price },
          });
          updatedCount++;

          // Also update variations if they have purchase prices
          if (wcProd.variations) {
            for (const wcVar of wcProd.variations) {
              if (wcVar.purchase_price > 0) {
                await this.prisma.productVariation.updateMany({
                  where: {
                    productId: product.id,
                    wcVariationId: wcVar.id,
                  },
                  data: { purchasePrice: wcVar.purchase_price },
                });
              }
            }
          }
        } else {
          skippedCount++;
        }
      }
    }

    return {
      success: true,
      message: `${updatedCount} ürünün alış fiyatı güncellendi`,
      updatedCount,
      skippedCount,
    };
  }
}
