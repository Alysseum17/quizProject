import request from 'supertest';
import { app } from '../../src/app.js';
import { prisma } from '../../src/prisma.js';
import jwt from 'jsonwebtoken';
import { cleanupDatabase } from '../helpers/cleanup.js';

describe('Bookmark Integration Tests', () => {
    let token: string;
    let userId: number;
    let secondUserId: number;
    let quizId: number;
    let inactiveQuizId: number;

    beforeAll(async () => {
        await cleanupDatabase();
        const user = await prisma.user.create({
            data: {
                username: 'Bookmarker',
                email: 'bookmarker@test.com',
                password_hash: 'hashed_placeholder'
            }
        });
        userId = user.id;

        const secondUser = await prisma.user.create({
            data: {
                username: 'SecondUser',
                email: 'second@test.com',
                password_hash: 'hashed_placeholder'
            }
        });
        secondUserId = secondUser.id;

        const quiz = await prisma.quiz.create({
            data: {
                title: 'Popular Quiz',
                quiz_description: 'Test description',
                difficulty: 'medium',
                time_limit: 10,
                author_id: secondUserId,
                is_active: true
            }
        });
        quizId = quiz.id;

        const inactiveQuiz = await prisma.quiz.create({
            data: {
                title: 'Deleted Quiz',
                quiz_description: 'Hidden',
                difficulty: 'hard',
                author_id: secondUserId,
                is_active: false
            }
        });
        inactiveQuizId = inactiveQuiz.id;

        token = jwt.sign(
            { id: userId },
            process.env.JWT_SECRET as string,
            { expiresIn: '1h' }
        );
    });

    afterAll(async () => {
        await prisma.$disconnect();
    });

    describe('Bookmark Management Flow (Success Scenarios)', () => {
        it('POST /api/bookmarks/:id - should add a bookmark', async () => {
            const response = await request(app)
                .post(`/api/bookmarks/${quizId}`)
                .set('Authorization', `Bearer ${token}`)
                .send();

            expect(response.status).toBe(201);
            expect(response.body.status).toBe('success');
        });

        it('GET /api/bookmarks - should retrieve my bookmarks', async () => {
            const response = await request(app)
                .get('/api/bookmarks')
                .set('Authorization', `Bearer ${token}`)
                .query({ page: 1, limit: 10 });

            expect(response.status).toBe(200);
            expect(response.body.results).toBe(1);
            expect(response.body.data.bookmarks[0].id).toBe(quizId);
        });

        it('PATCH /api/bookmarks/:id - should update bookmark note', async () => {
            const noteText = "Updated note";
            const response = await request(app)
                .patch(`/api/bookmarks/${quizId}`)
                .set('Authorization', `Bearer ${token}`)
                .send({ note: noteText });

            expect(response.status).toBe(200);
            expect(response.body.data.bookmark.note).toBe(noteText);
        });
    });

    describe('Bookmark Analytics', () => {
        it('GET /api/bookmarks/analytics/top - should return top bookmarked quizzes', async () => {
            await prisma.bookmark.create({
                data: { user_id: secondUserId, quiz_id: quizId }
            });

            const response = await request(app)
                .get('/api/bookmarks/analytics/top')
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            const stats = response.body.data.stats;
            const target = stats.find((s: any) => s.quiz_id === quizId);

            expect(Number(target.bookmark_count)).toBe(2);
        });
    });

    describe('Error Handling & Edge Cases', () => {

        it('POST /:id - should return 400 when bookmarking the same quiz twice', async () => {
            const response = await request(app)
                .post(`/api/bookmarks/${quizId}`)
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(400);
            expect(response.body.message).toMatch(/already/i);
        });

        it('POST /:id - should return 404 when bookmarking non-existent quiz', async () => {
            const response = await request(app)
                .post('/api/bookmarks/999999')
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(404);
            expect(response.body.message).toMatch(/not found/i);
        });

        it('POST /:id - should return 404 when bookmarking an INACTIVE quiz', async () => {
            const response = await request(app)
                .post(`/api/bookmarks/${inactiveQuizId}`)
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(404);
            expect(response.body.message).toMatch(/inactive/i);
        });

        it('POST /:id - should return 400 for invalid ID format (string instead of number)', async () => {
            const response = await request(app)
                .post('/api/bookmarks/invalid-id')
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(400);
        });

        it('PATCH /:id - should return 400 if note is not a string', async () => {
            const response = await request(app)
                .patch(`/api/bookmarks/${quizId}`)
                .set('Authorization', `Bearer ${token}`)
                .send({ note: 12345 });
            expect(response.status).toBe(400);
            expect(response.body.message).toMatch(/must be a string/i);
        });

        it('PATCH /:id - should return 404 when updating a bookmark that does not exist', async () => {
            const response = await request(app)
                .patch(`/api/bookmarks/${inactiveQuizId}`)
                .set('Authorization', `Bearer ${token}`)
                .send({ note: "New Note" });

            expect(response.status).toBe(404);
            expect(response.body.message).toMatch(/not found/i);
        });

        it('GET / - should return 401 if not authorized', async () => {
            const response = await request(app)
                .get('/api/bookmarks');

            expect(response.status).toBe(401);
        });
    });

    describe('Bookmark Deletion', () => {
        it('DELETE /:id - should remove bookmark', async () => {
            const response = await request(app)
                .delete(`/api/bookmarks/${quizId}`)
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(204);
        });

        it('DELETE /:id - should return 404 if bookmark already deleted', async () => {
            const response = await request(app)
                .delete(`/api/bookmarks/${quizId}`)
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(404);
        });
    });
});