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
    async changeUserInfo(userId: number, data: { username?: string; email?: string }) {
        return prisma.user.update({
            where: { id: userId },
            data: { username: data.username, email: data.email },
        });
    }

    async getProlificAuthors(limit: number, page: number) {
        const offset = (page - 1) * limit;
        return prisma.$queryRaw`
            WITH AuthorQuizCounts AS (
                SELECT 
                    u.user_id,
                    u.username,
                    COUNT(q.quiz_id) AS quiz_count
                FROM 
                    "User" u
                LEFT JOIN 
                    "Quiz" q ON u.user_id = q.author_id
                GROUP BY 
                    u.user_id, u.username
            ),
            AverageQuizCount AS (
                SELECT 
                    AVG(quiz_count) AS avg_quiz_count
                FROM 
                    AuthorQuizCounts
            )
            SELECT 
                aqc.username,
                aqc.quiz_count,
                DENSE_RANK() OVER (ORDER BY aqc.quiz_count DESC)::int AS rank
            FROM 
                AuthorQuizCounts aqc,
                AverageQuizCount aqc2
            WHERE 
                aqc.quiz_count > aqc2.avg_quiz_count
            ORDER BY 
                aqc.quiz_count DESC NULLS LAST
            LIMIT ${limit}
            OFFSET ${offset};
        `;
    }
    getHighPerfomanceUsers(limit: number, page: number) {
        const offset = (page - 1) * limit;
        return prisma.$queryRaw`
            WITH UserAverageScores AS (
                SELECT 
                    u.user_id,
                    u.username,
                    AVG(qa.score) AS average_score
                FROM 
                    "User" u
                INNER JOIN 
                    "QuizAttempt" qa ON u.user_id = qa.user_id
                GROUP BY 
                    u.user_id, u.username
            ),
            AverageOfAverages AS (
                SELECT 
                    AVG(average_score) AS avg_of_avg_scores
                FROM 
                    UserAverageScores
            )
            SELECT 
                uas.username,
                uas.average_score,
                DENSE_RANK() OVER (ORDER BY uas.average_score DESC)::int AS rank
            FROM 
                UserAverageScores uas,
                AverageOfAverages aoa
            WHERE 
                uas.average_score > aoa.avg_of_avg_scores
            ORDER BY 
                uas.average_score DESC NULLS LAST
            LIMIT ${limit}
            OFFSET ${offset};
        `;
    }
}

