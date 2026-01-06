import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { FaqsService } from './faqs.service';
import { CreateFAQDto, UpdateFAQDto } from './dto/faq.dto';

@Controller('api/faqs')
export class FaqsController {
    constructor(private readonly faqsService: FaqsService) { }

    @Get('admin/list')
    async listAdmin(@Query('page') page = '1', @Query('limit') limit = '10') {
        const data = await this.faqsService.adminList(Number(page), Number(limit));
        return { success: true, data };
    }

    @Get()
    async findAll() {
        const result = await this.faqsService.list();
        return { success: true, ...result };
    }

    @Post()
    async create(@Body() createFAQDto: CreateFAQDto) {
        const faq = await this.faqsService.create(createFAQDto);
        return { success: true, faq, message: 'Tạo câu hỏi thành công' };
    }

    @Put(':id')
    async update(@Param('id') id: string, @Body() updateFAQDto: UpdateFAQDto) {
        const faq = await this.faqsService.update(id, updateFAQDto);
        if (!faq) {
            return { success: false, message: 'Không tìm thấy câu hỏi' };
        }
        return { success: true, faq, message: 'Cập nhật thành công' };
    }

    @Delete(':id')
    async remove(@Param('id') id: string) {
        const faq = await this.faqsService.remove(id);
        if (!faq) {
            return { success: false, message: 'Không tìm thấy câu hỏi' };
        }
        return { success: true, message: 'Xóa câu hỏi thành công' };
    }
}
