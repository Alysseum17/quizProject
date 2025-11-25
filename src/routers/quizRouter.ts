import express from 'express';
import * as quizController from '../controllers/quizController.js';

const router = express.Router();

router.get('/', quizController.getAllQuiz);
router.get('/top-rated', quizController.getSortedQuizByRating);
router.get('/:id', quizController.findQuizById);
router.get('/name/:name', quizController.findQuizByName);
router.post('/', quizController.createQuiz);
router.put('/:id', quizController.updateQuiz);
router.delete('/:id', quizController.deleteQuiz);

export default router;