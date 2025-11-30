import { Request, Response, NextFunction } from "express";
import * as userSchemas from '../schemas/user.schema.js';
import catchAsync from "../utils/catchAsync.js";
import UserService from "../services/userService.js";
import AppError from "../utils/appError.js";


const userService = new UserService();

export const findUserByEmail = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const data = userSchemas.findUserByEmailSchema.parse(req.params);
    const { email } = data;
    if (!email) return next(new AppError('Email parameter is required', 400));
    const user = await userService.findUserByEmail(email);
    res.status(200).json({ user });
});

export const findUsersByName = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const data = userSchemas.findUsersByNameSchema.parse(req.params);
    const query = userSchemas.queryUserSchema.parse(req.query);
    const { name } = data;
    const { limit, page } = query;
    if (!name) return next(new AppError('Name parameter is required', 400));
    const users = await userService.findUsersByName(name, limit, page);
    res.status(200).json({ users });
});

export const getCurrentUser = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const userId = (req as any).user.id;
    const user = await userService.findUserById(userId);
    if (!user) {
        return next(new AppError('User not found', 404));
    }
    res.status(200).json({ user });
});

export const findTopUsersByQuizScore = catchAsync(async (req: Request, res: Response) => {
    const query = userSchemas.queryUserSchema.parse(req.query);
    const { limit, page } = query;
    const topUsers = await userService.findTopUsersByQuizScore(limit, page);
    res.status(200).json({ topUsers });
});

export const findTopAuthorsByQuizAttempts = catchAsync(async (req: Request, res: Response) => {
    const query = userSchemas.queryUserSchema.parse(req.query);
    const { limit, page } = query;
    const topAuthors = await userService.findTopAuthorsByQuizAttempts(limit, page);
    res.status(200).json({ topAuthors });
});

export const findTopAuthorsByQuizCounts = catchAsync(async (req: Request, res: Response) => {
    const query = userSchemas.queryUserSchema.parse(req.query);
    const { limit, page } = query;
    const topAuthors = await userService.findTopAuthorsByQuizCounts(limit, page);
    res.status(200).json({ topAuthors });
});

export const findTopAuthorsByAverageQuizRating = catchAsync(async (req: Request, res: Response) => {
    const query = userSchemas.queryUserSchema.parse(req.query);
    const { limit, page } = query;
    const topAuthors = await userService.findTopAuthorsByAverageQuizRating(limit, page);
    res.status(200).json({ topAuthors });
});