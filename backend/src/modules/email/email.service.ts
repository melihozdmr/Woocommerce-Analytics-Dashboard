import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST'),
      port: this.configService.get<number>('SMTP_PORT'),
      secure: false,
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASS'),
      },
    });
  }

  async sendVerificationCode(email: string, code: string, name?: string): Promise<boolean> {
    const appName = this.configService.get<string>('APP_NAME') || 'WooCommerce Analytics';

    const mailOptions = {
      from: `"${appName}" <${this.configService.get<string>('SMTP_USER')}>`,
      to: email,
      subject: `${appName} - E-posta Doğrulama Kodu`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333; text-align: center;">E-posta Doğrulama</h2>
          <p style="color: #666; font-size: 16px;">Merhaba${name ? ` ${name}` : ''},</p>
          <p style="color: #666; font-size: 16px;">Hesabınızı doğrulamak için aşağıdaki kodu kullanın:</p>
          <div style="background-color: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #333;">${code}</span>
          </div>
          <p style="color: #666; font-size: 14px;">Bu kod 15 dakika içinde geçerliliğini yitirecektir.</p>
          <p style="color: #666; font-size: 14px;">Eğer bu işlemi siz yapmadıysanız, bu e-postayı görmezden gelebilirsiniz.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #999; font-size: 12px; text-align: center;">${appName}</p>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Verification code sent to ${email}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send verification code to ${email}`, error);
      return false;
    }
  }

  async sendPasswordResetEmail(email: string, resetToken: string, name?: string): Promise<boolean> {
    const appName = this.configService.get<string>('APP_NAME') || 'WooCommerce Analytics';
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

    const mailOptions = {
      from: `"${appName}" <${this.configService.get<string>('SMTP_USER')}>`,
      to: email,
      subject: `${appName} - Şifre Sıfırlama`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333; text-align: center;">Şifre Sıfırlama</h2>
          <p style="color: #666; font-size: 16px;">Merhaba${name ? ` ${name}` : ''},</p>
          <p style="color: #666; font-size: 16px;">Şifrenizi sıfırlamak için aşağıdaki bağlantıya tıklayın:</p>
          <div style="text-align: center; margin: 20px 0;">
            <a href="${resetUrl}" style="background-color: #333; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Şifremi Sıfırla</a>
          </div>
          <p style="color: #666; font-size: 14px;">Bu bağlantı 30 dakika içinde geçerliliğini yitirecektir.</p>
          <p style="color: #666; font-size: 14px;">Eğer bu işlemi siz yapmadıysanız, bu e-postayı görmezden gelebilirsiniz.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #999; font-size: 12px; text-align: center;">${appName}</p>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Password reset email sent to ${email}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send password reset email to ${email}`, error);
      return false;
    }
  }

  async sendCompanyInvite(email: string, companyName: string, inviteToken: string): Promise<boolean> {
    const appName = this.configService.get<string>('APP_NAME') || 'WooCommerce Analytics';
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const inviteUrl = `${frontendUrl}/invite?token=${inviteToken}`;

    const mailOptions = {
      from: `"${appName}" <${this.configService.get<string>('SMTP_USER')}>`,
      to: email,
      subject: `${companyName} sizi ${appName}'e davet etti`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333; text-align: center;">Takım Daveti</h2>
          <p style="color: #666; font-size: 16px;">Merhaba,</p>
          <p style="color: #666; font-size: 16px;"><strong>${companyName}</strong> sizi ${appName} takımına katılmaya davet ediyor.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${inviteUrl}" style="background-color: #333; color: #fff; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Daveti Kabul Et</a>
          </div>
          <p style="color: #666; font-size: 14px;">Daveti kabul etmek için yukarıdaki butona tıklayın ve hesap oluşturun veya mevcut hesabınızla giriş yapın.</p>
          <p style="color: #666; font-size: 14px;">Eğer bu daveti beklemiyorsanız, bu e-postayı görmezden gelebilirsiniz.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #999; font-size: 12px; text-align: center;">${appName}</p>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Company invite sent to ${email} for ${companyName}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send company invite to ${email}`, error);
      return false;
    }
  }
}
