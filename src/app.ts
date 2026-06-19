// 应用入口：Koa 实例创建、中间件注册、服务启动
import Koa from 'koa';
import koaBody from 'koa-body';
import koaJson from 'koa-json';
import { config } from './config';
import exception from './middleware/exception';
import router from './router';

const app = new Koa();

// 全局中间件
app.use(exception);
app.use(koaBody());
app.use(koaJson());

// 路由
app.use(router.routes());
app.use(router.allowedMethods());

// 启动服务
app.listen(config.port, () => {
  console.log(`Server running at http://localhost:${config.port}`);
});

export default app;
