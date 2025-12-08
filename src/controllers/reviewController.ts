import { Request, Response, NextFunction } from "express";
import catchAsync from "../utils/catchAsync.js";
import ReviewService from "../services/reviewService.js";
import * as reviewSchemas from "../schemas/review.schema.js";
import { AuthRequest } from "../utils/authRequestInterface.js";

const reviewService = new ReviewService();

export const createReview = catchAsync(async (req: AuthRequest, res: Response) => {
  const userId = req.user.id;
  const quizId = Number(req.params.quizId);
  const data = reviewSchemas.createReviewSchema.parse(req.body);
  const newReview = await reviewService.createReview(userId, quizId, data);

  res.status(201).json({
    status: "success",
    review: newReview,
  });
});

export const getQuizReviews = catchAsync(
  async (req: Request, res: Response) => {
    const quizId = Number(req.params.quizId);
    const query = reviewSchemas.getReviewsQuerySchema.parse(req.query);
    const reviews = await reviewService.getQuizReviews(quizId, query);

    res.status(200).json({
      status: "success",
      results: reviews.length,
      page: query.page,
      limit: query.limit,
      reviews,
    });
  }
);

export const deleteReview = catchAsync(async (req: AuthRequest, res: Response) => {
  const userId = req.user.id;
  const reviewId = Number(req.params.id);

  await reviewService.deleteReview(userId, reviewId);

  res.status(204).json({
    status: "success",
    data: null,
  });
});

export const updateReview = catchAsync(async (req: AuthRequest, res: Response) => {
  const userId = req.user.id;
  const reviewId = Number(req.params.id);

  const data = reviewSchemas.updateReviewSchema.parse(req.body);

  const updatedReview = await reviewService.updateReview(
    userId,
    reviewId,
    data
  );

  res.status(200).json({
    status: "success",
    review: updatedReview,
  });
});
