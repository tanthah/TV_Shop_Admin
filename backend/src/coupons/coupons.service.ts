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

    // Gửi email khuyến mãi trong nền
    this.sendPromotionEmail(doc).catch(err => console.error('Lỗi khi gửi email khuyến mãi:', err));

    return doc.toObject();
  }

  async sendPromotionEmail(coupon: Coupon) {
    try {
      // Lấy tất cả email từ người dùng chấp nhận khuyến mãi và người đăng ký
      const [users, subscribers] = await Promise.all([
        this.userModel.find({ receivePromotions: true }, { email: 1 }).lean(),
        this.subscriberModel.find({}, { email: 1 }).lean()
      ]);

      const emails = new Set<string>();
      users.forEach(u => u.email && emails.add(u.email));
      subscribers.forEach(s => s.email && emails.add(s.email));

      const emailList = Array.from(emails);
      if (emailList.length === 0) return;

      // Gửi email (sử dụng BCC để gửi hàng loạt)
      // Nếu danh sách quá lớn, chúng ta nên chia nhỏ nó, nhưng hiện tại BCC là ổn cho < 100 người nhận
      // Đối với sản xuất với hàng ngàn người, sử dụng hàng đợi hoặc nhà cung cấp chuyên dụng

      await this.emailService.sendEmail({
        to: process.env.EMAIL_USER || 'admin@ute-shop.com', // Gửi cho chính mình, BCC cho những người khác
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
        // Lưu ý: SendEmailService cần hỗ trợ BCC hoặc chúng ta phải lặp.
        // Kiểm tra lại SendEmailService. Nó nhận `to`.
        // Nếu nó sử dụng nodemailer một cách minh bạch, nodemailer hỗ trợ chuỗi phân tách bằng dấu phẩy trong `to`.
        // Hãy chuyển chuỗi phân tách bằng dấu phẩy sang `to`.
        // Nếu SendEmailService coi `to` chỉ là một người nhận duy nhất?
        // Hãy kiểm tra lại SendEmailService.ts.
        // Nó chuyển `to` trực tiếp cho `transporter.sendMail`.
        // Trường `to` của Nodemailer hỗ trợ "danh sách người nhận phân tách bằng dấu phẩy".
        // TUY NHIÊN, hiển thị email của mọi người trong TO là vi phạm quyền riêng tư.
        // Chúng ta nên sử dụng BCC.
        // Nhưng chữ ký của SendEmailService là:
        // sendEmail({ to, subject, text, html }: { to: string; ... })
        // Nó KHÔNG chấp nhận đối số BCC.

        // Tôi nên cập nhật SendEmailService để chấp nhận BCC hoặc các tùy chọn cụ thể?
        // HOẶC đơn giản là lặp. Lặp an toàn hơn cho việc triển khai đơn giản để đảm bảo gửi và quyền riêng tư nếu chúng ta không thể thay đổi Service dễ dàng.
        // Nhưng nếu tôi có thể thay đổi Service, điều đó tốt hơn.
        // Tôi sẽ thay đổi SendEmailService để chấp nhận `bcc`.
      });

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
