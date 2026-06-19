// 自定义异常类：全局异常中间件统一捕获处理
import { HTTP_CODE } from '../constant';

export class HttpException extends Error {
  code: number;
  constructor(msg = '服务器异常', code = HTTP_CODE.SERVER_ERROR) {
    super(msg);
    this.code = code;
    this.name = 'HttpException';
  }
}

export class ParamsException extends HttpException {
  constructor(msg = '参数错误') {
    super(msg, HTTP_CODE.BAD_REQUEST);
    this.name = 'ParamsException';
  }
}

export class AuthException extends HttpException {
  constructor(msg = '未授权') {
    super(msg, HTTP_CODE.UNAUTHORIZED);
    this.name = 'AuthException';
  }
}

export class NotFoundException extends HttpException {
  constructor(msg = '资源不存在') {
    super(msg, HTTP_CODE.NOT_FOUND);
    this.name = 'NotFoundException';
  }
}

export class ConflictException extends HttpException {
  constructor(msg = '资源冲突') {
    super(msg, HTTP_CODE.CONFLICT);
    this.name = 'ConflictException';
  }
}
