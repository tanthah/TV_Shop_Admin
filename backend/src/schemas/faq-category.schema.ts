import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type FAQCategoryDocument = FAQCategory & Document;

@Schema({ timestamps: true })
export class FAQCategory {
    @Prop({ required: true, trim: true })
    name: string;

    @Prop({ required: true, unique: true, lowercase: true, trim: true })
    slug: string;



    @Prop({ default: 0 })
    order: number;

    @Prop({ default: 'bg-gray-800 text-gray-300 border-gray-700' })
    color: string;

    @Prop({ default: true })
    isActive: boolean;
}

export const FAQCategorySchema = SchemaFactory.createForClass(FAQCategory);
