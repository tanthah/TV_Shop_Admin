import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateNotificationDto } from './dto/create-notification.dto';

@Controller('api/notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) { }

  @UseGuards(JwtAuthGuard)
  @Get('admin/list')
  async list(@Query('page') page = '1', @Query('limit') limit = '20', @Query('status') status = '') {
    const data = await this.notificationsService.list({ page: Number(page), limit: Number(limit), status });
    return { success: true, data };
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() body: CreateNotificationDto) {
    const data = await this.notificationsService.create(body as any);
    return { success: true, data };
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/read')
  async setRead(@Param('id') id: string, @Query('value') value = 'true') {
    const data = await this.notificationsService.setRead(id, value === 'true');
    return data ? { success: true, data } : { success: false, message: 'Not found' };
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    const ok = await this.notificationsService.remove(id);
    return ok ? { success: true } : { success: false, message: 'Not found' };
  }
}
