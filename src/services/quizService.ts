import { Prisma } from '@prisma/client';
import {prisma} from '../prisma.js'
export default class QuizService {
    async findQuizByName(name: string) {
        return prisma.quiz.findMany({
            where: { title: { contains: name } },
        });
    }
    async getSortedQuizByRating(limit: number, sort: 'asc' | 'desc', rating: { gte: number; lte: number }) {
        const sortDirection = sort === 'asc' ? Prisma.sql`ASC` : Prisma.sql`DESC`;
        const quizzes = await prisma.$queryRaw`
            SELECT q.title, AVG(r.rating) as average_rating FROM "Quiz" q
            INNER JOIN "Review" r ON q.quiz_id = r.quiz_id
            GROUP BY q.quiz_id, q.title
            HAVING AVG(r.rating) >= ${rating.gte} AND AVG(r.rating) <= ${rating.lte}
            ORDER BY AVG(r.rating) ${sortDirection}
            LIMIT ${limit};
        `;
        return quizzes;
    }
}