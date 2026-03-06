import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { DownloadsService } from './downloads.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('downloads')
export class DownloadsController {
  constructor(private readonly downloadsService: DownloadsService) {}

  @Get(':productId/link')
  @Roles(Role.CUSTOMER, Role.REVIEWER, Role.ADMIN, Role.SUPER_ADMIN)
  async getDownloadLink(@Param('productId') productId: string, @CurrentUser() user: any, @Req() req: any) {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    const url = await this.downloadsService.generateSignedUrl(productId, user.sub, ipAddress, userAgent);
    return { url };
  }

  @Get('history')
  @Roles(Role.CUSTOMER, Role.REVIEWER, Role.ADMIN, Role.SUPER_ADMIN)
  async getHistory(@CurrentUser() user: any) {
    return this.downloadsService.getHistory(user.sub);
  }

  @Get('admin/list')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async getAllDownloads() {
    return this.downloadsService.getAllDownloads();
  }
}
