import { time } from 'console';
import zod from 'zod';

export const quizCreateSchema = zod.object({
    title: zod.string().min(1, 'Title is required'),
    quiz_description: zod.string().optional(),
    author_id: zod.coerce.number().int(),
    attempt_limit: zod.coerce.number().int().min(1).optional(),
    time_limit: zod.coerce.number().int().min(1).optional(),
    difficulty: zod.enum(['easy', 'medium', 'hard']).optional(),
});

export const quizUpdateSchema = zod.object({
    title: zod.string().min(1, 'Title is required').optional(),
    quiz_description: zod.string().optional(),
    attempt_limit: zod.coerce.number().int().min(1).optional(),
    time_limit: zod.coerce.number().int().min(1).optional(),
    difficulty: zod.enum(['easy', 'medium', 'hard']).optional(),
}); 

export const quizQuerySchema = zod.object({
    limit: zod.coerce.number().int().min(1).default(10).optional(),
    sort: zod.enum(['asc', 'desc']).default('desc').optional(),
    rating: zod.object({
        gte: zod.coerce.number().min(0).max(5).default(0).optional(),
        lte: zod.coerce.number().min(0).max(5).default(5).optional(),
    }).optional(),
});