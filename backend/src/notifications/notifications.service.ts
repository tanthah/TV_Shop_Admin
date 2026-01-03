import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Notification } from '../schemas/notification.schema';
import { NotificationsGateway } from './notifications.gateway';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name) private notificationModel: Model<Notification>,
    private notificationsGateway: NotificationsGateway
  ) { }

  async list({ page = 1, limit = 20, status = '' }: { page?: number; limit?: number; status?: string }) {
    const filter: any = {};
    if (status) filter.isRead = status === 'read';
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.notificationModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      this.notificationModel.countDocuments(filter),
    ]);
    return { items, total, page, limit };
  }

  async create(payload: {
    userId: string;
    type: string;
    title: string;
    message: string;
    link?: string;
    referenceId?: string;
    referenceType?: string;
  }) {
    const doc = await this.notificationModel.create({
      userId: new Types.ObjectId(payload.userId),
      type: payload.type,
      title: payload.title,
      message: payload.message,
      link: payload.link || '',
      referenceId: payload.referenceId ? new Types.ObjectId(payload.referenceId) : undefined,
      referenceType: payload.referenceType,
    });

    // Emit real-time event
    this.notificationsGateway.sendNotification(doc.toObject());

    return doc.toObject();
  }

  async setRead(id: string, value: boolean) {
    const updated = await this.notificationModel.findByIdAndUpdate(id, { isRead: value }, { new: true });
    return updated?.toObject() || null;
  }

  async remove(id: string) {
    const res = await this.notificationModel.findByIdAndDelete(id);
    return !!res;
  }
}
