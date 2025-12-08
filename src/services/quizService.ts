import { Prisma } from '@prisma/client';
import { prisma } from '../prisma.js'
import AppError from '../utils/appError.js';

interface SortedQuizByRating {
    title: string;
    average_rating: number;
}
interface updateQuizData {
    title?: string;
    quiz_description?: string;
    attempt_limit?: number | null;
    time_limit?: number | null;
    difficulty?: 'easy' | 'medium' | 'hard' | null;
}
interface QuizData {
    title: string;
    quiz_description?: string;
    attempt_limit?: number | null;
    time_limit?: number | null;
    difficulty?: 'easy' | 'medium' | 'hard' | null;
    questions: QuestionData[];
}
interface QuestionData {
    question_text: string;
    question_type: 'single_choice' | 'multiple_choice' | 'free_text';
    points?: number;
    options: OptionData[];
}
interface OptionData {
    optionText: string;
    is_correct?: boolean;
}
interface Answer {
    question_id: number;
    selected_option_ids?: number[];
    free_text_answer?: string;
};
interface getTopBookmarkedQuizzes {
    quiz_id: number;
    title: string;
    bookmark_count: number;
    author_name: string;
}

type QuestionWithOptions = Prisma.QuestionGetPayload<{
    include: { answer_options: true }
}>;

export default class QuizService {
    private async verifyQuizOwnership(tx: any, quizId: number, userId: number): Promise<void> {
        const existingQuiz = await tx.quiz.findUnique({ where: { id: quizId } });
        if (!existingQuiz) {
            throw new AppError('Quiz not found', 404);
        }
        if (existingQuiz.author_id !== userId) {
            throw new AppError('You do not have permission to modify this quiz', 403);
        }
    }
    private calculateAnswerScore(question: QuestionWithOptions, selected_option_ids: number[] | undefined, free_text_answer?: string): number {
        let answerScore = 0;
        if (question.question_type === 'free_text') {
            const correctAnswerOption = question.answer_options[0];
            const correctAnswerText = correctAnswerOption ? correctAnswerOption.answer_text : '';
            if (free_text_answer && free_text_answer.toLowerCase().trim() === correctAnswerText.toLowerCase().trim()) {
                answerScore = question.points;
            } else {
                answerScore = 0;
            }
        } else {
            if (selected_option_ids) {
                const correctOptions = question.answer_options.filter((o: any) => o.is_correct);
                const totalCorrectOptionsCount = correctOptions.length;
                let correctlySelectedCount = 0;
                let wronglySelectedCount = 0;
                for (const selectedId of selected_option_ids) {
                    const option = question.answer_options.find((o: any) => o.id === selectedId);
                    if (!option) {
                        throw new AppError(`Option ID ${selectedId} does not belong to question ${question.id}`, 400);
                    }
                    if (option.is_correct) {
                        correctlySelectedCount++;
                    } else {
                        wronglySelectedCount++;
                    }
                }
                if (totalCorrectOptionsCount === 0) {
                    answerScore = 0;
                } else if (wronglySelectedCount > 0) {
                    answerScore = 0;
                } else {
                    answerScore = question.points * (correctlySelectedCount / totalCorrectOptionsCount);
                }
            }
        }
        return answerScore;
    }

    async findQuizByName(name: string) {
        const quizzes = await prisma.quiz.findMany({
            where: { title: { contains: name } },
            include: {
                _count: {
                    select: { questions: true, quiz_attempts: true }
                },
                reviews: true
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
                description: quiz.quiz_description,
                total_questions: quiz._count.questions,
                total_attempts: quiz._count.quiz_attempts,
                average_rating: averageRating
            };
        });
    }
    async getFullyDetailedQuizById(quizId: number) {
        const quiz = await prisma.quiz.findUnique({
            where: { id: quizId },
            include: {
                questions: {
                    include: {
                        answer_options: true
                    }
                },
                reviews: {
                    select: {
                        user_id: true,
                        rating: true,
                        review_text: true,
                        created_at: true
                    },
                    take: 10,
                    orderBy: { created_at: 'desc' }
                }
            }
        });
        return quiz;
    }
    async updateQuiz(quizId: number, quizData: updateQuizData, userId: number) {
        return await prisma.$transaction(async (tx) => {
            await this.verifyQuizOwnership(tx, quizId, userId);
            return await tx.quiz.update({
                where: { id: quizId },
                data: quizData
            });
        });
    }
    async softDeleteQuiz(quizId: number, userId: number) {
        return await prisma.$transaction(async (tx) => {
            await this.verifyQuizOwnership(tx, quizId, userId);
            return await tx.quiz.update({
                where: { id: quizId },
                data: { is_active: false }
            });
        });
    }
    async getSortedQuizByRating(limit: number, sort: 'asc' | 'desc', page: number, rating: { gte: number; lte: number }) {
        const sortDirection = sort === 'asc' ? Prisma.sql`ASC` : Prisma.sql`DESC`;
        const offset = (page - 1) * limit;
        const quizzes = await prisma.$queryRaw<SortedQuizByRating[]>`
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
    async createQuizComplex(quizData: QuizData, authorId: number) {
        return await prisma.$transaction(async (tx) => {
            const { title, quiz_description, attempt_limit, time_limit, difficulty, questions } = quizData;
            const newQuiz = await tx.quiz.create({
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
                const newQuestion = await tx.question.create({
                    data: {
                        quiz_id: newQuiz.id,
                        question_text,
                        question_type,
                        points: questionData.points || 1
                    }
                });
                for (const option of options) {
                    const { optionText, is_correct } = option;
                    await tx.answerOption.create({
                        data: {
                            question_id: newQuestion.id,
                            answer_text: optionText,
                            is_correct: is_correct || false
                        }
                    });
                }
            }
            return await tx.quiz.findUnique({
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
        return await prisma.$transaction(async (tx) => {
            const quiz = await tx.quiz.findUnique({ where: { id: quizId } });
            if (!quiz) {
                throw new AppError('Quiz not found', 404);
            }

            const attemptCount = await tx.quizAttempt.count({
                where: {
                    quiz_id: quizId,
                    user_id: userId
                }
            });
            if (quiz.attempt_limit !== null && attemptCount >= quiz.attempt_limit) {
                throw new AppError('Attempt limit reached for this quiz', 400);
            }
            const existingAttempt = await tx.quizAttempt.findFirst({
                where: {
                    quiz_id: quizId,
                    user_id: userId,
                    finished_at: null
                }
            });
            if (existingAttempt) {
                throw new AppError('You have an ongoing attempt for this quiz', 400);
            }
            return await tx.quizAttempt.create({
                data: {
                    quiz_id: quizId,
                    user_id: userId,
                    started_at: new Date()
                }
            });
        });
    }
    async submitQuizAttempt(attemptId: number, answers: Answer[]) {
        return await prisma.$transaction(async (tx) => {
            const attempt = await tx.quizAttempt.findUnique({ where: { id: attemptId } });
            if (!attempt) {
                throw new AppError('Quiz attempt not found', 404);
            }
            if (attempt.finished_at) {
                throw new AppError('This attempt is already submitted', 400);
            }

            let totalQuizScore = 0;

            for (const answer of answers) {
                let { question_id, selected_option_ids, free_text_answer } = answer;
                let answerScore = 0;
                const question = await tx.question.findUnique({
                    where: { id: question_id },
                    include: { answer_options: true }
                });

                if (!question) {
                    throw new AppError(`Question with ID ${question_id} not found`, 404);
                }
                answerScore = this.calculateAnswerScore(question, selected_option_ids, free_text_answer);
                totalQuizScore += answerScore;

                const questionResponse = await tx.questionResponse.create({
                    data: {
                        free_text_answer: free_text_answer || null,
                        earned_points: answerScore,
                        question_id,
                        quiz_attempt_id: attemptId
                    }
                });
                if (selected_option_ids && selected_option_ids.length > 0) {
                    await tx.selectedAnswer.createMany({
                        data: selected_option_ids.map(optionId => ({
                            answer_option_id: optionId,
                            question_response_id: questionResponse.id
                        }))
                    });
                }
            }

            return await tx.quizAttempt.update({
                where: { id: attemptId },
                data: {
                    finished_at: new Date(),
                    score: totalQuizScore
                }
            });

        });

    }
    async getQuizResults(attemptId: number) {
        const attempt = await prisma.quizAttempt.findUnique({
            where: { id: attemptId },
            include: {
                question_responses: {
                    include: {
                        question: true,
                        selected_answers: {
                            include: {
                                answer_option: true
                            }
                        }
                    }
                }
            }
        });
        if (!attempt) {
            throw new AppError('Quiz attempt not found', 404);
        }
        const totalPointsEarned = attempt.question_responses.reduce((sum, response) => response.earned_points ? sum + response.earned_points : sum, 0);
        const totalPossiblePoints = attempt.question_responses.reduce((sum, response) => sum + response.question.points, 0);
        return {
            attemptId: attempt.id,
            userId: attempt.user_id,
            quizId: attempt.quiz_id,
            totalPointsEarned,
            totalPossiblePoints,
            questionResponses: attempt.question_responses.map(response => ({
                questionId: response.question_id,
                questionText: response.question.question_text,
                earnedPoints: response.earned_points,
                possiblePoints: response.question.points,
                selectedAnswers: response.selected_answers.map(sa => ({
                    answerOptionId: sa.answer_option_id,
                    answerText: sa.answer_option.answer_text,
                    isCorrect: sa.answer_option.is_correct
                })),
                freeTextAnswer: response.free_text_answer
            }))
        };
    }

    async getTopBookmarkedQuizzes(limit: number = 5) {
        return await prisma.$queryRaw <getTopBookmarkedQuizzes[]>`
            SELECT 
                q.id as quiz_id, 
                q.title,
                COUNT(b.user_id)::int as bookmark_count,
                u.username as author_name
            FROM "Quiz" q
            LEFT JOIN "Bookmark" b ON q.id = b.quiz_id
            LEFT JOIN "User" u ON q.author_id = u.id
            GROUP BY q.id, q.title, u.username
            HAVING COUNT(b.user_id) > 0
            ORDER BY bookmark_count DESC
            LIMIT ${limit};
        `;
    }
}