import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { PrismaService } from '../../database/prisma.service';
import { NotificationType } from '@prisma/client';

interface DailyReportData {
  companyName: string;
  date: string;
  totalOrders: number;
  totalRevenue: number;
  newOrders: number;
  criticalStockCount: number;
  topProducts: Array<{ name: string; quantity: number; revenue: number }>;
  storeStats: Array<{ name: string; orders: number; revenue: number }>;
}

interface WeeklyReportData {
  companyName: string;
  startDate: string;
  endDate: string;
  totalOrders: number;
  totalRevenue: number;
  orderGrowth: number;
  revenueGrowth: number;
  topProducts: Array<{ name: string; quantity: number; revenue: number }>;
  storeStats: Array<{ name: string; orders: number; revenue: number }>;
  criticalStockCount: number;
  outOfStockCount: number;
}

@Injectable()
export class EmailReportService {
  private readonly logger = new Logger(EmailReportService.name);
  private resend: Resend;
  private fromEmail: string;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    this.resend = new Resend(this.configService.get<string>('RESEND_API_KEY'));
    this.fromEmail = this.configService.get<string>('RESEND_FROM_EMAIL') || 'onboarding@resend.dev';
  }

  private getBaseTemplate(content: string): string {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const logoUrl = `${frontendUrl}/logos/klue-logo.png`;
    const symbolUrl = `${frontendUrl}/logos/klue-symbol.png`;

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="background-color: #ffffff;">
          <!-- Header -->
          <tr>
            <td style="padding: 32px 32px 0 32px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="left" style="vertical-align: middle;">
                    <img src="${logoUrl}" alt="Klue" height="28" style="display: block;">
                  </td>
                  <td align="right" style="vertical-align: middle;">
                    <img src="${symbolUrl}" alt="" width="24" height="24" style="display: block;">
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 48px 32px 32px 32px;">
              ${content}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();
  }

  async sendDailyReport(userId: string, companyId: string): Promise<boolean> {
    try {
      // Get user and company info
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, name: true },
      });

      const company = await this.prisma.company.findUnique({
        where: { id: companyId },
        select: { name: true },
      });

      if (!user || !company) {
        this.logger.warn(`User or company not found: userId=${userId}, companyId=${companyId}`);
        return false;
      }

      // Check if user has email reports enabled
      const setting = await this.prisma.notificationSetting.findUnique({
        where: {
          userId_notificationType: {
            userId,
            notificationType: NotificationType.DAILY_REPORT,
          },
        },
      });

      if (!setting?.emailEnabled) {
        this.logger.debug(`Daily report not enabled for user ${userId}`);
        return false;
      }

      // Generate report data
      const reportData = await this.generateDailyReportData(companyId);
      reportData.companyName = company.name;

      // Send email
      await this.sendDailyReportEmail(user.email, user.name || '', reportData);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send daily report: ${error.message}`);
      return false;
    }
  }

  async sendWeeklyReport(userId: string, companyId: string): Promise<boolean> {
    try {
      // Get user and company info
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, name: true },
      });

      const company = await this.prisma.company.findUnique({
        where: { id: companyId },
        select: { name: true },
      });

      if (!user || !company) {
        this.logger.warn(`User or company not found: userId=${userId}, companyId=${companyId}`);
        return false;
      }

      // Check if user has email reports enabled
      const setting = await this.prisma.notificationSetting.findUnique({
        where: {
          userId_notificationType: {
            userId,
            notificationType: NotificationType.WEEKLY_REPORT,
          },
        },
      });

      if (!setting?.emailEnabled) {
        this.logger.debug(`Weekly report not enabled for user ${userId}`);
        return false;
      }

      // Generate report data
      const reportData = await this.generateWeeklyReportData(companyId);
      reportData.companyName = company.name;

      // Send email
      await this.sendWeeklyReportEmail(user.email, user.name || '', reportData);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send weekly report: ${error.message}`);
      return false;
    }
  }

  private async generateDailyReportData(companyId: string): Promise<DailyReportData> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get company stores
    const stores = await this.prisma.store.findMany({
      where: { companyId, status: 'ACTIVE' },
      select: { id: true, name: true },
    });
    const storeIds = stores.map((s) => s.id);

    // Get today's orders
    const orders = await this.prisma.order.findMany({
      where: {
        storeId: { in: storeIds },
        orderDate: { gte: today, lt: tomorrow },
      },
      select: {
        id: true,
        total: true,
        storeId: true,
      },
    });

    // Get order items for top products
    const orderItems = await this.prisma.orderItem.findMany({
      where: {
        order: {
          storeId: { in: storeIds },
          orderDate: { gte: today, lt: tomorrow },
        },
      },
      select: {
        quantity: true,
        total: true,
        name: true,
      },
    });

    // Calculate top products
    const productMap = new Map<string, { quantity: number; revenue: number }>();
    for (const item of orderItems) {
      const existing = productMap.get(item.name) || { quantity: 0, revenue: 0 };
      existing.quantity += item.quantity;
      existing.revenue += Number(item.total);
      productMap.set(item.name, existing);
    }
    const topProducts = Array.from(productMap.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Calculate store stats
    const storeMap = new Map<string, { orders: number; revenue: number }>();
    for (const store of stores) {
      storeMap.set(store.id, { orders: 0, revenue: 0 });
    }
    for (const order of orders) {
      const stats = storeMap.get(order.storeId);
      if (stats) {
        stats.orders += 1;
        stats.revenue += Number(order.total);
      }
    }
    const storeStats = stores.map((store) => ({
      name: store.name,
      ...storeMap.get(store.id)!,
    }));

    // Get critical stock count
    const criticalStockCount = await this.prisma.product.count({
      where: {
        storeId: { in: storeIds },
        isActive: true,
        stockQuantity: { gt: 0, lte: 5 },
      },
    });

    return {
      companyName: '',
      date: today.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }),
      totalOrders: orders.length,
      totalRevenue: orders.reduce((sum, o) => sum + Number(o.total), 0),
      newOrders: orders.length,
      criticalStockCount,
      topProducts,
      storeStats,
    };
  }

  private async generateWeeklyReportData(companyId: string): Promise<WeeklyReportData> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - 7);
    const prevWeekStart = new Date(weekStart);
    prevWeekStart.setDate(prevWeekStart.getDate() - 7);

    // Get company stores
    const stores = await this.prisma.store.findMany({
      where: { companyId, status: 'ACTIVE' },
      select: { id: true, name: true },
    });
    const storeIds = stores.map((s) => s.id);

    // Get this week's orders
    const thisWeekOrders = await this.prisma.order.findMany({
      where: {
        storeId: { in: storeIds },
        orderDate: { gte: weekStart, lt: today },
      },
      select: { id: true, total: true, storeId: true },
    });

    // Get last week's orders for comparison
    const lastWeekOrders = await this.prisma.order.findMany({
      where: {
        storeId: { in: storeIds },
        orderDate: { gte: prevWeekStart, lt: weekStart },
      },
      select: { id: true, total: true },
    });

    const thisWeekRevenue = thisWeekOrders.reduce((sum, o) => sum + Number(o.total), 0);
    const lastWeekRevenue = lastWeekOrders.reduce((sum, o) => sum + Number(o.total), 0);

    // Calculate growth
    const orderGrowth = lastWeekOrders.length > 0
      ? ((thisWeekOrders.length - lastWeekOrders.length) / lastWeekOrders.length) * 100
      : 0;
    const revenueGrowth = lastWeekRevenue > 0
      ? ((thisWeekRevenue - lastWeekRevenue) / lastWeekRevenue) * 100
      : 0;

    // Get order items for top products
    const orderItems = await this.prisma.orderItem.findMany({
      where: {
        order: {
          storeId: { in: storeIds },
          orderDate: { gte: weekStart, lt: today },
        },
      },
      select: { quantity: true, total: true, name: true },
    });

    // Calculate top products
    const productMap = new Map<string, { quantity: number; revenue: number }>();
    for (const item of orderItems) {
      const existing = productMap.get(item.name) || { quantity: 0, revenue: 0 };
      existing.quantity += item.quantity;
      existing.revenue += Number(item.total);
      productMap.set(item.name, existing);
    }
    const topProducts = Array.from(productMap.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Calculate store stats
    const storeMap = new Map<string, { orders: number; revenue: number }>();
    for (const store of stores) {
      storeMap.set(store.id, { orders: 0, revenue: 0 });
    }
    for (const order of thisWeekOrders) {
      const stats = storeMap.get(order.storeId);
      if (stats) {
        stats.orders += 1;
        stats.revenue += Number(order.total);
      }
    }
    const storeStats = stores.map((store) => ({
      name: store.name,
      ...storeMap.get(store.id)!,
    }));

    // Get stock stats
    const criticalStockCount = await this.prisma.product.count({
      where: {
        storeId: { in: storeIds },
        isActive: true,
        stockQuantity: { gt: 0, lte: 5 },
      },
    });

    const outOfStockCount = await this.prisma.product.count({
      where: {
        storeId: { in: storeIds },
        isActive: true,
        stockQuantity: 0,
      },
    });

    return {
      companyName: '',
      startDate: weekStart.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' }),
      endDate: today.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }),
      totalOrders: thisWeekOrders.length,
      totalRevenue: thisWeekRevenue,
      orderGrowth,
      revenueGrowth,
      topProducts,
      storeStats,
      criticalStockCount,
      outOfStockCount,
    };
  }

  private async sendDailyReportEmail(email: string, _name: string, data: DailyReportData): Promise<void> {
    const appName = this.configService.get<string>('APP_NAME') || 'Klue';

    const topProductsHtml = data.topProducts.length > 0
      ? data.topProducts.map((p, i) => `
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #000; font-size: 14px;">${i + 1}. ${p.name}</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #eee; text-align: center; color: rgba(0,0,0,0.6); font-size: 14px;">${p.quantity}</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #eee; text-align: right; color: #000; font-size: 14px;">${p.revenue.toLocaleString('tr-TR')} TL</td>
        </tr>
      `).join('')
      : '<tr><td colspan="3" style="padding: 16px; text-align: center; color: rgba(0,0,0,0.6); font-size: 14px;">Bugün sipariş yok</td></tr>';

    const storeStatsHtml = data.storeStats.length > 0
      ? data.storeStats.map((s) => `
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #000; font-size: 14px;">${s.name}</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #eee; text-align: center; color: rgba(0,0,0,0.6); font-size: 14px;">${s.orders}</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #eee; text-align: right; color: #000; font-size: 14px;">${s.revenue.toLocaleString('tr-TR')} TL</td>
        </tr>
      `).join('')
      : '<tr><td colspan="3" style="padding: 16px; text-align: center; color: rgba(0,0,0,0.6); font-size: 14px;">Mağaza yok</td></tr>';

    const content = `
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
        <tr>
          <td style="padding-bottom: 8px;">
            <p style="margin: 0; color: #000; font-size: 20px; line-height: 28px; font-weight: 500;">
              ${data.companyName} - Günlük Rapor
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding-bottom: 24px;">
            <p style="margin: 0; color: rgba(0,0,0,0.6); font-size: 14px; line-height: 20px;">
              ${data.date}
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding-bottom: 24px;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
              <tr>
                <td style="padding: 16px; background: #f5f5f5; text-align: center; width: 32%;">
                  <p style="margin: 0; font-size: 24px; font-weight: bold; color: #000;">${data.totalOrders}</p>
                  <p style="margin: 4px 0 0 0; font-size: 12px; color: rgba(0,0,0,0.6);">Sipariş</p>
                </td>
                <td style="width: 2%;"></td>
                <td style="padding: 16px; background: #f5f5f5; text-align: center; width: 32%;">
                  <p style="margin: 0; font-size: 24px; font-weight: bold; color: #000;">${data.totalRevenue.toLocaleString('tr-TR')} TL</p>
                  <p style="margin: 4px 0 0 0; font-size: 12px; color: rgba(0,0,0,0.6);">Gelir</p>
                </td>
                <td style="width: 2%;"></td>
                <td style="padding: 16px; background: #f5f5f5; text-align: center; width: 32%;">
                  <p style="margin: 0; font-size: 24px; font-weight: bold; color: #000;">${data.criticalStockCount}</p>
                  <p style="margin: 4px 0 0 0; font-size: 12px; color: rgba(0,0,0,0.6);">Kritik Stok</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding-bottom: 24px;">
            <p style="margin: 0 0 16px 0; color: #000; font-size: 16px; font-weight: 500;">En Çok Satan Ürünler</p>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse: collapse;">
              <thead>
                <tr>
                  <th style="padding: 8px 0; text-align: left; border-bottom: 1px solid #000; font-size: 12px; color: rgba(0,0,0,0.6); font-weight: normal;">Ürün</th>
                  <th style="padding: 8px 0; text-align: center; border-bottom: 1px solid #000; font-size: 12px; color: rgba(0,0,0,0.6); font-weight: normal;">Adet</th>
                  <th style="padding: 8px 0; text-align: right; border-bottom: 1px solid #000; font-size: 12px; color: rgba(0,0,0,0.6); font-weight: normal;">Gelir</th>
                </tr>
              </thead>
              <tbody>
                ${topProductsHtml}
              </tbody>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding-bottom: 24px;">
            <p style="margin: 0 0 16px 0; color: #000; font-size: 16px; font-weight: 500;">Mağaza Bazında</p>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse: collapse;">
              <thead>
                <tr>
                  <th style="padding: 8px 0; text-align: left; border-bottom: 1px solid #000; font-size: 12px; color: rgba(0,0,0,0.6); font-weight: normal;">Mağaza</th>
                  <th style="padding: 8px 0; text-align: center; border-bottom: 1px solid #000; font-size: 12px; color: rgba(0,0,0,0.6); font-weight: normal;">Sipariş</th>
                  <th style="padding: 8px 0; text-align: right; border-bottom: 1px solid #000; font-size: 12px; color: rgba(0,0,0,0.6); font-weight: normal;">Gelir</th>
                </tr>
              </thead>
              <tbody>
                ${storeStatsHtml}
              </tbody>
            </table>
          </td>
        </tr>
        <tr>
          <td>
            <p style="margin: 0; color: rgba(0,0,0,0.6); font-size: 14px; line-height: 20px;">
              Bu e-postayı almak istemiyorsanız bildirim ayarlarından kapatabilirsiniz.
            </p>
          </td>
        </tr>
      </table>
    `;

    await this.resend.emails.send({
      from: `${appName} <${this.fromEmail}>`,
      to: email,
      subject: `${data.companyName} - Günlük Rapor (${data.date})`,
      html: this.getBaseTemplate(content),
    });
    this.logger.log(`Daily report sent to ${email} for ${data.companyName}`);
  }

  private async sendWeeklyReportEmail(email: string, _name: string, data: WeeklyReportData): Promise<void> {
    const appName = this.configService.get<string>('APP_NAME') || 'Klue';

    const growthColor = (value: number) => value >= 0 ? '#22c55e' : '#ef4444';
    const growthIcon = (value: number) => value >= 0 ? '↑' : '↓';

    const topProductsHtml = data.topProducts.length > 0
      ? data.topProducts.map((p, i) => `
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #000; font-size: 14px;">${i + 1}. ${p.name}</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #eee; text-align: center; color: rgba(0,0,0,0.6); font-size: 14px;">${p.quantity}</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #eee; text-align: right; color: #000; font-size: 14px;">${p.revenue.toLocaleString('tr-TR')} TL</td>
        </tr>
      `).join('')
      : '<tr><td colspan="3" style="padding: 16px; text-align: center; color: rgba(0,0,0,0.6); font-size: 14px;">Bu hafta sipariş yok</td></tr>';

    const storeStatsHtml = data.storeStats.length > 0
      ? data.storeStats.map((s) => `
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #000; font-size: 14px;">${s.name}</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #eee; text-align: center; color: rgba(0,0,0,0.6); font-size: 14px;">${s.orders}</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #eee; text-align: right; color: #000; font-size: 14px;">${s.revenue.toLocaleString('tr-TR')} TL</td>
        </tr>
      `).join('')
      : '<tr><td colspan="3" style="padding: 16px; text-align: center; color: rgba(0,0,0,0.6); font-size: 14px;">Mağaza yok</td></tr>';

    const content = `
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
        <tr>
          <td style="padding-bottom: 8px;">
            <p style="margin: 0; color: #000; font-size: 20px; line-height: 28px; font-weight: 500;">
              ${data.companyName} - Haftalık Rapor
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding-bottom: 24px;">
            <p style="margin: 0; color: rgba(0,0,0,0.6); font-size: 14px; line-height: 20px;">
              ${data.startDate} - ${data.endDate}
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding-bottom: 16px;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
              <tr>
                <td style="padding: 16px; background: #f5f5f5; text-align: center; width: 49%;">
                  <p style="margin: 0; font-size: 24px; font-weight: bold; color: #000;">${data.totalOrders}</p>
                  <p style="margin: 4px 0 0 0; font-size: 12px; color: rgba(0,0,0,0.6);">Toplam Sipariş</p>
                  <p style="margin: 4px 0 0 0; font-size: 12px; color: ${growthColor(data.orderGrowth)};">${growthIcon(data.orderGrowth)} %${Math.abs(data.orderGrowth).toFixed(1)}</p>
                </td>
                <td style="width: 2%;"></td>
                <td style="padding: 16px; background: #f5f5f5; text-align: center; width: 49%;">
                  <p style="margin: 0; font-size: 24px; font-weight: bold; color: #000;">${data.totalRevenue.toLocaleString('tr-TR')} TL</p>
                  <p style="margin: 4px 0 0 0; font-size: 12px; color: rgba(0,0,0,0.6);">Toplam Gelir</p>
                  <p style="margin: 4px 0 0 0; font-size: 12px; color: ${growthColor(data.revenueGrowth)};">${growthIcon(data.revenueGrowth)} %${Math.abs(data.revenueGrowth).toFixed(1)}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding-bottom: 24px;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
              <tr>
                <td style="padding: 16px; background: #f5f5f5; text-align: center; width: 49%;">
                  <p style="margin: 0; font-size: 24px; font-weight: bold; color: #000;">${data.criticalStockCount}</p>
                  <p style="margin: 4px 0 0 0; font-size: 12px; color: rgba(0,0,0,0.6);">Kritik Stok</p>
                </td>
                <td style="width: 2%;"></td>
                <td style="padding: 16px; background: #f5f5f5; text-align: center; width: 49%;">
                  <p style="margin: 0; font-size: 24px; font-weight: bold; color: #000;">${data.outOfStockCount}</p>
                  <p style="margin: 4px 0 0 0; font-size: 12px; color: rgba(0,0,0,0.6);">Stok Yok</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding-bottom: 24px;">
            <p style="margin: 0 0 16px 0; color: #000; font-size: 16px; font-weight: 500;">En Çok Satan Ürünler</p>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse: collapse;">
              <thead>
                <tr>
                  <th style="padding: 8px 0; text-align: left; border-bottom: 1px solid #000; font-size: 12px; color: rgba(0,0,0,0.6); font-weight: normal;">Ürün</th>
                  <th style="padding: 8px 0; text-align: center; border-bottom: 1px solid #000; font-size: 12px; color: rgba(0,0,0,0.6); font-weight: normal;">Adet</th>
                  <th style="padding: 8px 0; text-align: right; border-bottom: 1px solid #000; font-size: 12px; color: rgba(0,0,0,0.6); font-weight: normal;">Gelir</th>
                </tr>
              </thead>
              <tbody>
                ${topProductsHtml}
              </tbody>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding-bottom: 24px;">
            <p style="margin: 0 0 16px 0; color: #000; font-size: 16px; font-weight: 500;">Mağaza Bazında</p>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse: collapse;">
              <thead>
                <tr>
                  <th style="padding: 8px 0; text-align: left; border-bottom: 1px solid #000; font-size: 12px; color: rgba(0,0,0,0.6); font-weight: normal;">Mağaza</th>
                  <th style="padding: 8px 0; text-align: center; border-bottom: 1px solid #000; font-size: 12px; color: rgba(0,0,0,0.6); font-weight: normal;">Sipariş</th>
                  <th style="padding: 8px 0; text-align: right; border-bottom: 1px solid #000; font-size: 12px; color: rgba(0,0,0,0.6); font-weight: normal;">Gelir</th>
                </tr>
              </thead>
              <tbody>
                ${storeStatsHtml}
              </tbody>
            </table>
          </td>
        </tr>
        <tr>
          <td>
            <p style="margin: 0; color: rgba(0,0,0,0.6); font-size: 14px; line-height: 20px;">
              Bu e-postayı almak istemiyorsanız bildirim ayarlarından kapatabilirsiniz.
            </p>
          </td>
        </tr>
      </table>
    `;

    await this.resend.emails.send({
      from: `${appName} <${this.fromEmail}>`,
      to: email,
      subject: `${data.companyName} - Haftalık Rapor (${data.startDate} - ${data.endDate})`,
      html: this.getBaseTemplate(content),
    });
    this.logger.log(`Weekly report sent to ${email} for ${data.companyName}`);
  }

  // Get all users who have reports enabled for a specific report type
  async getUsersWithReportEnabled(reportType: NotificationType): Promise<Array<{ userId: string; companyId: string }>> {
    const settings = await this.prisma.notificationSetting.findMany({
      where: {
        notificationType: reportType,
        emailEnabled: true,
      },
      select: { userId: true },
    });

    // Get company memberships for these users
    const results: Array<{ userId: string; companyId: string }> = [];
    for (const setting of settings) {
      const memberships = await this.prisma.companyMember.findMany({
        where: {
          userId: setting.userId,
          inviteStatus: 'ACCEPTED',
        },
        select: { companyId: true },
      });

      for (const membership of memberships) {
        results.push({ userId: setting.userId, companyId: membership.companyId });
      }
    }

    return results;
  }
}
