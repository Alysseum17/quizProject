import {prisma} from '../prisma.js'

interface TopUsersByQuizScore {
    username: string;
    average_score: number;
    rank: number;
}

interface TopAuthorsByQuizAttempts {
    username: string;
    total_attempts: number;
    rank: number;
}

interface TopAuthorsByQuizCounts {
    username: string;
    total_quizzes: number;
    rank: number;
}

interface TopAuthorsByAverageQuizRating {
    username: string;
    average_rating: number;
    rank: number;
}

interface ProlificAuthor {
    username: string;
    quiz_count: number;
    rank: number;
}

interface HighPerformanceUser {
    username: string;
    average_score: number;
    rank: number;
}

interface UserQuizStats {
    user_id: number;
    quiz_id: number;
    total_attempts: number;
    best_score: number;
    last_attempt_date: Date;
    last_score: number;
}

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
    async getUserWithDetails(userId: number) {
   
        const [userStats, ratingStats] = await Promise.all([
        prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                username: true,
                email: true,
                _count: {
                    select: {
                        quizzes: true,       
                        quiz_attempts: true 
                    }
                }
            }
        }),
        prisma.review.aggregate({
            _avg: {
                rating: true
            },
            where: {
                quiz: {
                    author_id: userId
                }
            }
        })
    ]);

    if (!userStats) return null;

    return {
        id: userStats.id,
        username: userStats.username,
        email: userStats.email,
        total_quizzes: userStats._count.quizzes,
        total_quiz_attempts: userStats._count.quiz_attempts,
        average_quiz_rating: Number(ratingStats._avg.rating) || 0 
    };
}
    async getUserQuizes(userId: number) {
        const quizzes = await prisma.quiz.findMany({
            where: { author_id: userId },
            include: {
                _count: {  
                    select:{
                        quiz_attempts: true,
                    }
                },
                reviews: {
                    select: {
                        rating: true
                    }
                }
            }
        });
        return quizzes.map(quiz => {
            const totalRatings = quiz.reviews.reduce((sum, review) => sum + Number(review.rating), 0);
            const averageRating =
                quiz.reviews.length > 0
                    ? totalRatings / quiz.reviews.length
                    : 0;
            return {
                quiz_id: quiz.id,
                title: quiz.title,
                quiz_description: quiz.quiz_description,
                created_at: quiz.created_at,
                total_attempts: quiz._count.quiz_attempts,
                average_rating: averageRating
            };
        });
    }

    async findTopUsersByQuizScore(limit: number, page: number) {
        const offset = (page - 1) * limit;
        return prisma.$queryRaw<TopUsersByQuizScore[]>`
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
        return prisma.$queryRaw<TopAuthorsByQuizAttempts[]>`
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
        return prisma.$queryRaw<TopAuthorsByQuizCounts[]>`
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
        return prisma.$queryRaw<TopAuthorsByAverageQuizRating[]>`
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
        return prisma.$queryRaw<ProlificAuthor[]>`
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
    async getHighPerformanceUsers(limit: number, page: number) {
        const offset = (page - 1) * limit;
        return prisma.$queryRaw<HighPerformanceUser[]>`
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

    async getUserQuizStats(userId: number, quizId: number) {
        return prisma.$queryRaw<UserQuizStats[]>`
            SELECT 
                qa.user_id,
                qa.quiz_id,
                COUNT(qa.attempt_id)::int AS total_attempts,
                MAX(qa.score) AS best_score,
                MAX(qa.finished_at) AS last_attempt_date,
                (SELECT score 
                FROM "QuizAttempt" qa2 
                WHERE qa2.user_id = qa.user_id 
                    AND qa2.quiz_id = qa.quiz_id 
                ORDER BY started_at DESC 
                LIMIT 1) AS last_score
            FROM "QuizAttempt" qa
            WHERE qa.user_id = ${userId} AND qa.quiz_id = ${quizId}
            GROUP BY qa.user_id, qa.quiz_id;
`
    }
}

