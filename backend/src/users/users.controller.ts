import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { avatarStorage } from '../common/cloudinary';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async list(@Query('page') page = '1', @Query('limit') limit = '20', @Query('q') q = '', @Query('role') role = '', @Query('status') status = '') {
    const data = await this.usersService.list({ page: Number(page), limit: Number(limit), q, role, status });
    return { success: true, data };
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async get(@Param('id') id: string) {
    const data = await this.usersService.get(id);
    return data ? { success: true, data } : { success: false, message: 'Not found' };
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: UpdateUserDto) {
    const data = await this.usersService.update(id, body as any);
    return data ? { success: true, data } : { success: false, message: 'Not found' };
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async deactivate(@Param('id') id: string) {
    const data = await this.usersService.deactivate(id);
    return data ? { success: true, data } : { success: false, message: 'Not found' };
  }

  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('avatar', { storage: avatarStorage }))
  @Post(':id/avatar')
  async updateAvatar(@Param('id') id: string, @UploadedFile() file: any) {
    const avatarUrl = file?.path || '';
    const data = await this.usersService.updateAvatar(id, avatarUrl);
    return data ? { success: true, data } : { success: false, message: 'Not found' };
  }
}
