import zod from 'zod';

export const signupSchema = zod.object({
    username: zod.string().min(3, 'Username must be at least 3 characters long'),
    email: zod.string().email('Invalid email address'),
    password: zod.string().min(6, 'Password must be at least 6 characters long'),
    passwordConfirm: zod.string().min(6, 'Password confirmation must be at least 6 characters long'),
}).refine((data) => data.password === data.passwordConfirm, {
    message: 'Passwords do not match',
    path: ['passwordConfirm'],
});

export const loginSchema = zod.object({
    email: zod.string().email('Invalid email address'),
    password: zod.string().min(6, 'Password must be at least 6 characters long'),
});