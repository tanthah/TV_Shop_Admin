import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Comment extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  productId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  content: string;

  @Prop({ type: [String], default: [] })
  images: string[];

  @Prop({ default: false })
  isHidden: boolean;

  @Prop({ default: false })
  isRead: boolean;

  @Prop({ type: Object })
  adminReply?: {
    content: string;
    repliedAt: Date;
  };
}

export const CommentSchema = SchemaFactory.createForClass(Comment);
