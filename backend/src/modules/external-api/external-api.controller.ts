import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiHeader,
  ApiQuery,
  ApiSecurity,
} from '@nestjs/swagger';
import { ApiKeyGuard } from './guards/api-key.guard';
import { ApiRateLimitGuard } from './guards/api-rate-limit.guard';
import { ApiResponseInterceptor } from './interceptors/api-response.interceptor';
import { ApiLoggingInterceptor } from './interceptors/api-logging.interceptor';
import { ApiCompanyId } from './decorators/api-key.decorator';
import {
  StoreQueryDto,
  ProductQueryDto,
  OrderQueryDto,
  AnalyticsQueryDto,
} from './dto';
import { PrismaService } from '../../database/prisma.service';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('External API v1')
@Controller('api/v1')
@Public() // Bypass JWT auth - we use API key auth
@UseGuards(ApiKeyGuard, ApiRateLimitGuard)
@UseInterceptors(ApiResponseInterceptor, ApiLoggingInterceptor)
@ApiSecurity('api-key')
@ApiHeader({
  name: 'X-API-Key',
  description: 'API Key for authentication (Enterprise plan required)',
  required: true,
})
@ApiResponse({
  status: 401,
  description: 'Invalid or expired API key',
})
@ApiResponse({
  status: 403,
  description: 'Enterprise plan required',
})
@ApiResponse({
  status: 429,
  description: 'Rate limit exceeded',
})
export class ExternalApiController {
  constructor(private readonly prisma: PrismaService) {}

  // ==================== STORES ====================

  @Get('stores')
  @ApiOperation({ summary: 'List all stores' })
  @ApiResponse({ status: 200, description: 'List of stores' })
  @ApiResponse({ status: 401, description: 'Invalid API key' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  async listStores(
    @ApiCompanyId() companyId: string,
    @Query() query: StoreQueryDto,
  ) {
    const { limit = 20, offset = 0, status } = query;

    const where: any = { companyId };
    if (status) {
      where.status = status.toUpperCase();
    }

    const [stores, total] = await Promise.all([
      this.prisma.store.findMany({
        where,
        select: {
          id: true,
          name: true,
          url: true,
          currency: true,
          status: true,
          lastSyncAt: true,
          createdAt: true,
          _count: {
            select: {
              products: true,
              orders: true,
            },
          },
        },
        skip: offset,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      this.prisma.store.count({ where }),
    ]);

    return {
      items: stores.map((store) => ({
        id: store.id,
        name: store.name,
        url: store.url,
        currency: store.currency,
        status: store.status,
        lastSyncAt: store.lastSyncAt,
        createdAt: store.createdAt,
        productsCount: store._count.products,
        ordersCount: store._count.orders,
      })),
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + stores.length < total,
      },
    };
  }

  @Get('stores/:id')
  @ApiOperation({ summary: 'Get store details' })
  @ApiResponse({ status: 200, description: 'Store details' })
  @ApiResponse({ status: 404, description: 'Store not found' })
  async getStore(@ApiCompanyId() companyId: string, @Param('id') id: string) {
    const store = await this.prisma.store.findFirst({
      where: { id, companyId },
      select: {
        id: true,
        name: true,
        url: true,
        currency: true,
        status: true,
        commissionRate: true,
        shippingCost: true,
        lastSyncAt: true,
        createdAt: true,
        _count: {
          select: {
            products: true,
            orders: true,
          },
        },
      },
    });

    if (!store) {
      throw new NotFoundException({
        success: false,
        error: {
          code: 'STORE_NOT_FOUND',
          message: 'Store not found',
        },
      });
    }

    return {
      ...store,
      commissionRate: Number(store.commissionRate),
      shippingCost: Number(store.shippingCost),
      productsCount: store._count.products,
      ordersCount: store._count.orders,
    };
  }

  // ==================== PRODUCTS ====================

  @Get('products')
  @ApiOperation({ summary: 'List all products' })
  @ApiQuery({ name: 'storeId', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'stockStatus', required: false })
  @ApiResponse({ status: 200, description: 'List of products' })
  async listProducts(
    @ApiCompanyId() companyId: string,
    @Query() query: ProductQueryDto,
  ) {
    const {
      limit = 20,
      offset = 0,
      storeId,
      search,
      stockStatus,
      sortBy = 'name',
      sortOrder = 'asc',
    } = query;

    const where: any = {
      store: { companyId },
    };

    if (storeId) {
      where.storeId = storeId;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (stockStatus) {
      where.stockStatus = stockStatus;
    }

    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        select: {
          id: true,
          wcProductId: true,
          name: true,
          sku: true,
          imageUrl: true,
          productType: true,
          price: true,
          purchasePrice: true,
          stockQuantity: true,
          stockStatus: true,
          isActive: true,
          syncedAt: true,
          store: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: {
              variations: true,
            },
          },
        },
        skip: offset,
        take: limit,
        orderBy,
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      items: products.map((product) => ({
        id: product.id,
        wcProductId: product.wcProductId,
        name: product.name,
        sku: product.sku,
        imageUrl: product.imageUrl,
        productType: product.productType,
        price: Number(product.price),
        purchasePrice: product.purchasePrice
          ? Number(product.purchasePrice)
          : null,
        stockQuantity: product.stockQuantity,
        stockStatus: product.stockStatus,
        isActive: product.isActive,
        syncedAt: product.syncedAt,
        store: product.store,
        variationsCount: product._count.variations,
      })),
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + products.length < total,
      },
    };
  }

  @Get('products/critical-stock')
  @ApiOperation({ summary: 'List products with critical stock levels' })
  @ApiQuery({ name: 'threshold', required: false, description: 'Stock threshold (default: 5)' })
  async getCriticalStock(
    @ApiCompanyId() companyId: string,
    @Query('threshold') threshold: string = '5',
    @Query('limit') limit: string = '50',
  ) {
    const stockThreshold = parseInt(threshold) || 5;
    const limitNum = parseInt(limit) || 50;

    const products = await this.prisma.product.findMany({
      where: {
        store: { companyId },
        manageStock: true,
        stockQuantity: { lte: stockThreshold },
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        sku: true,
        imageUrl: true,
        stockQuantity: true,
        stockStatus: true,
        store: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { stockQuantity: 'asc' },
      take: limitNum,
    });

    return {
      items: products,
      threshold: stockThreshold,
      count: products.length,
    };
  }

  @Get('products/:id')
  @ApiOperation({ summary: 'Get product details' })
  async getProduct(@ApiCompanyId() companyId: string, @Param('id') id: string) {
    const product = await this.prisma.product.findFirst({
      where: {
        id,
        store: { companyId },
      },
      include: {
        store: {
          select: {
            id: true,
            name: true,
          },
        },
        variations: {
          select: {
            id: true,
            wcVariationId: true,
            sku: true,
            price: true,
            purchasePrice: true,
            stockQuantity: true,
            stockStatus: true,
            attributes: true,
            attributeString: true,
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException({
        success: false,
        error: {
          code: 'PRODUCT_NOT_FOUND',
          message: 'Product not found',
        },
      });
    }

    return {
      ...product,
      price: Number(product.price),
      purchasePrice: product.purchasePrice
        ? Number(product.purchasePrice)
        : null,
      variations: product.variations.map((v) => ({
        ...v,
        price: Number(v.price),
        purchasePrice: v.purchasePrice ? Number(v.purchasePrice) : null,
      })),
    };
  }

  // ==================== ORDERS ====================

  @Get('orders')
  @ApiOperation({ summary: 'List all orders' })
  async listOrders(
    @ApiCompanyId() companyId: string,
    @Query() query: OrderQueryDto,
  ) {
    const {
      limit = 20,
      offset = 0,
      storeId,
      status,
      startDate,
      endDate,
      sortBy = 'orderDate',
      sortOrder = 'desc',
    } = query;

    const where: any = {
      store: { companyId },
    };

    if (storeId) {
      where.storeId = storeId;
    }

    if (status) {
      where.status = status;
    }

    if (startDate || endDate) {
      where.orderDate = {};
      if (startDate) {
        where.orderDate.gte = new Date(startDate);
      }
      if (endDate) {
        where.orderDate.lte = new Date(endDate);
      }
    }

    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        select: {
          id: true,
          wcOrderId: true,
          orderNumber: true,
          status: true,
          total: true,
          subtotal: true,
          totalTax: true,
          shippingTotal: true,
          discountTotal: true,
          paymentMethod: true,
          customerEmail: true,
          customerName: true,
          itemsCount: true,
          orderDate: true,
          store: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        skip: offset,
        take: limit,
        orderBy,
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      items: orders.map((order) => ({
        ...order,
        total: Number(order.total),
        subtotal: Number(order.subtotal),
        totalTax: Number(order.totalTax),
        shippingTotal: Number(order.shippingTotal),
        discountTotal: Number(order.discountTotal),
      })),
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + orders.length < total,
      },
    };
  }

  @Get('orders/:id')
  @ApiOperation({ summary: 'Get order details' })
  async getOrder(@ApiCompanyId() companyId: string, @Param('id') id: string) {
    const order = await this.prisma.order.findFirst({
      where: {
        id,
        store: { companyId },
      },
      include: {
        store: {
          select: {
            id: true,
            name: true,
          },
        },
        items: {
          select: {
            id: true,
            wcProductId: true,
            wcVariationId: true,
            name: true,
            sku: true,
            quantity: true,
            price: true,
            subtotal: true,
            total: true,
            taxTotal: true,
          },
        },
        refunds: {
          select: {
            id: true,
            amount: true,
            reason: true,
            refundDate: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException({
        success: false,
        error: {
          code: 'ORDER_NOT_FOUND',
          message: 'Order not found',
        },
      });
    }

    return {
      ...order,
      total: Number(order.total),
      subtotal: Number(order.subtotal),
      totalTax: Number(order.totalTax),
      shippingTotal: Number(order.shippingTotal),
      discountTotal: Number(order.discountTotal),
      items: order.items.map((item) => ({
        ...item,
        price: Number(item.price),
        subtotal: Number(item.subtotal),
        total: Number(item.total),
        taxTotal: Number(item.taxTotal),
      })),
      refunds: order.refunds.map((refund) => ({
        ...refund,
        amount: Number(refund.amount),
      })),
    };
  }

  // ==================== ANALYTICS ====================

  @Get('analytics/overview')
  @ApiOperation({ summary: 'Get analytics overview' })
  async getAnalyticsOverview(
    @ApiCompanyId() companyId: string,
    @Query() query: AnalyticsQueryDto,
  ) {
    const { period = '30d', storeId } = query;

    const periodDays = this.parsePeriod(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodDays);

    const storeWhere: any = { companyId };
    if (storeId) {
      storeWhere.id = storeId;
    }

    const stores = await this.prisma.store.findMany({
      where: storeWhere,
      select: { id: true },
    });
    const storeIds = stores.map((s) => s.id);

    const [
      totalOrders,
      totalRevenue,
      totalProducts,
      lowStockCount,
      ordersByStatus,
    ] = await Promise.all([
      // Total orders
      this.prisma.order.count({
        where: {
          storeId: { in: storeIds },
          orderDate: { gte: startDate },
        },
      }),

      // Total revenue
      this.prisma.order.aggregate({
        where: {
          storeId: { in: storeIds },
          orderDate: { gte: startDate },
          status: { in: ['completed', 'processing'] },
        },
        _sum: { total: true },
      }),

      // Total products
      this.prisma.product.count({
        where: {
          storeId: { in: storeIds },
          isActive: true,
        },
      }),

      // Low stock products
      this.prisma.product.count({
        where: {
          storeId: { in: storeIds },
          manageStock: true,
          stockQuantity: { lte: 5 },
          isActive: true,
        },
      }),

      // Orders by status
      this.prisma.order.groupBy({
        by: ['status'],
        where: {
          storeId: { in: storeIds },
          orderDate: { gte: startDate },
        },
        _count: true,
      }),
    ]);

    return {
      period,
      startDate: startDate.toISOString(),
      summary: {
        totalOrders,
        totalRevenue: Number(totalRevenue._sum.total || 0),
        totalProducts,
        lowStockCount,
      },
      ordersByStatus: ordersByStatus.map((o) => ({
        status: o.status,
        count: o._count,
      })),
    };
  }

  @Get('analytics/sales')
  @ApiOperation({ summary: 'Get sales analytics' })
  async getSalesAnalytics(
    @ApiCompanyId() companyId: string,
    @Query() query: AnalyticsQueryDto,
  ) {
    const { period = '30d', storeId } = query;

    const periodDays = this.parsePeriod(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodDays);

    const storeWhere: any = { companyId };
    if (storeId) {
      storeWhere.id = storeId;
    }

    const stores = await this.prisma.store.findMany({
      where: storeWhere,
      select: { id: true },
    });
    const storeIds = stores.map((s) => s.id);

    // Daily sales
    const dailySales = await this.prisma.$queryRaw<
      Array<{ date: Date; orders: number; revenue: number }>
    >`
      SELECT
        DATE(order_date) as date,
        COUNT(*)::int as orders,
        COALESCE(SUM(total), 0)::float as revenue
      FROM orders
      WHERE store_id = ANY(${storeIds})
        AND order_date >= ${startDate}
        AND status IN ('completed', 'processing')
      GROUP BY DATE(order_date)
      ORDER BY date ASC
    `;

    // Top products by revenue
    const topProducts = await this.prisma.orderItem.groupBy({
      by: ['wcProductId', 'name'],
      where: {
        order: {
          storeId: { in: storeIds },
          orderDate: { gte: startDate },
          status: { in: ['completed', 'processing'] },
        },
      },
      _sum: { total: true, quantity: true },
      orderBy: { _sum: { total: 'desc' } },
      take: 10,
    });

    return {
      period,
      dailySales: dailySales.map((d) => ({
        date: d.date,
        orders: d.orders,
        revenue: Number(d.revenue),
      })),
      topProducts: topProducts.map((p) => ({
        wcProductId: p.wcProductId,
        name: p.name,
        totalRevenue: Number(p._sum.total || 0),
        totalQuantity: p._sum.quantity || 0,
      })),
    };
  }

  @Get('analytics/inventory')
  @ApiOperation({ summary: 'Get inventory analytics' })
  async getInventoryAnalytics(
    @ApiCompanyId() companyId: string,
    @Query() query: AnalyticsQueryDto,
  ) {
    const { storeId } = query;

    const storeWhere: any = { companyId };
    if (storeId) {
      storeWhere.id = storeId;
    }

    const stores = await this.prisma.store.findMany({
      where: storeWhere,
      select: { id: true },
    });
    const storeIds = stores.map((s) => s.id);

    const [stockStatusDistribution, lowStockProducts, stockValue] =
      await Promise.all([
        // Stock status distribution
        this.prisma.product.groupBy({
          by: ['stockStatus'],
          where: {
            storeId: { in: storeIds },
            isActive: true,
          },
          _count: true,
        }),

        // Low stock products
        this.prisma.product.findMany({
          where: {
            storeId: { in: storeIds },
            manageStock: true,
            stockQuantity: { lte: 5 },
            isActive: true,
          },
          select: {
            id: true,
            name: true,
            sku: true,
            stockQuantity: true,
            store: { select: { name: true } },
          },
          orderBy: { stockQuantity: 'asc' },
          take: 20,
        }),

        // Total stock value
        this.prisma.product.aggregate({
          where: {
            storeId: { in: storeIds },
            isActive: true,
            manageStock: true,
          },
          _sum: { stockQuantity: true },
        }),
      ]);

    return {
      stockStatusDistribution: stockStatusDistribution.map((s) => ({
        status: s.stockStatus,
        count: s._count,
      })),
      lowStockProducts,
      totalStockUnits: stockValue._sum.stockQuantity || 0,
    };
  }

  @Get('analytics/profit')
  @ApiOperation({ summary: 'Get profit analytics' })
  async getProfitAnalytics(
    @ApiCompanyId() companyId: string,
    @Query() query: AnalyticsQueryDto,
  ) {
    const { period = '30d', storeId } = query;

    const periodDays = this.parsePeriod(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodDays);

    const storeWhere: any = { companyId };
    if (storeId) {
      storeWhere.id = storeId;
    }

    const stores = await this.prisma.store.findMany({
      where: storeWhere,
      include: {
        orders: {
          where: {
            orderDate: { gte: startDate },
            status: { in: ['completed', 'processing'] },
          },
          include: {
            items: {
              include: {
                product: {
                  select: { purchasePrice: true },
                },
              },
            },
          },
        },
      },
    });

    let totalRevenue = 0;
    let totalCost = 0;
    let totalCommission = 0;
    let totalShipping = 0;

    for (const store of stores) {
      const commissionRate = Number(store.commissionRate) / 100;
      const shippingCost = Number(store.shippingCost);

      for (const order of store.orders) {
        const orderTotal = Number(order.total);
        totalRevenue += orderTotal;
        totalCommission += orderTotal * commissionRate;
        totalShipping += shippingCost;

        for (const item of order.items) {
          if (item.product?.purchasePrice) {
            totalCost += Number(item.product.purchasePrice) * item.quantity;
          }
        }
      }
    }

    const grossProfit = totalRevenue - totalCost;
    const netProfit = grossProfit - totalCommission - totalShipping;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    return {
      period,
      summary: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalCost: Math.round(totalCost * 100) / 100,
        grossProfit: Math.round(grossProfit * 100) / 100,
        totalCommission: Math.round(totalCommission * 100) / 100,
        totalShipping: Math.round(totalShipping * 100) / 100,
        netProfit: Math.round(netProfit * 100) / 100,
        profitMargin: Math.round(profitMargin * 100) / 100,
      },
    };
  }

  private parsePeriod(period: string): number {
    switch (period) {
      case 'today':
        return 1;
      case '7d':
        return 7;
      case '30d':
        return 30;
      case '90d':
        return 90;
      case '365d':
        return 365;
      default:
        return 30;
    }
  }
}
