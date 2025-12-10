import { prisma } from '../prisma.js';
import { Prisma } from '@prisma/client';
import AppError from '../utils/appError.js';

interface GetTopBookmarkedQuizzes {
    quiz_id: number;
    title: string;
    bookmark_count: number;
    author_name: string;
}


export default class BookmarkService {

    async addBookmark(userId: number, quizId: number) {

        const quiz = await prisma.quiz.findUnique({
            where: {
                id: quizId,
                is_active: true
            }
        });

        if (!quiz) {
            throw new AppError('Quiz not found or inactive', 404);
        }

        const existingBookmark = await prisma.bookmark.findUnique({
            where: {
                user_id_quiz_id: {
                    user_id: userId,
                    quiz_id: quizId
                }
            }
        });

        if (existingBookmark) {
            throw new AppError('This quiz is already in your bookmarks', 400);
        }

        const bookmark = await prisma.bookmark.create({
            data: {
                user_id: userId,
                quiz_id: quizId
            }
        });
        return bookmark;
    }

    async removeBookmark(userId: number, quizId: number) {
        try {
            await prisma.bookmark.delete({
                where: {
                    user_id_quiz_id: {
                        user_id: userId,
                        quiz_id: quizId
                    }
                }
            });
        } catch (error: any) {
            if (error.code === 'P2025') {
                throw new AppError('Bookmark not found', 404);
            }
            throw error;

        }
    }

    async getMyBookmarks(userId: number, page: number, limit: number) {
        const offset = (page - 1) * limit;

        const [total, bookmarks] = await Promise.all([
            prisma.bookmark.count({
                where: { user_id: userId }
            }),
            prisma.bookmark.findMany({
                where: { user_id: userId },
                include: {
                    quiz: {
                        select: {
                            id: true,
                            title: true,
                            quiz_description: true,
                            difficulty: true,
                            time_limit: true,
                            author: {
                                select: {
                                    id: true,
                                    username: true,
                                    avatar_url: true
                                }
                            },
                            _count: {
                                select: {
                                    questions: true,
                                    quiz_attempts: true,
                                    reviews: true
                                }
                            },
                            reviews: {
                                select: { rating: true }
                            }
                        }
                    }
                },
                skip: offset,
                take: limit,
                orderBy: { created_at: 'desc' }
            })
        ]);

        const items = bookmarks.map(b => {
            const totalRating = b.quiz.reviews.reduce((sum, r) => sum + Number(r.rating), 0);
            const avgRating = b.quiz.reviews.length > 0
                ? (totalRating / b.quiz.reviews.length).toFixed(1)
                : 0;

            const { reviews, ...quizData } = b.quiz;

            return {
                ...quizData,
                average_rating: Number(avgRating),
                bookmarked_at: b.created_at
            };
        });

        const totalPages = Math.ceil(total / limit);
        const hasNextPage = page < totalPages;
        const hasPrevPage = page > 1;

        return {
            items,
            pagination: {
                page,
                limit,
                total,
                totalPages,
                hasNextPage,
                hasPrevPage
            }
        };
    }

    async updateBookmarkNote(userId: number, quizId: number, note: string) {
        try {
            const updatedBookmark = await prisma.bookmark.update({
                where: {
                    user_id_quiz_id: {
                        user_id: userId,
                        quiz_id: quizId
                    }
                },
                data: {
                    note: note
                }
            });
            return updatedBookmark;
        } catch (error: any) {
            if (error.code === 'P2025') {
                throw new AppError('Bookmark not found', 404);
            }
            throw error;
        }
    }

    async getTopBookmarkedQuizzes(limit: number = 5) {
        return await prisma.$queryRaw<GetTopBookmarkedQuizzes[]>`
            SELECT 
                q.quiz_id as quiz_id, 
                q.title,
                COUNT(b.user_id)::int as bookmark_count,
                u.username as author_name
            FROM "Quiz" q
            LEFT JOIN "Bookmark" b ON q.quiz_id = b.quiz_id
            LEFT JOIN "User" u ON q.author_id = u.user_id
            GROUP BY q.quiz_id, q.title, u.username
            HAVING COUNT(b.user_id) > 0
            ORDER BY bookmark_count DESC
            LIMIT ${limit};
        `;
    }

    async cleanupInactiveBookmarks(userId: number) {
        return await prisma.$transaction(async (tx) => {
            const inactiveBookmarks = await tx.bookmark.findMany({
                where: {
                    user_id: userId,
                    quiz: {
                        is_active: false
                    }
                },
                select: { quiz_id: true }
            });

            const count = inactiveBookmarks.length;

            if (count === 0) {
                return { count: 0, message: 'No inactive bookmarks found' };
            }

            const idsToDelete = inactiveBookmarks.map(b => b.quiz_id);

            await tx.bookmark.deleteMany({
                where: {
                    user_id: userId,
                    quiz_id: { in: idsToDelete }
                }
            });

            return {
                count,
                message: `Successfully removed ${count} inactive bookmarks`
            };
        });
    }

    async bulkAddBookmarks(userId: number, quizIds: number[]) {
        return await prisma.$transaction(async (tx) => {
            const validQuizzes = await tx.quiz.findMany({
                where: {
                    id: { in: quizIds },
                    is_active: true
                },
                select: { id: true }
            });

            const validQuizIds = validQuizzes.map(q => q.id);

            if (validQuizIds.length === 0) {
                throw new AppError('No valid active quizzes found to add', 400);
            }

            const existingBookmarks = await tx.bookmark.findMany({
                where: {
                    user_id: userId,
                    quiz_id: { in: validQuizIds }
                },
                select: { quiz_id: true }
            });

            const existingIds = new Set(existingBookmarks.map(b => b.quiz_id));

            const newBookmarksData = validQuizIds
                .filter(id => !existingIds.has(id))
                .map(quizId => ({
                    user_id: userId,
                    quiz_id: quizId
                }));

            if (newBookmarksData.length > 0) {
                await tx.bookmark.createMany({
                    data: newBookmarksData
                });
            }

            return {
                requested: quizIds.length,
                added: newBookmarksData.length,
                duplicates_skipped: existingBookmarks.length,
                invalid_skipped: quizIds.length - validQuizIds.length
            };
        });
    }
}

