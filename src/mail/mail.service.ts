import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailData } from './interfaces/mail-data.interface';

@Injectable()
export class MailService {
  constructor(
    private mailerService: MailerService,
    private configService: ConfigService,
  ) {}

  async forgotPassword(mailData: MailData<{ hash: string }>) {
    await this.mailerService.sendMail({
      to: mailData.to,
      subject: 'Reset password',
      text: `${this.configService.get('app.frontendDomain')}/password-change/${
        mailData.data.hash
      } ${'Reset password'}`,
      template: 'reset-password',
      context: {
        title: 'Reset password',
        url: `${this.configService.get('app.frontendDomain')}/password-change/${
          mailData.data.hash
        }`,
        actionTitle: 'Reset password',
        app_name: this.configService.get('app.name'),
      },
    });
  }
}
