import { prisma } from "../prisma.js";
import AppError from "../utils/appError.js";

interface CreateReviewInput {
  rating: number;
  review_text?: string;
}
interface GetQuizReviewQuery {
  sort: "created_at" | "rating";
  order: "asc" | "desc";
  page: number;
  limit: number;
}
interface UpdateReviewInput {
  rating?: number;
  review_text?: string;
}

export default class ReviewService {
  async createReview(
    userId: number,
    quizId: number,
    data: CreateReviewInput
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

  async getQuizReviews(
    quizId: number,
    query: GetQuizReviewQuery
  ) {
    const offset = (query.page - 1) * query.limit;

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
      orderBy: {
        [query.sort]: query.order,
      },
      take: query.limit,
      skip: offset,
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
    data: UpdateReviewInput
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

  async getReviewAnalytics() {
    const results = await prisma.$queryRaw<any[]>`
            SELECT 
                q.title AS quiz_title,
                u.username AS author_name,
                COUNT(r.review_id)::int AS total_reviews,
                ROUND(AVG(r.rating)::numeric, 1)::float AS average_rating,

                SUM(CASE WHEN r.rating = 5 THEN 1 ELSE 0 END)::int AS count_5_stars,
                SUM(CASE WHEN r.rating = 4 THEN 1 ELSE 0 END)::int AS count_4_stars,
                SUM(CASE WHEN r.rating = 3 THEN 1 ELSE 0 END)::int AS count_3_stars,
                SUM(CASE WHEN r.rating = 2 THEN 1 ELSE 0 END)::int AS count_2_stars,
                SUM(CASE WHEN r.rating = 1 THEN 1 ELSE 0 END)::int AS count_1_stars,

                ROUND(
                    (SUM(CASE WHEN r.rating >= 4 THEN 1 ELSE 0 END)::numeric / NULLIF(COUNT(r.review_id), 0)) * 100, 
                    1
                )::float AS positive_percentage

            FROM "Quiz" q
            JOIN "Review" r ON q.quiz_id = r.quiz_id
            JOIN "User" u ON q.author_id = u.user_id 
            GROUP BY q.quiz_id, u.username
            ORDER BY total_reviews DESC;
        `;

    return results;
  }
}
