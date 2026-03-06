import { registerAs } from '@nestjs/config';

export const storageConfig = registerAs('storage', () => ({
  bucketName: process.env.S3_BUCKET_NAME,
  region: process.env.S3_REGION || 'us-east-1',
  accessKeyId: process.env.S3_ACCESS_KEY_ID,
  secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
}));
