import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    const port = this.configService.get<number>('SMTP_PORT') || 465;
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST'),
      port,
      secure: port === 465,
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASS'),
      },
    });
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

  async sendVerificationCode(email: string, code: string, _name?: string): Promise<boolean> {
    const appName = this.configService.get<string>('APP_NAME') || 'Klue';

    const content = `
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
        <tr>
          <td style="padding-bottom: 24px;">
            <p style="margin: 0; color: #000; font-size: 20px; line-height: 28px; font-weight: 500;">
              E-posta adresinizi doğrulamak için aşağıdaki kodu kullanın.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding-bottom: 8px;">
            <p style="margin: 0; color: rgba(0,0,0,0.6); font-size: 14px; line-height: 20px;">
              Doğrulama kodunuz:
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding-bottom: 24px;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
              <tr>
                <td style="background: #f5f5f5; padding: 24px; text-align: center;">
                  <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #000;">${code}</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td>
            <p style="margin: 0 0 8px 0; color: #000; font-size: 14px; line-height: 20px;">
              Bu kod 15 dakika içinde geçerliliğini yitirecektir.
            </p>
            <p style="margin: 0; color: rgba(0,0,0,0.6); font-size: 14px; line-height: 20px;">
              Eğer bu işlemi siz yapmadıysanız, bu e-postayı görmezden gelebilirsiniz.
            </p>
          </td>
        </tr>
      </table>
    `;

    const mailOptions = {
      from: `"${appName}" <${this.configService.get<string>('SMTP_USER')}>`,
      to: email,
      subject: `${appName} - E-posta Doğrulama Kodu`,
      html: this.getBaseTemplate(content),
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

  async sendPasswordResetEmail(email: string, resetToken: string, _name?: string): Promise<boolean> {
    const appName = this.configService.get<string>('APP_NAME') || 'Klue';
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

    const content = `
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
        <tr>
          <td style="padding-bottom: 24px;">
            <p style="margin: 0; color: #000; font-size: 20px; line-height: 28px; font-weight: 500;">
              Şifrenizi sıfırlamak için bir talep aldık.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding-bottom: 24px;">
            <p style="margin: 0; color: rgba(0,0,0,0.6); font-size: 14px; line-height: 20px;">
              Şifrenizi sıfırlamak için aşağıdaki butona tıklayın. Bu bağlantı 30 dakika içinde geçerliliğini yitirecektir.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding-bottom: 24px;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
              <tr>
                <td align="center" style="background: #000; padding: 16px;">
                  <a href="${resetUrl}" style="color: #fff; font-size: 16px; line-height: 20px; text-decoration: none; display: block;">
                    Şifremi Sıfırla
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td>
            <p style="margin: 0; color: rgba(0,0,0,0.6); font-size: 14px; line-height: 20px;">
              Eğer bu işlemi siz yapmadıysanız, bu e-postayı görmezden gelebilirsiniz.
            </p>
          </td>
        </tr>
      </table>
    `;

    const mailOptions = {
      from: `"${appName}" <${this.configService.get<string>('SMTP_USER')}>`,
      to: email,
      subject: `${appName} - Şifre Sıfırlama`,
      html: this.getBaseTemplate(content),
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

  async sendCompanyInvite(email: string, companyName: string, inviteToken: string, inviterName?: string): Promise<boolean> {
    const appName = this.configService.get<string>('APP_NAME') || 'Klue';
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const inviteUrl = `${frontendUrl}/invite?token=${inviteToken}`;

    const inviterText = inviterName ? `${inviterName} sizi` : `${companyName} sizi`;

    const content = `
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
        <tr>
          <td style="padding-bottom: 24px;">
            <p style="margin: 0; color: #000; font-size: 20px; line-height: 28px; font-weight: 500;">
              ${inviterText} ${companyName} takımına davet ediyor.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding-bottom: 24px;">
            <p style="margin: 0; color: rgba(0,0,0,0.6); font-size: 14px; line-height: 20px;">
              ${appName}'de ona katılarak işbirliği yapın, e-ticaret sitelerinizi yönetin ve yeni verimlilik zirvelerine erişin.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding-bottom: 24px;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
              <tr>
                <td align="center" style="background: #000; padding: 16px;">
                  <a href="${inviteUrl}" style="color: #fff; font-size: 16px; line-height: 20px; text-decoration: none; display: block;">
                    Daveti Kabul Et
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td>
            <p style="margin: 0; color: rgba(0,0,0,0.6); font-size: 14px; line-height: 20px;">
              Eğer bu daveti beklemiyorsanız, bu e-postayı görmezden gelebilirsiniz.
            </p>
          </td>
        </tr>
      </table>
    `;

    const mailOptions = {
      from: `"${appName}" <${this.configService.get<string>('SMTP_USER')}>`,
      to: email,
      subject: `${companyName} takımına davet edildiniz`,
      html: this.getBaseTemplate(content),
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
