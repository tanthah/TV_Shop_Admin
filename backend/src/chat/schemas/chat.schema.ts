
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ChatDocument = Chat & Document;

@Schema({ timestamps: true })
export class Chat {
    @Prop({ required: true })
    userId: string; // ID của khách hàng

    @Prop({ required: true })
    message: string;

    @Prop({ required: true, enum: ['user', 'admin', 'bot'] })
    from: string;

    @Prop()
    name?: string; // Tùy chọn: Lưu tên người dùng để hiển thị

    @Prop({ default: false })
    read: boolean;
}

export const ChatSchema = SchemaFactory.createForClass(Chat);
