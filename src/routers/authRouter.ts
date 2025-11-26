import express from 'express';
import * as authController from '../controllers/authCotroller.js';


const router = express.Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.post('/forgot-password', authController.protect, authController.forgotPassword);
router.post('/reset-password/:token', authController.protect, authController.resetPassword);

export default router;