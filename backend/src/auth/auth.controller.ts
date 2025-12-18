import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() body: LoginDto) {
    const result = await this.authService.login(body.email, body.password);
    if (!result) {
      return {
        success: false,
        message: 'Email hoặc mật khẩu không đúng',
      };
    }
    return {
      success: true,
      ...result,
    };
  }

  @Post('forgot-password')
  async forgot(@Body() body: ForgotPasswordDto) {
    await this.authService.sendForgotPasswordOtp(body.email);
    return {
      success: true,
      message: 'Nếu email tồn tại, OTP đã được gửi',
    };
  }

  @Post('verify-otp')
  async verify(@Body() body: VerifyOtpDto) {
    const ok = await this.authService.verifyOtp(body.email, body.otp);
    if (!ok) {
      return {
        success: false,
        message: 'OTP không hợp lệ',
      };
    }
    return {
      success: true,
      message: 'OTP hợp lệ',
      verified: true,
    };
  }

  @Post('reset-password')
  async reset(@Body() body: ResetPasswordDto) {
    const ok = await this.authService.resetPassword(body.email, body.otp, body.newPassword);
    if (!ok) {
      return {
        success: false,
        message: 'Không thể đặt lại mật khẩu',
      };
    }
    return {
      success: true,
      message: 'Đặt lại mật khẩu thành công',
    };
  }
}
