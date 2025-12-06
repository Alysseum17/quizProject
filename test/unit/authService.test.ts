import AuthService from '../../src/services/authService.js';
import { prisma } from '../../src/prisma.js';
import jwt from 'jsonwebtoken';
import AppError from '../../src/utils/appError.js';


jest.mock('../../src/prisma.js', () => ({
    prisma: {
        user: {
            findUnique: jest.fn()
        }
    }
}));
jest.mock('jsonwebtoken');

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
            password_changed_at: null 
        });

        const result = await authService.verifyUserToken(token);

        expect(result).toHaveProperty('id', 1);
        expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { id: 1 } });
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