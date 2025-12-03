import express from 'express';
import * as quizController from '../controllers/quizController.js';
import {protect} from '../controllers/authController.js';

const router = express.Router();

router.get('/', quizController.getAllQuiz);
router.get('/rating', quizController.getSortedQuizByRating);
router.get('/name/:name', quizController.findQuizByName);
router.get('/:quizId', quizController.getFullyDetailedQuizById);
router.get('/attempts/:attemptId/results', protect, quizController.getQuizResults);
router.post('/', protect, quizController.createQuiz);
router.post('/complex', protect, quizController.createQuizComplex);
router.post('/:quizId/start', protect, quizController.startQuizAttempt);
router.post('/attempts/:attemptId/submit', protect, quizController.submitQuizAttempt);
router.put('/:id', quizController.updateQuiz);
router.delete('/:id', quizController.softDeleteQuiz);

export default router;