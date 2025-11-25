import zod from 'zod';

export const quizSchema = zod.object({
    title: zod.string().min(1, 'Title is required'),
    quiz_description: zod.string().optional(),
    author_id: zod.coerce.number().int(),
    attempt_limit: zod.coerce.number().int().min(1).optional(),
    difficulty: zod.enum(['easy', 'medium', 'hard']).optional(),
});