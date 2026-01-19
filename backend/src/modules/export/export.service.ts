import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { InviteStatus } from '@prisma/client';

export interface ExportData {
  inventory?: InventoryExportRow[];
  orders?: OrderExportRow[];
  profit?: ProfitExportRow[];
  refunds?: RefundExportRow[];
}

interface InventoryExportRow {
  storeName: string;
  productName: string;
  sku: string;
  stockQuantity: number;
  price: number;
  purchasePrice: number | null;
  stockStatus: string;
}

interface OrderExportRow {
  storeName: string;
  orderNumber: string;
  status: string;
  customerName: string;
  total: number;
  paymentMethod: string;
  orderDate: string;
}

interface ProfitExportRow {
  storeName: string;
  orderNumber: string;
  revenue: number;
  cost: number;
  profit: number;
  margin: number;
  orderDate: string;
}

interface RefundExportRow {
  storeName: string;
  orderNumber: string;
  refundAmount: number;
  reason: string;
  refundDate: string;
}

@Injectable()
export class ExportService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get user's company IDs
   */
  private async getUserCompanyIds(userId: string): Promise<string[]> {
    const memberships = await this.prisma.companyMember.findMany({
      where: {
        userId,
        inviteStatus: InviteStatus.ACCEPTED,
      },
      select: { companyId: true },
    });
    return memberships.map((m) => m.companyId);
  }

  /**
   * Export inventory data to CSV format
   */
  async exportInventoryToCsv(
    userId: string,
    companyId: string,
  ): Promise<string> {
    const products = await this.prisma.product.findMany({
      where: {
        store: { companyId },
      },
      include: {
        store: { select: { name: true } },
        variations: true,
      },
      orderBy: { name: 'asc' },
    });

    const headers = [
      'Mağaza',
      'Ürün Adı',
      'SKU',
      'Stok',
      'Fiyat',
      'Alış Fiyatı',
      'Stok Durumu',
    ];

    const rows: string[][] = [];

    for (const product of products) {
      if (product.variations.length > 0) {
        for (const variation of product.variations) {
          rows.push([
            product.store.name,
            `${product.name} - ${variation.attributeString || ''}`,
            variation.sku || '',
            variation.stockQuantity.toString(),
            variation.price.toString(),
            variation.purchasePrice?.toString() || '',
            variation.stockStatus,
          ]);
        }
      } else {
        rows.push([
          product.store.name,
          product.name,
          product.sku || '',
          product.stockQuantity.toString(),
          product.price.toString(),
          product.purchasePrice?.toString() || '',
          product.stockStatus,
        ]);
      }
    }

    return this.generateCsv(headers, rows);
  }

  /**
   * Export orders data to CSV format
   */
  async exportOrdersToCsv(
    userId: string,
    companyId: string,
    period?: string,
  ): Promise<string> {
    const dateFilter = this.getDateFilter(period);

    const orders = await this.prisma.order.findMany({
      where: {
        store: { companyId },
        ...(dateFilter && { orderDate: { gte: dateFilter } }),
      },
      include: {
        store: { select: { name: true } },
      },
      orderBy: { orderDate: 'desc' },
    });

    const headers = [
      'Mağaza',
      'Sipariş No',
      'Durum',
      'Müşteri',
      'Toplam',
      'Ödeme Yöntemi',
      'Tarih',
    ];

    const rows = orders.map((order) => [
      order.store.name,
      order.orderNumber,
      this.translateStatus(order.status),
      order.customerName || '',
      order.total.toString(),
      order.paymentMethod || '',
      order.orderDate.toISOString().split('T')[0],
    ]);

    return this.generateCsv(headers, rows);
  }

  /**
   * Export profit data to CSV format
   */
  async exportProfitToCsv(
    userId: string,
    companyId: string,
    period?: string,
  ): Promise<string> {
    const dateFilter = this.getDateFilter(period);

    const orders = await this.prisma.order.findMany({
      where: {
        store: { companyId },
        status: { in: ['completed', 'processing'] },
        ...(dateFilter && { orderDate: { gte: dateFilter } }),
      },
      include: {
        store: { select: { name: true, commissionRate: true, shippingCost: true } },
        items: {
          include: {
            product: { select: { purchasePrice: true } },
          },
        },
      },
      orderBy: { orderDate: 'desc' },
    });

    const headers = [
      'Mağaza',
      'Sipariş No',
      'Gelir',
      'Maliyet',
      'Kar',
      'Marj %',
      'Tarih',
    ];

    const rows = orders.map((order) => {
      const revenue = Number(order.total);
      let cost = 0;

      for (const item of order.items) {
        const purchasePrice = item.product?.purchasePrice
          ? Number(item.product.purchasePrice)
          : 0;
        cost += purchasePrice * item.quantity;
      }

      // Add commission and shipping costs
      const commission = (revenue * Number(order.store.commissionRate)) / 100;
      const shipping = Number(order.store.shippingCost);
      cost += commission + shipping;

      const profit = revenue - cost;
      const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

      return [
        order.store.name,
        order.orderNumber,
        revenue.toFixed(2),
        cost.toFixed(2),
        profit.toFixed(2),
        margin.toFixed(1),
        order.orderDate.toISOString().split('T')[0],
      ];
    });

    return this.generateCsv(headers, rows);
  }

  /**
   * Export refunds data to CSV format
   */
  async exportRefundsToCsv(
    userId: string,
    companyId: string,
    period?: string,
  ): Promise<string> {
    const dateFilter = this.getDateFilter(period);

    const refunds = await this.prisma.refund.findMany({
      where: {
        order: {
          store: { companyId },
        },
        ...(dateFilter && { refundDate: { gte: dateFilter } }),
      },
      include: {
        order: {
          include: {
            store: { select: { name: true } },
          },
        },
      },
      orderBy: { refundDate: 'desc' },
    });

    const headers = ['Mağaza', 'Sipariş No', 'İade Tutarı', 'Sebep', 'Tarih'];

    const rows = refunds.map((refund) => [
      refund.order.store.name,
      refund.order.orderNumber,
      refund.amount.toString(),
      refund.reason || '',
      refund.refundDate.toISOString().split('T')[0],
    ]);

    return this.generateCsv(headers, rows);
  }

  /**
   * Generate CSV string from headers and rows
   */
  private generateCsv(headers: string[], rows: string[][]): string {
    const escapeCsvField = (field: string): string => {
      if (field.includes(',') || field.includes('"') || field.includes('\n')) {
        return `"${field.replace(/"/g, '""')}"`;
      }
      return field;
    };

    const headerLine = headers.map(escapeCsvField).join(',');
    const dataLines = rows.map((row) => row.map(escapeCsvField).join(','));

    return [headerLine, ...dataLines].join('\n');
  }

  /**
   * Get date filter based on period
   */
  private getDateFilter(period?: string): Date | null {
    if (!period) return null;

    const now = new Date();
    switch (period) {
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case '90d':
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      case '365d':
        return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      default:
        return null;
    }
  }

  /**
   * Translate order status to Turkish
   */
  private translateStatus(status: string): string {
    const statusMap: Record<string, string> = {
      completed: 'Tamamlandı',
      processing: 'İşleniyor',
      pending: 'Beklemede',
      cancelled: 'İptal',
      refunded: 'İade',
      failed: 'Başarısız',
    };
    return statusMap[status] || status;
  }
}
