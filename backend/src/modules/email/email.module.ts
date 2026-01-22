import { Module, Global } from '@nestjs/common';
import { EmailService } from './email.service';
import { EmailReportService } from './email-report.service';
import { ReportSchedulerService } from './report-scheduler.service';

@Global()
@Module({
  providers: [EmailService, EmailReportService, ReportSchedulerService],
  exports: [EmailService, EmailReportService, ReportSchedulerService],
})
export class EmailModule {}
