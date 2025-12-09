import AuthService from '../../src/services/authService.js';
import { prisma } from '../../src/prisma.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import AppError from '../../src/utils/appError.js';
import { is } from 'zod/locales';


jest.mock('../../src/prisma', () => ({
    prisma: {
        user: {
            findUnique: jest.fn(), 
            findFirst: jest.fn(),  
            create: jest.fn(),     
            update: jest.fn(),     
        }
    }
}));
jest.mock('bcrypt');
jest.mock('jsonwebtoken', () => ({
    sign: jest.fn().mockReturnValue('new_jwt_token'),
    verify: jest.fn() 
}));

describe('AuthService Unit Tests - verifyUserToken', () => {
    const authService = new AuthService();
    const token = 'valid_token_string';
    const mockPayload = { id: 1, iat: 1700000000 }; 

    beforeEach(() => {
        jest.clearAllMocks();
        process.env.JWT_SECRET = 'test-secret'; 
    });

    it('should return user if token is valid and user exists', async () => {
        (jwt.verify as jest.Mock).mockReturnValue(mockPayload);
        (prisma.user.findUnique as jest.Mock).mockResolvedValue({ 
            id: 1, 
            username: 'tester', 
            email: 'tester@example.com',
            password_changed_at: null, 
            is_active: true
        });

        const result = await authService.verifyUserToken(token);

        expect(result).toHaveProperty('id', 1);
        expect(prisma.user.findUnique).toHaveBeenCalled();
        const callArgs = (prisma.user.findUnique as jest.Mock).mock.calls[0][0];
        expect(callArgs.where.id).toBe(1);
    });

    it('should throw error if jwt.verify fails', async () => {
        (jwt.verify as jest.Mock).mockImplementation(() => {
            throw new Error('jwt expired');
        });

        await expect(authService.verifyUserToken(token))
            .rejects
            .toThrow('jwt expired');
    });

    it('should throw 401 if user no longer exists in DB', async () => {
        (jwt.verify as jest.Mock).mockReturnValue(mockPayload);
        (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

        await expect(authService.verifyUserToken(token))
            .rejects
            .toEqual(expect.objectContaining({
                statusCode: 401,
                message: expect.stringMatching(/no longer exists/i)
            }));
    });

    it('should throw 401 if user changed password AFTER token was issued', async () => {
        (jwt.verify as jest.Mock).mockReturnValue({ 
            id: 1, 
            iat: 1000 
        });

        (prisma.user.findUnique as jest.Mock).mockResolvedValue({ 
            id: 1, 
            password_changed_at: new Date(2000 * 1000) 
        });

        await expect(authService.verifyUserToken(token))
            .rejects
            .toEqual(expect.objectContaining({
                statusCode: 401,
                message: expect.stringMatching(/recently changed password/i)
            }));
    });
    
    it('should return user if password was changed BEFORE token was issued', async () => {
        (jwt.verify as jest.Mock).mockReturnValue({ 
            id: 1, 
            iat: 3000 
        });

        (prisma.user.findUnique as jest.Mock).mockResolvedValue({ 
            id: 1, 
            password_changed_at: new Date(2000 * 1000) 
        });

        const result = await authService.verifyUserToken(token);

        expect(result).toHaveProperty('id', 1);
    });
});

describe('AuthService - resetPassword', () => {
    const authService = new AuthService();
    const rawToken = 'my-secret-reset-token';
    const newPassword = 'newSecurePassword123';
    
   
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    beforeEach(() => {
        jest.clearAllMocks();
        process.env.JWT_SECRET = 'test';
        process.env.JWT_EXPIRES_IN = '1h';
    });

    it('should successfully reset password if token is valid and not expired', async () => {
        const mockUser = { id: 1, email: 'test@test.com', username: 'user' };
        
        (prisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser);
        
        (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_new_password');
        
        (prisma.user.update as jest.Mock).mockResolvedValue({ ...mockUser, password_changed_at: new Date() });

        const result = await authService.resetPassword(
            { password: newPassword, passwordConfirm: newPassword }, 
            rawToken
        );

        expect(prisma.user.findFirst).toHaveBeenCalledWith({
            where: {
                reset_token: hashedToken, 
                reset_token_expires_at: { gt: expect.any(Date) } 
            }
        });

        expect(prisma.user.update).toHaveBeenCalledWith({
            where: { id: mockUser.id },
            data: {
                password_hash: 'hashed_new_password',
                reset_token: null,
                reset_token_expires_at: null,
                password_changed_at: expect.any(Date)
            }
        });

        expect(result).toHaveProperty('token', 'new_jwt_token');
    });

    it('should throw "Token is invalid or has expired" if user not found', async () => {
     
        (prisma.user.findFirst as jest.Mock).mockResolvedValue(null);

        await expect(authService.resetPassword(
            { password: newPassword, passwordConfirm: newPassword }, 
            rawToken
        )).rejects.toThrow('Token is invalid or has expired');
        
        expect(prisma.user.update).not.toHaveBeenCalled();
    });
});