import {Request, Response, NextFunction} from 'express';
import AppError from '../utils/appError.js';
import { ZodError } from 'zod';

const globalErrorHandler = (err: any, _req: Request, res: Response, _next: NextFunction) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    if(err.code === 'P2002') {
        const field = err.meta?.target?.[0] || 'field';
        err = new AppError(`Duplicate value for ${field}. Please use another value!`, 400);
    }
    if(err.code === 'P2025') {
        err = new AppError(`The requested resource was not found.`, 404);
    }
    if(err.name === 'JsonWebTokenError') {
        err = new AppError('Invalid token. Please log in again!', 401);
    }
    if(err.name === 'TokenExpiredError') {
        err = new AppError('Your token has expired! Please log in again.', 401);
    }
    if(err instanceof ZodError){
        const messages = err.issues.map(e => e.message).join('. ');
        err = new AppError(`Invalid input data. ${messages}`, 400);
    }
    res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
        error: process.env.NODE_ENV === 'development' ? err : undefined
    });
}

export default globalErrorHandler;