import { Request, Response } from "express";
import catchAsync from "../utils/catchAsync.js";
import QuestionService from "../services/questionService.js";
import * as questionSchemas from "../schemas/question.schema.js";
import * as quizSchemas from "../schemas/quiz.schema.js";
import { AuthRequest } from "../utils/authRequestInterface.js";

const questionService = new QuestionService();

export const createQuestion = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user.id;
    const { quizId } = quizSchemas.quizIdParamSchema.parse(req.params);

    const data = questionSchemas.createQuestionSchema.parse(req.body);
    const question = await questionService.createQuestion(userId, quizId, data);

    res.status(201).json({ status: "success", question });
  }
);

export const updateQuestion = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user.id;
    const { questionId } = questionSchemas.questionIdParamSchema.parse(req.params);

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
    const { questionId } = questionSchemas.questionIdParamSchema.parse(req.params);

    await questionService.deleteQuestion(userId, questionId);

    res.status(204).json({ status: "success", data: null });
  }
);


export const addAnswerOption = catchAsync(async (req: AuthRequest, res: Response) => {
  const userId = req.user.id; 
  const { questionId } = questionSchemas.questionIdParamSchema.parse(req.params);

  const { answer_text, is_correct } = questionSchemas.optionSchema.parse(req.body);

  if (!answer_text) {
    return res.status(400).json({ status: 'fail', message: 'Answer text is required' });
  }

  const newAnswer = await questionService.addAnswerOption(userId, questionId, {
    answer_text,
    is_correct: is_correct || false,
  });

  res.status(201).json({ status: "success", data: { answer: newAnswer } });
});

export const updateAnswerOption = catchAsync(async (req: AuthRequest, res: Response) => {
  const userId = req.user.id;
  const { answerId } = questionSchemas.answerOptionIdParamSchema.parse(req.params);
  const { answer_text, is_correct } = questionSchemas.optionSchema.parse(req.body);

  const updatedAnswer = await questionService.updateAnswerOption(userId, answerId, {
    answer_text,
    is_correct,
  });

  res.status(200).json({ status: "success", data: { answer: updatedAnswer } });
});

export const deleteAnswerOption = catchAsync(async (req: AuthRequest, res: Response) => {
  const userId = req.user.id;
  const answerId = Number(req.params.answerId);

  await questionService.deleteAnswerOption(userId, answerId);

  res.status(204).json({ status: "success", data: null });
});


export const getQuestionStats = catchAsync(
  async (req: Request, res: Response) => {
    const quiz = Number(req.params.quizId);

    const stats = await questionService.getQuestionStats(quiz);

    res.status(200).json({ status: "success", stats });
  }
);