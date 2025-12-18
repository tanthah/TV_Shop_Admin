import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async list(@Query('status') status?: string) {
    const data = await this.ordersService.list(status);
    return { success: true, data };
  }

  @UseGuards(JwtAuthGuard)
  @Get('metrics')
  async metrics() {
    const data = await this.ordersService.metrics();
    return { success: true, data };
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async get(@Param('id') id: string) {
    const data = await this.ordersService.get(id);
    return data ? { success: true, data } : { success: false, message: 'Not found' };
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/status')
  async updateStatus(@Param('id') id: string, @Body() body: { status: string; note?: string }) {
    const data = await this.ordersService.updateStatus(id, body.status, body.note, 'admin');
    return data ? { success: true, data } : { success: false, message: 'Not found' };
  }
}
