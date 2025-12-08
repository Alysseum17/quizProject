import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { prisma } from '../src/prisma';

let token: string;
let quizId: number;
let userId: number;

describe('Bookmark System Tests', () => {

    beforeAll(async () => {
        await prisma.bookmark.deleteMany();
        await prisma.quiz.deleteMany();
        await prisma.user.deleteMany();

        const authRes = await request(app).post('/api/users/signup').send({
            username: 'TestUser',
            email: 'test@example.com',
            password: 'password123',
            passwordConfirm: 'password123'
        });

        token = authRes.body.token;
        userId = authRes.body.data.user.id;

        const quiz = await prisma.quiz.create({
            data: {
                title: 'Test Quiz',
                quiz_description: 'For testing',
                difficulty: 'easy',
                time_limit: 10,
                author_id: userId,
                is_active: true
            }
        });
        quizId = quiz.id;
    });

    it('should add a bookmark successfully', async () => {
        const res = await request(app)
            .post(`/api/bookmarks/${quizId}`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(201);
        expect(res.body.message).toBe('Quiz added to bookmarks');
    });

    it('should prevent duplicate bookmarks', async () => {
        const res = await request(app)
            .post(`/api/bookmarks/${quizId}`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(400);
    });

    it('should get my bookmarks', async () => {
        const res = await request(app)
            .get('/api/bookmarks?page=1&limit=10')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.results).toBe(1);
        expect(res.body.pagination.total).toBe(1);
    });


    afterAll(async () => {
        await prisma.$disconnect();
    });
});