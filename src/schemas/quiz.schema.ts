

import zod from 'zod';

export const quizCreateSchema = zod.object({
    title: zod.string().min(1, 'Title is required'),
    quiz_description: zod.string().optional(),
    author_id: zod.coerce.number().int().positive(),
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
    limit: zod.coerce.number().int().min(1).default(10),
    sort: zod.enum(['asc', 'desc']).default('desc'),
    page: zod.coerce.number().int().min(1).default(1),
    rating: zod.object({
        gte: zod.coerce.number().min(0).max(5).default(0),
        lte: zod.coerce.number().min(0).max(5).default(5),
    }).default({gte:0, lte:5}),
});

export const optionSchema = zod.object({
    optionText: zod.string().min(1, 'Option text is required'),
    isCorrect: zod.boolean().optional(),
});

export const questionSchema = zod.object({
    question_text: zod.string().min(1, 'Question text is required'),
    question_type: zod.enum(['single_choice', 'multiple_choice', 'free_text']),
    points: zod.coerce.number().int().min(1).optional(),
    options: zod.array(optionSchema).min(1, 'At least one option is required'),
});

export const quizComplexSchema = zod.object({
    title: zod.string().min(1, 'Title is required'),
    quiz_description: zod.string().optional(),
    attempt_limit: zod.coerce.number().int().min(1).optional(),
    time_limit: zod.coerce.number().int().min(1).optional(),
    difficulty: zod.enum(['easy', 'medium', 'hard']).optional(),
    questions: zod.array(questionSchema).min(1, 'At least one question is required'),
});

export const quizIdParamSchema = zod.object({
    quizId: zod.coerce.number().int().positive(),
});

export const quizAttemptIdParamSchema = zod.object({
    attemptId: zod.coerce.number().int().positive(),
});

export const quizNameParamSchema = zod.object({
    name: zod.string().min(1, 'Quiz name is required'),
});

export const quizAttemptSubmitSchema = zod.object({
    answers: zod.array(zod.object({
        question_id: zod.coerce.number().int().positive(),
        selected_option_ids: zod.array(zod.coerce.number().int().positive()).optional(),
        free_text_answer: zod.string().optional(),
    })).min(1, 'At least one answer is required'),
});

