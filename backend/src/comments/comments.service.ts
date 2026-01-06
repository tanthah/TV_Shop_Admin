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
      this.commentModel.find(filter).populate('userId', 'name email').populate('productId', 'name images').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
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
    // Xác định sản phẩm cho câu trả lời
    const original = await this.commentModel.findById(id);
    if (!original) return null;

    const replyComment = new this.commentModel({
      productId: original.productId,
      content: content,
      parentId: id,
      isAdmin: true,
      isRead: true,
      // userId để undefined/null
    });

    // Cũng đánh dấu bản gốc là đã đọc
    await this.commentModel.findByIdAndUpdate(id, { isRead: true });

    return await replyComment.save();
  }

  async getStats() {
    const unread = await this.commentModel.countDocuments({ isRead: false });
    return { unread };
  }

  async getThread(id: string) {
    const current = await this.commentModel.findById(id);
    if (!current) return null;

    // 1. Tìm gốc
    let root = current;
    while (root.parentId) {
      const parent = await this.commentModel.findById(root.parentId);
      if (!parent) break;
      root = parent;
    }

    // 2. Lấy tất cả bình luận cho sản phẩm này (tối ưu hóa: nếu sản phẩm có 10k bình luận, điều này là tồi tệ, nhưng đối với quy mô cửa hàng thì ổn)
    // Lý tưởng nhất là chúng ta sẽ sử dụng $graphLookup nhưng lọc trong bộ nhớ an toàn hơn về hành vi hiện tại
    const all = await this.commentModel
      .find({ productId: root.productId })
      .populate('userId', 'name email avatar')
      .populate('productId', 'name')
      .sort({ createdAt: 1 })
      .lean();

    // 3. Lọc chỉ cho chuỗi này
    const threadIds = new Set([root._id.toString()]);
    let added = true;
    while (added) {
      added = false;
      for (const c of all) {
        if (c.parentId && threadIds.has(c.parentId.toString()) && !threadIds.has(c._id.toString())) {
          threadIds.add(c._id.toString());
          added = true;
        }
      }
    }

    return all.filter(c => threadIds.has(c._id.toString()));
  }

  async remove(id: string) {
    const res = await this.commentModel.findByIdAndDelete(id);
    return !!res;
  }
}
