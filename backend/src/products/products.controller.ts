import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { productStorage } from '../common/cloudinary';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) { }

  @UseGuards(JwtAuthGuard)
  @Get()
  async list(@Query('page') page = '1', @Query('limit') limit = '20', @Query('q') q = '', @Query('status') status = '') {
    const data = await this.productsService.list({ page: Number(page), limit: Number(limit), q, status });
    return { success: true, data };
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async get(@Param('id') id: string) {
    const data = await this.productsService.get(id);
    return data ? { success: true, data } : { success: false, message: 'Not found' };
  }

  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FilesInterceptor('images', 5, { storage: productStorage }))
  @Post()
  async create(@UploadedFiles() files: any[], @Body() body: CreateProductDto) {
    try {
      const images = (files || []).map((f) => f.path);
      const data = await this.productsService.create({ ...body, images });
      return { success: true, data };
    } catch (err: any) {
      throw new (await import('@nestjs/common')).BadRequestException(err?.message || 'Không thể tạo sản phẩm');
    }
  }

  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FilesInterceptor('images', 5, { storage: productStorage }))
  @Patch(':id')
  async update(@Param('id') id: string, @UploadedFiles() files: any[], @Body() body: UpdateProductDto) {
    try {
      const payload: any = { ...body };
      if (files && files.length > 0) {
        const newImages = files.map((f) => f.path);
        if (body.keepExistingImages === 'true' || body.keepExistingImages === true) {
          const existingProduct = await this.productsService.get(id);
          if (existingProduct) {
            payload.images = [...(existingProduct.images || []), ...newImages];
          } else {
            payload.images = newImages;
          }
        } else {
          payload.images = newImages;
        }
      }
      delete payload.keepExistingImages;
      const data = await this.productsService.update(id, payload);
      return data ? { success: true, data } : { success: false, message: 'Not found' };
    } catch (err: any) {
      throw new (await import('@nestjs/common')).BadRequestException(err?.message || 'Không thể cập nhật sản phẩm');
    }
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/status')
  async toggleStatus(@Param('id') id: string) {
    const data = await this.productsService.toggleStatus(id);
    return data ? { success: true, data } : { success: false, message: 'Not found' };
  }

  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FilesInterceptor('images', 5, { storage: productStorage }))
  @Patch(':id/images')
  async addImages(@Param('id') id: string, @UploadedFiles() files: any[]) {
    const newImages = (files || []).map((f) => f.path);
    const data = await this.productsService.addImages(id, newImages);
    return data ? { success: true, data } : { success: false, message: 'Not found' };
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/images/:imageIndex')
  async removeImage(@Param('id') id: string, @Param('imageIndex') imageIndex: string) {
    const data = await this.productsService.removeImage(id, Number(imageIndex));
    return data ? { success: true, data } : { success: false, message: 'Not found' };
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    const ok = await this.productsService.remove(id);
    return ok ? { success: true } : { success: false, message: 'Not found' };
  }
}
