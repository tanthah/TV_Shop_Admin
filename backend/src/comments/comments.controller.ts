import { Controller, Delete, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async list(@Query('page') page = '1', @Query('limit') limit = '20', @Query('q') q = '', @Query('status') status = '') {
    const data = await this.commentsService.list({ page: Number(page), limit: Number(limit), q, status });
    return { success: true, data };
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/hide')
  async hide(@Param('id') id: string, @Query('value') value = 'true') {
    const data = await this.commentsService.hide(id, value === 'true');
    return data ? { success: true, data } : { success: false, message: 'Not found' };
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    const ok = await this.commentsService.remove(id);
    return ok ? { success: true } : { success: false, message: 'Not found' };
  }
}
