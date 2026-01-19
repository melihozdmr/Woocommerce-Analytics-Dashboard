import { Injectable, ForbiddenException, Inject } from '@nestjs/common';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { PrismaService } from '../../database/prisma.service';
import { InviteStatus } from '@prisma/client';

export interface RefundSummary {
  totalRefunds: number;
  totalRefundAmount: number;
  refundRate: number;
  totalOrders: number;
  avgRefundAmount: number;
  previousRefunds: number;
  previousRefundAmount: number;
  refundCountChange: number;
  refundAmountChange: number;
}

export interface RefundItem {
  id: string;
  orderId: string;
  orderNumber: string;
  amount: number;
  reason: string | null;
  refundDate: Date;
  storeName: string;
  customerName: string | null;
  orderTotal: number;
}

export interface RefundReason {
  reason: string;
  count: number;
  totalAmount: number;
  percentage: number;
}

export interface RefundTrend {
  date: string;
  count: number;
  amount: number;
}

export interface StoreRefundComparison {
  storeId: string;
  storeName: string;
  refundCount: number;
  refundAmount: number;
  totalOrders: number;
  refundRate: number;
}

@Injectable()
export class RefundService {
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  private getCacheKey(
    method: string,
    companyId: string,
    period: string,
    storeId?: string,
  ): string {
    const parts = ['refund', method, companyId, period];
    if (storeId) parts.push(storeId);
    return parts.join(':');
  }

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

  private async getCompanyStores(companyId: string) {
    return this.prisma.store.findMany({
      where: { companyId },
      select: { id: true, name: true },
    });
  }

  private getDateRange(
    period: string,
    customStartDate?: string,
    customEndDate?: string,
  ): { startDate: Date; endDate: Date } {
    if (customStartDate && customEndDate) {
      const startDate = new Date(customStartDate);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(customEndDate);
      endDate.setHours(23, 59, 59, 999);
      return { startDate, endDate };
    }

    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);

    switch (period) {
      case 'today':
        break;
      case '7d':
        startDate.setDate(startDate.getDate() - 6);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 29);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 89);
        break;
      case '365d':
        startDate.setDate(startDate.getDate() - 364);
        break;
      default:
        startDate.setDate(startDate.getDate() - 29);
    }

    return { startDate, endDate };
  }

  private getPreviousPeriodRange(
    startDate: Date,
    endDate: Date,
  ): { startDate: Date; endDate: Date } {
    const daysDiff = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    const prevEndDate = new Date(startDate);
    prevEndDate.setDate(prevEndDate.getDate() - 1);
    prevEndDate.setHours(23, 59, 59, 999);

    const prevStartDate = new Date(prevEndDate);
    prevStartDate.setDate(prevStartDate.getDate() - daysDiff + 1);
    prevStartDate.setHours(0, 0, 0, 0);

    return { startDate: prevStartDate, endDate: prevEndDate };
  }

  private calculatePercentageChange(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / Math.abs(previous)) * 100 * 10) / 10;
  }

  async getRefundSummary(
    companyId: string,
    userId: string,
    period: string = '30d',
    storeId?: string,
    customStartDate?: string,
    customEndDate?: string,
  ): Promise<RefundSummary> {
    await this.checkCompanyAccess(companyId, userId);

    const cacheKey = this.getCacheKey('summary', companyId, period, storeId);
    const cached = await this.cacheManager.get<RefundSummary>(cacheKey);
    if (cached) return cached;

    const stores = await this.getCompanyStores(companyId);
    const storeIds = storeId ? [storeId] : stores.map((s) => s.id);

    const { startDate, endDate } = this.getDateRange(period, customStartDate, customEndDate);
    const prevRange = this.getPreviousPeriodRange(startDate, endDate);

    // Current period refunds
    const refunds = await this.prisma.refund.findMany({
      where: {
        refundDate: { gte: startDate, lte: endDate },
        order: { storeId: { in: storeIds } },
      },
    });

    // Previous period refunds
    const prevRefunds = await this.prisma.refund.findMany({
      where: {
        refundDate: { gte: prevRange.startDate, lte: prevRange.endDate },
        order: { storeId: { in: storeIds } },
      },
    });

    // Total orders in current period
    const totalOrders = await this.prisma.order.count({
      where: {
        storeId: { in: storeIds },
        orderDate: { gte: startDate, lte: endDate },
        status: { in: ['completed', 'processing', 'refunded'] },
      },
    });

    const totalRefunds = refunds.length;
    const totalRefundAmount = refunds.reduce((sum, r) => sum + Number(r.amount), 0);
    const avgRefundAmount = totalRefunds > 0 ? totalRefundAmount / totalRefunds : 0;
    const refundRate = totalOrders > 0 ? (totalRefunds / totalOrders) * 100 : 0;

    const previousRefunds = prevRefunds.length;
    const previousRefundAmount = prevRefunds.reduce((sum, r) => sum + Number(r.amount), 0);

    const result: RefundSummary = {
      totalRefunds,
      totalRefundAmount: Math.round(totalRefundAmount * 100) / 100,
      refundRate: Math.round(refundRate * 10) / 10,
      totalOrders,
      avgRefundAmount: Math.round(avgRefundAmount * 100) / 100,
      previousRefunds,
      previousRefundAmount: Math.round(previousRefundAmount * 100) / 100,
      refundCountChange: this.calculatePercentageChange(totalRefunds, previousRefunds),
      refundAmountChange: this.calculatePercentageChange(totalRefundAmount, previousRefundAmount),
    };

    await this.cacheManager.set(cacheKey, result, this.CACHE_TTL);
    return result;
  }

  async getRefundList(
    companyId: string,
    userId: string,
    period: string = '30d',
    storeId?: string,
    customStartDate?: string,
    customEndDate?: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{ refunds: RefundItem[]; total: number; page: number; totalPages: number }> {
    await this.checkCompanyAccess(companyId, userId);

    const stores = await this.getCompanyStores(companyId);
    const storeIds = storeId ? [storeId] : stores.map((s) => s.id);
    const storeMap = new Map(stores.map((s) => [s.id, s.name]));

    const { startDate, endDate } = this.getDateRange(period, customStartDate, customEndDate);

    const where = {
      refundDate: { gte: startDate, lte: endDate },
      order: { storeId: { in: storeIds } },
    };

    const [refunds, total] = await Promise.all([
      this.prisma.refund.findMany({
        where,
        include: {
          order: {
            select: {
              id: true,
              orderNumber: true,
              total: true,
              customerName: true,
              storeId: true,
            },
          },
        },
        orderBy: { refundDate: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.refund.count({ where }),
    ]);

    const results: RefundItem[] = refunds.map((refund) => ({
      id: refund.id,
      orderId: refund.orderId,
      orderNumber: refund.order.orderNumber,
      amount: Number(refund.amount),
      reason: refund.reason,
      refundDate: refund.refundDate,
      storeName: storeMap.get(refund.order.storeId) || 'Unknown',
      customerName: refund.order.customerName,
      orderTotal: Number(refund.order.total),
    }));

    return {
      refunds: results,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getRefundReasons(
    companyId: string,
    userId: string,
    period: string = '30d',
    storeId?: string,
    customStartDate?: string,
    customEndDate?: string,
  ): Promise<RefundReason[]> {
    await this.checkCompanyAccess(companyId, userId);

    const cacheKey = this.getCacheKey('reasons', companyId, period, storeId);
    const cached = await this.cacheManager.get<RefundReason[]>(cacheKey);
    if (cached) return cached;

    const stores = await this.getCompanyStores(companyId);
    const storeIds = storeId ? [storeId] : stores.map((s) => s.id);

    const { startDate, endDate } = this.getDateRange(period, customStartDate, customEndDate);

    const refunds = await this.prisma.refund.findMany({
      where: {
        refundDate: { gte: startDate, lte: endDate },
        order: { storeId: { in: storeIds } },
      },
      select: { reason: true, amount: true },
    });

    // Group by reason
    const reasonMap = new Map<string, { count: number; totalAmount: number }>();
    let totalCount = 0;

    for (const refund of refunds) {
      const reason = refund.reason || 'Belirtilmemiş';
      const existing = reasonMap.get(reason) || { count: 0, totalAmount: 0 };
      existing.count++;
      existing.totalAmount += Number(refund.amount);
      reasonMap.set(reason, existing);
      totalCount++;
    }

    const results: RefundReason[] = Array.from(reasonMap.entries())
      .map(([reason, data]) => ({
        reason,
        count: data.count,
        totalAmount: Math.round(data.totalAmount * 100) / 100,
        percentage: totalCount > 0 ? Math.round((data.count / totalCount) * 100 * 10) / 10 : 0,
      }))
      .sort((a, b) => b.count - a.count);

    await this.cacheManager.set(cacheKey, results, this.CACHE_TTL);
    return results;
  }

  async getRefundTrend(
    companyId: string,
    userId: string,
    period: string = '30d',
    storeId?: string,
    customStartDate?: string,
    customEndDate?: string,
  ): Promise<RefundTrend[]> {
    await this.checkCompanyAccess(companyId, userId);

    const cacheKey = this.getCacheKey('trend', companyId, period, storeId);
    const cached = await this.cacheManager.get<RefundTrend[]>(cacheKey);
    if (cached) return cached;

    const stores = await this.getCompanyStores(companyId);
    const storeIds = storeId ? [storeId] : stores.map((s) => s.id);

    const { startDate, endDate } = this.getDateRange(period, customStartDate, customEndDate);

    const refunds = await this.prisma.refund.findMany({
      where: {
        refundDate: { gte: startDate, lte: endDate },
        order: { storeId: { in: storeIds } },
      },
      select: { refundDate: true, amount: true },
      orderBy: { refundDate: 'asc' },
    });

    // Initialize all dates
    const trendMap = new Map<string, { count: number; amount: number }>();
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateKey = this.getLocalDateKey(currentDate);
      trendMap.set(dateKey, { count: 0, amount: 0 });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Fill data
    for (const refund of refunds) {
      const dateKey = this.getLocalDateKey(refund.refundDate);
      const existing = trendMap.get(dateKey);
      if (existing) {
        existing.count++;
        existing.amount += Number(refund.amount);
      }
    }

    const results: RefundTrend[] = Array.from(trendMap.entries()).map(([date, data]) => ({
      date,
      count: data.count,
      amount: Math.round(data.amount * 100) / 100,
    }));

    await this.cacheManager.set(cacheKey, results, this.CACHE_TTL);
    return results;
  }

  async getStoreComparison(
    companyId: string,
    userId: string,
    period: string = '30d',
    customStartDate?: string,
    customEndDate?: string,
  ): Promise<StoreRefundComparison[]> {
    await this.checkCompanyAccess(companyId, userId);

    const cacheKey = this.getCacheKey('comparison', companyId, period);
    const cached = await this.cacheManager.get<StoreRefundComparison[]>(cacheKey);
    if (cached) return cached;

    const stores = await this.getCompanyStores(companyId);
    const { startDate, endDate } = this.getDateRange(period, customStartDate, customEndDate);

    const results: StoreRefundComparison[] = [];

    for (const store of stores) {
      const [refunds, totalOrders] = await Promise.all([
        this.prisma.refund.findMany({
          where: {
            refundDate: { gte: startDate, lte: endDate },
            order: { storeId: store.id },
          },
          select: { amount: true },
        }),
        this.prisma.order.count({
          where: {
            storeId: store.id,
            orderDate: { gte: startDate, lte: endDate },
            status: { in: ['completed', 'processing', 'refunded'] },
          },
        }),
      ]);

      const refundCount = refunds.length;
      const refundAmount = refunds.reduce((sum, r) => sum + Number(r.amount), 0);
      const refundRate = totalOrders > 0 ? (refundCount / totalOrders) * 100 : 0;

      results.push({
        storeId: store.id,
        storeName: store.name,
        refundCount,
        refundAmount: Math.round(refundAmount * 100) / 100,
        totalOrders,
        refundRate: Math.round(refundRate * 10) / 10,
      });
    }

    // Sort by refund rate descending
    results.sort((a, b) => b.refundRate - a.refundRate);

    await this.cacheManager.set(cacheKey, results, this.CACHE_TTL);
    return results;
  }

  private getLocalDateKey(date: Date): string {
    const turkeyOffset = 3 * 60; // UTC+3
    const localDate = new Date(date.getTime() + turkeyOffset * 60 * 1000);
    return localDate.toISOString().split('T')[0];
  }
}
