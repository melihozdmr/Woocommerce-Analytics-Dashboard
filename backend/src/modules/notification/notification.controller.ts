import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { NotificationService, NotificationSettingDto } from './notification.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotificationType } from '@prisma/client';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  // Bildirimleri listele
  @Get()
  async findAll(
    @Request() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('unreadOnly') unreadOnly?: string,
    @Query('companyId') companyId?: string,
  ) {
    const userId = req.user.id;
    const effectiveCompanyId = companyId || req.user.currentCompanyId;

    return this.notificationService.findAll(userId, effectiveCompanyId, {
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
      unreadOnly: unreadOnly === 'true',
    });
  }

  // Okunmamış bildirim sayısı
  @Get('unread-count')
  async getUnreadCount(
    @Request() req: any,
    @Query('companyId') companyId?: string,
  ) {
    const userId = req.user.id;
    const effectiveCompanyId = companyId || req.user.currentCompanyId;
    const count = await this.notificationService.getUnreadCount(userId, effectiveCompanyId);
    return { count };
  }

  // Bildirim ayarlarını getir
  @Get('settings')
  async getSettings(@Request() req: any) {
    return this.notificationService.getSettings(req.user.id);
  }

  // Bildirim ayarını güncelle
  @Put('settings')
  async updateSettings(
    @Request() req: any,
    @Body() body: { settings: NotificationSettingDto[] },
  ) {
    return this.notificationService.updateSettings(req.user.id, body.settings);
  }

  // Tek bir ayarı güncelle
  @Put('settings/:type')
  async updateSetting(
    @Request() req: any,
    @Param('type') type: string,
    @Body() body: { inAppEnabled?: boolean; emailEnabled?: boolean; thresholdValue?: number },
  ) {
    // Validate that type is a valid NotificationType
    const validTypes = Object.values(NotificationType);
    if (!validTypes.includes(type as NotificationType)) {
      throw new Error(`Invalid notification type: ${type}`);
    }

    return this.notificationService.updateSetting(req.user.id, {
      notificationType: type as NotificationType,
      inAppEnabled: body.inAppEnabled ?? true,
      emailEnabled: body.emailEnabled ?? false,
      thresholdValue: body.thresholdValue,
    });
  }

  // Bildirimi okundu olarak işaretle
  @Put(':id/read')
  async markAsRead(@Request() req: any, @Param('id') id: string) {
    await this.notificationService.markAsRead(id, req.user.id);
    return { success: true };
  }

  // Tüm bildirimleri okundu olarak işaretle
  @Put('read-all')
  async markAllAsRead(
    @Request() req: any,
    @Query('companyId') companyId?: string,
  ) {
    const effectiveCompanyId = companyId || req.user.currentCompanyId;
    await this.notificationService.markAllAsRead(req.user.id, effectiveCompanyId);
    return { success: true };
  }

  // Bildirim sil
  @Delete(':id')
  async delete(@Request() req: any, @Param('id') id: string) {
    await this.notificationService.delete(id, req.user.id);
    return { success: true };
  }

  // Tüm bildirimleri sil
  @Delete()
  async deleteAll(
    @Request() req: any,
    @Query('companyId') companyId?: string,
  ) {
    const effectiveCompanyId = companyId || req.user.currentCompanyId;
    await this.notificationService.deleteAll(req.user.id, effectiveCompanyId);
    return { success: true };
  }
}
