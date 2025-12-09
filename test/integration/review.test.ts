import request from "supertest";
import { app } from "../../src/app.js";
import { prisma } from "../../src/prisma.js";
import jwt from "jsonwebtoken";
import { cleanupDatabase } from "../helpers/cleanup.js";

describe("Review Integration Tests", () => {
  let authorToken: string;
  let reviewerToken: string;
  let quizId: number;
  let reviewId: number;

  const createTestUser = async (username: string, email: string) => {
    const user = await prisma.user.create({
      data: {
        username,
        email,
        password_hash: "hashed_placeholder",
      },
    });

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET as string, {
      expiresIn: "1h",
    });
    return { user, token };
  };

  beforeAll(async () => {
    await cleanupDatabase();

    const author = await createTestUser("author_user", "author@test.com");
    authorToken = author.token;

    const reviewer = await createTestUser("reviewer_user", "reviewer@test.com");
    reviewerToken = reviewer.token;

    const quiz = await prisma.quiz.create({
      data: {
        title: "Reviewable Quiz",
        author_id: author.user.id,
        quiz_description: "Test description",
        questions: {
          create: [
            {
              question_text: "Q1",
              question_type: "single_choice",
              answer_options: {
                create: [{ answer_text: "A1", is_correct: true }],
              },
            },
          ],
        },
      },
    });
    quizId = quiz.id;
  });
  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe("Review CRUD Flow", () => {
    it("POST /api/quizzes/:id/reviews - should create a review", async () => {
      const response = await request(app)
        .post(`/api/quizzes/${quizId}/reviews`)
        .set("Authorization", `Bearer ${reviewerToken}`)
        .send({
          rating: 5,
          review_text: "Great quiz!",
        });

      expect(response.status).toBe(201);
      expect(response.body.status).toBe("success");
      expect(Number(response.body.review.rating)).toBe(5);
      expect(response.body.review.review_text).toBe("Great quiz!");

      reviewId = response.body.review.id;
    });

    it("POST /api/quizzes/:id/reviews - should prevent duplicate reviews", async () => {
      const response = await request(app)
        .post(`/api/quizzes/${quizId}/reviews`)
        .set("Authorization", `Bearer ${reviewerToken}`)
        .send({
          rating: 4,
          review_text: "Another review",
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/already reviewed/);
    });

    it("GET /api/quizzes/:id/reviews - should get reviews list", async () => {
      const response = await request(app)
        .get(`/api/quizzes/${quizId}/reviews`)
        .set("Authorization", `Bearer ${authorToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.items)).toBe(true);
      expect(response.body.items.length).toBeGreaterThan(0);
      expect(response.body.items[0].user).toHaveProperty(
        "username",
        "reviewer_user"
      );
      expect(response.body.pagination).toHaveProperty("totalItems");
    });

    it("GET /api/reviews/analytics - should get analytics", async () => {
      const response = await request(app)
        .get("/api/reviews/analytics")
        .set("Authorization", `Bearer ${authorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("success");
      expect(Array.isArray(response.body.data)).toBe(true);

      if (response.body.data.length > 0) {
        const firstItem = response.body.data[0];
        expect(firstItem).toHaveProperty("quiz_title");
        expect(firstItem).toHaveProperty("average_rating");
      }
    });

    it("PATCH /api/reviews/:id - should update a review", async () => {
      const response = await request(app)
        .patch(`/api/reviews/${reviewId}`)
        .set("Authorization", `Bearer ${reviewerToken}`)
        .send({
          rating: 3,
          review_text: "Updated text",
        });

      expect(response.status).toBe(200);
      expect(response.body.review.review_text).toBe("Updated text");
      expect(Number(response.body.review.rating)).toBe(3);
    });

    it("PATCH /api/reviews/:id - should return 403 when updating others review", async () => {
      const response = await request(app)
        .patch(`/api/reviews/${reviewId}`)
        .set("Authorization", `Bearer ${authorToken}`)
        .send({ review_text: "Hacked" });

      expect(response.status).toBe(403);
    });

    it("DELETE /api/reviews/:id - should delete a review", async () => {
      const response = await request(app)
        .delete(`/api/reviews/${reviewId}`)
        .set("Authorization", `Bearer ${reviewerToken}`);

      expect(response.status).toBe(204);
    });

    it("DELETE /api/reviews/:id - should return 404 for already deleted review", async () => {
      const response = await request(app)
        .delete(`/api/reviews/${reviewId}`)
        .set("Authorization", `Bearer ${reviewerToken}`);

      expect(response.status).toBe(404);
    });
  });
});
