import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import { categoryStorage } from '../common/cloudinary';

@Controller('api/categories')
export class CategoriesController {
    constructor(private readonly categoriesService: CategoriesService) { }

    @UseGuards(JwtAuthGuard)
    @Get('admin/list')
    async list(
        @Query('page') page = '1',
        @Query('limit') limit = '20',
        @Query('q') q = '',
        @Query('status') status = '',
    ) {
        const data = await this.categoriesService.list({ page: Number(page), limit: Number(limit), q, status });
        return { success: true, data };
    }

    @UseGuards(JwtAuthGuard)
    @Get('all')
    async listAll() {
        const data = await this.categoriesService.listAll();
        return { success: true, data };
    }

    @UseGuards(JwtAuthGuard)
    @Get(':id')
    async get(@Param('id') id: string) {
        const data = await this.categoriesService.get(id);
        return data ? { success: true, data } : { success: false, message: 'Not found' };
    }

    @UseGuards(JwtAuthGuard)
    @UseInterceptors(FileInterceptor('image', { storage: categoryStorage }))
    @Post()
    async create(@UploadedFile() file: any, @Body() body: CreateCategoryDto) {
        const image = file?.path || body.image || '';
        const data = await this.categoriesService.create({ ...body, image });
        return { success: true, data };
    }

    @UseGuards(JwtAuthGuard)
    @UseInterceptors(FileInterceptor('image', { storage: categoryStorage }))
    @Patch(':id')
    async update(@Param('id') id: string, @UploadedFile() file: any, @Body() body: UpdateCategoryDto) {
        const payload: any = { ...body };
        if (file?.path) {
            payload.image = file.path;
        }
        const data = await this.categoriesService.update(id, payload);
        return data ? { success: true, data } : { success: false, message: 'Not found' };
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id/status')
    async toggleStatus(@Param('id') id: string) {
        const data = await this.categoriesService.toggleStatus(id);
        return data ? { success: true, data } : { success: false, message: 'Not found' };
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    async remove(@Param('id') id: string) {
        const ok = await this.categoriesService.remove(id);
        return ok ? { success: true, message: 'Xóa danh mục thành công' } : { success: false, message: 'Not found' };
    }
}
