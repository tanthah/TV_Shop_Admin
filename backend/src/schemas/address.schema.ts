import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Address extends Document {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    userId: Types.ObjectId;

    @Prop()
    fullName: string;

    @Prop()
    phone: string;

    @Prop()
    addressLine: string;

    @Prop()
    ward: string;

    @Prop()
    district: string;

    @Prop()
    city: string;

    @Prop({ default: false })
    isDefault: boolean;
}

export const AddressSchema = SchemaFactory.createForClass(Address);
