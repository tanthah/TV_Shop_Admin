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

  async list(status?: string) {
    const filter: any = {};
    if (status) filter.status = status;
    return this.orderModel.find(filter).sort({ createdAt: -1 }).limit(50).lean();
  }

  async get(id: string) {
    return this.orderModel.findById(id).lean();
  }

  async updateStatus(id: string, status: string, note?: string, updatedBy = 'admin') {
    const order = await this.orderModel.findById(id);
    if (!order) return null;
    order.status = status;
    order.statusHistory.push({ status, note, updatedBy, timestamp: new Date() } as any);
    await order.save();

    // Create & Emit notification
    // Assuming we notify the USER who owns the order
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
