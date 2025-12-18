import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Product } from '../schemas/product.schema';

@Injectable()
export class ProductsService {
  constructor(@InjectModel(Product.name) private productModel: Model<Product>) { }

  async list({ page = 1, limit = 20, q = '', status = '' }: { page?: number; limit?: number; q?: string; status?: string }) {
    const filter: any = {};
    if (q) filter.name = { $regex: q, $options: 'i' };
    if (status) filter.isActive = status === 'active';
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.productModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('categoryId', 'name slug').lean(),
      this.productModel.countDocuments(filter),
    ]);
    return { items, total, page, limit };
  }

  async get(id: string) {
    return this.productModel.findById(id).populate('categoryId', 'name slug').lean();
  }

  async create(payload: any) {
    // Calculate finalPrice
    const price = Number(payload.price) || 0;
    const discount = Number(payload.discount) || 0;
    const finalPrice = price - (price * discount) / 100;

    // Convert categoryId string to ObjectId if provided
    const data: any = { ...payload, finalPrice };
    if (payload.categoryId && typeof payload.categoryId === 'string') {
      data.categoryId = new Types.ObjectId(payload.categoryId);
    }

    const doc = new this.productModel(data);
    await doc.save();
    return doc.toObject();
  }

  async update(id: string, payload: any) {
    // Recalculate finalPrice if price or discount changed
    const existing = await this.productModel.findById(id);
    if (!existing) return null;

    const price = payload.price !== undefined ? Number(payload.price) : existing.price;
    const discount = payload.discount !== undefined ? Number(payload.discount) : existing.discount;
    const finalPrice = price - (price * discount) / 100;

    // Convert categoryId string to ObjectId if provided
    const data: any = { ...payload, finalPrice };
    if (payload.categoryId === '') {
      delete data.categoryId;
    } else if (payload.categoryId && typeof payload.categoryId === 'string') {
      data.categoryId = new Types.ObjectId(payload.categoryId);
    }

    const updated = await this.productModel.findByIdAndUpdate(
      id,
      data,
      { new: true, runValidators: true }
    ).populate('categoryId', 'name slug');

    return updated?.toObject() || null;
  }

  async toggleStatus(id: string) {
    const product = await this.productModel.findById(id);
    if (!product) return null;
    product.isActive = !product.isActive;
    await product.save();
    return product.toObject();
  }

  async addImages(id: string, newImages: string[]) {
    const product = await this.productModel.findById(id);
    if (!product) return null;
    product.images = [...(product.images || []), ...newImages];
    await product.save();
    return product.toObject();
  }

  async removeImage(id: string, imageIndex: number) {
    const product = await this.productModel.findById(id);
    if (!product) return null;
    if (imageIndex >= 0 && imageIndex < product.images.length) {
      product.images.splice(imageIndex, 1);
      await product.save();
    }
    return product.toObject();
  }

  async remove(id: string) {
    const res = await this.productModel.findByIdAndDelete(id);
    return !!res;
  }
}
