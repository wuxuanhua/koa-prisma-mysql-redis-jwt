// JWT 认证中间件：校验请求头 Authorization，注入 ctx.state.user
import { Context, Next } from 'koa';
import { verifyToken, JwtPayload } from '../utils/jwt';
import { AuthException } from '../utils/exception';

const auth = async (ctx: Context, next: Next): Promise<void> => {
  const token = ctx.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    throw new AuthException('缺少认证令牌');
  }
  try {
    const payload: JwtPayload = verifyToken(token);
    ctx.state.user = payload;
  } catch {
    throw new AuthException('令牌无效或已过期');
  }
  await next();
};

export default auth;
