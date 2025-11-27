import { NextFunction, Request, Response } from 'express';      
import {prisma} from '../prisma.js'
import * as handlerFactory from './handlerFactory.js';
import { quizCreateSchema, quizUpdateSchema, quizQuerySchema } from '../schemas/quiz.schema.js';
import catchAsync from '../utils/catchAsync.js';
import QuizService from '../services/quizService.js';
import AppError from '../utils/appError.js';

const model = prisma.quiz;
const quizService = new QuizService();
export const getAllQuiz = handlerFactory.getAll(model);

export const findQuizById = handlerFactory.getOne(model);

export const findQuizByName = catchAsync(async (req:Request, res:Response, next: NextFunction) => {
    const { name } = req.params;
    if (!name) return next(new AppError('Quiz name parameter is required', 400));
    const quiz = await quizService.findQuizByName(name);
    res.status(200).json({ quiz });
});
export const createQuiz = handlerFactory.createOne(model, quizCreateSchema);

export const deleteQuiz = handlerFactory.deleteOne(model);

export const getSortedQuizByRating = catchAsync(async (req:Request, res:Response) => {
    const data = quizQuerySchema.parse(req.query);
    const { limit, sort, rating } = data;
    const quizzes = await quizService.getSortedQuizByRating(limit, sort, rating);
    res.status(200).json({ quizzes });
});

export const updateQuiz = handlerFactory.updateOne(model, quizUpdateSchema);