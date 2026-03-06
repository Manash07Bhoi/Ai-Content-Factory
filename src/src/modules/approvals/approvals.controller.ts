import { Controller, Get, Post, Param, Query, Body, Patch } from '@nestjs/common';
import { ApprovalsService } from './approvals.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { IsString, IsNotEmpty, IsOptional, IsNumber, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class PaginationDto {
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  @Min(1)
  limit?: number = 20;
}

export class RejectDto {
  @IsString()
  @IsNotEmpty()
  reason: string;
}

@Controller('approvals')
export class ApprovalsController {
  constructor(private readonly approvalsService: ApprovalsService) {}

  @Get('pending')
  @Roles(Role.ADMIN, Role.REVIEWER, Role.SUPER_ADMIN)
  async getPending(@Query() pagination: PaginationDto) {
    return this.approvalsService.getPendingApprovals(pagination.page, pagination.limit);
  }

  @Post(':id/approve')
  @Roles(Role.ADMIN, Role.REVIEWER, Role.SUPER_ADMIN)
  async approve(@Param('id') id: string) {
    return this.approvalsService.approve(id);
  }

  @Post(':id/reject')
  @Roles(Role.ADMIN, Role.REVIEWER, Role.SUPER_ADMIN)
  async reject(@Param('id') id: string, @Body() body: RejectDto) {
    return this.approvalsService.reject(id, body.reason);
  }
}
