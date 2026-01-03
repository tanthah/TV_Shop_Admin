import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) { }

  async list({ page = 1, limit = 20, q = '', role = '', status = '' }: { page?: number; limit?: number; q?: string; role?: string; status?: string }) {
    const filter: any = {};
    if (q) filter.name = { $regex: q, $options: 'i' };
    if (role) filter.role = role;
    if (status) filter.isActive = status === 'active';
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.userModel.find(filter).select('-password').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      this.userModel.countDocuments(filter),
    ]);
    return { items, total, page, limit };
  }

  async get(id: string) {
    return this.userModel.findById(id).select('-password').lean();
  }

  async update(id: string, payload: Partial<User>) {
    const updated = await this.userModel.findByIdAndUpdate(id, payload, { new: true }).select('-password');
    return updated?.toObject() || null;
  }

  async delete(id: string) {
    const deleted = await this.userModel.findByIdAndDelete(id);
    return deleted?.toObject() || null;
  }

  async updateAvatar(id: string, avatarUrl: string) {
    const updated = await this.userModel.findByIdAndUpdate(id, { avatar: avatarUrl }, { new: true }).select('-password');
    return updated?.toObject() || null;
  }
}
