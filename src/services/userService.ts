import {prisma} from '../prisma.js'

export default class UserService {
    async findUserByEmail(email: string) {
        return prisma.user.findUnique({
            where: { email },
        });
    }
    async findUsersByName(name: string, limit: number, page: number) {
        const offset = (page - 1) * limit;
        return prisma.user.findMany({
            where: { username: { contains: name } },
            take: limit,
            skip: offset,
        });
    }
    async findUserById(userId: number) {
        return prisma.user.findUnique({
            where: { id: userId },
        });
    }

    async findTopUsersByQuizScore(limit: number, page: number) {
        const offset = (page - 1) * limit;
        return prisma.$queryRaw`
            SELECT u.username, AVG(s.score) as average_score, DENSE_RANK() OVER (ORDER BY AVG(s.score) DESC)::int as rank FROM "User" u
            INNER JOIN "QuizAttempt" s ON u.user_id = s.user_id
            GROUP BY u.user_id, u.username
            ORDER BY average_score DESC NULLS LAST
            LIMIT ${limit}
            OFFSET ${offset}
        `;
    }
    async findTopAuthorsByQuizAttempts(limit: number, page: number) {
        const offset = (page - 1) * limit;
        return prisma.$queryRaw`
            SELECT u.username, COUNT(qa.quiz_attempt_id)::int as total_attempts, DENSE_RANK() OVER (ORDER BY COUNT(qa.quiz_attempt_id) DESC)::int as rank FROM "User" u
            INNER JOIN "Quiz" q ON u.user_id = q.author_id
            INNER JOIN "QuizAttempt" qa ON q.quiz_id = qa.quiz_id
            GROUP BY u.user_id, u.username
            ORDER BY total_attempts DESC NULLS LAST
            LIMIT ${limit}
            OFFSET ${offset}
        `;
    }

    async findTopAuthorsByQuizCounts(limit: number, page: number) {
        const offset = (page - 1) * limit;
        return prisma.$queryRaw`
            SELECT u.username, COUNT(q.quiz_id)::int as total_quizzes, DENSE_RANK() OVER (ORDER BY COUNT(q.quiz_id) DESC)::int as rank FROM "User" u
            INNER JOIN "Quiz" q ON u.user_id = q.author_id
            GROUP BY u.user_id, u.username
            ORDER BY total_quizzes DESC NULLS LAST
            LIMIT ${limit}
            OFFSET ${offset}
        `;
    }
    async findTopAuthorsByAverageQuizRating(limit: number, page: number) {
        const offset = (page - 1) * limit;
        return prisma.$queryRaw`
            SELECT u.username, AVG(r.rating) as average_rating, DENSE_RANK() OVER (ORDER BY AVG(r.rating) DESC)::int as rank FROM "User" u
            INNER JOIN "Quiz" q ON u.user_id = q.author_id
            INNER JOIN "Review" r ON q.quiz_id = r.quiz_id
            GROUP BY u.user_id, u.username
            ORDER BY average_rating DESC NULLS LAST
            LIMIT ${limit}
            OFFSET ${offset}
        `;
    }
    
}

