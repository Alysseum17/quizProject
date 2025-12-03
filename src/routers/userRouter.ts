import express from 'express';
import * as userController from '../controllers/userController.js';
import {protect} from '../controllers/authController.js';

const router = express.Router();

router.get('/me', protect, userController.getCurrentUser);
router.get('/me/:quizId/stats', protect, userController.getUserQuizStats);
router.get('/email/:email', userController.findUserByEmail);
router.get('/name/:name', userController.findUsersByName);
router.get('/top/quiz-scores', userController.findTopUsersByQuizScore);
router.get('/top/authors/quiz-attempts', userController.findTopAuthorsByQuizAttempts);
router.get('/top/authors/quiz-counts', userController.findTopAuthorsByQuizCounts);
router.get('/top/authors/average-quiz-ratings', userController.findTopAuthorsByAverageQuizRating);
router.get('/top/authors/prolific', userController.getProlificAuthors);
router.get('/top/users/high-performance', userController.getHighPerfomanceUsers);
router.get('/:userId', userController.getUserWithDetails);
router.get('/:userId/quizes', userController.getUserQuizes);
router.patch('/change-info', protect, userController.changeUserInfo);

export default router;