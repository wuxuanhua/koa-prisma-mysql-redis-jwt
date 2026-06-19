// 用户 Controller：参数校验、调用 Service、统一返回格式
import { Context } from 'koa';
import userService from '../service/user';
import { success } from '../utils/response';
import { HTTP_CODE } from '../constant';

export const getUser = async (ctx: Context): Promise<void> => {
  const id = parseInt(ctx.params.id, 10);
  const user = await userService.getById(id);
  ctx.body = success(user);
};

export const getUserList = async (ctx: Context): Promise<void> => {
  const page = parseInt((ctx.query.page as string) || '1', 10);
  const pageSize = parseInt((ctx.query.pageSize as string) || '10', 10);
  const data = await userService.getList(page, pageSize);
  ctx.body = success(data);
};

export const register = async (ctx: Context): Promise<void> => {
  const { username, password, email } = ctx.request.body as { username: string; password: string; email?: string };
  const user = await userService.create({ username, password, email });
  ctx.body = success(user, '注册成功', HTTP_CODE.CREATED);
  ctx.status = HTTP_CODE.CREATED;
};

export const login = async (ctx: Context): Promise<void> => {
  const { username, password } = ctx.request.body as { username: string; password: string };
  const data = await userService.login(username, password);
  ctx.body = success(data, '登录成功');
};

export const updateUser = async (ctx: Context): Promise<void> => {
  const id = parseInt(ctx.params.id, 10);
  const { email, avatar, status } = ctx.request.body as { email?: string; avatar?: string; status?: number };
  const user = await userService.update(id, { email, avatar, status });
  ctx.body = success(user, '更新成功');
};

export const deleteUser = async (ctx: Context): Promise<void> => {
  const id = parseInt(ctx.params.id, 10);
  await userService.remove(id);
  ctx.body = success(null, '删除成功');
};
