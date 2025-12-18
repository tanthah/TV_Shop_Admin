import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const avatarStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'UTE_Shop/avatars',
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
    transformation: [{ width: 500, height: 500, crop: 'limit' }],
    public_id: (_req: any, _file: any) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      return `avatar-${uniqueSuffix}`;
    },
  },
});

export const productStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'UTE_Shop/products',
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
    transformation: [{ width: 1200, height: 1200, crop: 'limit' }],
    public_id: (_req: any, _file: any) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      return `product-${uniqueSuffix}`;
    },
  },
});

export const categoryStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'UTE_Shop/categories',
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
    transformation: [{ width: 800, height: 800, crop: 'limit' }],
    public_id: (_req: any, _file: any) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      return `category-${uniqueSuffix}`;
    },
  },
});

// Helper to delete image from Cloudinary
export const deleteFromCloudinary = async (publicId: string) => {
  try {
    if (!publicId) return;
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    throw error;
  }
};

// Extract public_id from Cloudinary URL
export const extractPublicId = (url: string) => {
  if (!url) return null;
  const matches = url.match(/\/v\d+\/(.+)\./);
  return matches ? matches[1] : null;
};

