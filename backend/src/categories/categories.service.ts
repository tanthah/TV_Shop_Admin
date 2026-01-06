import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Category } from '../schemas/category.schema';

@Injectable()
export class CategoriesService {
    constructor(@InjectModel(Category.name) private categoryModel: Model<Category>) { }

    async list({ page = 1, limit = 20, q = '', status = '' }: { page?: number; limit?: number; q?: string; status?: string }) {
        const filter: any = {};
        if (q) filter.name = { $regex: q, $options: 'i' };
        if (status) filter.isActive = status === 'active';
        const skip = (page - 1) * limit;
        const [items, total] = await Promise.all([
            this.categoryModel.find(filter).sort({ name: 1 }).skip(skip).limit(limit).lean(),
            this.categoryModel.countDocuments(filter),
        ]);
        return { items, total, page, limit };
    }

    async listAll() {
        return this.categoryModel.find({ isActive: true }).sort({ name: 1 }).lean();
    }

    async get(id: string) {
        return this.categoryModel.findById(id).lean();
    }

    async create(payload: Partial<Category>) {
        const doc = new this.categoryModel(payload);
        await doc.save();
        return doc.toObject();
    }

    async update(id: string, payload: Partial<Category>) {
        const updated = await this.categoryModel.findByIdAndUpdate(id, payload, { new: true, runValidators: true });
        return updated?.toObject() || null;
    }

    async toggleStatus(id: string) {
        const category = await this.categoryModel.findById(id);
        if (!category) return null;
        category.isActive = !category.isActive;
        await category.save();
        return category.toObject();
    }

    async remove(id: string) {
        const res = await this.categoryModel.findByIdAndDelete(id);
        return !!res;
    }
}
