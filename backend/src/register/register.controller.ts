import { Body, Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { avatarStorage } from '../common/cloudinary';
import { RegisterService } from './register.service';
import { SendRegisterOtpDto } from './dto/send-register-otp.dto';
import { VerifyOtpDto } from '../auth/dto/verify-otp.dto';
import { CompleteRegisterDto } from './dto/complete-register.dto';

@Controller('api/register')
export class RegisterController {
  constructor(private readonly registerService: RegisterService) { }

  @Post('send-register-otp')
  async sendOtp(@Body() body: SendRegisterOtpDto) {
    const result = await this.registerService.sendOtp(body.email);
    if (!result.success) return result;
    return {
      success: true,
      message: 'OTP đã được gửi',
    };
  }

  @Post('verify-register-otp')
  async verify(@Body() body: VerifyOtpDto) {
    const ok = this.registerService.verifyOtp(body.email, body.otp);
    if (!ok) {
      return {
        success: false,
        message: 'OTP không hợp lệ hoặc đã hết hạn!',
      };
    }
    return {
      success: true,
      message: 'OTP hợp lệ',
      verified: true,
    };
  }

  @Post('complete-register')
  @UseInterceptors(FileInterceptor('avatar', { storage: avatarStorage }))
  async complete(@UploadedFile() file: any, @Body() body: CompleteRegisterDto) {
    const avatarUrl = file?.path || '';
    const result = await this.registerService.completeRegister({
      ...body,
      avatarUrl,
    });
    if (!result.success || !result.user) return result;
    return {
      success: true,
      message: 'Đăng ký thành công!',
      user: {
        id: result.user._id,
        name: result.user.name,
        email: result.user.email,
        role: result.user.role,
        avatar: result.user.avatar,
      },
    };
  }
}
