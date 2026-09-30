import { Router } from 'express';
import { registerPage, register, loginPage, login, logout } from '../controllers/auth.js';

const router = Router();

router.get('/register', registerPage);
router.post('/register', register);

router.get('/login', loginPage);
router.post('/login', login);

router.post('/logout', logout);

export default router;