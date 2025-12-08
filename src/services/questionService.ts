import { prisma } from "../prisma.js";
import AppError from "../utils/appError.js";

type OptionInput = {
  answer_text: string;
  is_correct: boolean;
};

export default class QuestionService {
  async createQuestion(
    userId: number,
    quizId: number,
    data: {
      question_text: string;
      question_type: "single_choice" | "multiple_choice" | "free_text";
      points: number;
      options: OptionInput[];
    }
  ) {
    const quiz = await prisma.quiz.findUnique({ where: { id: quizId } });

    if (!quiz) throw new AppError("Quiz not found", 404);
    if (quiz.author_id !== userId)
      throw new AppError("You can only add questions to your own quizzes", 403);

    return await prisma.$transaction(async (tx) => {
      const newQuestion = await tx.question.create({
        data: {
          quiz_id: quizId,
          question_text: data.question_text,
          question_type: data.question_type,
          points: data.points,
        },
      });
      const optionsData = data.options.map((opt) => ({
        question_id: newQuestion.id,
        answer_text: opt.answer_text,
        is_correct: opt.is_correct,
      }));

      await tx.answerOption.createMany({ data: optionsData });

      return await tx.question.findUnique({
        where: { id: newQuestion.id },
        include: { answer_options: true },
      });
    });
  }

  async updateQuestion(
    userId: number,
    questionId: number,
    data: {
      question_text?: string;
      question_type?: "single_choice" | "multiple_choice" | "free_text";
      points?: number;
    }
  ) {
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: { quiz: true },
    });

    if (!question) throw new AppError("Question not found", 404);
    if (question.quiz.author_id !== userId)
      throw new AppError("Permission denied", 403);

    return await prisma.question.update({
      where: { id: questionId },
      data: data,
    });
  }

  async deleteQuestion(userId: number, questionId: number) {
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: { quiz: true },
    });

    if (!question) throw new AppError("Question not found", 404);
    if (question.quiz.author_id !== userId)
      throw new AppError("Permission denied", 403);

    await prisma.question.delete({ where: { id: questionId } });
  }

  async getQuestionStats(quizId: number) {
    const quiz = await prisma.quiz.findUnique({ where: { id: quizId } });
    if (!quiz) throw new AppError("Quiz not found", 404);

    const stats = await prisma.question.groupBy({
      by: ["question_type"],
      where: {
        quiz_id: quizId,
      },
      _count: {
        id: true,
      },
      _sum: {
        points: true,
      },
      _avg: {
        points: true,
      },
      _min: {
        points: true,
      },
      _max: {
        points: true,
      },
    });
    return stats;
  }
}
