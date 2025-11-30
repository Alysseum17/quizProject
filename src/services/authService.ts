import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { Email } from '../utils/email.js';
import AppError from '../utils/appError.js';
import crypto from 'crypto';
import { prisma } from '../prisma.js';  
export default class AuthService { 
    signToken = (userId: number) => {
        const payload = { id: userId };
        const secret: Secret = process.env.JWT_SECRET as string;
        const options: SignOptions = {
            expiresIn: process.env.JWT_EXPIRES_IN as any
        };
        return jwt.sign(payload, secret, options);
    }
    async hashPassword(password: string) {
        return await bcrypt.hash(password, 12);
    }
    async validatePassword(inputPassword: string, storedHash: string) {
        return await bcrypt.compare(inputPassword, storedHash);
    }
    createPasswordResetToken() {
        const resetToken = crypto.randomBytes(32).toString('hex');
        const reset_token_expires_at = new Date(Date.now() + 10 * 60 * 1000);
        return { resetToken,  reset_token_expires_at };
    }
    async verifyUserToken(token: string) {
        const secret: Secret = process.env.JWT_SECRET as string;
        const decoded: any =  jwt.verify(token, secret);
        const currentUser = await prisma.user.findUnique({
            where: { id: decoded.id }
        });
        if (!currentUser) {
            throw new AppError('The user belonging to this token no longer exists.', 401);
        }
        if(currentUser.password_changed_at){
                const changedTimestamp = Math.floor(new Date(currentUser.password_changed_at).getTime() / 1000);
                if (decoded.iat < changedTimestamp) {
                    throw new AppError('User recently changed password! Please log in again.', 401);
                }
            }
        return currentUser;
    }
    async signup(userData: any, url: string) {
        const { username, email, password } = userData;
            const password_hash = await this.hashPassword(password);
            const newUser = await prisma.user.create({
                data: {
                    username,
                    email,
                    password_hash
                }
            });
            await new Email(newUser, url).sendWelcome();
            const token = this.signToken(newUser.id);
            return { user: newUser, token };
    }
    async login(loginData: any) {
        const { email, password } = loginData;
        if (!email || !password) {
             throw new AppError('Please provide email and password!', 400);
        }
        const user = await prisma.user.findUnique({
            where: { email }
        });
        if (!user || !(await this.validatePassword(password, user.password_hash))) {
            throw new AppError('Incorrect email or password', 401);
        }
        const token = this.signToken(user.id);
        return { user, token };
    }
    async forgotPassword(email: string, protocol: string, host: string) {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            throw new AppError('There is no user with that email address.', 404);
        }
        const {resetToken, reset_token_expires_at} = this.createPasswordResetToken();
        await prisma.user.update({
            where: { id: user.id },
            data: {
                reset_token: crypto.createHash('sha256').update(resetToken).digest('hex'),
                reset_token_expires_at
            }
        });
       const resetURL = `${protocol}://${host}/api/user/resetPassword/${resetToken}`;
           try {
               await new Email(user, resetURL).sendPasswordReset();
           } catch (err) {
               await prisma.user.update({
                   where: { id: user.id },
                   data: {
                       reset_token: null,
                       reset_token_expires_at: null
                   }
               });
               throw new AppError('There was an error sending the email. Try again later!', 500);
           }
    }
    async resetPassword(data: any, token: string) {
        const { password} = data;
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
        const user = await prisma.user.findFirst({
            where: {
                reset_token: hashedToken,
                reset_token_expires_at: { gt: new Date() }
            }
        });
        if (!user) {
            throw new AppError('Token is invalid or has expired', 400);
        }
        const password_hash = await this.hashPassword(password);
        const newUser = await prisma.user.update({
            where: { id: user.id },
            data: {
                password_hash,
                reset_token: null,
                reset_token_expires_at: null,
                password_changed_at: new Date()
            }
        });
        const newToken = this.signToken(user.id);
        return { user: newUser, token: newToken };
    }
    async updatePassword(userId: number, data: any) {
        const { currentPassword, newPassword } = data;
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user || !(await this.validatePassword(currentPassword, user.password_hash))) {
            throw new AppError('Your current password is incorrect.', 401);
        }
        const password_hash = await this.hashPassword(newPassword);
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                password_hash,
                password_changed_at: new Date()
            }
        });
        const token = this.signToken(userId);
        return { user: updatedUser, token };
    }
    async softDeleteAccount(userId: number) {
        await prisma.user.update({
            where: { id: userId },
            data: { is_active: false }
        });
    }
}