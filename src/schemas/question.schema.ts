import zod from "zod";

export const optionSchema = zod.object({
  answer_text: zod.string().min(1, "Answer text is required"),
  is_correct: zod.boolean().optional().default(false),
});

export const answerOptionIdParamSchema = zod.object({
  answerId: zod.coerce.number().int().positive(),
});

export const createQuestionSchema = zod.object({
  question_text: zod.string().min(3, "Question text must be at least 3 chars"),
  question_type: zod
    .enum(["single_choice", "multiple_choice", "free_text"])
    .default("single_choice"),
  points: zod.number().int().min(1).default(1),
  options: zod.array(optionSchema).min(1, "At least one option is required"),
});

export const updateQuestionSchema = zod.object({
  question_text: zod.string().optional(),
  question_type: zod
    .enum(["single_choice", "multiple_choice", "free_text"])
    .optional(),
  points: zod.number().int().min(1).optional(),
});

export const questionIdParamSchema = zod.object({
  questionId: zod.coerce.number().int().positive(),
});