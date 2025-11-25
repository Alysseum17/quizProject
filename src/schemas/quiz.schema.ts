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