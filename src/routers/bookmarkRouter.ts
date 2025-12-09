import express from 'express';
import * as bookmarkController from '../controllers/bookmarkController.js';
import { protect } from '../controllers/authController.js';

const router = express.Router();

router.use(protect);
router.get('/analytics/top', bookmarkController.getTopBookmarkedQuizzes);
router.delete('/cleanup', bookmarkController.cleanupInactive);
router.post('/bulk', bookmarkController.bulkAdd);
router.get('/', bookmarkController.getMyBookmarks);
router.post('/:quizId', bookmarkController.addBookmark);
router.delete('/:quizId', bookmarkController.removeBookmark);
router.patch('/:quizId', bookmarkController.updateBookmarkNote);

export default router;