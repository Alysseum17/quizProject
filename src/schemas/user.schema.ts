import zod from 'zod';

export const findUserByEmailSchema = zod.object({
    email: zod.string().email('Invalid email address'),
});

export const findUsersByNameSchema = zod.object({
    name: zod.string().min(1, 'Name is required'),
});

export const changeInfoSchema = zod.object({
    username: zod.string().min(3, 'Username must be at least 3 characters long').optional(),
    email: zod.string().email('Invalid email address').optional(),
});

export const queryUserSchema = zod.object({
    limit: zod.coerce.number().int().min(1).default(10),
    page: zod.coerce.number().int().min(1).default(1),
});

export const findUserByIdSchema = zod.object({
    userId: zod.coerce.number().int().positive(),
});

export const quizIdParamSchema = zod.object({
    quizId: zod.coerce.number().int().positive(),
});
