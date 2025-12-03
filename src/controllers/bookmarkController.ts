import { Request, Response } from "express";
import catchAsync from "../utils/catchAsync.js";
import BookmarkService from "../services/bookmarkService.js";
import { quizIdParamSchema, quizQuerySchema } from "../schemas/quiz.schema.js";

const bookmarkService = new BookmarkService();

export const addBookmark = catchAsync(async (req: Request, res: Response) => {
    const userId = (req as any).user.id;
    const { id: quizId } = quizIdParamSchema.parse(req.params);

    await bookmarkService.addBookmark(userId, quizId);

    res.status(201).json({
        status: 'success',
        message: 'Quiz added to bookmarks'
    });
});

export const removeBookmark = catchAsync(async (req: Request, res: Response) => {
    const userId = (req as any).user.id;
    const { id: quizId } = quizIdParamSchema.parse(req.params);

    await bookmarkService.removeBookmark(userId, quizId);
    res.status(204).json({
        status: 'success',
        data: null
    });
});

export const getMyBookmarks = catchAsync(async (req: Request, res: Response) => {
    const userId = (req as any).user.id;
    const { page, limit } = quizQuerySchema.parse(req.query);

    const bookmarks = await bookmarkService.getMyBookmarks(userId, page, limit);
    res.status(200).json({
        status: 'success',
        results: bookmarks.length,
        data: {
            bookmarks
        }
    });
});


