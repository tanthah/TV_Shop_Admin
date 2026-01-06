import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { FAQ, FAQDocument } from '../schemas/faq.schema';
import { CreateFAQDto, UpdateFAQDto } from './dto/faq.dto';

@Injectable()
export class FaqsService {
    constructor(@InjectModel(FAQ.name) private faqModel: Model<FAQDocument>) { }

    async list() {
        // Nhóm theo danh mục để khớp với định dạng phản hồi của backend cũ
        const faqs = await this.faqModel.find({ isActive: true }).sort({ order: 1 }).exec();

        const groupedFAQs = faqs.reduce((acc, faq) => {
            const category = faq.category;
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push(faq);
            return acc;
        }, {} as Record<string, FAQ[]>);

        return { faqs: groupedFAQs, total: faqs.length };
    }

    async adminList(page: number, limit: number) {
        const skip = (page - 1) * limit;
        const [items, total] = await Promise.all([
            this.faqModel.find().sort({ order: 1 }).skip(skip).limit(limit).exec(),
            this.faqModel.countDocuments()
        ]);
        return { items, total, page, limit };
    }

    async create(createFAQDto: CreateFAQDto) {
        const createdFAQ = new this.faqModel(createFAQDto);
        return createdFAQ.save();
    }

    async update(id: string, updateFAQDto: UpdateFAQDto) {
        return this.faqModel.findByIdAndUpdate(id, updateFAQDto, { new: true });
    }

    async remove(id: string) {
        return this.faqModel.findByIdAndDelete(id);
    }
}
