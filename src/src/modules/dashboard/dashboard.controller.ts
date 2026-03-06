import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { StatsService } from './stats.service';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { RolesHierarchy } from '../../common/utils/roles.util';

@ApiTags('Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly statsService: StatsService) {}

  @Get('overview')
  @Roles(...RolesHierarchy.atLeast(Role.ADMIN))
  @ApiOperation({ summary: 'Get main dashboard overview statistics' })
  async getOverview() {
    return this.statsService.getTotals();
  }

  @Get('content-stats')
  @Roles(...RolesHierarchy.atLeast(Role.ADMIN))
  @ApiOperation({ summary: 'Get content generation stats (mocked for now)' })
  async getContentStats() {
    return this.statsService.getContentStats();
  }

  @Get('revenue')
  @Roles(...RolesHierarchy.atLeast(Role.ADMIN))
  @ApiOperation({ summary: 'Get revenue statistics (mocked for now)' })
  async getRevenue() {
    return this.statsService.getRevenueSummary();
  }

  @Get('automation-status')
  @Roles(...RolesHierarchy.atLeast(Role.ADMIN))
  @ApiOperation({ summary: 'Get automation status (mocked for now)' })
  async getAutomationStatus() {
    return this.statsService.getAutomationStatus();
  }

  @Get('reviewer-stats')
  @Roles(...RolesHierarchy.atLeast(Role.ADMIN))
  @ApiOperation({ summary: 'Get reviewer performance stats' })
  async getReviewerStats() {
    return this.statsService.getReviewerStats();
  }
}
