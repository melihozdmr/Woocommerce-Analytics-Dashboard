import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EmailReportService } from './email-report.service';
import { NotificationType } from '@prisma/client';

@Injectable()
export class ReportSchedulerService {
  private readonly logger = new Logger(ReportSchedulerService.name);

  constructor(private emailReportService: EmailReportService) {}

  // Run daily report at 8:00 AM every day
  @Cron('0 8 * * *', {
    timeZone: 'Europe/Istanbul',
  })
  async sendDailyReports() {
    this.logger.log('Starting daily report distribution...');

    try {
      const users = await this.emailReportService.getUsersWithReportEnabled(NotificationType.DAILY_REPORT);
      this.logger.log(`Found ${users.length} users with daily reports enabled`);

      let successCount = 0;
      let failCount = 0;

      for (const { userId, companyId } of users) {
        try {
          const sent = await this.emailReportService.sendDailyReport(userId, companyId);
          if (sent) {
            successCount++;
          }
        } catch (error) {
          this.logger.error(`Failed to send daily report to user ${userId}: ${error.message}`);
          failCount++;
        }
      }

      this.logger.log(`Daily reports completed: ${successCount} sent, ${failCount} failed`);
    } catch (error) {
      this.logger.error(`Daily report job failed: ${error.message}`);
    }
  }

  // Run weekly report every Monday at 8:00 AM
  @Cron('0 8 * * 1', {
    timeZone: 'Europe/Istanbul',
  })
  async sendWeeklyReports() {
    this.logger.log('Starting weekly report distribution...');

    try {
      const users = await this.emailReportService.getUsersWithReportEnabled(NotificationType.WEEKLY_REPORT);
      this.logger.log(`Found ${users.length} users with weekly reports enabled`);

      let successCount = 0;
      let failCount = 0;

      for (const { userId, companyId } of users) {
        try {
          const sent = await this.emailReportService.sendWeeklyReport(userId, companyId);
          if (sent) {
            successCount++;
          }
        } catch (error) {
          this.logger.error(`Failed to send weekly report to user ${userId}: ${error.message}`);
          failCount++;
        }
      }

      this.logger.log(`Weekly reports completed: ${successCount} sent, ${failCount} failed`);
    } catch (error) {
      this.logger.error(`Weekly report job failed: ${error.message}`);
    }
  }

  // Manual trigger for testing (can be called via an admin endpoint)
  async triggerDailyReport(userId: string, companyId: string): Promise<boolean> {
    return this.emailReportService.sendDailyReport(userId, companyId);
  }

  async triggerWeeklyReport(userId: string, companyId: string): Promise<boolean> {
    return this.emailReportService.sendWeeklyReport(userId, companyId);
  }
}
