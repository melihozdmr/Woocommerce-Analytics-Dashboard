import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { EmailService } from '../email/email.service';
import { CreateCompanyDto, UpdateCompanyDto, InviteMemberDto } from './dto';
import { randomUUID } from 'crypto';
import { CompanyRole, InviteStatus } from '@prisma/client';

@Injectable()
export class CompanyService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  async createCompany(userId: string, dto: CreateCompanyDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Kullanıcı bulunamadı');
    }

    // Generate unique slug
    let slug = this.generateSlug(dto.name);
    let slugExists = await this.prisma.company.findUnique({ where: { slug } });
    let counter = 1;
    while (slugExists) {
      slug = `${this.generateSlug(dto.name)}-${counter}`;
      slugExists = await this.prisma.company.findUnique({ where: { slug } });
      counter++;
    }

    // Create company and add user as owner
    const company = await this.prisma.company.create({
      data: {
        name: dto.name,
        slug,
        members: {
          create: {
            userId,
            email: user.email,
            role: CompanyRole.OWNER,
            inviteStatus: InviteStatus.ACCEPTED,
            joinedAt: new Date(),
          },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
          },
        },
      },
    });

    // Set as user's current company
    await this.prisma.user.update({
      where: { id: userId },
      data: { currentCompanyId: company.id },
    });

    return company;
  }

  async getCompany(companyId: string, userId: string) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      include: {
        members: {
          where: { inviteStatus: InviteStatus.ACCEPTED },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!company) {
      throw new NotFoundException('Şirket bulunamadı');
    }

    // Check if user is a member
    const isMember = company.members.some((m) => m.userId === userId);
    if (!isMember) {
      throw new ForbiddenException('Bu şirkete erişim yetkiniz yok');
    }

    return company;
  }

  async updateCompany(companyId: string, userId: string, dto: UpdateCompanyDto) {
    // Check if user has permission (owner or admin)
    const membership = await this.prisma.companyMember.findFirst({
      where: {
        companyId,
        userId,
        inviteStatus: InviteStatus.ACCEPTED,
        role: { in: [CompanyRole.OWNER, CompanyRole.ADMIN] },
      },
    });

    if (!membership) {
      throw new ForbiddenException('Şirket bilgilerini güncelleme yetkiniz yok');
    }

    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      throw new NotFoundException('Şirket bulunamadı');
    }

    // If name is being updated, check if new slug would be unique
    let newSlug = company.slug;
    if (dto.name && dto.name !== company.name) {
      newSlug = this.generateSlug(dto.name);
      let slugExists = await this.prisma.company.findFirst({
        where: { slug: newSlug, id: { not: companyId } },
      });
      let counter = 1;
      while (slugExists) {
        newSlug = `${this.generateSlug(dto.name)}-${counter}`;
        slugExists = await this.prisma.company.findFirst({
          where: { slug: newSlug, id: { not: companyId } },
        });
        counter++;
      }
    }

    const updatedCompany = await this.prisma.company.update({
      where: { id: companyId },
      data: {
        ...(dto.name && { name: dto.name, slug: newSlug }),
        ...(dto.logo !== undefined && { logo: dto.logo }),
      },
    });

    return updatedCompany;
  }

  async getUserCompanies(userId: string) {
    const memberships = await this.prisma.companyMember.findMany({
      where: {
        userId,
        inviteStatus: InviteStatus.ACCEPTED,
      },
      include: {
        company: true,
      },
    });

    return memberships.map((m) => ({
      ...m.company,
      role: m.role,
    }));
  }

  async inviteMember(companyId: string, userId: string, dto: InviteMemberDto) {
    // Check if user has permission to invite
    const membership = await this.prisma.companyMember.findFirst({
      where: {
        companyId,
        userId,
        inviteStatus: InviteStatus.ACCEPTED,
        role: { in: [CompanyRole.OWNER, CompanyRole.ADMIN] },
      },
    });

    if (!membership) {
      throw new ForbiddenException('Üye davet etme yetkiniz yok');
    }

    // Check if email is already a member or invited
    const existingMember = await this.prisma.companyMember.findUnique({
      where: {
        companyId_email: {
          companyId,
          email: dto.email,
        },
      },
    });

    if (existingMember) {
      if (existingMember.inviteStatus === InviteStatus.ACCEPTED) {
        throw new ConflictException('Bu e-posta zaten şirkete üye');
      }
      if (existingMember.inviteStatus === InviteStatus.PENDING) {
        throw new ConflictException('Bu e-postaya zaten davet gönderilmiş');
      }
    }

    // Generate invite token
    const inviteToken = randomUUID();

    // Create or update invite
    const invite = await this.prisma.companyMember.upsert({
      where: {
        companyId_email: {
          companyId,
          email: dto.email,
        },
      },
      update: {
        inviteToken,
        inviteStatus: InviteStatus.PENDING,
        role: dto.role as CompanyRole,
        invitedAt: new Date(),
      },
      create: {
        companyId,
        email: dto.email,
        role: dto.role as CompanyRole,
        inviteToken,
        inviteStatus: InviteStatus.PENDING,
      },
      include: {
        company: true,
      },
    });

    // Send invite email
    await this.emailService.sendCompanyInvite(
      dto.email,
      invite.company.name,
      inviteToken,
    );

    return {
      message: 'Davet gönderildi',
      email: dto.email,
    };
  }

  async getMembers(companyId: string, userId: string) {
    // Check if user is a member
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

    const members = await this.prisma.companyMember.findMany({
      where: { companyId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
      orderBy: [
        { role: 'asc' },
        { joinedAt: 'asc' },
      ],
    });

    return members;
  }

  async acceptInvite(token: string, userId: string) {
    const invite = await this.prisma.companyMember.findUnique({
      where: { inviteToken: token },
      include: { company: true },
    });

    if (!invite) {
      throw new NotFoundException('Geçersiz davet linki');
    }

    if (invite.inviteStatus !== InviteStatus.PENDING) {
      throw new BadRequestException('Bu davet artık geçerli değil');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Kullanıcı bulunamadı');
    }

    // Check if invite email matches user email
    if (invite.email.toLowerCase() !== user.email.toLowerCase()) {
      throw new ForbiddenException('Bu davet size ait değil');
    }

    // Accept invite
    await this.prisma.companyMember.update({
      where: { id: invite.id },
      data: {
        userId,
        inviteStatus: InviteStatus.ACCEPTED,
        inviteToken: null,
        joinedAt: new Date(),
      },
    });

    // Set as user's current company if they don't have one
    if (!user.currentCompanyId) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { currentCompanyId: invite.companyId },
      });
    }

    return {
      message: 'Şirkete başarıyla katıldınız',
      company: invite.company,
    };
  }

  async removeMember(companyId: string, memberId: string, userId: string) {
    // Check if user has permission
    const userMembership = await this.prisma.companyMember.findFirst({
      where: {
        companyId,
        userId,
        inviteStatus: InviteStatus.ACCEPTED,
        role: { in: [CompanyRole.OWNER, CompanyRole.ADMIN] },
      },
    });

    if (!userMembership) {
      throw new ForbiddenException('Üye silme yetkiniz yok');
    }

    const memberToRemove = await this.prisma.companyMember.findUnique({
      where: { id: memberId },
    });

    if (!memberToRemove || memberToRemove.companyId !== companyId) {
      throw new NotFoundException('Üye bulunamadı');
    }

    // Cannot remove owner
    if (memberToRemove.role === CompanyRole.OWNER) {
      throw new ForbiddenException('Şirket sahibi silinemez');
    }

    // Admin cannot remove another admin
    if (
      userMembership.role === CompanyRole.ADMIN &&
      memberToRemove.role === CompanyRole.ADMIN
    ) {
      throw new ForbiddenException('Admin başka bir admini silemez');
    }

    await this.prisma.companyMember.delete({
      where: { id: memberId },
    });

    // If removed user's current company is this, clear it
    if (memberToRemove.userId) {
      const removedUser = await this.prisma.user.findUnique({
        where: { id: memberToRemove.userId },
      });
      if (removedUser?.currentCompanyId === companyId) {
        await this.prisma.user.update({
          where: { id: memberToRemove.userId },
          data: { currentCompanyId: null },
        });
      }
    }

    return { message: 'Üye silindi' };
  }

  async switchCompany(userId: string, companyId: string) {
    const membership = await this.prisma.companyMember.findFirst({
      where: {
        userId,
        companyId,
        inviteStatus: InviteStatus.ACCEPTED,
      },
      include: { company: true },
    });

    if (!membership) {
      throw new ForbiddenException('Bu şirkete erişim yetkiniz yok');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { currentCompanyId: companyId },
    });

    return membership.company;
  }
}
