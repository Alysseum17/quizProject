import request from 'supertest';
import { app } from '../../src/app.js';
import { prisma } from '../../src/prisma.js';
import { Email } from '../../src/utils/email.js';
import { cleanupDatabase } from '../helpers/cleanup.js';


jest.mock('../../src/utils/email.js', () => {
    return {
        Email: jest.fn().mockImplementation(() => ({
            sendWelcome: jest.fn().mockResolvedValue(true),
            sendPasswordReset: jest.fn().mockResolvedValue(true)
        }))
    };
});

describe('Authentication Integration Tests', () => {

    beforeAll(async () => {
        await cleanupDatabase();
    });

    afterAll(async () => {
        await prisma.$disconnect();
    });

    let authToken: string;
    let resetToken: string;
    const testUser = {
        username: 'auth_tester',
        email: 'auth@test.com',
        password: 'password123',
        passwordConfirm: 'password123'
    };

    describe('Registration Flow', () => {
        it('POST /signup - should register a new user', async () => {
            const response = await request(app)
                .post('/api/users/signup')
                .send(testUser);

            expect(response.status).toBe(201);
            expect(response.body.status).toBe('success');
            expect(response.body.data.user.email).toBe(testUser.email);
            expect(response.body).toHaveProperty('token');
            
            expect(Email).toHaveBeenCalled();
        });

        it('POST /signup - should fail with duplicate email', async () => {
            const response = await request(app)
                .post('/api/users/signup')
                .send(testUser);

            expect(response.status).toBe(400); 
            expect(response.body.message).toMatch(/email already in use/i);
        });
    });

    describe('Login Flow', () => {
        it('POST /login - should login with correct credentials', async () => {
            const response = await request(app)
                .post('/api/users/login')
                .send({
                    email: testUser.email,
                    password: testUser.password
                });

            expect(response.status).toBe(200);
            expect(response.body.status).toBe('success');
            expect(response.body).toHaveProperty('token');
            authToken = response.body.token; 
        });

        it('POST /login - should fail with incorrect password', async () => {
            const response = await request(app)
                .post('/api/users/login')
                .send({
                    email: testUser.email,
                    password: 'wrongpassword'
                });

            expect(response.status).toBe(401);
            expect(response.body.message).toMatch(/incorrect/i);
        });
        it('POST /login - should fail with non-existent email', async () => {
            const response = await request(app)
                .post('/api/users/login')
                .send({
                    email: 'nonexistent@test.com',
                    password: 'somepassword'
                });

            expect(response.status).toBe(401);
            expect(response.body.message).toMatch(/incorrect/i);
        });
        it ('POST /login - should fail for deactivated account', async () => {
            await prisma.user.updateMany({
                where: { email: testUser.email },
                data: { is_active: false }
            });

            const response = await request(app)
                .post('/api/users/login')
                .send({
                    email: testUser.email,
                    password: testUser.password
                });

            expect(response.status).toBe(401);
            expect(response.body.message).toMatch(/deactivated/i);

            await prisma.user.updateMany({
                where: { email: testUser.email },
                data: { is_active: true }
            });
        });
    });
    describe('Logout Flow', () => {
        it('POST /logout - should logout the user', async () => {
            const response = await request(app)
                .post('/api/users/logout')
                .set('Authorization', `Bearer ${authToken}`)
                .send();

            expect(response.status).toBe(200);
            expect(response.body.status).toBe('success');
        });
    });
    describe('Password Management Flow', () => {
        it('POST /update-password - should update password (authenticated)', async () => {
            const newPassword = 'newpassword123';
            const response = await request(app)
                .post('/api/users/update-password')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    currentPassword: testUser.password,
                    newPassword: newPassword,
                    newPasswordConfirm: newPassword
                });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('token');
            authToken = response.body.token; 
            testUser.password = newPassword; 
        });
            it('POST /update-password - should fail with incorrect current password', async () => {
            const response = await request(app)
                .post('/api/users/update-password')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    currentPassword: 'wrongcurrentpassword',
                    newPassword: 'anothernewpassword123',
                    newPasswordConfirm: 'anothernewpassword123'
                });

            expect(response.status).toBe(401);
            expect(response.body.message).toMatch(/current password is incorrect/i);
        });

        it('POST /forgot-password - should send reset token', async () => {
            const response = await request(app)
                .post('/api/users/forgot-password')
                .send({ email: testUser.email });

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Token sent to email!');
            const user = await prisma.user.findUnique({ where: { email: testUser.email } });
            expect(user?.reset_token).not.toBeNull();
            expect(Email).toHaveBeenCalled();
           
        });
    });

    describe('Account Deletion', () => {
        it('DELETE /delete-account - should soft delete user', async () => {
            const response = await request(app)
                .delete('/api/users/delete-account')
                .set('Authorization', `Bearer ${authToken}`)
                .send();

            expect(response.status).toBe(204); 

            const user = await prisma.user.findUnique({ where: { email: testUser.email } });
            expect(user).not.toBeNull();
            expect(user?.is_active).toBe(false);
        });
    });
});