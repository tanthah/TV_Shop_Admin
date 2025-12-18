import { Injectable } from '@nestjs/common';
import nodemailer from 'nodemailer';

@Injectable()
export class SendEmailService {
  async sendEmail({
    to,
    subject,
    text,
    html,
  }: {
    to: string;
    subject: string;
    text?: string;
    html?: string;
  }) {
    try {
      const transporter = nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE || 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD,
        },
      });

      const info = await transporter.sendMail({
        from: `"${process.env.EMAIL_FROM_NAME || 'UTE Shop'}" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        text,
        html,
      });

      return { success: true, messageId: info.messageId };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}
