import express from 'express';
import * as authController from '../controllers/authCotroller.js';
import e from 'express';

const router = express.Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);

export default router;