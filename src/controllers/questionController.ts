import { Request, Response } from "express";
import catchAsync from "../utils/catchAsync.js";
import QuestionService from "../services/questionService.js";
import * as questionSchemas from "../schemas/question.schema.js";
import { AuthRequest } from "../utils/authRequestInterface.js";

const questionService = new QuestionService();

export const createQuestion = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user.id;
    const quizId = Number(req.params.quizId);

    const data = questionSchemas.createQuestionSchema.parse(req.body);
    const question = await questionService.createQuestion(userId, quizId, data);

    res.status(201).json({ status: "success", question });
  }
);

export const updateQuestion = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user.id;
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
  async (req: AuthRequest, res: Response) => {
    const userId = req.user.id;
    const questionId = Number(req.params.id);

    await questionService.deleteQuestion(userId, questionId);

    res.status(204).json({ status: "success", data: null });
  }
);

export const getQuestionStats = catchAsync(
  async (req: Request, res: Response) => {
    const quiz = Number(req.params.quizId);

    const stats = await questionService.getQuestionStats(quiz);

    res.status(200).json({ status: "success", stats });
  }
);
