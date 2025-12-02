import { NextFunction, Request, Response } from 'express';
import * as authSchemas from '../schemas/auth.schema.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';
import AuthService from '../services/authService.js';
import { updatePasswordSchema } from '../schemas/auth.schema.js';


const authService = new AuthService();

const createSendToken = (user: any, token: string, statusCode: number, req: Request, res: Response) => {
    res.cookie('jwt', token, {
        httpOnly: true,
        secure: req.secure || req.headers['x-forwarded-proto'] === 'https'
    });

    user.password_hash = undefined;

    res.status(statusCode).json({
        status: 'success',
        token,
        data: { user }
    });
};

export const signup = catchAsync(async (req: Request, res: Response) => {
    const data = authSchemas.signupSchema.parse(req.body);
    const url = `${req.protocol}://${req.get('host')}/me`;
    const {user, token} = await authService.signup(data, url);
    createSendToken(user, token, 201, req, res);
});

export const login = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const data = authSchemas.loginSchema.parse(req.body);
    const {user, token} = await authService.login(data);
    createSendToken(user, token, 200, req, res);
});

export const logout = catchAsync(async (req: Request, res: Response) => {
    res.cookie('jwt', 'loggedout', {
        httpOnly: true,
        secure: req.secure || req.headers['x-forwarded-proto'] === 'https',
        expires: new Date(Date.now() + 10 * 1000)
    });
    res.status(200).json({ status: 'success' });
});

export const protect = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.jwt) {
        token = req.cookies.jwt;
    }
    if (!token) {
        return next(new AppError('You are not logged in! Please log in to get access.', 401));
    }
    const currentUser = await authService.verifyUserToken(token);
    if (!currentUser) {
        return next(new AppError('The user belonging to this token does no longer exist.', 401));
    }
    (req as any).user = currentUser;
    next();
});

export const forgotPassword = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const data = authSchemas.forgotPasswordSchema.parse(req.body);
    const host = req.get('host') || 'localhost:3000';
    await authService.forgotPassword(data.email, req.protocol, host);
    res.status(200).json({
        status: 'success',
        message: 'Token sent to email!'
    });
});

export const resetPassword = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const data = authSchemas.resetPasswordSchema.parse(req.body);
    const tokenReq = req.params.token;
    const {user,token} = await authService.resetPassword(data, tokenReq);
    createSendToken(user, token, 200, req, res);
});

export const updatePassword = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const userId = (req as any).user.id;
    const data = updatePasswordSchema.parse(req.body);
    const {user, token} = await authService.updatePassword(userId, data);
    createSendToken(user, token, 200, req, res);
});

export const softDeleteAccount = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const userId = (req as any).user.id;
    await authService.softDeleteAccount(userId);
    res.status(204).json({ status: 'success', data: null });
});
