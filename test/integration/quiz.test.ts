import request from 'supertest';
import { app } from '../../src/app.js';
import { prisma } from '../../src/prisma.js';
import jwt from 'jsonwebtoken';
import { cleanupDatabase } from '../helpers/cleanup.js';


const createTestQuiz = async (authorId: number, title = 'Test Quiz', attempt_limit?: number) => {
    return await prisma.quiz.create({
        data: {
            title,
            author_id: authorId,
            attempt_limit,
            questions: {
                create: [{
                    question_text: 'Test Q',
                    question_type: 'single_choice',
                    answer_options: { create: [{ answer_text: 'A', is_correct: true }] }
                }]
            }
        },
        include: { questions: { include: { answer_options: true } } }
    });
};

describe('Global Quiz Integration Tests', () => {
    let token: string;
    let userId: number;
    beforeAll(async () => {
        await cleanupDatabase();

        const user = await prisma.user.create({
            data: {
                username: 'global_tester',
                email: 'global@test.com',
                password_hash: 'hashed_placeholder'
            }
        });

        userId = user.id;
        token = jwt.sign(
            { id: user.id },
            process.env.JWT_SECRET as string,
            { expiresIn: '1h' }
        );
    });

    afterAll(async () => {
        await prisma.$disconnect();
    });

    describe('Quiz Management Flow', () => {
        let createdQuizId: number;

        it('POST /complex - should create a new quiz', async () => {
            const response = await request(app)
                .post('/api/quizzes/complex')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    title: 'Sample Quiz',
                    quiz_description: 'A simple test quiz',
                    attempt_limit: 3,
                    time_limit: 30,
                    difficulty: 'easy',
                    questions: [
                        {
                            question_text: 'What is 2 + 2?',
                            question_type: 'single_choice',
                            points: 5,
                            options: [
                                { optionText: '3' },
                                { optionText: '4', isCorrect: true },
                                { optionText: '5' }
                            ]
                        }
                    ]
                });
            expect(response.status).toBe(201);
            expect(response.body.quiz.title).toBe('Sample Quiz');
            expect(response.body.quiz.quiz_description).toBe('A simple test quiz');
            expect(response.body.quiz.attempt_limit).toBe(3);
            expect(response.body.quiz.time_limit).toBe(30);
            expect(response.body.quiz.difficulty).toBe('easy');
            createdQuizId = response.body.quiz.id; 
        });

        it('POST / - should create a basic quiz', async () => {
            const response = await request(app)
                .post('/api/quizzes')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    title: 'Basic Quiz',
                    quiz_description: 'Basic desc',
                    author_id: userId,
                    attempt_limit: 5,
                    time_limit: 20,
                    difficulty: 'medium'
                });
            expect(response.status).toBe(201);
            expect(response.body.newItem.title).toBe('Basic Quiz');
            expect(response.body.newItem.quiz_description).toBe('Basic desc');
            expect(response.body.newItem.attempt_limit).toBe(5);
            expect(response.body.newItem.time_limit).toBe(20);
            expect(response.body.newItem.difficulty).toBe('medium');
        });

        it('GET / - should retrieve quizzes', async () => {
            const response = await request(app).get('/api/quizzes');
            expect(response.status).toBe(200);
            expect(response.body.items.length).toBeGreaterThanOrEqual(1);
        });

        it('GET /:id - should retrieve detail quiz', async () => {
            const response = await request(app).get(`/api/quizzes/${createdQuizId}`);
            expect(response.status).toBe(200);
            expect(response.body.quiz.id).toBe(createdQuizId);
            expect(response.body.quiz.title).toBe('Sample Quiz');
            expect(response.body.quiz.quiz_description).toBe('A simple test quiz');
            expect(response.body.quiz.attempt_limit).toBe(3);
            expect(response.body.quiz.time_limit).toBe(30);
            expect(response.body.quiz.difficulty).toBe('easy');
        });

        it('PUT /:id - should update quiz', async () => {
             const response = await request(app)
                .put(`/api/quizzes/${createdQuizId}`)
                .set('Authorization', `Bearer ${token}`)
                .send({ title: 'Updated Title' });
             expect(response.status).toBe(200);
             expect(response.body.quiz.title).toBe('Updated Title');
        });

        it('DELETE /:id - should soft delete', async () => {
             const response = await request(app)
                .delete(`/api/quizzes/${createdQuizId}`)
                .set('Authorization', `Bearer ${token}`)
                .send({ is_active: false });
             console.log('DEBUG BODY:', JSON.stringify(response.body, null, 2));
             expect(response.status).toBe(200);
             expect(response.body.quiz.is_active).toBe(false);
             expect(response.body.message).toBe('Quiz soft-deleted successfully');
        });
    });
    describe('Quiz errors handling', () => {
        it('GET /:id - should return 404 for non-existent quiz', async () => {
            const response = await request(app).get('/api/quizzes/999999');
            expect(response.status).toBe(404);
            expect(response.body.message).toBe('Quiz not found');
        });
        it('PUT /:id - should return 404 when updating non-existent quiz', async () => {
            const response = await request(app)
                .put('/api/quizzes/999999')
                .set('Authorization', `Bearer ${token}`)
                .send({ title: 'Non-existent Quiz' });
            expect(response.status).toBe(404);
            expect(response.body.message).toBe('Quiz not found');
        });
        it('DELETE /:id - should return 404 when deleting non-existent quiz', async () => {
            const response = await request(app)
                .delete('/api/quizzes/999999')
                .set('Authorization', `Bearer ${token}`)
                .send();
            expect(response.status).toBe(404);
            expect(response.body.message).toBe('Quiz not found');
        });
        it('PUT /:id - should return 403 when updating quiz not owned by user', async () => {
            const anotherUser = await prisma.user.create({
                data: {
                    username: 'another_user',
                    email: 'another_user@example.com',
                    password_hash: 'hashed_placeholder'
                }
            });
            const quiz = await prisma.quiz.create({
                data: {
                    title: 'Another User Quiz',
                    author_id: anotherUser.id
                }
            });
            const response = await request(app)
                .put(`/api/quizzes/${quiz.id}`)
                .set('Authorization', `Bearer ${token}`)
                .send({ title: 'Hacked Title' });
            expect(response.status).toBe(403);
            expect(response.body.message).toBe('You do not have permission to modify this quiz');
        });
        it('DELETE /:id - should return 403 when deleting quiz not owned by user', async () => {
            const anotherUser = await prisma.user.create({
                data: {
                    username: 'third_user',
                    email: 'third_user@example.com',
                    password_hash: 'hashed_placeholder'
                }
            });
            const quiz = await prisma.quiz.create({
                data: {
                    title: 'Third User Quiz',
                    author_id: anotherUser.id
                }
            });
            const response = await request(app)
                .delete(`/api/quizzes/${quiz.id}`)
                .set('Authorization', `Bearer ${token}`)
                .send();
            expect(response.status).toBe(403);
            expect(response.body.message).toBe('You do not have permission to modify this quiz');
        });
    });
    describe('Quiz Attempt Flow', () => {
        let attemptQuizId: number;
        let attemptId: number;
        beforeAll(async () => {
            const quiz = await prisma.quiz.create({
                data: {
                    title: 'Attempt Quiz',
                    author_id: userId,
                    questions: {
                        create: [
                            {
                                question_text: 'Capital of France?',
                                question_type: 'single_choice',
                                points: 5,
                                answer_options: {
                                    create: [
                                        { answer_text: 'Paris', is_correct: true },
                                        { answer_text: 'Berlin' }
                                    ]
                                }
                            }
                        ]
                    }
                }
            });
            attemptQuizId = quiz.id;
        });

        it('POST /start - should start attempt', async () => {
            const response = await request(app)
                .post(`/api/quizzes/${attemptQuizId}/start`)
                .set('Authorization', `Bearer ${token}`)
                .send();
            
            expect(response.status).toBe(201);
            expect(response.body.attempt.finished_at).toBeNull();
            attemptId = response.body.attempt.id;
        });
        it('POST /submit - should submit attempt', async () => {
            const quiz = await prisma.quiz.findUnique({
                where: { id: attemptQuizId },
                include: { questions: { include: { answer_options: true } } }
            });
            if (!quiz || quiz.questions.length === 0) throw new Error('Quiz or questions not found');
            const question = quiz.questions[0];
            const correctAnswerOption = question.answer_options.find(opt => opt.is_correct);
            if (!correctAnswerOption) throw new Error('Correct answer option not found');
            const submitResponse = await request(app)
                .post(`/api/quizzes/attempts/${attemptId}/submit`)
                .set('Authorization', `Bearer ${token}`)
                .send({
                    answers: [
                        {
                            question_id: question.id,
                            selected_option_ids: [correctAnswerOption.id]
                        }
                    ]
                });
            expect(submitResponse.status).toBe(200);
            expect(submitResponse.body.result).toHaveProperty('score');
            expect(submitResponse.body.result.score).toBe(5);
    });
        it('GET /results - should get quiz results', async () => {
            const response = await request(app)
                .get(`/api/quizzes/attempts/${attemptId}/results`)
                .set('Authorization', `Bearer ${token}`)
                .send();
            expect(response.status).toBe(200);
            expect(response.body.results).toHaveProperty('totalPointsEarned');
            expect(response.body.results.totalPointsEarned).toBe(5);
            expect(response.body.results).toHaveProperty('totalPossiblePoints');
            expect(response.body.results.totalPossiblePoints).toBe(5);
            expect(response.body.results).toHaveProperty('questionResponses');
            expect(response.body.results.questionResponses.length).toBe(1);
            expect(response.body.results.questionResponses[0]).toHaveProperty('earnedPoints', 5);
            expect(response.body.results.questionResponses[0]).toHaveProperty('possiblePoints', 5);
            expect(response.body.results.questionResponses[0]).toHaveProperty('selectedAnswers');
            expect(response.body.results.questionResponses[0].selectedAnswers.length).toBe(1);
            expect(response.body.results.questionResponses[0].selectedAnswers[0]).toHaveProperty('answerText', 'Paris');
            expect(response.body.results.questionResponses[0].selectedAnswers[0]).toHaveProperty('isCorrect', true);
        });
    });
    describe('Quiz Attempt Errors Handling', () => {
        it('POST /start - should return 404 when starting attempt for non-existent quiz', async () => {
            const response = await request(app)
                .post('/api/quizzes/999999/start')
                .set('Authorization', `Bearer ${token}`)
                .send();
            expect(response.status).toBe(404);
            expect(response.body.message).toBe('Quiz not found');
        });
        it('POST /start - should return 400 when starting attempt for a quiz that is already started', async () => {
            const quiz = await createTestQuiz(userId, 'Ongoing Attempt Quiz');
            await request(app)
                .post(`/api/quizzes/${quiz.id}/start`)
                .set('Authorization', `Bearer ${token}`)
                .send();
            const secondStartResponse = await request(app)
                .post(`/api/quizzes/${quiz.id}/start`)
                .set('Authorization', `Bearer ${token}`)
                .send();
            expect(secondStartResponse.status).toBe(400);
            expect(secondStartResponse.body.message).toBe('You have an ongoing attempt for this quiz');
        });
        it('POST /start - should return 400 when starting attempt exceeding attempt limit', async () => {
            const quiz = await createTestQuiz(userId, 'Limited Attempt Quiz', 1);
            await request(app)
                .post(`/api/quizzes/${quiz.id}/start`)
                .set('Authorization', `Bearer ${token}`)
                .send();
            const secondAttemptResponse = await request(app)
                .post(`/api/quizzes/${quiz.id}/start`)
                .set('Authorization', `Bearer ${token}`)
                .send();
            console.log('DEBUG RESPONSE BODY:', JSON.stringify(secondAttemptResponse.body, null, 2));
            expect(secondAttemptResponse.status).toBe(400);
            expect(secondAttemptResponse.body.message).toBe('Attempt limit reached for this quiz');
        });
        it('POST /submit - should return 404 when submitting non-existent attempt', async () => {
            const response = await request(app)
                .post('/api/quizzes/attempts/999999/submit')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    answers: [
                        {
                            question_id: 1,
                            selected_option_ids: [1]
                        }
                    ]
                });
            expect(response.status).toBe(404);
            expect(response.body.message).toBe('Quiz attempt not found');
        });
        it('GET /results - should return 404 when getting results for non-existent attempt', async () => {
            const response = await request(app)
                .get('/api/quizzes/attempts/999999/results')
                .set('Authorization', `Bearer ${token}`)
                .send();
            expect(response.status).toBe(404);
            expect(response.body.message).toBe('Quiz attempt not found');
        });
        it('POST /submit - should return 400 when submitting after attempt is finished', async () => {
            const quiz = await createTestQuiz(userId, 'Finished Attempt Quiz');
            const realQuestionId = quiz.questions[0].id;
            const realAnswerOptionId = quiz.questions[0].answer_options.find((opt) => opt.is_correct)?.id;
            const startResponse = await request(app)
                .post(`/api/quizzes/${quiz.id}/start`)
                .set('Authorization', `Bearer ${token}`)
                .send();
            const finishedAttemptId = startResponse.body.attempt.id;
            await prisma.quizAttempt.update({
                where: { id: finishedAttemptId },
                data: { finished_at: new Date() }
            });
            const submitResponse = await request(app)
                .post(`/api/quizzes/attempts/${finishedAttemptId}/submit`)
                .set('Authorization', `Bearer ${token}`)
                .send({
                    answers: [
                        {
                            question_id: realQuestionId,
                            selected_option_ids: [realAnswerOptionId!]
                        }
                    ]
                });
            expect(submitResponse.status).toBe(400);
            expect(submitResponse.body.message).toBe('This attempt is already submitted');
        });
    });
});