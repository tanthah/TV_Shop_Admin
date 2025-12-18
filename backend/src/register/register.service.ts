import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import bcrypt from 'bcrypt';
import { User } from '../schemas/user.schema';
import { SendEmailService } from '../common/send-email.service';

type OtpData = { otp: string; expiresAt: number };

@Injectable()
export class RegisterService {
  private otpStore = new Map<string, OtpData>();

  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private emailService: SendEmailService,
  ) {}

  async sendOtp(email: string) {
    const exist = await this.userModel.findOne({ email });
    if (exist) return { success: false, message: 'Email đã tồn tại!' };

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    this.otpStore.set(email, { otp, expiresAt: Date.now() + 10 * 60 * 1000 });

    await this.emailService.sendEmail({
      to: email,
      subject: 'Mã OTP đăng ký tài khoản',
      text: `Mã OTP của bạn là: ${otp}. Mã này có hiệu lực trong 10 phút.`,
      html: `<div style="font-family: Arial, sans-serif; padding: 20px;">
              <h2 style="color:#0d6efd;">Xác thực đăng ký tài khoản</h2>
              <p>Mã OTP của bạn là:</p>
              <h1 style="color:#0d6efd; font-size:36px; letter-spacing:8px;">${otp}</h1>
            </div>`,
    });
    return { success: true };
  }

  verifyOtp(email: string, otp: string) {
    const data = this.otpStore.get(email);
    if (!data) return false;
    if (data.expiresAt < Date.now()) return false;
    return data.otp === otp;
  }

  async completeRegister(payload: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    dateOfBirth?: string;
    gender?: string;
    otp: string;
    avatarUrl?: string;
  }) {
    const { email, password, otp } = payload;
    const data = this.otpStore.get(email);
    if (!data || data.otp !== otp || data.expiresAt < Date.now()) {
      return { success: false, message: 'OTP không hợp lệ hoặc đã hết hạn!' };
    }

    const exist = await this.userModel.findOne({ email });
    if (exist) return { success: false, message: 'Email đã tồn tại!' };

    const hashed = await bcrypt.hash(password, 10);
    const user = await this.userModel.create({
      name: payload.name,
      email,
      password: hashed,
      phone: payload.phone,
      dateOfBirth: payload.dateOfBirth ? new Date(payload.dateOfBirth) : undefined,
      gender: payload.gender,
      avatar: payload.avatarUrl || '',
    });

    this.otpStore.delete(email);
    return { success: true, user };
  }
}
