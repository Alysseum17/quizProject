import zod from 'zod';

export const findUserByEmailSchema = zod.object({
    email: zod.string().email('Invalid email address'),
});

export const findUsersByNameSchema = zod.object({
    name: zod.string().min(1, 'Name is required'),
});

export const queryUserSchema = zod.object({
    limit: zod.coerce.number().int().min(1).default(10),
    page: zod.coerce.number().int().min(1).default(1),
});