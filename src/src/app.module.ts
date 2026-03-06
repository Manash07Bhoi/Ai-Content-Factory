import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bullmq';
import { BullBoardModule } from '@bull-board/nestjs';
import { ExpressAdapter } from '@bull-board/express';
import { postgresConfig, mongoConfig } from './config/database.config';
import { jwtConfig } from './config/jwt.config';
import { bullConfig } from './config/bull.config';
import { storageConfig } from './config/storage.config';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { AiGeneratorModule } from './modules/ai-generator/ai-generator.module';
import { PromptsModule } from './modules/prompts/prompts.module';
import { CategorisationModule } from './modules/categorisation/categorisation.module';
import { ApprovalsModule } from './modules/approvals/approvals.module';
import { StorageModule } from './modules/storage/storage.module';
import { ProductsModule } from './modules/products/products.module';
import { ProductBuilderModule } from './modules/product-builder/product-builder.module';
import { OrdersModule } from './modules/orders/orders.module';
import { DownloadsModule } from './modules/downloads/downloads.module';
import { AutomationModule } from './modules/automation/automation.module';
import { SearchModule } from './modules/search/search.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { MarketingModule } from './modules/coupons/marketing.module';
import { ExternalCommsModule } from './modules/affiliates/external-comms.module';
import { AuditModule } from './modules/audit/audit.module';
import { WishlistsModule } from './modules/wishlists/wishlists.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { MiddlewareConsumer, NestModule } from '@nestjs/common';
import { BullBoardAuthMiddleware } from './common/middlewares/bull-board-auth.middleware';
import { JwtModule } from '@nestjs/jwt';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [postgresConfig, mongoConfig, jwtConfig, bullConfig, storageConfig],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        configService.get<TypeOrmModuleOptions>('postgres')!,
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<{ uri: string }>('mongodb')?.uri,
      }),
    }),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: configService.get('bull').redis,
      }),
    }),
    BullBoardModule.forRoot({
      route: '/admin/queues',
      adapter: ExpressAdapter,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    UsersModule,
    AuthModule,
    AiGeneratorModule,
    PromptsModule,
    CategorisationModule,
    ApprovalsModule,
    StorageModule,
    ProductsModule,
    ProductBuilderModule,
    OrdersModule,
    DownloadsModule,
    AutomationModule,
    SearchModule,
    DashboardModule,
    MarketingModule,
    ExternalCommsModule,
    AuditModule,
    WishlistsModule,
    ReviewsModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => configService.get('jwt') as any,
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
      exclude: ['/api/(.*)'],
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(BullBoardAuthMiddleware).forRoutes('/admin/queues');
  }
}
