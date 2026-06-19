// 配置模块：根据环境加载对应 .env 文件，导出全局配置
import dotenv from 'dotenv';
import path from 'path';

const env = process.env.NODE_ENV || 'development';
dotenv.config({ path: path.resolve(__dirname, `../../.env.${env}`) });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  database: {
    url: process.env.DATABASE_URL!,
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB || '0', 10),
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'default_secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  logLevel: process.env.LOG_LEVEL || 'info',
} as const;
