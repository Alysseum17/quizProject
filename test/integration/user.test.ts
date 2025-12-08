import request from 'supertest';
import { app } from '../../src/app.js';
import { prisma } from '../../src/prisma.js';
import jwt from 'jsonwebtoken';
import { cleanupDatabase } from '../helpers/cleanup.js';

describe('User Profile & Analytics Integration Tests', () => {
    let token: string;
    let userId: number;
    let secondUserId: number;
    let quizId: number;
    
    const MAIN_USER_EMAIL = 'main_user@test.com';
    const SECOND_USER_EMAIL = 'second_user@test.com';
    const QUIZ_TITLE = 'Analytics Test Quiz';

    beforeAll(async () => {
        await cleanupDatabase();

        const mainUser = await prisma.user.create({
            data: {
                username: 'MainUser',
                email: MAIN_USER_EMAIL,
                password_hash: 'hashed_placeholder'
            }
        });
        userId = mainUser.id;

        const secondUser = await prisma.user.create({
            data: {
                username: 'SecondUser',
                email: SECOND_USER_EMAIL,
                password_hash: 'hashed_placeholder'
            }
        });
        secondUserId = secondUser.id;

        token = jwt.sign(
            { id: userId },
            process.env.JWT_SECRET as string,
            { expiresIn: '1h' }
        );

        const quiz = await prisma.quiz.create({
            data: {
                title: QUIZ_TITLE,
                author_id: userId,
                quiz_description: 'Test desc',
                questions: {
                    create: [{
                        question_text: 'Q1',
                        question_type: 'single_choice',
                        points: 10,
                        answer_options: { create: [{ answer_text: 'A1', is_correct: true }] }
                    }]
                }
            }
        });
        quizId = quiz.id;

        await prisma.quizAttempt.create({
            data: {
                quiz_id: quizId,
                user_id: userId,
                started_at: new Date('2023-01-01'),
                finished_at: new Date('2023-01-01'),
                score: 0
            }
        });

        await prisma.quizAttempt.create({
            data: {
                quiz_id: quizId,
                user_id: userId,
                started_at: new Date(),
                finished_at: new Date(),
                score: 10
            }
        });

        await prisma.review.create({
            data: {
                quiz_id: quizId,
                user_id: userId,
                rating: 5,
                review_text: 'Best quiz ever'
            }
        });
    });

    afterAll(async () => {
        await prisma.$disconnect();
    });

    describe('Protected Personal Routes', () => {
        it('GET /me - should return full details of current logged user', async () => {
            const response = await request(app)
                .get('/api/user-profiles/me')
                .set('Authorization', `Bearer ${token}`);
            
            expect(response.status).toBe(200);
            expect(response.body.user.id).toBe(userId);
            expect(response.body.user.email).toBe(MAIN_USER_EMAIL);
            expect(response.body.user.username).toBe('MainUser');
            expect(response.body.user.total_quizzes).toBe(1);
            expect(response.body.user.total_quiz_attempts).toBe(2);
        });

        it('GET /me - should fail 401 without token', async () => {
            const response = await request(app).get('/api/user-profiles/me');
            expect(response.status).toBe(401);
            expect(response.body.message).toMatch(/logged in/i);
        });

        it('PATCH /change-info - should successfully update username', async () => {
            const newUsername = 'UpdatedMainUser';
            const response = await request(app)
                .patch('/api/user-profiles/change-info')
                .set('Authorization', `Bearer ${token}`)
                .send({ username: newUsername });

            expect(response.status).toBe(200);
            expect(response.body.user.username).toBe(newUsername);
            
            const userInDb = await prisma.user.findUnique({ where: { id: userId } });
            expect(userInDb?.username).toBe(newUsername);
        });

        it('PATCH /change-info - should fail 400 if email is already taken', async () => {
            const response = await request(app)
                .patch('/api/user-profiles/change-info')
                .set('Authorization', `Bearer ${token}`)
                .send({ email: SECOND_USER_EMAIL });

            expect(response.status).toBe(400);
            expect(response.body.message).toMatch(/duplicate/i);
        });
    });

    describe('User Statistics & Activities', () => {
        it('GET /me/:quizId/stats - should return correct aggregation', async () => {
            const response = await request(app)
                .get(`/api/user-profiles/me/${quizId}/stats`)
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(response.body.stats).toHaveLength(1);
            
            const stats = response.body.stats[0];
            expect(stats.total_attempts).toBe(2);
            expect(stats.best_score).toBe(10);
            expect(stats.last_score).toBe(10);
        });

        it('GET /me/:quizId/stats - should return 404 if user never passed this quiz', async () => {
    const newQuiz = await prisma.quiz.create({
        data: { title: 'Untouched Quiz', author_id: userId }
    });

    try {
        const response = await request(app)
            .get(`/api/user-profiles/me/${newQuiz.id}/stats`)
            .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(404);
        expect(response.body.message).toMatch(/no stats found/i);
    } finally {
        await prisma.quiz.delete({ where: { id: newQuiz.id } });
    }
});

        it('GET /me/activities - should return sorted history', async () => {
            const response = await request(app)
                .get('/api/user-profiles/me/activities')
                .set('Authorization', `Bearer ${token}`)
                .query({ limit: 10 });

            expect(response.status).toBe(200);
            expect(response.body.activities).toHaveLength(2);
            expect(response.body.activities[0].score).toBe(10);
            expect(response.body.activities[1].score).toBe(0);
            expect(response.body.activities[0].quiz).toHaveProperty('title', QUIZ_TITLE);
        });
    });

    describe('Public Profile Search', () => {
        it('GET /email/:email - should find user and return public info', async () => {
            const response = await request(app)
                .get(`/api/user-profiles/email/${MAIN_USER_EMAIL}`);

            expect(response.status).toBe(200);
            expect(response.body.user).not.toBeNull();
            expect(response.body.user.id).toBe(userId);
        });

        it('GET /email/:email - should return null user if not found', async () => {
            const response = await request(app)
                .get('/api/user-profiles/email/ghost@nowhere.com');

            expect(response.status).toBe(200);
            expect(response.body.user).toBeNull();
        });

        it('GET /:userId - should return user profile details', async () => {
            const response = await request(app)
                .get(`/api/user-profiles/${userId}`);

            expect(response.status).toBe(200);
            expect(response.body.user.id).toBe(userId);
            expect(response.body.user.average_quiz_rating).toBe(5);
        });

        it('GET /:userId - should return 404 for non-existent ID', async () => {
            const response = await request(app).get('/api/user-profiles/999999');
            
            expect(response.status).toBe(404);
            expect(response.body.message).toMatch(/not found/i);
        });
    });

    describe('Global Leaderboards', () => {
        it('GET /top/authors/prolific - should verify author rank', async () => {
            const response = await request(app).get('/api/user-profiles/top/authors/prolific');
            
            expect(response.status).toBe(200);
            expect(response.body.authors.length).toBeGreaterThan(0);
            expect(response.body.authors[0].username).toContain('UpdatedMainUser');
            expect(response.body.authors[0].quiz_count).toBe(1);
        });

        it('GET /top/quiz-scores - should sort users by score', async () => {
            const response = await request(app).get('/api/user-profiles/top/quiz-scores');
            
            expect(response.status).toBe(200);
            const topUsers = response.body.topUsers;
            
            expect(topUsers.length).toBeGreaterThan(0);
            expect(Number(topUsers[0].average_score)).toBe(5);
        });
        it('GET /top/authors/attempts - should verify author rank by total attempts', async () => {
            
            const response = await request(app).get('/api/user-profiles/top/authors/quiz-attempts');
            
            expect(response.status).toBe(200);
            
            const {topAuthors} = response.body;
            
            expect(topAuthors.length).toBeGreaterThan(0);
        
            const mainUserRank = topAuthors.find((a: any) => a.username === 'UpdatedMainUser');
            
            expect(mainUserRank).toBeDefined();
            expect(mainUserRank.total_attempts).toBe(2);
        });
    });
});
