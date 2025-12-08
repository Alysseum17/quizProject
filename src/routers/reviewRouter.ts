import express from "express";
import * as reviewController from "../controllers/reviewController.js";
import { protect } from "../controllers/authCotroller.js";

const router = express.Router({ mergeParams: true });

router.get("/analytics", reviewController.getReviewAnalytics);

router
  .route("/")
  .get(reviewController.getQuizReviews)
  .post(protect, reviewController.createReview);

router
  .route("/:id")
  .delete(protect, reviewController.deleteReview)
  .patch(protect, reviewController.updateReview);

export default router;
