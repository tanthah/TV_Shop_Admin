import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcrypt';
import { User } from '../schemas/user.schema';
import { SendEmailService } from '../common/send-email.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private jwtService: JwtService,
    private emailService: SendEmailService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.userModel.findOne({ email });
    if (!user) return null;

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return null;

    const token = await this.jwtService.signAsync({ sub: user._id });
    return {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
    };
  }

  async sendForgotPasswordOtp(email: string) {
    const user = await this.userModel.findOne({ email });
    if (!user) return true;

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetPasswordOtp = otp;
    user.resetPasswordOtpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    await this.emailService.sendEmail({
      to: email,
      subject: 'Mã OTP đặt lại mật khẩu',
      text: `Mã OTP của bạn là: ${otp}. Mã này có hiệu lực trong 10 phút.`,
      html: `<div style="font-family: Arial, sans-serif; padding: 20px;">
              <h2>Đặt lại mật khẩu</h2>
              <p>Mã OTP của bạn là:</p>
              <h1 style="color: #4CAF50; font-size: 32px; letter-spacing: 5px;">${otp}</h1>
              <p>Mã này có hiệu lực trong <strong>10 phút</strong>.</p>
            </div>`,
    });
    return true;
  }

  async verifyOtp(email: string, otp: string) {
    const user = await this.userModel.findOne({ email });
    if (!user) return false;
    if (!user.resetPasswordOtp || !user.resetPasswordOtpExpires) return false;
    if (user.resetPasswordOtpExpires < new Date()) return false;
    return user.resetPasswordOtp === otp;
  }

  async resetPassword(email: string, otp: string, newPassword: string) {
    const user = await this.userModel.findOne({ email });
    if (!user) return false;
    if (!user.resetPasswordOtp || !user.resetPasswordOtpExpires) return false;
    if (user.resetPasswordOtpExpires < new Date()) return false;
    if (user.resetPasswordOtp !== otp) return false;

    const hash = await bcrypt.hash(newPassword, 10);
    user.password = hash;
    user.resetPasswordOtp = undefined;
    user.resetPasswordOtpExpires = undefined;
    await user.save();
    return true;
  }
}
