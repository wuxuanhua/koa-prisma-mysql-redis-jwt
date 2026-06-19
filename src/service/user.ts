// 用户 Service：用户相关的业务逻辑与数据库操作
import prisma from '../db/prisma';
import { ParamsException, NotFoundException, ConflictException } from '../utils/exception';
import { signToken } from '../utils/jwt';
import crypto from 'crypto';

const hashPassword = (password: string): string => {
  return crypto.createHash('sha256').update(password).digest('hex');
};

export class UserService {
  async getById(id: number) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    const { password: _, ...userWithoutPwd } = user;
    return userWithoutPwd;
  }

  async getList(page = 1, pageSize = 10) {
    const skip = (page - 1) * pageSize;
    const [list, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: pageSize,
        select: { id: true, username: true, email: true, avatar: true, role: true, status: true, createdAt: true, updatedAt: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count(),
    ]);
    return { list, total, page, pageSize };
  }

  async create(data: { username: string; password: string; email?: string }) {
    const exist = await prisma.user.findUnique({ where: { username: data.username } });
    if (exist) {
      throw new ConflictException('用户名已存在');
    }
    return prisma.user.create({
      data: {
        username: data.username,
        password: hashPassword(data.password),
        email: data.email,
      },
      select: { id: true, username: true, email: true, role: true, createdAt: true },
    });
  }

  async login(username: string, password: string) {
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    if (user.status !== 1) {
      throw new ParamsException('账号已被禁用');
    }
    if (user.password !== hashPassword(password)) {
      throw new ParamsException('密码错误');
    }
    const token = signToken({ id: user.id, username: user.username, role: user.role });
    const { password: _, ...userWithoutPwd } = user;
    return { token, user: userWithoutPwd };
  }

  async update(id: number, data: { email?: string; avatar?: string; status?: number }) {
    await this.getById(id);
    return prisma.user.update({
      where: { id },
      data,
      select: { id: true, username: true, email: true, avatar: true, role: true, status: true, updatedAt: true },
    });
  }

  async remove(id: number) {
    await this.getById(id);
    await prisma.user.delete({ where: { id } });
  }
}

export default new UserService();
