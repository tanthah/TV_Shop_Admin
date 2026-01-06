import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('api/orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) { }

  @UseGuards(JwtAuthGuard)
  @Get('admin/list')
  async list(
    @Query('status') status?: string,
    @Query('userId') userId?: string,
    @Query('paymentMethod') paymentMethod?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('q') q?: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10'
  ) {
    const data = await this.ordersService.list({
      status,
      userId,
      paymentMethod,
      startDate,
      endDate,
      q,
      page: parseInt(page),
      limit: parseInt(limit)
    });
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
    console.log(`[DEBUG] PATCH /api/orders/${id}/status called with body:`, body);
    try {
      const data = await this.ordersService.updateStatus(id, body.status, body.note, 'admin');
      return data ? { success: true, data } : { success: false, message: 'Not found' };
    } catch (error) {
      console.error(`[DEBUG] Error in updateStatus:`, error);
      throw error;
    }
  }
}
