import { prisma } from '../prisma.js';
import AppError from '../utils/appError.js';

export default class BookmarkService {

    async addBookmark(userId: number, quizId: number) {

        const quiz = await prisma.quiz.findUnique({
            where: { id: quizId }
        });
        if (!quiz) {
            throw new AppError('Quiz not found', 404);
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
        const bookmarks = await prisma.bookmark.findMany({
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
                            select: { username: true }
                        },
                        _count: {
                            select: { questions: true }
                        }
                    }
                }
            },
            skip: offset,
            take: limit,
            orderBy: {
                created_at: 'desc'
            }
        });
        return bookmarks.map(b => ({ ...b.quiz, bookmarked_at: b.created_at }))
    }
}



