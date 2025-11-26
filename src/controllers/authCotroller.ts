import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import { Request, Response } from 'express';
import { prisma } from '../prisma.js';
import bcrypt from 'bcrypt';
import { signupSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from '../schemas/auth.schema.js';
import { Email } from '../utils/email.js';
import crypto from 'crypto';

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

export const signup = async (req: Request, res: Response) => {
    const result = signupSchema.safeParse(req.body);
    if (!result.success) {
        return res.status(400).json({ error: result.error });
    }
    const { username, email, password } = result.data;
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
}

export const login = async (req: Request, res: Response) => {
    const result = loginSchema.safeParse(req.body);
    console.log(result);
    if (!result.success) {
        return res.status(400).json({ error: result.error });
    }
    const { email, password } = result.data;
    if (!email || !password) {
        return res.status(400).json({ error: 'Please provide email and password!' });
    }
    const user = await prisma.user.findUnique({
        where: { email }
    });
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
        return res.status(401).json({ error: 'Incorrect email or password' });
    }
    createSendToken(user, 200, req, res);
}

export const logout = (req: Request, res: Response) => {
    res.cookie('jwt', 'loggedout', {
        httpOnly: true,
        expires: new Date(Date.now() + 10 * 1000)
    });
    res.status(200).json({ status: 'success'
    });
}

export const protect = async (req: Request, res: Response, next: Function) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }
    else if (req.cookies.jwt) {
        token = req.cookies.jwt;
    }
    if (!token) {
        return res.status(401).json({ error: 'You are not logged in! Please log in to get access.' });
    }
    const decoded:any = jwt.verify(token, process.env.JWT_SECRET as string);
    console.log(decoded);
    const currentUser = await prisma.user.findUnique({
        where: { id: decoded.id }
    });
    if (!currentUser) {
        return res.status(401).json({ error: 'The user belonging to this token does no longer exist.' });
    }
    if(currentUser.password_changed_at){
        const changedTimestamp = Math.floor(new Date(currentUser.password_changed_at).getTime() / 1000);
        if (decoded.iat < changedTimestamp) {
            return res.status(401).json({ error: 'User recently changed password! Please log in again.' });
        }
    }
    (req as any).user = currentUser;
    next();
}

export const forgotPassword = async (req: Request, res: Response) => {
    const result = forgotPasswordSchema.safeParse(req.body);
    if (!result.success) {
        return res.status(400).json({ error: result.error });
    }
    const { email } = result.data;
    const user = await prisma.user.findUnique({
        where: { email }
    });
    if (!user) {
        return res.status(404).json({ error: 'There is no user with that email address.' });    
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
        res.status(500).json({ error: 'There was an error sending the email. Try again later!' });
    }
    };

export const resetPassword = async (req: Request, res: Response) => {
    const result = resetPasswordSchema.safeParse(req.body);
    if (!result.success) {
        return res.status(400).json({ error: result.error });
    }
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await prisma.user.findFirst({
        where: {
            reset_token: hashedToken,
            reset_token_expires_at: { gt: new Date() }
        }
    });
    if (!user) {
        return res.status(400).json({ error: 'Token is invalid or has expired' });
    }
    const { password } = result.data;
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
}
