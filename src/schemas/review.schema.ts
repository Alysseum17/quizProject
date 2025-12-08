import zod from "zod";

export const createReviewSchema = zod.object({
  rating: zod
    .number()
    .min(1, "Rating must be a least 1")
    .max(5, "Rating must be at most 5"),
  review_text: zod.string().optional(),
});

export const updateReviewSchema = zod.object({
  rating: zod.number().min(1).max(5).optional(),
  review_text: zod.string().optional(),
});
