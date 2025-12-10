import {prisma} from '../prisma.js'
import {Prisma} from '@prisma/client';

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
            where: { email, is_active: true },
        });
    }
    async findUsersByName(name: string, limit: number, page: number) {
        const offset = (page - 1) * limit;
        const [total, users] = await Promise.all([
            prisma.user.count({
                where: { username: { contains: name }, is_active: true },
            }),
        prisma.user.findMany({
            where: { username: { contains: name }, is_active: true },
            take: limit,
            skip: offset,
        })
        ]);
        const totalPages = Math.ceil(total / limit);
        const hasNextPage = page < totalPages;
        const hasPrevPage = page > 1;
        return {
            pagination: {
                totalItems: total,
                totalPages,
                currentPage: page,
                hasNextPage,
                hasPrevPage,
            },
            items:users,
        };
    }
    async findUserById(userId: number) {
        return prisma.user.findUnique({
            where: { id: userId, is_active: true },
        });
    }
    async getUserWithDetails(userId: number) {
   
        const [userStats, ratingStats] = await Promise.all([
        prisma.user.findUnique({
            where: { id: userId, is_active: true },
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
                    author_id: userId, 
                    is_active: true
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
    async getUserQuizes(userId: number, limit: number, page: number) {
        const offset = (page - 1) * limit;
        const total = await prisma.quiz.count({
            where: { author_id: userId, is_active: true },
        });
        const quizzes = await prisma.quiz.findMany({
            where: { author_id: userId, is_active: true },
            take: limit,
            skip: offset,
            select: {
                id: true,
                title: true,
                quiz_description: true,
                created_at: true,
                _count: { select: { quiz_attempts: true } },
            }
        });
        const quizIds = quizzes.map(quiz => quiz.id);

        const ratings = await prisma.review.groupBy({
            by: ['quiz_id'],
            where: { quiz_id: { in: quizIds } },
            _avg: { rating: true }
        });

        const ratingsMap: Map<number, number> = new Map();
        ratings.forEach(rating => {
            ratingsMap.set(rating.quiz_id, Number(rating._avg.rating) || 0);
        });

        const mappedQuizzes = quizzes.map(quiz => ({
            ...quiz,
            total_attempts: quiz._count.quiz_attempts,
            average_rating: ratingsMap.get(quiz.id)
        }));
        const totalPages = Math.ceil(total / limit);
        const hasNextPage = page < totalPages;
        const hasPrevPage = page > 1;
        return {
            pagination: {
                totalItems: total,
                totalPages,
                currentPage: page,
                hasNextPage,
                hasPrevPage,
            },
            items: mappedQuizzes,
        };
    }

    async findTopUsersByQuizScore(limit: number, page: number) {
        const offset = (page - 1) * limit;
        const [total, users] = await Promise.all([
            prisma.$queryRaw<{ count: bigint }[]>`
                SELECT COUNT(DISTINCT u.user_id) as count FROM "User" u
                INNER JOIN "QuizAttempt" s ON u.user_id = s.user_id AND u.is_active
            `,
            prisma.$queryRaw<TopUsersByQuizScore[]>`
            SELECT u.username, COALESCE(AVG(s.score), 0) as average_score, DENSE_RANK() OVER (ORDER BY AVG(s.score) DESC)::int as rank FROM "User" u
            INNER JOIN "QuizAttempt" s ON u.user_id = s.user_id AND u.is_active
            GROUP BY u.user_id, u.username
            ORDER BY average_score DESC NULLS LAST
            LIMIT ${limit}
            OFFSET ${offset}
        `]);
        const totalCount = total[0]?.count ? Number(total[0].count) : 0;
        const totalPages = Math.ceil(totalCount / limit);
        const hasNextPage = page < totalPages;
        const hasPrevPage = page > 1;
        return {
            pagination: {
                totalItems: totalCount,
                totalPages,
                currentPage: page,
                hasNextPage,
                hasPrevPage,
            },
            items:users
        };
    }
    async findTopAuthorsByQuizAttempts(limit: number, page: number) {
        const offset = (page - 1) * limit;
        const [total, authors] = await Promise.all([
            prisma.$queryRaw<{ count: bigint }[]>`
                SELECT COUNT(DISTINCT u.user_id) as count FROM "User" u
                INNER JOIN "Quiz" q ON u.user_id = q.author_id AND q.is_active AND u.is_active
                INNER JOIN "QuizAttempt" qa ON q.quiz_id = qa.quiz_id
            `,
        
            prisma.$queryRaw<TopAuthorsByQuizAttempts[]>`
            SELECT u.username, COUNT(qa.quiz_attempt_id)::int as total_attempts, DENSE_RANK() OVER (ORDER BY COUNT(qa.quiz_attempt_id) DESC)::int as rank FROM "User" u
            INNER JOIN "Quiz" q ON u.user_id = q.author_id AND q.is_active AND u.is_active
            INNER JOIN "QuizAttempt" qa ON q.quiz_id = qa.quiz_id
            GROUP BY u.user_id, u.username
            ORDER BY total_attempts DESC NULLS LAST
            LIMIT ${limit}
            OFFSET ${offset}
        `]);
        const totalCount = total[0]?.count ? Number(total[0].count) : 0;
        const totalPages = Math.ceil(totalCount / limit);
        const hasNextPage = page < totalPages;
        const hasPrevPage = page > 1;
        return {
            pagination: {
                totalItems: totalCount,
                totalPages,
                currentPage: page,
                hasNextPage,
                hasPrevPage,
            },
            items:authors
        };
    }

    async findTopAuthorsByQuizCounts(limit: number, page: number) {
        const offset = (page - 1) * limit;
        const [total, authors] = await Promise.all([
            prisma.$queryRaw<{ count: bigint }[]>`
                SELECT COUNT(DISTINCT u.user_id) as count FROM "User" u
                INNER JOIN "Quiz" q ON u.user_id = q.author_id AND q.is_active AND u.is_active
            `,
            prisma.$queryRaw<TopAuthorsByQuizCounts[]>`
            SELECT u.username, COUNT(q.quiz_id)::int as total_quizzes, DENSE_RANK() OVER (ORDER BY COUNT(q.quiz_id) DESC)::int as rank FROM "User" u
            INNER JOIN "Quiz" q ON u.user_id = q.author_id AND q.is_active AND u.is_active
            GROUP BY u.user_id, u.username
            ORDER BY total_quizzes DESC NULLS LAST
            LIMIT ${limit}
            OFFSET ${offset}
        `]);
        const totalCount = total[0]?.count ? Number(total[0].count) : 0;
        const totalPages = Math.ceil(totalCount / limit);
        const hasNextPage = page < totalPages;
        const hasPrevPage = page > 1;
        return {
            pagination: {
                totalItems: totalCount,
                totalPages,
                currentPage: page,
                hasNextPage,
                hasPrevPage,
            },
            items: authors
        };
    }
    async findTopAuthorsByAverageQuizRating(limit: number, page: number) {
        const offset = (page - 1) * limit;
        const [total, authors] = await Promise.all([
            prisma.$queryRaw<{ count: bigint }[]>`
                SELECT COUNT(DISTINCT u.user_id) as count FROM "User" u
                INNER JOIN "Quiz" q ON u.user_id = q.author_id AND q.is_active AND u.is_active
                INNER JOIN "Review" r ON q.quiz_id = r.quiz_id
            `,
            prisma.$queryRaw<TopAuthorsByAverageQuizRating[]>`
            SELECT u.username, AVG(r.rating) as average_rating, DENSE_RANK() OVER (ORDER BY AVG(r.rating) DESC)::int as rank FROM "User" u
            INNER JOIN "Quiz" q ON u.user_id = q.author_id AND q.is_active AND u.is_active
            INNER JOIN "Review" r ON q.quiz_id = r.quiz_id
            GROUP BY u.user_id, u.username
            ORDER BY average_rating DESC NULLS LAST
            LIMIT ${limit}
            OFFSET ${offset}
        `]);
        const totalCount = total[0]?.count ? Number(total[0].count) : 0;
        const totalPages = Math.ceil(totalCount / limit);
        const hasNextPage = page < totalPages;
        const hasPrevPage = page > 1;
        return {
            pagination: {
                totalItems: totalCount,
                totalPages,
                currentPage: page,
                hasNextPage,
                hasPrevPage,
            },
            items: authors
        };
    }
    async changeUserInfo(userId: number, data: { username?: string; email?: string }) {
        return prisma.user.update({
            where: { id: userId },
            data: { username: data.username, email: data.email },
        });
    }

    async getProlificAuthors(limit: number, page: number) {
        const offset = (page - 1) * limit;
        const [total, authors] = await Promise.all([
            prisma.$queryRaw<{ count: bigint }[]>`
                SELECT COUNT(*) as count FROM (
                    SELECT u.user_id
                    FROM "User" u
                    LEFT JOIN "Quiz" q ON u.user_id = q.author_id AND q.is_active AND u.is_active
                    GROUP BY u.user_id
                    HAVING COUNT(q.quiz_id) > (
                        SELECT AVG(quiz_count) FROM (
                            SELECT COUNT(q2.quiz_id) AS quiz_count
                            FROM "User" u2
                            LEFT JOIN "Quiz" q2 ON u2.user_id = q2.author_id AND q2.is_active AND u2.is_active
                            GROUP BY u2.user_id
                        ) AS AvgQuizCounts
                    )
                ) AS ProlificAuthors;
            `,
            prisma.$queryRaw<ProlificAuthor[]>`
            WITH AuthorQuizCounts AS (
                SELECT 
                    u.user_id,
                    u.username,
                    COUNT(q.quiz_id)::int AS quiz_count
                FROM 
                    "User" u
                LEFT JOIN 
                    "Quiz" q ON u.user_id = q.author_id AND q.is_active AND u.is_active
                GROUP BY 
                    u.user_id, u.username
            ),
            AverageQuizCount AS (
                SELECT 
                    AVG(quiz_count)::float AS avg_quiz_count
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
        `]);
        const totalCount = total[0]?.count ? Number(total[0].count) : 0;
        const totalPages = Math.ceil(totalCount / limit);
        const hasNextPage = page < totalPages;
        const hasPrevPage = page > 1;
        return {
            pagination: {
                totalItems: totalCount,
                totalPages,
                currentPage: page,
                hasNextPage,
                hasPrevPage,
            },
            items: authors
        };
    }
    async getHighPerformanceUsers(limit: number, page: number) {
        const offset = (page - 1) * limit;
        const cte = Prisma.sql`
            WITH UserAverageScores AS (
                        SELECT 
                            u.user_id,
                            u.username,
                            AVG(qa.score) AS average_score
                        FROM 
                            "User" u
                        INNER JOIN 
                            "QuizAttempt" qa ON u.user_id = qa.user_id AND u.is_active
                        GROUP BY 
                            u.user_id,
                            u.username
                    ),
                    AverageOfAverages AS (
                        SELECT 
                            AVG(average_score) AS avg_of_avg_scores
                        FROM 
                            UserAverageScores
                    )
                `;
        const [total, users] = await Promise.all([
            prisma.$queryRaw<{ count: bigint }[]>`
                SELECT COUNT(*) as count FROM (
                    ${cte}
                    SELECT 
                        uas.user_id
                    FROM 
                        UserAverageScores uas,
                        AverageOfAverages aoa
                    WHERE 
                        uas.average_score > aoa.avg_of_avg_scores
                ) AS HighPerformanceUsers;
            `,
            prisma.$queryRaw<HighPerformanceUser[]>`
            ${cte}
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
        `]);
        const totalCount = total[0]?.count ? Number(total[0].count) : 0;
        const totalPages = Math.ceil(totalCount / limit);
        const hasNextPage = page < totalPages;
        const hasPrevPage = page > 1;
        return {
            pagination: {
                totalItems: totalCount,
                totalPages,
                currentPage: page,
                hasNextPage,
                hasPrevPage,
            },
            items: users
        };
    }

    async getUserQuizStats(userId: number, quizId: number) {
        return prisma.$queryRaw<UserQuizStats[]>`
            SELECT 
                qa.user_id,
                qa.quiz_id,
                COUNT(qa.quiz_attempt_id)::int AS total_attempts,
                MAX(qa.score)::int AS best_score,
                MAX(qa.finished_at) AS last_attempt_date,
                (SELECT score 
                FROM "QuizAttempt" qa2 
                WHERE qa2.user_id = qa.user_id 
                    AND qa2.quiz_id = qa.quiz_id 
                ORDER BY started_at DESC 
                LIMIT 1)::int AS last_score
            FROM "QuizAttempt" qa
            WHERE qa.user_id = ${userId} AND qa.quiz_id = ${quizId}
            GROUP BY qa.user_id, qa.quiz_id;
`
    }
    async getLastUserActivities(userId: number, limit: number, page: number) {
        const offset = (page - 1) * limit;
        const [total, activities] = await Promise.all([
            prisma.quizAttempt.count({
                where: { user_id: userId, finished_at: { not: null } },
            }),
            prisma.quizAttempt.findMany({
            where: { user_id: userId, finished_at: { not: null } },
            orderBy: { started_at: 'desc' },
            take: limit,
            skip: offset,
            include: {
                quiz: {
                    select: {
                        id: true,
                        title: true,
                        quiz_description: true,
                    }
                }
            }
        })]);
        const totalPages = Math.ceil(total / limit);
        const hasNextPage = page < totalPages;
        const hasPrevPage = page > 1;
        return {
            pagination: {
                totalItems: total,
                totalPages,
                currentPage: page,
                hasNextPage,
                hasPrevPage,
            },
            items: activities,
        };
    }

}

