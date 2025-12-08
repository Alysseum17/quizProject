import { prisma } from "../prisma.js";
import AppError from "../utils/appError.js";

export default class ReviewService {
  async createReview(
    userId: number,
    quizId: number,
    data: { rating: number; review_text?: string }
  ) {
    const quiz = await prisma.quiz.findUnique({ where: { id: quizId } });
    if (!quiz) {
      throw new AppError("Quiz not found", 404);
    }
    const existingReview = await prisma.review.findFirst({
      where: {
        user_id: userId,
        quiz_id: quizId,
      },
    });

    if (existingReview) {
      throw new AppError("You have already reviewed this quiz", 400);
    }

    return await prisma.review.create({
      data: {
        user_id: userId,
        quiz_id: quizId,
        rating: data.rating,
        review_text: data.review_text,
      },
    });
  }

  async getQuizReviews(quizId: number) {
    return await prisma.review.findMany({
      where: { quiz_id: quizId },
      include: {
        user: {
          select: {
            username: true,
            avatar_url: true,
          },
        },
      },
      orderBy: { created_at: "desc" },
    });
  }

  async deleteReview(userId: number, reviewId: number) {
    const review = await prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) {
      throw new AppError("Review not found", 400);
    }

    if (review.user_id !== userId) {
      throw new AppError("You can only delete your own reviews", 403);
    }

    await prisma.review.delete({ where: { id: reviewId } });
  }

  async updateReview(
    userId: number,
    reviewId: number,
    data: { rating?: number; review_text?: string }
  ) {
    const review = await prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) {
      throw new AppError("Review not found", 404);
    }

    if (review.user_id !== userId) {
      throw new AppError("You can only edit your own reviews", 403);
    }

    return await prisma.review.update({
      where: { id: reviewId },
      data: {
        rating: data.rating,
        review_text: data.review_text,
      },
    });
  }
}
