import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Coupon } from '../schemas/coupon.schema';

@Injectable()
export class CouponsService {
  constructor(@InjectModel(Coupon.name) private couponModel: Model<Coupon>) {}

  async list({ page = 1, limit = 20, q = '', status = '' }: { page?: number; limit?: number; q?: string; status?: string }) {
    const filter: any = {};
    if (q) filter.code = { $regex: q, $options: 'i' };
    if (status) filter.isActive = status === 'active';
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.couponModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      this.couponModel.countDocuments(filter),
    ]);
    return { items, total, page, limit };
  }

  async create(payload: Partial<Coupon>) {
    const doc = new this.couponModel(payload);
    await doc.save();
    return doc.toObject();
  }

  async update(id: string, payload: Partial<Coupon>) {
    const updated = await this.couponModel.findByIdAndUpdate(id, payload, { new: true });
    return updated?.toObject() || null;
  }

  async setActive(id: string, value: boolean) {
    const updated = await this.couponModel.findByIdAndUpdate(id, { isActive: value }, { new: true });
    return updated?.toObject() || null;
  }

  async remove(id: string) {
    const res = await this.couponModel.findByIdAndDelete(id);
    return !!res;
  }
}
