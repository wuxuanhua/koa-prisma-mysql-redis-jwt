// Prisma 客户端单例：全局复用避免重复创建连接
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default prisma;
