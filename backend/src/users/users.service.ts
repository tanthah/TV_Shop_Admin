import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User } from '../schemas/user.schema';
import { Order } from '../schemas/order.schema';
import { Comment } from '../schemas/comment.schema';
import { Notification } from '../schemas/notification.schema';
import { Subscriber } from '../schemas/subscriber.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Order.name) private orderModel: Model<Order>,
    @InjectModel(Comment.name) private commentModel: Model<Comment>,
    @InjectModel(Notification.name) private notificationModel: Model<Notification>,
    @InjectModel(Subscriber.name) private subscriberModel: Model<Subscriber>,
  ) { }

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
    const user = await this.userModel.findById(id).select('-password').lean();
    if (!user) return null;

    // Tổng hợp thống kê
    const stats = await this.orderModel.aggregate([
      {
        $match: {
          $or: [
            { userId: user._id },
            { userId: user._id.toString() },
            { userId: new Types.ObjectId(user._id) } // Đảm bảo khớp ObjectId nếu userId là chuỗi
          ]
        }
      },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalSpent: {
            $sum: {
              $cond: [{ $eq: ['$status', 'completed'] }, '$totalPrice', 0]
            }
          }
        }
      }
    ]);

    return {
      ...user,
      stats: stats[0] || { totalOrders: 0, totalSpent: 0 }
    };
  }

  async update(id: string, payload: Partial<User>) {
    const updated = await this.userModel.findByIdAndUpdate(id, payload, { new: true }).select('-password');
    return updated?.toObject() || null;
  }

  async delete(id: string) {
    const user = await this.userModel.findById(id);
    if (!user) return null;

    // Xóa liên hoàn
    await Promise.all([
      this.orderModel.deleteMany({ userId: id }),
      this.commentModel.deleteMany({ userId: id }),
      this.notificationModel.deleteMany({ userId: id }),
      this.subscriberModel.deleteMany({ email: user.email }), // Xóa khỏi danh sách đăng ký nếu email khớp
    ]);

    const deleted = await this.userModel.findByIdAndDelete(id);
    return deleted?.toObject() || null;
  }

  async updateAvatar(id: string, avatarUrl: string) {
    const updated = await this.userModel.findByIdAndUpdate(id, { avatar: avatarUrl }, { new: true }).select('-password');
    return updated?.toObject() || null;
  }
}
