import { NextFunction, Request, Response } from 'express';
import { prisma } from '../prisma.js'
import * as handlerFactory from './handlerFactory.js';
import * as quizSchemas from '../schemas/quiz.schema.js';
import catchAsync from '../utils/catchAsync.js';
import QuizService from '../services/quizService.js';
import AppError from '../utils/appError.js';
import { AuthRequest } from '../utils/authRequestInterface.js';

const model = prisma.quiz;
const quizService = new QuizService();
export const getAllQuiz = handlerFactory.getAll(model);

export const findQuizById = handlerFactory.getOne(model);

export const findQuizByName = catchAsync(async (req: Request, res: Response) => {
    const data = quizSchemas.quizNameParamSchema.parse(req.params);
    const { name } = data;
    const quizzes = await quizService.findQuizByName(name);
    res.status(200).json({ status: "success", quizzes });
});
export const createQuiz = handlerFactory.createOne(model, quizSchemas.quizCreateSchema);

export const updateQuiz = catchAsync(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const data = quizSchemas.quizUpdateSchema.parse(req.body);
    const userId = req.user.id;
    const quiz = await quizService.updateQuiz(+id, data, userId);
    res.status(200).json({status: "success", quiz });
});

export const softDeleteQuiz = catchAsync(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.user.id;
    const quiz = await quizService.softDeleteQuiz(+id, userId);
    res.status(200).json({
        status: "success",
        message: 'Quiz soft-deleted successfully',
        quiz
    })
});
export const getSortedQuizByRating = catchAsync(async (req: Request, res: Response) => {
    const data = quizSchemas.quizQuerySchema.parse(req.query);
    const {items, pagination} = await quizService.getSortedQuizByRating(data);
    res.status(200).json({ status: "success", items, pagination });
});



export const createQuizComplex = catchAsync(async (req: AuthRequest, res: Response) => {
    const authorId = req.user.id;
    const data = req.body;
    const quizData = quizSchemas.quizComplexSchema.parse(data);
    const newQuiz = await quizService.createQuizComplex(quizData, authorId);
    res.status(201).json({ status: "success", quiz: newQuiz });
});

export const startQuizAttempt = catchAsync(async (req: AuthRequest, res: Response) => {
    const data = quizSchemas.quizIdParamSchema.parse(req.params);
    const { quizId } = data;
    const userId = req.user.id;
    const attempt = await quizService.startQuizAttempt(quizId, userId);
    res.status(201).json({ status: "success", attempt });
});

export const submitQuizAttempt = catchAsync(async (req: AuthRequest, res: Response) => {
    const paramData = quizSchemas.quizAttemptIdParamSchema.parse(req.params);
    const { attemptId } = paramData;
    const bodyData = quizSchemas.quizAttemptSubmitSchema.parse(req.body);
    const { answers } = bodyData;
    const result = await quizService.submitQuizAttempt(attemptId, answers);
    res.status(200).json({ status: "success", result });
});

export const getQuizResults = catchAsync(async (req: Request, res: Response) => {
    const data = quizSchemas.quizAttemptIdParamSchema.parse(req.params);
    const { attemptId } = data;
    const results = await quizService.getQuizResults(attemptId);
    res.status(200).json({ status: "success", results });
});


export const getFullyDetailedQuizById = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { quizId } = quizSchemas.quizIdParamSchema.parse(req.params);
    const quiz = await quizService.getFullyDetailedQuizById(quizId);
    if (!quiz) {
        return next(new AppError('Quiz not found', 404));
    }
    res.status(200).json({ quiz });
});

