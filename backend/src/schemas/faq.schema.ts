import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type FAQDocument = FAQ & Document;

@Schema({ timestamps: true })
export class FAQ {
    @Prop({ required: true })
    category: string;

    @Prop({ required: true })
    question: string;

    @Prop({ required: true })
    answer: string;

    @Prop({ default: 0 })
    order: number;

    @Prop({ default: true })
    isActive: boolean;
}

export const FAQSchema = SchemaFactory.createForClass(FAQ);

// Chỉ mục kép khớp với backend cũ
FAQSchema.index({ category: 1, order: 1 });
FAQSchema.index({ isActive: 1, order: 1 });
