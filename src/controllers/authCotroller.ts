import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import { NextFunction, Request, Response } from 'express';
import { prisma } from '../prisma.js';
import bcrypt from 'bcrypt';
import { signupSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from '../schemas/auth.schema.js';
import { Email } from '../utils/email.js';
import crypto from 'crypto';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';

const signToken = (userId: number) => {
    const payload = { id: userId };
    const secret: Secret = process.env.JWT_SECRET as string;
    const options: SignOptions = {
        expiresIn: process.env.JWT_EXPIRES_IN as any
    };
    return jwt.sign(payload, secret, options);
}

const createSendToken = (user: any, statusCode: number, req:Request, res: Response) => {
    const token = signToken(user.id);
    res.cookie('jwt', token, {
        httpOnly: true,
        secure: req.secure || req.headers['x-forwarded-proto'] === 'https'
    });
    user.password_hash = undefined;
    res.status(statusCode).json({
        status: 'success',
        token,
        data: {
            user
        }
    });
}

export const signup = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const data = signupSchema.parse(req.body);
    const { username, email, password } = data;
    const password_hash = await bcrypt.hash(password, 12);
    const newUser = await prisma.user.create({
        data: {
            username,
            email,
            password_hash
        }
    });
    const url = `${req.protocol}://${req.get('host')}/me`;
    await new Email(newUser, url).sendWelcome();
    createSendToken(newUser, 201, req, res);
});

export const login = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const data = loginSchema.parse(req.body);
    const { email, password } = data;
    if (!email || !password) {
        return next(new AppError('Please provide email and password!', 400));
    }
    const user = await prisma.user.findUnique({
        where: { email }
    });
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
        return next(new AppError('Incorrect email or password', 401));
    }
    createSendToken(user, 200, req, res);
});

export const logout = catchAsync(async (req: Request, res: Response) => {
    res.cookie('jwt', 'loggedout', {
        httpOnly: true,
        expires: new Date(Date.now() + 10 * 1000)
    });
    res.status(200).json({ status: 'success'
    });
});

export const protect = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }
    else if (req.cookies.jwt) {
        token = req.cookies.jwt;
    }
    if (!token) {
        return next(new AppError('You are not logged in! Please log in to get access.', 401));
    }
    const decoded:any = jwt.verify(token, process.env.JWT_SECRET as string);
    const currentUser = await prisma.user.findUnique({
        where: { id: decoded.id }
    });
    if (!currentUser) {
        return next(new AppError('The user belonging to this token does no longer exist.', 401));
    }
    if(currentUser.password_changed_at){
        const changedTimestamp = Math.floor(new Date(currentUser.password_changed_at).getTime() / 1000);
        if (decoded.iat < changedTimestamp) {
            return next(new AppError('User recently changed password! Please log in again.', 401));
        }
    }
    (req as any).user = currentUser;
    next();
});

export const forgotPassword = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const data = forgotPasswordSchema.parse(req.body);
    const { email } = data;
    const user = await prisma.user.findUnique({
        where: { email }
    });
    if (!user) {
        return next(new AppError('There is no user with that email address.', 404));  
    }
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpires = new Date(Date.now() + 10 * 60 * 1000);
    await prisma.user.update({
        where: { id: user.id },
        data: {
            reset_token: crypto.createHash('sha256').update(resetToken).digest('hex'),
            reset_token_expires_at: resetTokenExpires
        }
    });
    const resetURL = `${req.protocol}://${req.get('host')}/api/user/resetPassword/${resetToken}`;
    try {
        await new Email(user, resetURL).sendPasswordReset();
        res.status(200).json({
            status: 'success',
            message: 'Token sent to email!'
        });
    } catch (err) {
        await prisma.user.update({
            where: { id: user.id },
            data: {
                reset_token: null,
                reset_token_expires_at: null
            }
        });
        return next(new AppError('There was an error sending the email. Try again later!', 500));
    }
    });

export const resetPassword = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const data = resetPasswordSchema.parse(req.body);
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await prisma.user.findFirst({
        where: {
            reset_token: hashedToken,
            reset_token_expires_at: { gt: new Date() }
        }
    });
    if (!user) {
        return next(new AppError('Token is invalid or has expired', 400));
    }
    const { password } = data;
    const password_hash = await bcrypt.hash(password, 12);
    await prisma.user.update({
        where: { id: user.id },
        data: {
            password_hash,
            reset_token: null,
            reset_token_expires_at: null,
            password_changed_at: new Date()
        }
    });
    createSendToken(user, 200, req, res);
});
