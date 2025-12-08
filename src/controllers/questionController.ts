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
