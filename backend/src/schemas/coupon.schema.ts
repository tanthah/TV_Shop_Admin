import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Coupon extends Document {
  @Prop({ required: true, unique: true, uppercase: true })
  code: string;

  @Prop({ required: true, enum: ['fixed', 'percentage'] })
  type: string;

  @Prop({ required: true })
  value: number;

  @Prop({ default: 0 })
  minOrderValue: number;

  @Prop()
  maxDiscount?: number;

  @Prop()
  maxUses?: number;

  @Prop({ default: 0 })
  usedCount: number;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  userId?: Types.ObjectId;

  @Prop({ default: Date.now })
  startDate: Date;

  @Prop({ required: true })
  expiryDate: Date;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ enum: ['review', 'admin', 'promotion'], default: 'admin' })
  source: string;

  @Prop({ type: Types.ObjectId })
  sourceId?: Types.ObjectId;

  @Prop()
  description?: string;
}

export const CouponSchema = SchemaFactory.createForClass(Coupon);
