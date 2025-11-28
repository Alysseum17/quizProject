import { Prisma } from '@prisma/client';
import {prisma} from '../prisma.js'
export default class QuizService {
    async findQuizByName(name: string) {
        return prisma.quiz.findMany({
            where: { title: { contains: name } },
        });
    }
    async getSortedQuizByRating(limit: number, sort: 'asc' | 'desc', page: number, rating: { gte: number; lte: number }) {
        const sortDirection = sort === 'asc' ? Prisma.sql`ASC` : Prisma.sql`DESC`;
        const offset = (page - 1) * limit;
        const quizzes = await prisma.$queryRaw`
            SELECT q.title, AVG(r.rating) as average_rating FROM "Quiz" q
            INNER JOIN "Review" r ON q.quiz_id = r.quiz_id
            GROUP BY q.quiz_id, q.title
            HAVING AVG(r.rating) >= ${rating.gte} AND AVG(r.rating) <= ${rating.lte}
            ORDER BY AVG(r.rating) ${sortDirection}
            LIMIT ${limit}
            OFFSET ${offset}
        `;
        return quizzes;
    }
    async createQuizComplex(quizData: any, authorId: number) {
        return await prisma.$transaction(async (prisma) => {
            const { title, quiz_description,  attempt_limit, time_limit, difficulty, questions } = quizData;
            const newQuiz = await prisma.quiz.create({
                data: {
                    title,
                    quiz_description, 
                    attempt_limit,
                    time_limit,
                    difficulty,
                    author_id: authorId 
                }
            }); 
            for (const questionData of questions) {
                const { question_text, question_type, options } = questionData;
                const newQuestion = await prisma.question.create({
                    data: {
                        quiz_id: newQuiz.id,
                        question_text,
                        question_type,
                        points: questionData.points || 1
                    }
                });
                for (const option of options) {
                    const { optionText, isCorrect } = option;
                    await prisma.answerOption.create({
                        data: {
                            question_id: newQuestion.id,
                            answer_text: optionText,
                            is_correct: isCorrect || false
                        }
                    });
                }
            }
            return await prisma.quiz.findUnique({
                where: { id: newQuiz.id },
                include: {
                    questions: {
                        include: {
                            answer_options: true
                        }
                    }
                }
            });
                
        });
    }
    async startQuizAttempt(quizId: number, userId: number) {
        return await prisma.$transaction(async (prisma) => {
            const quiz = await prisma.quiz.findUnique({ where: { id: quizId } });
            if (!quiz) {
                throw new Error('Quiz not found');
            }
            const attemptCount = await prisma.quizAttempt.count({
                where: {
                    quiz_id: quizId,
                    user_id: userId
                }
            });
            if (quiz.attempt_limit !== null && attemptCount >= quiz.attempt_limit) {
                throw new Error('Attempt limit reached for this quiz');
            }
            const newAttempt = await prisma.quizAttempt.create({
                data: {
                    quiz_id: quizId,
                    user_id: userId,
                    started_at: new Date()
                }
            });
            return newAttempt;
        });
    }
}