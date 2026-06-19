# Koa2 + Prisma + MySQL + Redis + JWT 后端服务

基于 Koa2 + TypeScript 的分层架构后端项目，使用 Prisma ORM 操作 MySQL，Redis 缓存，JWT 身份认证。

## 项目结构

```
├── prisma/
│   └── schema.prisma          # 数据模型定义（Prisma Schema）
├── src/
│   ├── app.ts                 # 应用入口，Koa 实例化与中间件注册
│   ├── config/
│   │   └── index.ts           # 环境配置（读取 .env，导出全局 config）
│   ├── constant/
│   │   └── index.ts           # 常量定义（HTTP 状态码、用户角色/状态枚举）
│   ├── controller/
│   │   └── user.ts            # 用户控制器（参数校验、调用 Service、返回封装）
│   ├── db/
│   │   └── prisma.ts          # PrismaClient 单例（全局复用）
│   ├── middleware/
│   │   ├── exception.ts       # 全局异常捕获中间件
│   │   └── auth.ts            # JWT 认证中间件
│   ├── router/
│   │   ├── index.ts           # 路由汇总（/api 前缀）
│   │   └── user.ts            # 用户路由（RESTful 风格）
│   ├── service/
│   │   └── user.ts            # 用户服务层（业务逻辑 + 数据库操作）
│   └── utils/
│       ├── exception.ts       # 自定义异常类（HttpException / Params / Auth / NotFound）
│       ├── jwt.ts             # JWT 工具（签发 / 校验 token）
│       └── response.ts        # 统一返回体（success / fail）
├── .env.development           # 开发环境变量
├── .env.production            # 生产环境变量
├── .eslintrc.json             # ESLint 配置
├── .prettierrc                # Prettier 配置
├── tsconfig.json              # TypeScript 配置
└── package.json               # 项目依赖与脚本
```

### 分层职责

| 层 | 职责 | 禁止 |
|----|------|------|
| Router | 路径 + HTTP 方法绑定，参数透传 | 写逻辑、写 SQL |
| Controller | 参数获取与校验，调用 Service，返回统一格式 | 写 SQL、复杂循环业务 |
| Service | 业务逻辑 + 数据库 CRUD | 操作 ctx、处理返回格式 |
| Middleware | 全局切面（异常捕获、认证鉴权） | 漏写 `await next()` |

## 快速开始

### 环境要求

- Node.js >= 22.21.0
- pnpm（包管理器）
- Docker & Docker Compose（用于启动 MySQL + Redis）

### 启动基础设施（MySQL + Redis）

```bash
# 前台运行
docker-compose up

# 后台运行
docker-compose up -d

# 停止
docker-compose down

# 停止并清除数据卷
docker-compose down -v
```

### 安装依赖

```bash
pnpm install
```

### 配置环境变量

开发环境使用 `.env.development`，生产环境使用 `.env.production`。

```bash
# .env.development
PORT=3000
DATABASE_URL="mysql://root:123456@localhost:3306/mydb"
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=7d
```

### 初始化数据库

```bash
# 同步 Prisma Schema 到数据库（开发用，直接建表）
pnpm db:push

# 或使用 Migration（推荐，有迁移记录）
pnpm db:migrate

# 生成 Prisma Client 类型
pnpm db:generate
```

### 启动项目

```bash
# 开发模式（热重载）
pnpm dev

# 生产模式
pnpm build      # 编译 TypeScript
pnpm start      # 运行编译产物
```

服务默认运行在 `http://localhost:3000`。

## Prisma 使用指南

### Schema 定义

数据模型定义在 `prisma/schema.prisma`：

```prisma
model User {
  id        Int      @id @default(autoincrement())
  username  String   @unique @db.VarChar(50)
  password  String   @db.VarChar(255)
  email     String?  @db.VarChar(100)
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  @@map("user")
}
```

### 常用命令

| 命令 | 说明 |
|------|------|
| `pnpm db:generate` | 根据 Schema 生成 Prisma Client |
| `pnpm db:push` | 直接推送 Schema 到数据库（无迁移记录） |
| `pnpm db:migrate` | 创建迁移文件并应用到数据库 |
| `pnpm db:seed` | 执行 `prisma/seed.ts` 种子数据脚本 |

### 在 Service 中使用

```typescript
import prisma from '../db/prisma';

// 查询
const user = await prisma.user.findUnique({ where: { id: 1 } });

// 分页查询
const [list, total] = await Promise.all([
  prisma.user.findMany({ skip: 0, take: 10 }),
  prisma.user.count(),
]);

// 创建
const newUser = await prisma.user.create({
  data: { username: 'admin', password: 'hash' },
});

// 事务
const result = await prisma.$transaction(async (tx) => {
  const user = await tx.user.create({ data: { ... } });
  await tx.log.create({ data: { userId: user.id, ... } });
  return user;
});
```

## Redis 使用指南

项目中已封装 Redis 客户端，配置从环境变量读取。

### 配置说明

```bash
# .env.development / .env.production
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=123456
REDIS_DB=0          # 数据库编号 0~15，默认 0
```

### Redis 客户端

```typescript
// src/db/redis.ts — 已初始化，直接导入使用
import redis from '../db/redis';
```

### Service 中使用缓存

```typescript
import redis from '../db/redis';

async getById(id: number) {
  const cacheKey = `user:${id}`;

  // 查缓存
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  // 查数据库
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    throw new NotFoundException('用户不存在');
  }

  // 写缓存，5 分钟过期
  const { password: _, ...data } = user;
  await redis.set(cacheKey, JSON.stringify(data), 'EX', 300);
  return data;
}
```

### 常用 Redis 操作

```typescript
// 字符串
await redis.set('key', 'value');
await redis.set('key', 'value', 'EX', 300);  // 5分钟过期
const val = await redis.get('key');
await redis.del('key');

// Hash
await redis.hset('user:1', 'name', 'zhangsan');
const name = await redis.hget('user:1', 'name');
const all = await redis.hgetall('user:1');

// List
await redis.lpush('queue', 'task1');
const task = await redis.rpop('queue');

// Set
await redis.sadd('tags', 'nodejs', 'koa');
const members = await redis.smembers('tags');

// 批量删除（按前缀匹配）
const keys = await redis.keys('cache:*');
if (keys.length) {
  await redis.del(...keys);
}
```

## API 接口

所有接口前缀：`/api`

### 用户模块

| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| POST | `/user/register` | 否 | 注册 |
| POST | `/user/login` | 否 | 登录（返回 token） |
| GET | `/user` | 是 | 用户列表（分页） |
| GET | `/user/:id` | 是 | 用户详情 |
| PUT | `/user/:id` | 是 | 更新用户 |
| DELETE | `/user/:id` | 是 | 删除用户 |

### 统一返回格式

```json
// 成功
{ "code": 200, "data": { ... }, "msg": "操作成功" }

// 失败
{ "code": 400, "data": null, "msg": "参数错误" }
```

### 认证方式

请求头携带 JWT Token：

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

## 打包部署

```bash
# 1. 编译 TypeScript
pnpm build
# 输出到 dist/ 目录

# 2. 将以下内容部署到服务器
#    - dist/          编译产物
#    - node_modules/  依赖
#    - prisma/        Schema 文件
#    - .env.production  生产环境变量
#    - package.json

# 3. 服务器上启动
NODE_ENV=production node dist/app.js

# 或使用 PM2 管理进程
pm2 start dist/app.js --name koa-server
```

## Git 操作

```bash
# 克隆仓库
git clone https://github.com/wuxuanhua/koa-prisma-mysql-redis-jwt.git
cd koa-prisma-mysql-redis-jwt

# 查看状态
git status

# 查看提交历史
git log --oneline

# 拉取最新代码
git pull

# 添加修改到暂存区
git add .                    # 添加所有修改
git add src/                 # 添加指定目录
git add package.json         # 添加指定文件

# 提交修改
git commit -m "feat: 描述你的修改"

# 推送到远程仓库
git push

# 分支操作
git branch                   # 查看本地分支
git branch -a                # 查看所有分支（含远程）
git branch feature/xxx       # 创建新分支
git checkout feature/xxx     # 切换到指定分支
git checkout -b feature/xxx  # 创建并切换到新分支

# 合并分支（在目标分支上执行）
git merge feature/xxx

# 删除分支
git branch -d feature/xxx    # 删除本地分支
git push origin -d feature/xxx  # 删除远程分支

# 撤销操作
git reset HEAD <file>        # 取消暂存
git checkout -- <file>       # 撤销文件修改
git reset --soft HEAD~1      # 撤销最后一次 commit（保留修改）
```

### 提交信息规范

推荐使用 [Conventional Commits](https://www.conventionalcommits.org/) 格式：

| 类型 | 说明 |
|------|------|
| `feat` | 新功能 |
| `fix` | 修复 Bug |
| `docs` | 文档更新 |
| `style` | 代码格式（不影响逻辑） |
| `refactor` | 重构 |
| `perf` | 性能优化 |
| `test` | 测试相关 |
| `chore` | 构建/工具/依赖等 |

**示例：**
```bash
git commit -m "feat: 添加用户登录接口"
git commit -m "fix: 修复 JWT token 过期判断"
git commit -m "docs: 更新 API 文档"
```

## 脚本速查

| 命令 | 说明 |
|------|------|
| `pnpm dev` | 开发模式（tsx watch 热重载） |
| `pnpm build` | TypeScript 编译到 dist/ |
| `pnpm start` | 运行编译产物 |
| `pnpm db:generate` | 生成 Prisma Client |
| `pnpm db:push` | Schema 直接同步到数据库 |
| `pnpm db:migrate` | 创建并应用迁移文件 |
| `pnpm lint` | ESLint 代码检查 |
| `pnpm format` | Prettier 代码格式化 |
