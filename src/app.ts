import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import quizRouter from './routers/quizRouter.js';
import authRouter from './routers/authRouter.js';
import globalErrorHandler from './controllers/errorController.js';
export const app = express();
app.set('query parser', 'extended');

app.enable('trust proxy');
app.use(cors());
app.use(helmet());
const limiter = rateLimit({
    max: 100,
    windowMs: 60 * 60 * 1000,
    message: 'Too many requests from this IP, please try again in an hour!'
});

app.use('/api', limiter);
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(compression());

app.use('/api/quizzes', quizRouter);
app.use('/api/users', authRouter);

app.use(globalErrorHandler);






