import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

class GeneralSettings {
  siteName: string;
  contactEmail: string;
  supportPhone: string;
  address: string;
  footerDescription: string;
  socialLinks: {
    facebook: string;
    instagram: string;
    youtube: string;
    tiktok: string;
  };
  maintenanceMode: boolean;
  homepageMessage: string;
}

class OrderSettings {
  allowGuestCheckout: boolean;
  autoConfirm: boolean;
  defaultShippingFee: number;
}

class NotificationSettings {
  enableEmailNotifications: boolean;
  enablePushNotifications: boolean;
}

@Schema({ timestamps: true })
export class Setting extends Document {
  @Prop({ unique: true, default: 'global' })
  key: string;

  @Prop({ type: Object, default: {} })
  general: GeneralSettings;

  @Prop({ type: Object, default: {} })
  order: OrderSettings;

  @Prop({ type: Object, default: {} })
  notification: NotificationSettings;
}

export const SettingSchema = SchemaFactory.createForClass(Setting);
