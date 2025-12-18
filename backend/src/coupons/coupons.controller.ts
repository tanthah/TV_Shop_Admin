import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { CouponsService } from './coupons.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';

@Controller('coupons')
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async list(@Query('page') page = '1', @Query('limit') limit = '20', @Query('q') q = '', @Query('status') status = '') {
    const data = await this.couponsService.list({ page: Number(page), limit: Number(limit), q, status });
    return { success: true, data };
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() body: CreateCouponDto) {
    const payload = {
      ...body,
      expiryDate: new Date(body.expiryDate),
    };
    const data = await this.couponsService.create(payload as any);
    return { success: true, data };
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: UpdateCouponDto) {
    const payload = {
      ...body,
      ...(body.expiryDate ? { expiryDate: new Date(body.expiryDate) } : {}),
    };
    const data = await this.couponsService.update(id, payload as any);
    return data ? { success: true, data } : { success: false, message: 'Not found' };
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/active')
  async setActive(@Param('id') id: string, @Query('value') value = 'true') {
    const data = await this.couponsService.setActive(id, value === 'true');
    return data ? { success: true, data } : { success: false, message: 'Not found' };
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    const ok = await this.couponsService.remove(id);
    return ok ? { success: true } : { success: false, message: 'Not found' };
  }
}
