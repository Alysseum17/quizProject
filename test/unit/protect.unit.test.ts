import { protect } from '../../src/controllers/authController.js'; 
import AuthService from '../../src/services/authService.js';
import AppError from '../../src/utils/appError.js';
import { Request, Response, NextFunction } from 'express';


jest.mock('../../src/services/authService.js');

describe('Auth Middleware Unit Tests (protect)', () => {
    let req: Partial<Request>;
    let res: Partial<Response>;
    let next: NextFunction;

    beforeEach(() => {
        req = {
            headers: {},
            cookies: {}
        };
        res = {}; 
        next = jest.fn(); 
    });

    it('should throw error if no token is provided', async () => {
        req.headers = {};
        req.cookies = {};

        await protect(req as Request, res as Response, next);

        expect(next).toHaveBeenCalledTimes(1);

        expect(next).toHaveBeenCalledWith(expect.any(AppError));
        
        const error = (next as jest.Mock).mock.calls[0][0];
        expect(error.message).toMatch(/not logged in/i);
    });

   it('should call next with error if token verification fails (Service throws error)', async () => {
        req.headers = { authorization: 'Bearer invalid_token' };
        
        const expectedError = new AppError('Invalid token signature', 401);

        (AuthService.prototype.verifyUserToken as jest.Mock).mockRejectedValue(expectedError);

        await protect(req as Request, res as Response, next);
        await new Promise(resolve => process.nextTick(resolve));
        expect(next).toHaveBeenCalledWith(expectedError);
    });

    it('should call next() and attach user if token is valid', async () => {
        req.headers = { authorization: 'Bearer valid_token' };
        
        const mockUser = { id: 1, username: 'tester', email: 'test@test.com' };
        (AuthService.prototype.verifyUserToken as jest.Mock).mockResolvedValue(mockUser);

        await protect(req as Request, res as Response, next);

        expect(next).toHaveBeenCalledWith(); 
        expect(next).toHaveBeenCalledTimes(1);

        expect((req as any).user).toEqual(mockUser);
    });
});