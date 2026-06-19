// 全局异常中间件：捕获所有未处理的异常，统一返回格式
import { Context, Next } from 'koa';
import { HttpException } from '../utils/exception';
import { fail } from '../utils/response';
import { HTTP_CODE } from '../constant';

const exception = async (ctx: Context, next: Next): Promise<void> => {
  try {
    await next();
  } catch (err) {
    if (err instanceof HttpException) {
      ctx.body = fail(err.message, err.code);
      ctx.status = err.code;
      return;
    }
    ctx.body = fail((err as Error).message || '服务器内部错误', HTTP_CODE.SERVER_ERROR);
    ctx.status = HTTP_CODE.SERVER_ERROR;
  }
};

export default exception;
