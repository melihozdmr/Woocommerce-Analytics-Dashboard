import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';
import { WooCommerceClient } from '../store/woocommerce.client';

export interface InventorySummary {
  totalStock: number;
  totalStockValue: number;
  estimatedRevenue: number;
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
  estimatedRevenue: number;
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
  constructor(private prisma: PrismaService) {}

  async getSummary(companyId: string, criticalThreshold: number = 5): Promise<InventorySummary> {
    // Get all stores for this company
    const stores = await this.prisma.store.findMany({
      where: { companyId, status: 'ACTIVE' },
      select: { id: true, lastSyncAt: true },
    });

    const storeIds = stores.map((s) => s.id);

    if (storeIds.length === 0) {
      return {
        totalStock: 0,
        totalStockValue: 0,
        estimatedRevenue: 0,
        criticalStockCount: 0,
        outOfStockCount: 0,
        productsWithoutPurchasePrice: 0,
        lastSyncAt: null,
      };
    }

    // Get products aggregate
    const products = await this.prisma.product.findMany({
      where: {
        storeId: { in: storeIds },
        isActive: true,
      },
      select: {
        stockQuantity: true,
        price: true,
        purchasePrice: true,
        productType: true,
      },
    });

    // Get variations aggregate (for variable products)
    const variations = await this.prisma.productVariation.findMany({
      where: {
        product: {
          storeId: { in: storeIds },
          isActive: true,
          productType: 'variable',
        },
        isActive: true,
      },
      select: {
        stockQuantity: true,
        price: true,
      },
    });

    // Calculate totals
    let totalStock = 0;
    let totalStockValue = 0;
    let estimatedRevenue = 0;
    let criticalStockCount = 0;
    let outOfStockCount = 0;
    let productsWithoutPurchasePrice = 0;

    // Process simple products
    for (const product of products) {
      if (product.productType === 'simple') {
        const qty = product.stockQuantity;
        const price = Number(product.price);
        const purchasePrice = product.purchasePrice ? Number(product.purchasePrice) : 0;

        totalStock += qty;
        totalStockValue += purchasePrice * qty;
        estimatedRevenue += price * qty;

        if (qty === 0) outOfStockCount++;
        else if (qty <= criticalThreshold) criticalStockCount++;

        if (!product.purchasePrice) productsWithoutPurchasePrice++;
      }
    }

    // Process variations
    for (const variation of variations) {
      const qty = variation.stockQuantity;
      const price = Number(variation.price);

      totalStock += qty;
      estimatedRevenue += price * qty;
      // Note: variations don't have purchase price, use parent product's

      if (qty === 0) outOfStockCount++;
      else if (qty <= criticalThreshold) criticalStockCount++;
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
      estimatedRevenue: Math.round(estimatedRevenue * 100) / 100,
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
        products: {
          where: { isActive: true },
          select: {
            stockQuantity: true,
            price: true,
            purchasePrice: true,
            productType: true,
          },
        },
      },
    });

    return stores.map((store) => {
      let totalStock = 0;
      let totalStockValue = 0;
      let estimatedRevenue = 0;
      let criticalStockCount = 0;

      for (const product of store.products) {
        if (product.productType === 'simple') {
          const qty = product.stockQuantity;
          const price = Number(product.price);
          const purchasePrice = product.purchasePrice ? Number(product.purchasePrice) : 0;

          totalStock += qty;
          totalStockValue += purchasePrice * qty;
          estimatedRevenue += price * qty;

          if (qty > 0 && qty <= criticalThreshold) criticalStockCount++;
        }
      }

      return {
        storeId: store.id,
        storeName: store.name,
        totalStock,
        totalStockValue: Math.round(totalStockValue * 100) / 100,
        estimatedRevenue: Math.round(estimatedRevenue * 100) / 100,
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
      criticalThreshold?: number;
    } = {},
  ) {
    const { page = 1, limit = 20, storeId, search, sortBy = 'name', sortOrder = 'asc', stockStatus, criticalThreshold = 5 } = options;

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

    return {
      products: products.map((p) => {
        // Calculate effective stock quantity
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
        };
      }),
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
      },
    });

    if (!product) {
      return null;
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

    // Create WooCommerce client
    const wcClient = new WooCommerceClient({
      url: product.store.url,
      consumerKey: product.store.consumerKey,
      consumerSecret: product.store.consumerSecret,
    });

    // Update stock in WooCommerce
    try {
      await wcClient.updateProductStock(product.wcProductId, stockQuantity);
    } catch (error: any) {
      if (error.response?.status === 401) {
        throw new BadRequestException(
          'WooCommerce API anahtarı yazma yetkisine sahip değil. Lütfen "Read/Write" yetkili yeni bir API anahtarı oluşturun.'
        );
      }
      throw new BadRequestException('WooCommerce stok güncellemesi başarısız: ' + (error.message || 'Bilinmeyen hata'));
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

    // Create WooCommerce client
    const wcClient = new WooCommerceClient({
      url: variation.product.store.url,
      consumerKey: variation.product.store.consumerKey,
      consumerSecret: variation.product.store.consumerSecret,
    });

    // Update stock in WooCommerce
    try {
      await wcClient.updateVariationStock(
        variation.product.wcProductId,
        variation.wcVariationId,
        stockQuantity,
      );
    } catch (error: any) {
      if (error.response?.status === 401) {
        throw new BadRequestException(
          'WooCommerce API anahtarı yazma yetkisine sahip değil. Lütfen "Read/Write" yetkili yeni bir API anahtarı oluşturun.'
        );
      }
      throw new BadRequestException('WooCommerce stok güncellemesi başarısız: ' + (error.message || 'Bilinmeyen hata'));
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
}
