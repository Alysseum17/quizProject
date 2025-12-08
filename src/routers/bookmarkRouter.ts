import express from 'express';
import * as bookmarkController from '../controllers/bookmarkController.js';
import { protect } from '../controllers/authController.js';

const router = express.Router();

router.use(protect);
router.get('/', bookmarkController.getMyBookmarks);
router.get('/analytics/top', bookmarkController.getTopBookmarkedQuizzes);
router.post('/:quizId', bookmarkController.addBookmark);
router.delete('/:quizId', bookmarkController.removeBookmark);
router.patch('/:quizId', bookmarkController.updateBookmarkNote);

export default router;