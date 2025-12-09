import { prisma } from "../prisma.js";
import AppError from "../utils/appError.js";


type OptionInput = {
 {
  answer_text: string;
  is_correct: boolean;
};
interface createQuestionInput {
  question_text: string;
  question_type: "single_choice" | "multiple_choice" | "free_text";
  points: number;
  options: OptionInput[];
}
interface updateQuestionInput {
  question_text?: string;
  question_type?: "single_choice" | "multiple_choice" | "free_text";
  points?: number;
}

export default class QuestionService {
  async createQuestion(
    userId: number,
    quizId: number,
    data: createQuestionInput
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
    data: updateQuestionInput
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

  private async verifyAnswerOwnership(tx: any, answerId: number, userId: number) {
    const answer = await tx.answerOption.findUnique({
      where: { id: answerId },
      include: {
        question: {
          include: { quiz: true },
        },
      },
    });

    if (!answer) {
      throw new AppError("Answer option not found", 404);
    }

    if (answer.question.quiz.author_id !== userId) {
      throw new AppError("You do not have permission to modify this answer", 403);
    }
    return answer;
  }

  async addAnswerOption(
    userId: number,
    questionId: number,
    data: { answer_text: string; is_correct: boolean }
  ) {
    return await prisma.$transaction(async (tx) => {
      const question = await tx.question.findUnique({
        where: { id: questionId },
        include: { quiz: true },
      });

      if (!question) throw new AppError("Question not found", 404);
      if (question.quiz.author_id !== userId) {
        throw new AppError("You do not have permission to add answers to this question", 403);
      }

      return await tx.answerOption.create({
        data: {
          question_id: questionId,
          answer_text: data.answer_text,
          is_correct: data.is_correct,
        },
      });
    });
  }

  async updateAnswerOption(
    userId: number,
    answerId: number,
    data: { answer_text?: string; is_correct?: boolean }
  ) {
    return await prisma.$transaction(async (tx) => {
      await this.verifyAnswerOwnership(tx, answerId, userId);

      return await tx.answerOption.update({
        where: { id: answerId },
        data: data,
      });
    });
  }

  async deleteAnswerOption(userId: number, answerId: number) {
    return await prisma.$transaction(async (tx) => {
      await this.verifyAnswerOwnership(tx, answerId, userId);

      await tx.answerOption.delete({
        where: { id: answerId },
      });
    });

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

