import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Coupon } from '../schemas/coupon.schema';
import { User } from '../schemas/user.schema';
import { Subscriber } from '../schemas/subscriber.schema';
import { SendEmailService } from '../common/send-email.service';

@Injectable()
export class CouponsService {
  constructor(
    @InjectModel(Coupon.name) private couponModel: Model<Coupon>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Subscriber.name) private subscriberModel: Model<Subscriber>,
    private emailService: SendEmailService
  ) { }

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

    // Send promotion emails in background
    this.sendPromotionEmail(doc).catch(err => console.error('Error sending promotion emails:', err));

    return doc.toObject();
  }

  async sendPromotionEmail(coupon: Coupon) {
    try {
      // Fetch all emails
      const [users, subscribers] = await Promise.all([
        this.userModel.find({}, { email: 1 }).lean(),
        this.subscriberModel.find({}, { email: 1 }).lean()
      ]);

      const emails = new Set<string>();
      users.forEach(u => u.email && emails.add(u.email));
      subscribers.forEach(s => s.email && emails.add(s.email));

      const emailList = Array.from(emails);
      if (emailList.length === 0) return;

      // Send email (using BCC for mass mail)
      // If the list is huge, we should chunk it, but for now BCC is fine for < 100 recips
      // For production with thousands, use a queue or specialized provider loop

      await this.emailService.sendEmail({
        to: process.env.EMAIL_USER || 'admin@ute-shop.com', // Send to self, BCC everyone else
        bcc: emailList,
        subject: `🎉 Khuyến mãi mới: ${coupon.code} - Giảm ${coupon.type === 'percentage' ? coupon.value + '%' : coupon.value.toLocaleString() + 'đ'}`,
        html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <h1 style="color: #4f46e5;">Ưu đãi mới từ TV Shop!</h1>
                        <p style="color: #666; font-size: 16px;">Chúng tôi vừa tung ra mã khuyến mãi mới dành riêng cho bạn:</p>
                    </div>
                    
                    <div style="background-color: #f3f4f6; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
                        <span style="display: block; font-size: 14px; color: #666; margin-bottom: 5px;">Mã giảm giá:</span>
                        <strong style="font-size: 32px; color: #4f46e5; letter-spacing: 2px;">${coupon.code}</strong>
                        <div style="margin-top: 10px; font-size: 18px; color: #333;">
                            Giảm ${coupon.type === 'percentage' ? coupon.value + '%' : coupon.value.toLocaleString() + 'đ'}
                        </div>
                        <div style="margin-top: 5px; font-size: 14px; color: #888;">
                            Đơn tối thiểu: ${coupon.minOrderValue ? coupon.minOrderValue.toLocaleString() + 'đ' : '0đ'}
                        </div>
                         <div style="margin-top: 5px; font-size: 14px; color: #888;">
                            Hạn sử dụng: ${new Date(coupon.expiryDate).toLocaleDateString()}
                        </div>
                    </div>

                    <div style="text-align: center;">
                        <a href="http://localhost:5173" style="display: inline-block; padding: 12px 24px; background-color: #4f46e5; color: white; text-decoration: none; border-radius: 50px; font-weight: bold;">Mua sắm ngay</a>
                    </div>
                </div>
            `
        // Note: SendEmailService needs to support BCC or we loop.
        // Check SendEmailService again. It takes `to`.
        // If it uses nodemailer transparently, nodemailer supports comma separated string in `to`.
        // Let's pass comma separated string to `to`.
      });

      // If SendEmailService treats `to` as single recipient only?
      // Let's check SendEmailService.ts again.
      // It passes `to` directly to `transporter.sendMail`.
      // Nodemailer `to` field supports "comma separated list of recipients".
      // HOWEVER, showing everyone's email in TO is bad privacy.
      // We should use BCC.
      // But SendEmailService signature is:
      // sendEmail({ to, subject, text, html }: { to: string; ... })
      // It does NOT accept BCC argument.

      // I should update SendEmailService to accept BCC or specific options?
      // OR simply loop. Looping is safer for simple implementation to ensure delivery and privacy if we can't change Service easily.
      // But if I can change Service, that's better.
      // I will change SendEmailService to accept `bcc`.

    } catch (error) {
      console.error('Failed to send promotion emails:', error);
    }
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
