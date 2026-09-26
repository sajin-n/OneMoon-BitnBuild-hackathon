import dotenv from 'dotenv';
import { APP_CONFIG } from '@onemoon/config';

dotenv.config();

export const config = {
  port: Number(process.env.API_PORT) || APP_CONFIG.defaultApiPort,
  host: process.env.API_HOST || '0.0.0.0',
  databaseUrl: process.env.DATABASE_URL || '',
  mlServiceUrl: process.env.ML_SERVICE_URL || 'http://localhost:8000',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
};
