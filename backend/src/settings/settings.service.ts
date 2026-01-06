import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Setting } from '../schemas/setting.schema';

@Injectable()
export class SettingsService {
  constructor(@InjectModel(Setting.name) private settingModel: Model<Setting>) { }

  async get() {
    const found = await this.settingModel.findOne({ key: 'global' }).lean();
    if (!found) {
      const created = new this.settingModel({
        key: 'global',
        general: {
          siteName: 'UTE Shop',
          contactEmail: '',
          supportPhone: '',
          address: '',
          footerDescription: '',
          socialLinks: {
            facebook: '',
            instagram: '',
            youtube: '',
            tiktok: '',
          },
          maintenanceMode: false,
          homepageMessage: '',
        },
        order: {
          allowGuestCheckout: false,
          autoConfirm: false,
          defaultShippingFee: 0,
        },
        notification: {
          enableEmailNotifications: true,
          enablePushNotifications: false,
        },
      } as any);
      await created.save();
      return created.toObject();
    }
    return found;
  }

  async update(payload: {
    siteName?: string;
    contactEmail?: string;
    supportPhone?: string;
    maintenanceMode?: boolean;
    homepageMessage?: string;
    allowGuestCheckout?: boolean;
    autoConfirm?: boolean;
    defaultShippingFee?: number;
    enableEmailNotifications?: boolean;
    enablePushNotifications?: boolean;
    address?: string;
    footerDescription?: string;
    socialLinks?: {
      facebook: string;
      instagram: string;
      youtube: string;
      tiktok: string;
    };
  }) {
    const current = await this.get();
    const general = {
      ...current.general,
      ...(payload.siteName !== undefined ? { siteName: payload.siteName } : {}),
      ...(payload.contactEmail !== undefined ? { contactEmail: payload.contactEmail } : {}),
      ...(payload.supportPhone !== undefined ? { supportPhone: payload.supportPhone } : {}),
      ...(payload.address !== undefined ? { address: payload.address } : {}),
      ...(payload.footerDescription !== undefined ? { footerDescription: payload.footerDescription } : {}),
      ...(payload.socialLinks !== undefined ? { socialLinks: payload.socialLinks } : {}),
      ...(payload.maintenanceMode !== undefined ? { maintenanceMode: payload.maintenanceMode } : {}),
      ...(payload.homepageMessage !== undefined ? { homepageMessage: payload.homepageMessage } : {}),
    };
    const order = {
      ...current.order,
      ...(payload.allowGuestCheckout !== undefined ? { allowGuestCheckout: payload.allowGuestCheckout } : {}),
      ...(payload.autoConfirm !== undefined ? { autoConfirm: payload.autoConfirm } : {}),
      ...(payload.defaultShippingFee !== undefined ? { defaultShippingFee: payload.defaultShippingFee } : {}),
    };
    const notification = {
      ...current.notification,
      ...(payload.enableEmailNotifications !== undefined ? { enableEmailNotifications: payload.enableEmailNotifications } : {}),
      ...(payload.enablePushNotifications !== undefined ? { enablePushNotifications: payload.enablePushNotifications } : {}),
    };
    const updated = await this.settingModel.findOneAndUpdate(
      { key: 'global' },
      { general, order, notification },
      { new: true, upsert: true },
    );
    return updated.toObject();
  }
}
