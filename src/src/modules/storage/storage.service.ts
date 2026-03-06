import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';
import * as path from 'path';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private s3Client: S3Client | null = null;
  private isDev: boolean;
  private bucketName: string;

  constructor(private readonly configService: ConfigService) {
    this.isDev = this.configService.get('NODE_ENV') !== 'production';
    this.bucketName = this.configService.get<string>('storage.bucketName') || 'mock-bucket';

    const accessKeyId = this.configService.get<string>('storage.accessKeyId');
    const secretAccessKey = this.configService.get<string>('storage.secretAccessKey');
    const region = this.configService.get<string>('storage.region');

    if (accessKeyId && secretAccessKey) {
      this.s3Client = new S3Client({
        region,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      });
    } else {
      this.logger.warn('AWS S3 credentials not found. Storage service will use mock local fallback.');
    }
  }

  async uploadFile(fileBuffer: Buffer, originalName: string, mimeType: string, folder: string = 'uploads'): Promise<string> {
    const extension = path.extname(originalName);
    const key = `${folder}/${randomUUID()}${extension}`;

    if (this.shouldUseFallback()) {
      return this.mockUpload(key, fileBuffer);
    }

    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: fileBuffer,
        ContentType: mimeType,
      });

      await this.s3Client!.send(command);
      this.logger.log(`Successfully uploaded file to S3: ${key}`);
      return key; // return the S3 key
    } catch (error) {
      this.logger.error(`Failed to upload to S3: ${error.message}`);
      if (this.isDev) {
        return this.mockUpload(key, fileBuffer);
      }
      throw error;
    }
  }

  async generateSignedUrl(key: string, expiresIn: number = 900): Promise<string> {
    if (this.shouldUseFallback()) {
      return `http://localhost:3000/mock-download/${key}`;
    }

    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const url = await getSignedUrl(this.s3Client!, command, { expiresIn });
      return url;
    } catch (error) {
      this.logger.error(`Failed to generate signed URL: ${error.message}`);
      throw error;
    }
  }

  private shouldUseFallback(): boolean {
    return !this.s3Client;
  }

  private mockUpload(key: string, _buffer: Buffer): string {
    this.logger.debug(`Mock upload: saved virtual file ${key}`);
    return key;
  }
}
