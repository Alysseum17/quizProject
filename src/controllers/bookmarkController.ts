import { Request, Response } from "express";
import catchAsync from "../utils/catchAsync.js";
import BookmarkService from "../services/bookmarkService.js";
import { quizIdParamSchema, quizQuerySchema,  quizIdsParamSchema } from "../schemas/quiz.schema.js";
import {updateBookmarkNoteSchema} from "../schemas/bookmark.schema.js";
import { AuthRequest } from "../utils/authRequestInterface.js";

const bookmarkService = new BookmarkService();

export const addBookmark = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.user.id;
    const { quizId } = quizIdParamSchema.parse(req.params);

    await bookmarkService.addBookmark(userId, quizId);

    res.status(201).json({
        status: 'success',
        message: 'Quiz added to bookmarks'
    });
});

export const removeBookmark = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.user.id;
    const { quizId } = quizIdParamSchema.parse(req.params);

    await bookmarkService.removeBookmark(userId, quizId);
    res.status(204).json({
        status: 'success',
        data: null
    });
});

export const getMyBookmarks = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.user.id;
    const { page, limit } = quizQuerySchema.parse(req.query);

    const data = await bookmarkService.getMyBookmarks(userId, page, limit);

    res.status(200).json({
        status: 'success',
        results: data.items.length,
        pagination: data.pagination,
        data: {
            bookmarks: data.items
        }
    });
});


export const updateBookmarkNote = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.user.id;
    const { quizId } = quizIdParamSchema.parse(req.params);
    const { note } = updateBookmarkNoteSchema.parse(req.body);

    const bookmark = await bookmarkService.updateBookmarkNote(userId, quizId, note);

    res.status(200).json({
        status: 'success',
        data: { bookmark }
    });
});

export const getTopBookmarkedQuizzes = catchAsync(async (req: Request, res: Response) => {
    const stats = await bookmarkService.getTopBookmarkedQuizzes();

    res.status(200).json({
        status: 'success',
        results: stats.length,
        data: { stats }
    });
});

export const cleanupInactive = catchAsync(async (req: Request, res: Response) => {
    const userId = (req as any).user.id;
    const result = await bookmarkService.cleanupInactiveBookmarks(userId);

    res.status(200).json({
        status: 'success',
        data: result
    });
});

export const bulkAdd = catchAsync(async (req: Request, res: Response) => {
    const userId = (req as any).user.id;
    const { quizIds } = quizIdsParamSchema.parse(req.body);
    const result = await bookmarkService.bulkAddBookmarks(userId, quizIds);

    res.status(201).json({
        status: 'success',
        data: result
    });
});