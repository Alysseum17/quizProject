import request from 'supertest';
import { app } from '../../src/app.js';
import { prisma } from '../../src/prisma.js';
import jwt from 'jsonwebtoken';
import e from 'express';

describe('Global Quiz Integration Tests', () => {
    let token: string;
    let userId: number;
    beforeAll(async () => {
        await prisma.selectedAnswer.deleteMany();
        await prisma.questionResponse.deleteMany();
        await prisma.quizAttempt.deleteMany();
        await prisma.answerOption.deleteMany();
        await prisma.question.deleteMany();
        await prisma.quiz.deleteMany();
        await prisma.user.deleteMany();

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
             expect(response.body.updatedItem.title).toBe('Updated Title');
        });

        it('DELETE /:id - should soft delete', async () => {
             const response = await request(app)
                .delete(`/api/quizzes/${createdQuizId}`)
                .set('Authorization', `Bearer ${token}`)
                .send({ is_active: false });
             
             expect(response.status).toBe(200); 
             expect(response.text).toBe('Item soft-deleted successfully');
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
});