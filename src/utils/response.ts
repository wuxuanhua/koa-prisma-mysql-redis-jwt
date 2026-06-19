// 统一返回体格式
import { HTTP_CODE } from '../constant';

export interface ApiResponse<T = unknown> {
  code: number;
  data: T;
  msg: string;
}

export const success = <T>(data: T, msg = '操作成功', code = HTTP_CODE.SUCCESS): ApiResponse<T> => ({
  code,
  data,
  msg,
});

export const fail = (msg = '操作失败', code = HTTP_CODE.BAD_REQUEST): ApiResponse<null> => ({
  code,
  data: null,
  msg,
});
