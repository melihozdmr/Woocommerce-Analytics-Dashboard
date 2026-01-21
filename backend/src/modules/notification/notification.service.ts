import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { NotificationType, Prisma } from '@prisma/client';

export interface CreateNotificationDto {
  userId: string;
  companyId: string;
  type: NotificationType;
  title: string;
  message?: string;
  data?: Record<string, any>;
}

export interface NotificationSettingDto {
  notificationType: NotificationType;
  inAppEnabled: boolean;
  emailEnabled: boolean;
  thresholdValue?: number;
}

@Injectable()
export class NotificationService {
  constructor(private prisma: PrismaService) {}

  // Bildirim oluştur
  async create(dto: CreateNotificationDto) {
    // Önce kullanıcının bu bildirim türü için ayarlarını kontrol et
    const setting = await this.prisma.notificationSetting.findUnique({
      where: {
        userId_notificationType: {
          userId: dto.userId,
          notificationType: dto.type,
        },
      },
    });

    // Eğer ayar varsa ve in-app kapalıysa bildirim oluşturma
    if (setting && !setting.inAppEnabled) {
      return null;
    }

    return this.prisma.notification.create({
      data: {
        userId: dto.userId,
        companyId: dto.companyId,
        type: dto.type,
        title: dto.title,
        message: dto.message,
        data: dto.data as Prisma.InputJsonValue,
      },
    });
  }

  // Toplu bildirim oluştur (birden fazla kullanıcıya)
  async createForCompanyUsers(companyId: string, type: NotificationType, title: string, message?: string, data?: Record<string, any>) {
    // Şirketin tüm üyelerini al
    const members = await this.prisma.companyMember.findMany({
      where: {
        companyId,
        inviteStatus: 'ACCEPTED',
        userId: { not: null },
      },
      select: { userId: true },
    });

    const notifications = [];
    for (const member of members) {
      if (member.userId) {
        const notification = await this.create({
          userId: member.userId,
          companyId,
          type,
          title,
          message,
          data,
        });
        if (notification) {
          notifications.push(notification);
        }
      }
    }

    return notifications;
  }

  // Kullanıcının bildirimlerini getir
  async findAll(userId: string, companyId?: string, options: { page?: number; limit?: number; unreadOnly?: boolean } = {}) {
    const { page = 1, limit = 20, unreadOnly = false } = options;

    const where: Prisma.NotificationWhereInput = {
      userId,
      ...(companyId && { companyId }),
      ...(unreadOnly && { isRead: false }),
    };

    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.notification.count({ where }),
    ]);

    return {
      notifications,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Okunmamış bildirim sayısı
  async getUnreadCount(userId: string, companyId?: string) {
    return this.prisma.notification.count({
      where: {
        userId,
        isRead: false,
        ...(companyId && { companyId }),
      },
    });
  }

  // Bildirimi okundu olarak işaretle
  async markAsRead(notificationId: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId,
      },
      data: { isRead: true },
    });
  }

  // Tüm bildirimleri okundu olarak işaretle
  async markAllAsRead(userId: string, companyId?: string) {
    return this.prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
        ...(companyId && { companyId }),
      },
      data: { isRead: true },
    });
  }

  // Bildirim sil
  async delete(notificationId: string, userId: string) {
    return this.prisma.notification.deleteMany({
      where: {
        id: notificationId,
        userId,
      },
    });
  }

  // Tüm bildirimleri sil
  async deleteAll(userId: string, companyId?: string) {
    return this.prisma.notification.deleteMany({
      where: {
        userId,
        ...(companyId && { companyId }),
      },
    });
  }

  // ========================
  // Bildirim Ayarları
  // ========================

  // Kullanıcının bildirim ayarlarını getir
  async getSettings(userId: string) {
    const settings = await this.prisma.notificationSetting.findMany({
      where: { userId },
    });

    // Tüm bildirim türleri için varsayılan ayarları oluştur
    const allTypes = Object.values(NotificationType);
    const settingsMap = new Map(settings.map(s => [s.notificationType, s]));

    return allTypes.map(type => {
      const existing = settingsMap.get(type);
      return {
        notificationType: type,
        inAppEnabled: existing?.inAppEnabled ?? true,
        emailEnabled: existing?.emailEnabled ?? false,
        thresholdValue: existing?.thresholdValue ? Number(existing.thresholdValue) : null,
      };
    });
  }

  // Bildirim ayarını güncelle
  async updateSetting(userId: string, dto: NotificationSettingDto) {
    return this.prisma.notificationSetting.upsert({
      where: {
        userId_notificationType: {
          userId,
          notificationType: dto.notificationType,
        },
      },
      update: {
        inAppEnabled: dto.inAppEnabled,
        emailEnabled: dto.emailEnabled,
        thresholdValue: dto.thresholdValue,
      },
      create: {
        userId,
        notificationType: dto.notificationType,
        inAppEnabled: dto.inAppEnabled,
        emailEnabled: dto.emailEnabled,
        thresholdValue: dto.thresholdValue,
      },
    });
  }

  // Toplu ayar güncelle
  async updateSettings(userId: string, settings: NotificationSettingDto[]) {
    const results = [];
    for (const setting of settings) {
      const result = await this.updateSetting(userId, setting);
      results.push(result);
    }
    return results;
  }

  // ========================
  // Bildirim Tetikleyiciler
  // ========================

  // Yeni sipariş bildirimi
  async notifyNewOrder(companyId: string, orderNumber: string, total: number, storeName: string) {
    return this.createForCompanyUsers(
      companyId,
      NotificationType.NEW_ORDER,
      'Yeni Sipariş',
      `${storeName}'den #${orderNumber} numaralı ${total.toLocaleString('tr-TR')} TL'lik sipariş alındı`,
      { orderNumber, total, storeName },
    );
  }

  // Kritik stok bildirimi
  async notifyCriticalStock(companyId: string, productName: string, stockQuantity: number, storeName: string) {
    return this.createForCompanyUsers(
      companyId,
      NotificationType.CRITICAL_STOCK,
      'Kritik Stok Uyarısı',
      `"${productName}" stoğu kritik seviyede (${stockQuantity} adet kaldı) - ${storeName}`,
      { productName, stockQuantity, storeName },
    );
  }

  // Yüksek tutarlı sipariş bildirimi
  async notifyHighValueOrder(companyId: string, orderNumber: string, total: number, storeName: string) {
    return this.createForCompanyUsers(
      companyId,
      NotificationType.HIGH_VALUE_ORDER,
      'Yüksek Tutarlı Sipariş',
      `${storeName}'den ${total.toLocaleString('tr-TR')} TL'lik büyük sipariş!`,
      { orderNumber, total, storeName },
    );
  }

  // İade bildirimi
  async notifyRefund(companyId: string, orderNumber: string, amount: number, storeName: string) {
    return this.createForCompanyUsers(
      companyId,
      NotificationType.REFUND_RECEIVED,
      'İade Talebi',
      `#${orderNumber} numaralı sipariş için ${amount.toLocaleString('tr-TR')} TL'lik iade talebi alındı - ${storeName}`,
      { orderNumber, amount, storeName },
    );
  }

  // Senkronizasyon hatası bildirimi
  async notifySyncError(companyId: string, storeName: string, errorMessage: string) {
    return this.createForCompanyUsers(
      companyId,
      NotificationType.SYNC_ERROR,
      'Senkronizasyon Hatası',
      `${storeName} mağazasıyla senkronizasyon başarısız: ${errorMessage}`,
      { storeName, errorMessage },
    );
  }

  // Senkronizasyon başarılı bildirimi
  async notifySyncSuccess(companyId: string, storeName: string, productsCount: number, ordersCount: number) {
    return this.createForCompanyUsers(
      companyId,
      NotificationType.SYNC_SUCCESS,
      'Senkronizasyon Tamamlandı',
      `${storeName} başarıyla senkronize edildi (${productsCount} ürün, ${ordersCount} sipariş)`,
      { storeName, productsCount, ordersCount },
    );
  }

  // Düşük kar marjı bildirimi
  async notifyLowProfitMargin(companyId: string, productName: string, profitMargin: number, storeName: string) {
    return this.createForCompanyUsers(
      companyId,
      NotificationType.LOW_PROFIT_MARGIN,
      'Düşük Kar Marjı',
      `"${productName}" ürününde kar marjı %${profitMargin.toFixed(1)}'e düştü - ${storeName}`,
      { productName, profitMargin, storeName },
    );
  }

  // Eski bildirimleri temizle (30 günden eski)
  async cleanupOldNotifications(daysOld: number = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    return this.prisma.notification.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
        isRead: true, // Sadece okunmuş bildirimleri sil
      },
    });
  }
}
