import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Subscriber extends Document {
    @Prop({ required: true, unique: true, lowercase: true, trim: true })
    email: string;

    @Prop({ default: false })
    isRegisteredUser: boolean;
}

export const SubscriberSchema = SchemaFactory.createForClass(Subscriber);
