import { Injectable, PipeTransform, ArgumentMetadata, BadRequestException } from '@nestjs/common';

export interface FileValidationOptions {
  maxSizeMB?: number;
  allowedMimeTypes?: string[];
}

@Injectable()
export class FileValidationPipe implements PipeTransform {
  constructor(private readonly options: FileValidationOptions = {}) {}

  transform(value: any, metadata: ArgumentMetadata) {
    if (!value) {
      throw new BadRequestException('File is required');
    }

    const { maxSizeMB = 5, allowedMimeTypes = ['image/jpeg', 'image/png', 'application/pdf', 'application/zip'] } = this.options;
    const file = value as Express.Multer.File;

    const maxBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxBytes) {
      throw new BadRequestException(`File size exceeds limit of ${maxSizeMB}MB`);
    }

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(`File type ${file.mimetype} is not supported. Allowed types: ${allowedMimeTypes.join(', ')}`);
    }

    return value;
  }
}
