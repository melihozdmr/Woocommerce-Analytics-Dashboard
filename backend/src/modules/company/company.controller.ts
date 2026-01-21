import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CompanyService } from './company.service';
import { CreateCompanyDto, UpdateCompanyDto, InviteMemberDto } from './dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('company')
@Controller('company')
@ApiBearerAuth()
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Post()
  @ApiOperation({ summary: 'Yeni şirket oluştur' })
  @ApiResponse({ status: 201, description: 'Şirket oluşturuldu' })
  async createCompany(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateCompanyDto,
  ) {
    return this.companyService.createCompany(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Kullanıcının şirketlerini listele' })
  @ApiResponse({ status: 200, description: 'Şirket listesi' })
  async getUserCompanies(@CurrentUser('id') userId: string) {
    return this.companyService.getUserCompanies(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Şirket detayı' })
  @ApiResponse({ status: 200, description: 'Şirket bilgisi' })
  async getCompany(
    @Param('id') companyId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.companyService.getCompany(companyId, userId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Şirket bilgilerini güncelle' })
  @ApiResponse({ status: 200, description: 'Şirket güncellendi' })
  async updateCompany(
    @Param('id') companyId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateCompanyDto,
  ) {
    return this.companyService.updateCompany(companyId, userId, dto);
  }

  @Get(':id/members')
  @ApiOperation({ summary: 'Şirket üyelerini listele' })
  @ApiResponse({ status: 200, description: 'Üye listesi' })
  async getMembers(
    @Param('id') companyId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.companyService.getMembers(companyId, userId);
  }

  @Post(':id/invite')
  @ApiOperation({ summary: 'Şirkete üye davet et' })
  @ApiResponse({ status: 200, description: 'Davet gönderildi' })
  async inviteMember(
    @Param('id') companyId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: InviteMemberDto,
  ) {
    return this.companyService.inviteMember(companyId, userId, dto);
  }

  @Delete(':id/members/:memberId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Üyeyi şirketten çıkar' })
  @ApiResponse({ status: 200, description: 'Üye silindi' })
  async removeMember(
    @Param('id') companyId: string,
    @Param('memberId') memberId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.companyService.removeMember(companyId, memberId, userId);
  }

  @Post(':id/switch')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Aktif şirketi değiştir' })
  @ApiResponse({ status: 200, description: 'Şirket değiştirildi' })
  async switchCompany(
    @Param('id') companyId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.companyService.switchCompany(userId, companyId);
  }

  @Post('accept-invite/:token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Daveti kabul et' })
  @ApiResponse({ status: 200, description: 'Davet kabul edildi' })
  async acceptInvite(
    @Param('token') token: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.companyService.acceptInvite(token, userId);
  }
}
