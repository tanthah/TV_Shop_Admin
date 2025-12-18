import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Product extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  slug: string;

  @Prop()
  description?: string;

  @Prop({ required: true })
  price: number;

  @Prop({ default: 0 })
  discount: number;

  @Prop()
  finalPrice?: number;

  @Prop({ default: 0 })
  stock: number;

  @Prop({ default: 0 })
  sold: number;

  @Prop({ default: 0 })
  views: number;

  @Prop({ default: 0, min: 0, max: 5 })
  rating: number;

  @Prop({ default: 0 })
  numReviews: number;

  @Prop({ type: Object, default: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } })
  ratingBreakdown: Record<string, number>;

  @Prop({ default: 0 })
  wishlistCount: number;

  @Prop({ default: 0 })
  reviewCount: number;

  @Prop({ default: 0 })
  purchaseCount: number;

  @Prop({ type: [String], default: [] })
  images: string[];

  @Prop({ type: Types.ObjectId, ref: 'Category' })
  categoryId?: Types.ObjectId;

  @Prop()
  brand?: string;

  @Prop({ type: Object, default: {} })
  attributes: Record<string, any>;

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  promotionText?: string;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
ProductSchema.pre('save', function (next) {
  const self: any = this;
  self.finalPrice = self.price - (self.price * self.discount) / 100;
  return;
});
