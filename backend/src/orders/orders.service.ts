import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order } from '../schemas/order.schema';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<Order>,
    private notificationsService: NotificationsService
  ) { }

  async list({ status, userId, paymentMethod, startDate, endDate, q, page = 1, limit = 50 }: { status?: string, userId?: string, paymentMethod?: string, startDate?: string, endDate?: string, q?: string, page?: number, limit?: number }) {
    const filter: any = {};
    if (status) filter.status = status;
    if (userId) filter.userId = userId;
    if (paymentMethod) filter.paymentMethod = paymentMethod;
    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    if (q) {
      filter.$or = [
        { orderCode: { $regex: q, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.orderModel.find(filter)
        .populate('userId', 'name email phone avatar')
        .populate('items.productId', 'name image')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.orderModel.countDocuments(filter)
    ]);

    return { items, total, page, limit };
  }

  async get(id: string) {
    return this.orderModel.findById(id)
      .populate('userId', 'name email phone avatar')
      .populate('items.productId', 'name image')
      .populate('addressId')
      .lean();
  }

  async updateStatus(id: string, status: string, note?: string, updatedBy = 'admin') {
    const order = await this.orderModel.findById(id);
    if (!order) return null;
    order.status = status;
    order.statusHistory.push({ status, note, updatedBy, timestamp: new Date() } as any);
    await order.save();

    // Tạo và phát thông báo
    // Giả sử chúng ta thông báo cho USER sở hữu đơn hàng
    await this.notificationsService.create({
      userId: order.userId.toString(),
      type: 'order_update',
      title: `Đơn hàng #${order.orderCode || id.slice(-6)} đã cập nhật`,
      message: `Trạng thái mới: ${status}`,
      referenceId: id,
      referenceType: 'order'
    });

    return order.toObject();
  }

  async metrics() {
    const totalOrders = await this.orderModel.countDocuments({});
    const statusCounts = await this.orderModel.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    const completedRevenueAgg = await this.orderModel.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, revenue: { $sum: '$totalPrice' } } },
    ]);
    const revenue = completedRevenueAgg[0]?.revenue || 0;
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const newToday = await this.orderModel.countDocuments({ createdAt: { $gte: startOfDay } });
    return {
      totalOrders,
      newToday,
      revenue,
      statusCounts: statusCounts.map((s) => ({ status: s._id, count: s.count })),
    };
  }
}
