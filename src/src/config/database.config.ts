import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const postgresConfig = registerAs(
  'postgres',
  (): TypeOrmModuleOptions => ({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    autoLoadEntities: true,
    synchronize: process.env.NODE_ENV === 'development', // ONLY use synchronize in dev
  }),
);

export const mongoConfig = registerAs('mongodb', () => ({
  uri: process.env.MONGODB_URI,
}));
