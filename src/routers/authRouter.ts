import express from 'express';
import * as authController from '../controllers/authCotroller.js';


const router = express.Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password/:token', authController.resetPassword);
router.post('/update-password', authController.protect, authController.updatePassword);
router.delete('/delete-account', authController.protect, authController.softDeleteAccount);

export default router;