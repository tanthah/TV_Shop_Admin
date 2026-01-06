import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

class OrderItem {
  productId: Types.ObjectId;
  quantity: number;
  price: number;
}

@Schema()
class StatusHistoryEntry {
  @Prop()
  status: string;

  @Prop({ default: Date.now })
  timestamp: Date;

  @Prop()
  note?: string;

  @Prop()
  updatedBy?: string;
}

@Schema({ timestamps: true })
export class Order extends Document {
  @Prop({ unique: true })
  orderCode: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: [{ productId: { type: Types.ObjectId, ref: 'Product' }, quantity: Number, price: Number }] })
  items: OrderItem[];

  @Prop()
  totalPrice: number;

  @Prop()
  shippingFee?: number;

  @Prop({ default: 0 })
  discount?: number;

  @Prop({
    enum: ['new', 'confirmed', 'preparing', 'shipping', 'completed', 'cancelled', 'cancel_requested'],
    default: 'new',
  })
  status: string;

  @Prop({ type: [StatusHistoryEntry], default: [] })
  statusHistory: StatusHistoryEntry[];

  @Prop({ enum: ['unpaid', 'paid', 'refunded'], default: 'unpaid' })
  paymentStatus: string;

  @Prop()
  paymentMethod?: string;

  @Prop({ type: Types.ObjectId, ref: 'Address' })
  addressId?: Types.ObjectId;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
