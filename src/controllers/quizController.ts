import { NextFunction, Request, Response } from 'express';      
import {prisma} from '../prisma.js'
import * as handlerFactory from './handlerFactory.js';
import * as quizSchemas from '../schemas/quiz.schema.js';
import catchAsync from '../utils/catchAsync.js';
import QuizService from '../services/quizService.js';
import AppError from '../utils/appError.js';

const model = prisma.quiz;
const quizService = new QuizService();
export const getAllQuiz = handlerFactory.getAll(model);

export const findQuizById = handlerFactory.getOne(model);

export const findQuizByName = catchAsync(async (req:Request, res:Response, next: NextFunction) => {
    const data = quizSchemas.quizNameParamSchema.parse(req.params);
    const { name } = data;
    const quiz = await quizService.findQuizByName(name);
    res.status(200).json({ quiz });
});
export const createQuiz = handlerFactory.createOne(model, quizSchemas.quizCreateSchema);

export const updateQuiz = handlerFactory.updateOne(model, quizSchemas.quizUpdateSchema);

export const softDeleteQuiz = handlerFactory.softDelete(model);



export const getSortedQuizByRating = catchAsync(async (req:Request, res:Response) => {
    const data = quizSchemas.quizQuerySchema.parse(req.query);
    const { limit, sort, page, rating } = data;
    const quizzes = await quizService.getSortedQuizByRating(limit, sort, page,  rating);
    res.status(200).json({ quizzes });
});



export const createQuizComplex = catchAsync(async (req:Request, res:Response, next: NextFunction) => {
    const authorId = (req as any).user.id;
    const data = req.body;
    const quizData = quizSchemas.quizComplexSchema.parse(data);
    const newQuiz = await quizService.createQuizComplex(quizData, authorId);
    res.status(201).json({ quiz: newQuiz });
});

export const startQuizAttempt = catchAsync(async (req:Request, res:Response, next: NextFunction) => {
    const data = quizSchemas.quizAttemptIdParamSchema.parse(req.params);
    const { quizId } = data;
    const userId = (req as any).user.id;
    const attempt = await quizService.startQuizAttempt(quizId, userId);
    res.status(201).json({ attempt });
});

export const getFullyDetailedQuizById = catchAsync(async (req:Request, res:Response, next: NextFunction) => {
    const quizId = quizSchemas.quizIdParamSchema.parse(req.params).id;
    const quiz = await quizService.getFullyDetailedQuizById(quizId);
    if (!quiz) {
        return next(new AppError('Quiz not found', 404));
    }
    res.status(200).json({ quiz });
});