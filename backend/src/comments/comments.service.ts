import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Comment } from '../schemas/comment.schema';

@Injectable()
export class CommentsService {
  constructor(@InjectModel(Comment.name) private commentModel: Model<Comment>) { }

  async list({ page = 1, limit = 20, q = '', status = '' }: { page?: number; limit?: number; q?: string; status?: string }) {
    const filter: any = {};
    if (q) filter.content = { $regex: q, $options: 'i' };
    if (status) filter.isHidden = status === 'hidden';
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.commentModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      this.commentModel.countDocuments(filter),
    ]);
    return { items, total, page, limit };
  }

  async hide(id: string, value: boolean) {
    const updated = await this.commentModel.findByIdAndUpdate(id, { isHidden: value }, { new: true });
    return updated?.toObject() || null;
  }

  async setRead(id: string, value: boolean) {
    const updated = await this.commentModel.findByIdAndUpdate(id, { isRead: value }, { new: true });
    return updated?.toObject() || null;
  }

  async reply(id: string, content: string) {
    const updated = await this.commentModel.findByIdAndUpdate(id, {
      adminReply: { content, repliedAt: new Date() },
      isRead: true
    }, { new: true });
    return updated?.toObject() || null;
  }

  async getStats() {
    const unread = await this.commentModel.countDocuments({ isRead: false });
    return { unread };
  }

  async remove(id: string) {
    const res = await this.commentModel.findByIdAndDelete(id);
    return !!res;
  }
}
