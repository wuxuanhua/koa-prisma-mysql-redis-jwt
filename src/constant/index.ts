// 常量定义：HTTP 状态码与业务状态枚举
export const HTTP_CODE = {
  SUCCESS: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  SERVER_ERROR: 500,
} as const;

export const USER_STATUS = {
  ACTIVE: 1,
  DISABLED: 0,
} as const;

export const USER_ROLE = {
  USER: 'user',
  ADMIN: 'admin',
} as const;
