import { Controller, Post, UseInterceptors, UploadedFile, Get, Param, ForbiddenException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { StorageService } from './storage.service';
import { FileValidationPipe } from './pipes/file-validation.pipe';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { Express } from 'express';

@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('upload')
  @Roles(Role.ADMIN, Role.REVIEWER, Role.SUPER_ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile(new FileValidationPipe({ maxSizeMB: 10 }))
    file: Express.Multer.File,
  ) {
    const key = await this.storageService.uploadFile(file.buffer, file.originalname, file.mimetype, 'admin-uploads');
    return { key, message: 'File uploaded successfully' };
  }

  // Example endpoint to get a presigned URL. Real implementation requires checking purchase entitlement.
  @Get('download/:key')
  @Roles(Role.CUSTOMER, Role.ADMIN, Role.REVIEWER, Role.SUPER_ADMIN)
  async getDownloadLink(@Param('key') key: string, @CurrentUser() user: any) {
    // SECURITY: This endpoint must verify the user is allowed to download this file key.
    // For now we just check if it's admin, or throw forbidden.
    if (user.role === Role.CUSTOMER) {
      // In reality: Check OrdersRepository.verifyPurchase(userId, productId)
      throw new ForbiddenException('Not implemented: Purchase verification required for customers.');
    }

    const url = await this.storageService.generateSignedUrl(key);
    return { url };
  }
}
