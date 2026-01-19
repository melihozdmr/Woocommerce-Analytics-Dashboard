import {
  Controller,
  Get,
  Param,
  Query,
  Res,
  UseGuards,
  Request,
} from '@nestjs/common';
import type { Response } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FeatureAccessGuard } from '../pricing/guards/feature-access.guard';
import { RequireFeature } from '../pricing/decorators/require-feature.decorator';
import { ExportService } from './export.service';

@ApiTags('export')
@Controller('company/:companyId/export')
@ApiBearerAuth()
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  /**
   * Export inventory to CSV
   * Requires csvExport feature
   */
  @Get('inventory/csv')
  @UseGuards(JwtAuthGuard, FeatureAccessGuard)
  @RequireFeature('csvExport')
  @ApiOperation({ summary: 'Envanter verilerini CSV olarak dışa aktar' })
  async exportInventoryCsv(
    @Param('companyId') companyId: string,
    @Request() req: { user: { id: string } },
    @Res() res: Response,
  ) {
    const csv = await this.exportService.exportInventoryToCsv(
      req.user.id,
      companyId,
    );

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="envanter-${Date.now()}.csv"`,
    );
    res.send('\uFEFF' + csv); // BOM for Excel UTF-8 support
  }

  /**
   * Export orders to CSV
   * Requires csvExport feature
   */
  @Get('orders/csv')
  @UseGuards(JwtAuthGuard, FeatureAccessGuard)
  @RequireFeature('csvExport')
  @ApiOperation({ summary: 'Sipariş verilerini CSV olarak dışa aktar' })
  async exportOrdersCsv(
    @Param('companyId') companyId: string,
    @Query('period') period: string,
    @Request() req: { user: { id: string } },
    @Res() res: Response,
  ) {
    const csv = await this.exportService.exportOrdersToCsv(
      req.user.id,
      companyId,
      period,
    );

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="siparisler-${Date.now()}.csv"`,
    );
    res.send('\uFEFF' + csv);
  }

  /**
   * Export profit data to CSV
   * Requires csvExport feature
   */
  @Get('profit/csv')
  @UseGuards(JwtAuthGuard, FeatureAccessGuard)
  @RequireFeature('csvExport')
  @ApiOperation({ summary: 'Kar verilerini CSV olarak dışa aktar' })
  async exportProfitCsv(
    @Param('companyId') companyId: string,
    @Query('period') period: string,
    @Request() req: { user: { id: string } },
    @Res() res: Response,
  ) {
    const csv = await this.exportService.exportProfitToCsv(
      req.user.id,
      companyId,
      period,
    );

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="kar-analizi-${Date.now()}.csv"`,
    );
    res.send('\uFEFF' + csv);
  }

  /**
   * Export refunds to CSV
   * Requires csvExport feature
   */
  @Get('refunds/csv')
  @UseGuards(JwtAuthGuard, FeatureAccessGuard)
  @RequireFeature('csvExport')
  @ApiOperation({ summary: 'İade verilerini CSV olarak dışa aktar' })
  async exportRefundsCsv(
    @Param('companyId') companyId: string,
    @Query('period') period: string,
    @Request() req: { user: { id: string } },
    @Res() res: Response,
  ) {
    const csv = await this.exportService.exportRefundsToCsv(
      req.user.id,
      companyId,
      period,
    );

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="iadeler-${Date.now()}.csv"`,
    );
    res.send('\uFEFF' + csv);
  }
}
