// 用户路由：RESTful 风格，只做路径绑定与参数分发
import Router from '@koa/router';
import { getUser, getUserList, register, login, updateUser, deleteUser } from '../controller/user';
import auth from '../middleware/auth';

const router = new Router({ prefix: '/user' });

router.get('/', auth, getUserList);
router.get('/:id', auth, getUser);
router.post('/register', register);
router.post('/login', login);
router.put('/:id', auth, updateUser);
router.delete('/:id', auth, deleteUser);

export default router;
