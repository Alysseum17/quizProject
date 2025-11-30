import express from 'express';
import * as userController from '../controllers/userController.js';
import {protect} from '../controllers/authCotroller.js';

const router = express.Router();

router.get('/me', protect, userController.getCurrentUser);
router.get('/email/:email', userController.findUserByEmail);
router.get('/name/:name', userController.findUsersByName);
router.get('/top/quiz-scores', userController.findTopUsersByQuizScore);
router.get('/top/authors/quiz-attempts', userController.findTopAuthorsByQuizAttempts);
router.get('/top/authors/quiz-counts', userController.findTopAuthorsByQuizCounts);
router.get('/top/authors/average-quiz-ratings', userController.findTopAuthorsByAverageQuizRating);

export default router;