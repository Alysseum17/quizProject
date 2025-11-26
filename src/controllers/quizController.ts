import { Request, Response } from 'express';
import {Prisma} from '@prisma/client';        
import {prisma} from '../prisma.js'
import * as handlerFactory from './handlerFactory.js';
import { quizCreateSchema, quizUpdateSchema, quizQuerySchema } from '../schemas/quiz.schema.js';
import catchAsync from '../utils/catchAsync.js';

const model = prisma.quiz;

export const getAllQuiz = handlerFactory.getAll(model);

export const findQuizById = handlerFactory.getOne(model);

export const findQuizByName = catchAsync(async (req:Request, res:Response) => {
    const { name } = req.params;
    const quiz = await prisma.quiz.findMany({
        where: { title: { contains: name } },
    });
    res.status(200).json({ quiz });
});
export const createQuiz = handlerFactory.createOne(model, quizCreateSchema);

export const deleteQuiz = handlerFactory.deleteOne(model);

export const getSortedQuizByRating = catchAsync(async (req:Request, res:Response) => {
    const data = quizQuerySchema.parse(req.query);
    const { limit, sort, rating } = data;
    const sortDirection = sort === 'asc' ? Prisma.sql`ASC` : Prisma.sql`DESC`;
    const limitNumber = Number(limit);
    const quizzes = await prisma.$queryRaw`
        SELECT q.title, AVG(r.rating) as average_rating FROM "Quiz" q
        INNER JOIN "Review" r ON q.quiz_id = r.quiz_id
        GROUP BY q.quiz_id, q.title
        HAVING AVG(r.rating) >= ${rating?.gte} AND AVG(r.rating) <= ${rating?.lte}
        ORDER BY AVG(r.rating) ${sortDirection}
        LIMIT ${limitNumber};
    `;
    res.status(200).json({ quizzes });
});

export const updateQuiz = handlerFactory.updateOne(model, quizUpdateSchema);