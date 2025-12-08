import express from 'express';
import * as bookmarkController from '../controllers/bookmarkController.js';
import { protect } from '../controllers/authCotroller.js';

const router = express.Router();

router.use(protect);
router.get('/', bookmarkController.getMyBookmarks);
router.post('/:id', bookmarkController.addBookmark);
router.delete('/:id', bookmarkController.removeBookmark);
router.patch('/:id', bookmarkController.updateBookmarkNote);

export default router;