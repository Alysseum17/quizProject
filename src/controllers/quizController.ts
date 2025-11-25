import { Request, Response } from 'express';
import {Prisma} from '../../generated/prisma/index.js';        
import {prisma} from '../prisma.js'
import * as handlerFactory from './handlerFactory.js';
import { quizSchema } from '../schemas/quiz.schema.js';

const model = prisma.quiz;

export const getAllQuiz = handlerFactory.getAll(model);

export const findQuizById = handlerFactory.getOne(model);

export const findQuizByName = async (req:Request, res:Response) => {
    const { name } = req.params;
    const quiz = await prisma.quiz.findMany({
        where: { title: { contains: name } },
    });
    res.status(200).json({ quiz });
}
export const createQuiz = handlerFactory.createOne(model, quizSchema);

export const deleteQuiz = handlerFactory.deleteOne(model);

export const topFiveRatedQuizzes = async (req:Request, res:Response) => {
    const {limit, sort} = req.query;
    const sortDirection = sort === 'asc' ? Prisma.sql`ASC` : Prisma.sql`DESC`;
    const quizzes = await prisma.$queryRaw`
        SELECT q.title, AVG(r.rating) as average_rating FROM "Quiz" q
        INNER JOIN "Review" r ON q.quiz_id = r.quiz_id
        GROUP BY q.quiz_id, q.title
        ORDER BY AVG(r.rating) ${sort === 'asc' ? 'ASC' : 'DESC'}
        LIMIT ${Number(limit) || 5};
    `;
    res.status(200).json({ quizzes });
}