import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  CreateMappingDto,
  UpdateMappingDto,
  AddProductsToMappingDto,
  RemoveProductsFromMappingDto,
} from './dto/product-mapping.dto';

export interface MappingSuggestion {
  masterSku: string;
  suggestionKey: string; // Used for dismissing
  products: {
    id: string;
    storeId: string;
    storeName: string;
    name: string;
    sku: string;
    stockQuantity: number;
    price: number;
  }[];
  storeCount: number;
  totalStock: number;
  realStock: number; // Gerçek stok = Kaynak - Diğerleri (ilk ürün kaynak kabul edilir)
}

export interface MappingWithDetails {
  id: string;
  masterSku: string;
  name: string | null;
  createdAt: Date;
  updatedAt: Date;
  items: {
    id: string;
    storeId: string;
    storeName: string;
    productId: string;
    productName: string;
    sku: string | null;
    stockQuantity: number;
    price: number;
    isSource: boolean;
  }[];
  totalStock: number;
  realStock: number; // Gerçek stok = Kaynak Stok - Diğer Stokların Toplamı
  storeCount: number;
}

@Injectable()
export class ProductMappingService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Extract SKU-like code from product name
   * Matches patterns like: "0101", "SZ4590", "ABC-123", etc. at the start of the name
   */
  private extractSkuFromName(name: string): string | null {
    if (!name) return null;

    // Pattern: Alphanumeric code at the start, optionally with hyphens/underscores
    // Examples: "0101 Ürün", "SZ4590 Ürün", "ABC-123 Ürün"
    const match = name.match(/^([A-Za-z0-9]+[-_]?[A-Za-z0-9]*)\s+/);

    if (match && match[1]) {
      const code = match[1];
      // Only consider it a SKU-like code if it has at least 3 characters
      // and contains at least one digit
      if (code.length >= 3 && /\d/.test(code)) {
        return code;
      }
    }

    return null;
  }

  /**
   * Get all mappings for a company
   */
  async getMappings(companyId: string): Promise<MappingWithDetails[]> {
    const mappings = await this.prisma.productMapping.findMany({
      where: { companyId },
      include: {
        items: {
          include: {
            store: { select: { id: true, name: true } },
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                stockQuantity: true,
                price: true,
                variations: { select: { stockQuantity: true } },
              },
            },
          },
          orderBy: { createdAt: 'asc' }, // İlk eklenen kaynak olacak
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return mappings.map((mapping) => {
      const items = mapping.items.map((item) => {
        // Calculate stock including variations
        let stockQuantity = item.product.stockQuantity;
        if (item.product.variations && item.product.variations.length > 0) {
          stockQuantity = item.product.variations.reduce((sum, v) => sum + v.stockQuantity, 0);
        }

        return {
          id: item.id,
          storeId: item.store.id,
          storeName: item.store.name,
          productId: item.product.id,
          productName: item.product.name,
          sku: item.sku,
          stockQuantity,
          price: Number(item.product.price),
          isSource: item.isSource,
        };
      });

      const totalStock = items.reduce((sum, item) => sum + item.stockQuantity, 0);
      const uniqueStores = new Set(items.map((item) => item.storeId));

      // Gerçek stok = Kaynak sitenin stoğu (iki site aynı fiziksel ürünü satıyor)
      const sourceItem = items.find((item) => item.isSource);
      const realStock = sourceItem?.stockQuantity || items[0]?.stockQuantity || 0;

      return {
        id: mapping.id,
        masterSku: mapping.masterSku,
        name: mapping.name,
        createdAt: mapping.createdAt,
        updatedAt: mapping.updatedAt,
        items,
        totalStock,
        realStock,
        storeCount: uniqueStores.size,
      };
    });
  }

  /**
   * Get a single mapping by ID
   */
  async getMapping(companyId: string, mappingId: string): Promise<MappingWithDetails> {
    const mapping = await this.prisma.productMapping.findFirst({
      where: { id: mappingId, companyId },
      include: {
        items: {
          include: {
            store: { select: { id: true, name: true } },
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                stockQuantity: true,
                price: true,
                variations: { select: { stockQuantity: true } },
              },
            },
          },
          orderBy: { createdAt: 'asc' }, // İlk eklenen kaynak olacak
        },
      },
    });

    if (!mapping) {
      throw new NotFoundException('Eşleştirme bulunamadı');
    }

    const items = mapping.items.map((item) => {
      // Calculate stock including variations
      let stockQuantity = item.product.stockQuantity;
      if (item.product.variations && item.product.variations.length > 0) {
        stockQuantity = item.product.variations.reduce((sum, v) => sum + v.stockQuantity, 0);
      }

      return {
        id: item.id,
        storeId: item.store.id,
        storeName: item.store.name,
        productId: item.product.id,
        productName: item.product.name,
        sku: item.sku,
        stockQuantity,
        price: Number(item.product.price),
        isSource: item.isSource,
      };
    });

    const totalStock = items.reduce((sum, item) => sum + item.stockQuantity, 0);
    const uniqueStores = new Set(items.map((item) => item.storeId));

    // Gerçek stok = Kaynak sitenin stoğu (iki site aynı fiziksel ürünü satıyor)
    const sourceItem = items.find((item) => item.isSource);
    const realStock = sourceItem?.stockQuantity || items[0]?.stockQuantity || 0;

    return {
      id: mapping.id,
      masterSku: mapping.masterSku,
      name: mapping.name,
      createdAt: mapping.createdAt,
      updatedAt: mapping.updatedAt,
      items,
      totalStock,
      realStock,
      storeCount: uniqueStores.size,
    };
  }

  /**
   * Create a new mapping
   */
  async createMapping(companyId: string, dto: CreateMappingDto): Promise<MappingWithDetails> {
    // Check if masterSku already exists
    const existingMapping = await this.prisma.productMapping.findUnique({
      where: { companyId_masterSku: { companyId, masterSku: dto.masterSku } },
    });

    if (existingMapping) {
      throw new BadRequestException('Bu SKU için zaten bir eşleştirme mevcut');
    }

    // Verify products exist and belong to company's stores
    const products = await this.prisma.product.findMany({
      where: {
        id: { in: dto.productIds },
        store: { companyId },
      },
      include: { store: { select: { id: true, name: true } } },
    });

    if (products.length !== dto.productIds.length) {
      throw new BadRequestException('Bazı ürünler bulunamadı veya bu şirkete ait değil');
    }

    // Check if products are from different stores
    const uniqueStores = new Set(products.map((p) => p.storeId));
    if (uniqueStores.size < 2) {
      throw new BadRequestException('Eşleştirme için en az 2 farklı mağazadan ürün gerekli');
    }

    // Check if any product is already in another mapping
    const existingItems = await this.prisma.productMappingItem.findMany({
      where: { productId: { in: dto.productIds } },
      include: { mapping: true },
    });

    if (existingItems.length > 0) {
      const skus = existingItems.map((item) => item.mapping.masterSku).join(', ');
      throw new BadRequestException(
        `Bazı ürünler zaten başka eşleştirmelerde: ${skus}`,
      );
    }

    // Create mapping with items - ilk ürün kaynak olarak işaretlenir
    const mapping = await this.prisma.productMapping.create({
      data: {
        companyId,
        masterSku: dto.masterSku,
        name: dto.name,
        items: {
          create: products.map((product, index) => ({
            storeId: product.storeId,
            productId: product.id,
            sku: product.sku,
            isSource: index === 0, // İlk ürün kaynak
          })),
        },
      },
    });

    return this.getMapping(companyId, mapping.id);
  }

  /**
   * Update a mapping
   */
  async updateMapping(
    companyId: string,
    mappingId: string,
    dto: UpdateMappingDto,
  ): Promise<MappingWithDetails> {
    const mapping = await this.prisma.productMapping.findFirst({
      where: { id: mappingId, companyId },
    });

    if (!mapping) {
      throw new NotFoundException('Eşleştirme bulunamadı');
    }

    // If changing masterSku, check it doesn't already exist
    if (dto.masterSku && dto.masterSku !== mapping.masterSku) {
      const existingMapping = await this.prisma.productMapping.findUnique({
        where: { companyId_masterSku: { companyId, masterSku: dto.masterSku } },
      });

      if (existingMapping) {
        throw new BadRequestException('Bu SKU için zaten bir eşleştirme mevcut');
      }
    }

    await this.prisma.productMapping.update({
      where: { id: mappingId },
      data: {
        masterSku: dto.masterSku,
        name: dto.name,
      },
    });

    return this.getMapping(companyId, mappingId);
  }

  /**
   * Delete a mapping
   */
  async deleteMapping(companyId: string, mappingId: string): Promise<void> {
    const mapping = await this.prisma.productMapping.findFirst({
      where: { id: mappingId, companyId },
    });

    if (!mapping) {
      throw new NotFoundException('Eşleştirme bulunamadı');
    }

    await this.prisma.productMapping.delete({
      where: { id: mappingId },
    });
  }

  /**
   * Add products to an existing mapping
   */
  async addProductsToMapping(
    companyId: string,
    mappingId: string,
    dto: AddProductsToMappingDto,
  ): Promise<MappingWithDetails> {
    const mapping = await this.prisma.productMapping.findFirst({
      where: { id: mappingId, companyId },
    });

    if (!mapping) {
      throw new NotFoundException('Eşleştirme bulunamadı');
    }

    // Verify products
    const products = await this.prisma.product.findMany({
      where: {
        id: { in: dto.productIds },
        store: { companyId },
      },
    });

    if (products.length !== dto.productIds.length) {
      throw new BadRequestException('Bazı ürünler bulunamadı');
    }

    // Check if products are already in another mapping
    const existingItems = await this.prisma.productMappingItem.findMany({
      where: { productId: { in: dto.productIds } },
    });

    if (existingItems.length > 0) {
      throw new BadRequestException('Bazı ürünler zaten başka eşleştirmelerde');
    }

    // Add products
    await this.prisma.productMappingItem.createMany({
      data: products.map((product) => ({
        mappingId,
        storeId: product.storeId,
        productId: product.id,
        sku: product.sku,
      })),
      skipDuplicates: true,
    });

    return this.getMapping(companyId, mappingId);
  }

  /**
   * Remove products from a mapping
   */
  async removeProductsFromMapping(
    companyId: string,
    mappingId: string,
    dto: RemoveProductsFromMappingDto,
  ): Promise<MappingWithDetails> {
    const mapping = await this.prisma.productMapping.findFirst({
      where: { id: mappingId, companyId },
      include: { items: true },
    });

    if (!mapping) {
      throw new NotFoundException('Eşleştirme bulunamadı');
    }

    // Check if removing would leave less than 2 items
    const remainingCount = mapping.items.length - dto.productIds.length;
    if (remainingCount < 2) {
      throw new BadRequestException(
        'Eşleştirmede en az 2 ürün kalmalı. Eşleştirmeyi silmek için silme işlemini kullanın.',
      );
    }

    await this.prisma.productMappingItem.deleteMany({
      where: {
        mappingId,
        productId: { in: dto.productIds },
      },
    });

    return this.getMapping(companyId, mappingId);
  }

  /**
   * Get auto-match suggestions based on SKU and product name
   */
  async getSuggestions(companyId: string, storeIds?: string[]): Promise<MappingSuggestion[]> {
    // Get dismissed suggestions for this company
    const dismissedSuggestions = await this.prisma.dismissedMappingSuggestion.findMany({
      where: { companyId },
      select: { suggestionKey: true },
    });
    const dismissedKeys = new Set(dismissedSuggestions.map((d) => d.suggestionKey));

    // Get all products from company's stores that are not already mapped
    const whereClause: any = {
      store: { companyId },
      productMappingItems: { none: {} }, // Not already in a mapping
    };

    if (storeIds && storeIds.length > 0) {
      whereClause.storeId = { in: storeIds };
    }

    const products = await this.prisma.product.findMany({
      where: whereClause,
      include: {
        store: { select: { id: true, name: true } },
        variations: { select: { stockQuantity: true } },
      },
    });

    // Group by SKU (if available) or by normalized name
    const groups = new Map<
      string,
      {
        id: string;
        storeId: string;
        storeName: string;
        name: string;
        sku: string;
        stockQuantity: number;
        price: number;
      }[]
    >();

    for (const product of products) {
      // Use SKU if available, otherwise extract code from product name, or use full name
      let groupKey: string;
      let displaySku: string;

      if (product.sku && product.sku.trim() !== '') {
        groupKey = `sku:${product.sku.toLowerCase().trim()}`;
        displaySku = product.sku;
      } else {
        // Try to extract SKU-like code from product name (e.g., "0101 Ürün Adı" or "SZ4590 Ürün Adı")
        const skuFromName = this.extractSkuFromName(product.name);

        if (skuFromName) {
          groupKey = `code:${skuFromName.toLowerCase()}`;
          displaySku = skuFromName;
        } else {
          // Normalize name for matching: lowercase, remove extra spaces
          const normalizedName = product.name.toLowerCase().trim().replace(/\s+/g, ' ');
          groupKey = `name:${normalizedName}`;
          displaySku = product.name;
        }
      }

      // Calculate total stock including variations
      let totalStock = product.stockQuantity;
      if (product.variations && product.variations.length > 0) {
        totalStock = product.variations.reduce((sum, v) => sum + v.stockQuantity, 0);
      }

      if (!groups.has(groupKey)) {
        groups.set(groupKey, []);
      }
      groups.get(groupKey)!.push({
        id: product.id,
        storeId: product.store.id,
        storeName: product.store.name,
        name: product.name,
        sku: displaySku,
        stockQuantity: totalStock,
        price: Number(product.price),
      });
    }

    // Filter groups with products from multiple stores and not dismissed
    const suggestions: MappingSuggestion[] = [];

    for (const [key, groupProducts] of groups) {
      // Skip if this suggestion was dismissed
      if (dismissedKeys.has(key)) {
        continue;
      }

      const uniqueStores = new Set(groupProducts.map((p) => p.storeId));
      if (uniqueStores.size > 1) {
        // Determine master SKU - prefer actual SKU over name
        const masterSku = key.startsWith('sku:')
          ? key.substring(4)
          : key.startsWith('code:')
            ? key.substring(5)
            : groupProducts[0].name;

        // Gerçek stok = ilk ürünün stoğu (kaynak olarak kabul edilir)
        const realStock = groupProducts[0]?.stockQuantity || 0;

        suggestions.push({
          masterSku,
          suggestionKey: key,
          products: groupProducts,
          storeCount: uniqueStores.size,
          totalStock: groupProducts.reduce((sum, p) => sum + p.stockQuantity, 0),
          realStock,
        });
      }
    }

    // Sort by store count (more stores = better match)
    suggestions.sort((a, b) => b.storeCount - a.storeCount);

    return suggestions;
  }

  /**
   * Dismiss a suggestion
   */
  async dismissSuggestion(companyId: string, suggestionKey: string): Promise<void> {
    await this.prisma.dismissedMappingSuggestion.upsert({
      where: { companyId_suggestionKey: { companyId, suggestionKey } },
      create: { companyId, suggestionKey },
      update: {},
    });
  }

  /**
   * Restore a dismissed suggestion
   */
  async restoreSuggestion(companyId: string, suggestionKey: string): Promise<void> {
    await this.prisma.dismissedMappingSuggestion.deleteMany({
      where: { companyId, suggestionKey },
    });
  }

  /**
   * Get all dismissed suggestions
   */
  async getDismissedSuggestions(companyId: string): Promise<string[]> {
    const dismissed = await this.prisma.dismissedMappingSuggestion.findMany({
      where: { companyId },
      select: { suggestionKey: true },
    });
    return dismissed.map((d) => d.suggestionKey);
  }

  /**
   * Auto-create mappings from suggestions
   */
  async autoMatch(companyId: string, storeIds?: string[]): Promise<{ created: number; skipped: number }> {
    const suggestions = await this.getSuggestions(companyId, storeIds);

    let created = 0;
    let skipped = 0;

    for (const suggestion of suggestions) {
      try {
        await this.createMapping(companyId, {
          masterSku: suggestion.masterSku,
          productIds: suggestion.products.map((p) => p.id),
        });
        created++;
      } catch (error) {
        skipped++;
      }
    }

    return { created, skipped };
  }

  /**
   * Search products for manual mapping
   */
  async searchProductsForMapping(
    companyId: string,
    query: string,
    storeId?: string,
  ): Promise<{
    id: string;
    storeId: string;
    storeName: string;
    name: string;
    sku: string | null;
    stockQuantity: number;
    price: number;
    isAlreadyMapped: boolean;
    mappingId: string | null;
  }[]> {
    if (!query || query.trim().length < 2) {
      return [];
    }

    const searchTerm = query.trim().toLowerCase();

    const whereClause: any = {
      store: { companyId },
      OR: [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { sku: { contains: searchTerm, mode: 'insensitive' } },
      ],
    };

    if (storeId) {
      whereClause.storeId = storeId;
    }

    const products = await this.prisma.product.findMany({
      where: whereClause,
      include: {
        store: { select: { id: true, name: true } },
        variations: { select: { stockQuantity: true } },
        productMappingItems: {
          select: { mappingId: true },
          take: 1,
        },
      },
      take: 50, // Limit results
      orderBy: { name: 'asc' },
    });

    return products.map((product) => {
      let stockQuantity = product.stockQuantity;
      if (product.variations && product.variations.length > 0) {
        stockQuantity = product.variations.reduce((sum, v) => sum + v.stockQuantity, 0);
      }

      const mappingItem = product.productMappingItems[0];

      return {
        id: product.id,
        storeId: product.store.id,
        storeName: product.store.name,
        name: product.name,
        sku: product.sku,
        stockQuantity,
        price: Number(product.price),
        isAlreadyMapped: !!mappingItem,
        mappingId: mappingItem?.mappingId || null,
      };
    });
  }

  /**
   * Get consolidated inventory for mapped products
   */
  async getConsolidatedInventory(companyId: string): Promise<
    {
      masterSku: string;
      name: string | null;
      mappingId: string;
      totalStock: number;
      stores: { storeId: string; storeName: string; stock: number }[];
    }[]
  > {
    const mappings = await this.getMappings(companyId);

    return mappings.map((mapping) => {
      const storeStocks = new Map<string, { storeName: string; stock: number }>();

      for (const item of mapping.items) {
        if (!storeStocks.has(item.storeId)) {
          storeStocks.set(item.storeId, { storeName: item.storeName, stock: 0 });
        }
        storeStocks.get(item.storeId)!.stock += item.stockQuantity;
      }

      return {
        masterSku: mapping.masterSku,
        name: mapping.name,
        mappingId: mapping.id,
        totalStock: mapping.totalStock,
        stores: Array.from(storeStocks.entries()).map(([storeId, data]) => ({
          storeId,
          storeName: data.storeName,
          stock: data.stock,
        })),
      };
    });
  }
}
