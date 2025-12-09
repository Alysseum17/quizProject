import { Request, Response, NextFunction } from "express";
import * as userSchemas from '../schemas/user.schema.js';
import catchAsync from "../utils/catchAsync.js";
import UserService from "../services/userService.js";
import AppError from "../utils/appError.js";
import { AuthRequest } from "../utils/authRequestInterface.js";


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

export const getUserWithDetails = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const data = userSchemas.findUserByIdSchema.parse(req.params);
    const { userId } = data;
    const user = await userService.getUserWithDetails(userId);
    if (!user) {
        return next(new AppError('User not found', 404));
    }
    res.status(200).json({ user });
});

export const getUserQuizes = catchAsync(async (req: AuthRequest, res: Response) => {
    const data = userSchemas.findUserByIdSchema.parse(req.params);
    const { userId } = data;
    const quizes = await userService.getUserQuizes(userId);
    res.status(200).json({ quizes });
});

export const getCurrentUser = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const userId = req.user.id;
    const user = await userService.getUserWithDetails(userId);
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

export const changeUserInfo = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.user.id;
    const data = userSchemas.changeInfoSchema.parse(req.body);
    const updatedUser = await userService.changeUserInfo(userId, data);
    res.status(200).json({ user: updatedUser });
});

export const getProlificAuthors = catchAsync(async (req: Request, res: Response) => {
    const query = userSchemas.queryUserSchema.parse(req.query);
    const { limit, page } = query;
    const authors = await userService.getProlificAuthors(limit, page);
    res.status(200).json({ authors });
});
export const getHighPerfomanceUsers = catchAsync(async (req: Request, res: Response) => {
    const query = userSchemas.queryUserSchema.parse(req.query);
    const { limit, page } = query;
    const users = await userService.getHighPerformanceUsers(limit, page);
    res.status(200).json({ users });
});

export const getUserQuizStats = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const data = userSchemas.quizIdParamSchema.parse(req.params);
    const userId = req.user.id;
    const { quizId } = data;
    const stats = await userService.getUserQuizStats(userId, quizId);
    if (stats.length === 0) {
        return next(new AppError('No stats found for this user and quiz', 404));
    }
    res.status(200).json({ stats });
});

export const getUserLastActivities = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.user.id;
    const {limit, page} = userSchemas.queryUserSchema.parse(req.query);
    const activities = await userService.getLastUserActivities(userId, limit, page);
    res.status(200).json({ activities });
});