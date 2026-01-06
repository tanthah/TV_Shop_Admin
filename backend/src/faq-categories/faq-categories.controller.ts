import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { FaqCategoriesService } from './faq-categories.service';
import { CreateFAQCategoryDto, UpdateFAQCategoryDto } from './dto/faq-category.dto';

@Controller('api/faq-categories')
export class FaqCategoriesController {
    constructor(private readonly service: FaqCategoriesService) { }

    @Get()
    async findAll() {
        const result = await this.service.list();
        return { success: true, ...result };
    }

    @Post()
    async create(@Body() dto: CreateFAQCategoryDto) {
        const category = await this.service.create(dto);
        return { success: true, category, message: 'Tạo danh mục thành công' };
    }

    @Put(':id')
    async update(@Param('id') id: string, @Body() dto: UpdateFAQCategoryDto) {
        const category = await this.service.update(id, dto);
        if (!category) return { success: false, message: 'Không tìm thấy danh mục' };
        return { success: true, category, message: 'Cập nhật thành công' };
    }

    @Delete(':id')
    async remove(@Param('id') id: string) {
        const category = await this.service.remove(id);
        if (!category) return { success: false, message: 'Không tìm thấy danh mục' };
        return { success: true, message: 'Xóa danh mục thành công' };
    }
}
