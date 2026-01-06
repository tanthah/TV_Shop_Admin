import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { productStorage } from '../common/cloudinary';

@Controller('api/products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) { }

  @UseGuards(JwtAuthGuard)
  @Get('admin/list')
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
  @UseInterceptors(FilesInterceptor('images', 20, { storage: productStorage }))
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
  @UseInterceptors(FilesInterceptor('images', 20, { storage: productStorage }))
  @Patch(':id')
  async update(@Param('id') id: string, @UploadedFiles() files: any[], @Body() body: UpdateProductDto) {
    try {
      const payload: any = { ...body };

      // Xử lý logic hình ảnh
      const newImages = (files || []).map((f) => f.path);
      let finalImages: string[] = [];

      if (body.keepExistingImages === 'true' || body.keepExistingImages === true) {
        // Nếu giữ lại hiện có, chúng tôi dựa vào danh sách được gửi từ frontend (phản ánh các mục đã xóa)
        // ValidationPipe đảm bảo existingImageUrls hợp lệ nếu có
        let current: string[] = [];
        if (body.existingImageUrls) {
          current = Array.isArray(body.existingImageUrls) ? body.existingImageUrls : [body.existingImageUrls as unknown as string];
        }
        finalImages = [...current, ...newImages];
      } else {
        // Nếu không giữ lại hiện có, chúng tôi thay thế mọi thứ bằng hình ảnh mới
        finalImages = newImages;
      }

      // Chỉ cập nhật hình ảnh nếu có sự thay đổi hoặc hành động rõ ràng
      // Nếu không có tệp mới và keepExistingImages là false, có nghĩa là xóa tất cả hình ảnh?
      // Hoặc nếu keepExistingImages là true nhưng danh sách được xử lý khác nhau?
      // Đơn giản nhất: Luôn cập nhật 'images' nếu phát hiện tệp HOẶC cờ keepExistingImages có mặt
      if ((files && files.length > 0) || body.keepExistingImages || body.existingImageUrls) {
        payload.images = finalImages;
      }

      // Dọn dẹp các trường phụ trợ
      delete payload.keepExistingImages;
      delete payload.existingImageUrls;

      const data = await this.productsService.update(id, payload);
      return data ? { success: true, data } : { success: false, message: 'Not found' };
    } catch (err: any) {
      console.error('Update Product Error:', err); // Log for debugging
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
  @UseInterceptors(FilesInterceptor('images', 20, { storage: productStorage }))
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
