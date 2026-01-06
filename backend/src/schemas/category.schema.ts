import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Category extends Document {
    @Prop({ required: true })
    name: string;

    @Prop({ required: true, unique: true })
    slug: string;

    @Prop()
    description?: string;

    @Prop()
    image?: string;

    @Prop({ default: true })
    isActive: boolean;
}

export const CategorySchema = SchemaFactory.createForClass(Category);
