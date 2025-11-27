import express from 'express';
import * as quizController from '../controllers/quizController.js';
import {protect} from '../controllers/authCotroller.js';

const router = express.Router();

router.get('/', quizController.getAllQuiz);
router.get('/rating', quizController.getSortedQuizByRating);
router.get('/:id', quizController.findQuizById);
router.get('/name/:name', quizController.findQuizByName);
router.post('/', protect, quizController.createQuiz);
router.post('/complex', protect, quizController.createQuizComplex);
router.post('/:quizId/start', protect, quizController.startQuizAttempt);
router.put('/:id', quizController.updateQuiz);
router.delete('/:id', quizController.deleteQuiz);

export default router;