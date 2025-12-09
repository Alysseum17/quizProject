import { Request, Response } from "express";
import catchAsync from "../utils/catchAsync.js";
import QuestionService from "../services/questionService.js";
import * as questionSchemas from "../schemas/question.schema.js";

const questionService = new QuestionService();

export const createQuestion = catchAsync(
  async (req: Request, res: Response) => {
    const userId = (req as any).user.id;
    const quizId = Number(req.params.quizId);

    const data = questionSchemas.createQuestionSchema.parse(req.body);
    const question = await questionService.createQuestion(userId, quizId, data);

    res.status(201).json({ status: "success", question });
  }
);

export const updateQuestion = catchAsync(
  async (req: Request, res: Response) => {
    const userId = (req as any).user.id;
    const questionId = Number(req.params.id);

    const data = questionSchemas.updateQuestionSchema.parse(req.body);
    const question = await questionService.updateQuestion(
      userId,
      questionId,
      data
    );
    res.status(200).json({ status: "success", question });
  }
);

export const deleteQuestion = catchAsync(
  async (req: Request, res: Response) => {
    const userId = (req as any).user.id;
    const questionId = Number(req.params.id);

    await questionService.deleteQuestion(userId, questionId);

    res.status(204).json({ status: "success", data: null });
  }
);

export const addAnswerOption = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const questionId = Number(req.params.questionId);

  const { answer_text, is_correct } = req.body;

  if (!answer_text) {
    return res.status(400).json({ status: 'fail', message: 'Answer text is required' });
  }

  const newAnswer = await questionService.addAnswerOption(userId, questionId, {
    answer_text,
    is_correct: is_correct || false,
  });

  res.status(201).json({ status: "success", data: { answer: newAnswer } });
});

export const updateAnswerOption = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const answerId = Number(req.params.answerId);
  const { answer_text, is_correct } = req.body;

  const updatedAnswer = await questionService.updateAnswerOption(userId, answerId, {
    answer_text,
    is_correct,
  });

  res.status(200).json({ status: "success", data: { answer: updatedAnswer } });
});

export const deleteAnswerOption = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const answerId = Number(req.params.answerId);

  await questionService.deleteAnswerOption(userId, answerId);

  res.status(204).json({ status: "success", data: null });
});
