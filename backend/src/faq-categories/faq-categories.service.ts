import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { FAQCategory, FAQCategoryDocument } from '../schemas/faq-category.schema';
import { CreateFAQCategoryDto, UpdateFAQCategoryDto } from './dto/faq-category.dto';

@Injectable()
export class FaqCategoriesService {
    constructor(@InjectModel(FAQCategory.name) private faqCategoryModel: Model<FAQCategoryDocument>) { }

    async list() {
        const categories = await this.faqCategoryModel.find({ isActive: true }).sort({ order: 1 }).exec();
        return { categories };
    }

    async create(createDto: CreateFAQCategoryDto) {
        const newCategory = new this.faqCategoryModel(createDto);
        return newCategory.save();
    }

    async update(id: string, updateDto: UpdateFAQCategoryDto) {
        return this.faqCategoryModel.findByIdAndUpdate(id, updateDto, { new: true });
    }

    async remove(id: string) {
        return this.faqCategoryModel.findByIdAndDelete(id);
    }
}
