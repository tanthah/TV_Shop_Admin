import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop()
  phone?: string;

  @Prop({ default: '' })
  avatar?: string;

  @Prop()
  dateOfBirth?: Date;

  @Prop({ enum: ['male', 'female', 'other'], default: 'other' })
  gender?: string;

  @Prop({ enum: ['admin', 'user'], default: 'user' })
  role: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: true })
  receivePromotions: boolean;

  @Prop()
  resetPasswordOtp?: string;

  @Prop()
  resetPasswordOtpExpires?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
