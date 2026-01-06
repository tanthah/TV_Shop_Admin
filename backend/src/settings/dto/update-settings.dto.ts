import { IsBoolean, IsNumber, IsObject, IsOptional, IsString, Min } from 'class-validator';

export class UpdateSettingsDto {
  @IsOptional()
  @IsString()
  siteName?: string;

  @IsOptional()
  @IsString()
  contactEmail?: string;

  @IsOptional()
  @IsString()
  supportPhone?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  footerDescription?: string;

  @IsOptional()
  @IsObject()
  socialLinks?: {
    facebook: string;
    instagram: string;
    youtube: string;
    tiktok: string;
  };

  @IsOptional()
  @IsBoolean()
  maintenanceMode?: boolean;

  @IsOptional()
  @IsString()
  homepageMessage?: string;

  @IsOptional()
  @IsBoolean()
  allowGuestCheckout?: boolean;

  @IsOptional()
  @IsBoolean()
  autoConfirm?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  defaultShippingFee?: number;

  @IsOptional()
  @IsBoolean()
  enableEmailNotifications?: boolean;

  @IsOptional()
  @IsBoolean()
  enablePushNotifications?: boolean;
}
