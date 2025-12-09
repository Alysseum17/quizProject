import request from "supertest";
import { app } from "../../src/app.js";
import { prisma } from "../../src/prisma.js";
import jwt from "jsonwebtoken";
import { cleanupDatabase } from "../helpers/cleanup.js";

const createTestQuiz = async (
  authorId: number,
  title = "Test Quiz",
  attempt_limit?: number
) => {
  return await prisma.quiz.create({
    data: {
      title,
      author_id: authorId,
      attempt_limit,
      questions: {
        create: [
          {
            question_text: "Test Q",
            question_type: "single_choice",
            answer_options: {
              create: [{ answer_text: "A", is_correct: true }],
            },
          },
        ],
      },
    },
    include: { questions: { include: { answer_options: true } } },
  });
};

describe("Global Quiz Integration Tests", () => {
  let token: string;
  let userId: number;
  
  beforeAll(async () => {
    await cleanupDatabase();

    const user = await prisma.user.create({
      data: {
        username: "global_tester",
        email: "global@test.com",
        password_hash: "hashed_placeholder",
      },
    });

    userId = user.id;
    token = jwt.sign({ id: user.id }, process.env.JWT_SECRET as string, {
      expiresIn: "1h",
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe("Quiz Management Flow", () => {
    let createdQuizId: number;

    it("POST /complex - should create a new quiz", async () => {
      const response = await request(app)
        .post("/api/quizzes/complex")
        .set("Authorization", `Bearer ${token}`)
        .send({
          title: "Sample Quiz",
          quiz_description: "A simple test quiz",
          attempt_limit: 3,
          time_limit: 30,
          difficulty: "easy",
          questions: [
            {
              question_text: "What is 2 + 2?",
              question_type: "single_choice",
              points: 5,
              options: [
                { optionText: "3" },
                { optionText: "4", isCorrect: true },
                { optionText: "5" },
              ],
            },
          ],
        });
      expect(response.status).toBe(201);
      expect(response.body.quiz.title).toBe("Sample Quiz");
      expect(response.body.quiz.quiz_description).toBe("A simple test quiz");
      expect(response.body.quiz.attempt_limit).toBe(3);
      expect(response.body.quiz.time_limit).toBe(30);
      expect(response.body.quiz.difficulty).toBe("easy");
      createdQuizId = response.body.quiz.id;
    });

    it("POST / - should create a basic quiz", async () => {
      const response = await request(app)
        .post("/api/quizzes")
        .set("Authorization", `Bearer ${token}`)
        .send({
          title: "Basic Quiz",
          quiz_description: "Basic desc",
          author_id: userId,
          attempt_limit: 5,
          time_limit: 20,
          difficulty: "medium",
        });
      expect(response.status).toBe(201);
      expect(response.body.newItem.title).toBe("Basic Quiz");
      expect(response.body.newItem.quiz_description).toBe("Basic desc");
      expect(response.body.newItem.attempt_limit).toBe(5);
      expect(response.body.newItem.time_limit).toBe(20);
      expect(response.body.newItem.difficulty).toBe("medium");
    });

    it("GET / - should retrieve quizzes with pagination structure", async () => {
      const response = await request(app).get("/api/quizzes");

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("items");
      expect(response.body).toHaveProperty("pagination");

      expect(response.body.pagination).toHaveProperty("page");
      expect(response.body.pagination).toHaveProperty("total");
      expect(response.body.pagination).toHaveProperty("totalPages");

      expect(response.body.items.length).toBeGreaterThanOrEqual(1);

      expect(response.body.items[0]).toHaveProperty("average_rating");
    });

    it("GET /:id - should retrieve detail quiz", async () => {
      const response = await request(app).get(`/api/quizzes/${createdQuizId}`);
      expect(response.status).toBe(200);
      expect(response.body.quiz.id).toBe(createdQuizId);
      expect(response.body.quiz.title).toBe("Sample Quiz");
      expect(response.body.quiz.quiz_description).toBe("A simple test quiz");
      expect(response.body.quiz.attempt_limit).toBe(3);
      expect(response.body.quiz.time_limit).toBe(30);
      expect(response.body.quiz.difficulty).toBe("easy");
    });

    it("PUT /:id - should update quiz", async () => {
      const response = await request(app)
        .put(`/api/quizzes/${createdQuizId}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ title: "Updated Title" });
      expect(response.status).toBe(200);
      expect(response.body.quiz.title).toBe("Updated Title");
    });

    it("DELETE /:id - should soft delete", async () => {
      const response = await request(app)
        .delete(`/api/quizzes/${createdQuizId}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ is_active: false });
      expect(response.status).toBe(200);
      expect(response.body.quiz.is_active).toBe(false);
      expect(response.body.message).toBe("Quiz soft-deleted successfully");
    });
  });

  describe("Quiz Search & Filtering", () => {
    beforeAll(async () => {
      const quiz1 = await createTestQuiz(userId, "Math Quiz");
      await prisma.review.create({
        data: {
          quiz_id: quiz1.id,
          user_id: userId,
          rating: 5,
          review_text: "Excellent",
        },
      });

      const quiz2 = await createTestQuiz(userId, "History Quiz");
      await prisma.review.create({
        data: {
          quiz_id: quiz2.id,
          user_id: userId,
          rating: 3,
          review_text: "Average",
        },
      });

      await createTestQuiz(userId, "Science Quiz");
    });

    it("GET / - should filter quizzes by rating range (4-5)", async () => {
      const response = await request(app).get("/api/quizzes").query({
        "rating[gte]": 4,
        "rating[lte]": 5,
      });

      expect(response.status).toBe(200);
      expect(response.body.items).toHaveLength(1);
      expect(response.body.items[0].title).toBe("Math Quiz");
      expect(Number(response.body.pagination.total)).toBe(1);
    });

    it("GET / - should search quizzes by name", async () => {
      const response = await request(app)
        .get("/api/quizzes")
        .query({ name: "History" });

      expect(response.status).toBe(200);
      expect(response.body.items).toHaveLength(1);
      expect(response.body.items[0].title).toBe("History Quiz");
    });

    it("GET / - should sort quizzes by rating descending", async () => {
      const response = await request(app).get("/api/quizzes").query({
        sort: "desc",
        orderBy: "average_rating",
      });

      expect(response.status).toBe(200);
      const items = response.body.items;
      expect(items.length).toBeGreaterThanOrEqual(2);
      expect(Number(items[0].average_rating)).toBeGreaterThanOrEqual(
        Number(items[1].average_rating)
      );
    });

    it("GET / - should include quizzes with 0 rating when filtering broadly", async () => {
      const response = await request(app).get("/api/quizzes").query({
        name: "Science",
        "rating[gte]": 0,
      });

      expect(response.status).toBe(200);
      expect(response.body.items[0].title).toBe("Science Quiz");
      expect(Number(response.body.items[0].average_rating)).toBe(0);
    });
  });

  describe("Quiz errors handling", () => {
    it("GET /:id - should return 404 for non-existent quiz", async () => {
      const response = await request(app).get("/api/quizzes/999999");
      expect(response.status).toBe(404);
      expect(response.body.message).toBe("Quiz not found");
    });
    it("PUT /:id - should return 404 when updating non-existent quiz", async () => {
      const response = await request(app)
        .put("/api/quizzes/999999")
        .set("Authorization", `Bearer ${token}`)
        .send({ title: "Non-existent Quiz" });
      expect(response.status).toBe(404);
      expect(response.body.message).toBe("Quiz not found");
    });
    it("DELETE /:id - should return 404 when deleting non-existent quiz", async () => {
      const response = await request(app)
        .delete("/api/quizzes/999999")
        .set("Authorization", `Bearer ${token}`)
        .send();
      expect(response.status).toBe(404);
      expect(response.body.message).toBe("Quiz not found");
    });
    it("PUT /:id - should return 403 when updating quiz not owned by user", async () => {
      const anotherUser = await prisma.user.create({
        data: {
          username: "another_user",
          email: "another_user@example.com",
          password_hash: "hashed_placeholder",
        },
      });
      const quiz = await prisma.quiz.create({
        data: {
          title: "Another User Quiz",
          author_id: anotherUser.id,
        },
      });
      const response = await request(app)
        .put(`/api/quizzes/${quiz.id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ title: "Hacked Title" });
      expect(response.status).toBe(403);
      expect(response.body.message).toBe(
        "You do not have permission to modify this quiz"
      );
    });
    it("DELETE /:id - should return 403 when deleting quiz not owned by user", async () => {
      const anotherUser = await prisma.user.create({
        data: {
          username: "third_user",
          email: "third_user@example.com",
          password_hash: "hashed_placeholder",
        },
      });
      const quiz = await prisma.quiz.create({
        data: {
          title: "Third User Quiz",
          author_id: anotherUser.id,
        },
      });
      const response = await request(app)
        .delete(`/api/quizzes/${quiz.id}`)
        .set("Authorization", `Bearer ${token}`)
        .send();
      expect(response.status).toBe(403);
      expect(response.body.message).toBe(
        "You do not have permission to modify this quiz"
      );
    });
  });

  describe("Quiz Attempt Flow", () => {
    let attemptQuizId: number;
    let attemptId: number;
    beforeAll(async () => {
      const quiz = await prisma.quiz.create({
        data: {
          title: "Attempt Quiz",
          author_id: userId,
          questions: {
            create: [
              {
                question_text: "Capital of France?",
                question_type: "single_choice",
                points: 5,
                answer_options: {
                  create: [
                    { answer_text: "Paris", is_correct: true },
                    { answer_text: "Berlin" },
                  ],
                },
              },
            ],
          },
        },
      });
      attemptQuizId = quiz.id;
    });

    it("POST /start - should start attempt", async () => {
      const response = await request(app)
        .post(`/api/quizzes/${attemptQuizId}/start`)
        .set("Authorization", `Bearer ${token}`)
        .send();

      expect(response.status).toBe(201);
      expect(response.body.attempt.finished_at).toBeNull();
      attemptId = response.body.attempt.id;
    });
    it("POST /submit - should submit attempt", async () => {
      const quiz = await prisma.quiz.findUnique({
        where: { id: attemptQuizId },
        include: { questions: { include: { answer_options: true } } },
      });
      if (!quiz || quiz.questions.length === 0)
        throw new Error("Quiz or questions not found");
      const question = quiz.questions[0];
      const correctAnswerOption = question.answer_options.find(
        (opt) => opt.is_correct
      );
      if (!correctAnswerOption)
        throw new Error("Correct answer option not found");
      const submitResponse = await request(app)
        .post(`/api/quizzes/attempts/${attemptId}/submit`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          answers: [
            {
              question_id: question.id,
              selected_option_ids: [correctAnswerOption.id],
            },
          ],
        });
      expect(submitResponse.status).toBe(200);
      expect(submitResponse.body.result).toHaveProperty("score");
      expect(submitResponse.body.result.score).toBe(5);
    });
    it("GET /results - should get quiz results", async () => {
      const response = await request(app)
        .get(`/api/quizzes/attempts/${attemptId}/results`)
        .set("Authorization", `Bearer ${token}`)
        .send();
      expect(response.status).toBe(200);
      expect(response.body.results).toHaveProperty("totalPointsEarned");
      expect(response.body.results.totalPointsEarned).toBe(5);
      expect(response.body.results).toHaveProperty("totalPossiblePoints");
      expect(response.body.results.totalPossiblePoints).toBe(5);
      expect(response.body.results).toHaveProperty("questionResponses");
      expect(response.body.results.questionResponses.length).toBe(1);
      expect(response.body.results.questionResponses[0]).toHaveProperty(
        "earnedPoints",
        5
      );
      expect(response.body.results.questionResponses[0]).toHaveProperty(
        "possiblePoints",
        5
      );
      expect(response.body.results.questionResponses[0]).toHaveProperty(
        "selectedAnswers"
      );
      expect(
        response.body.results.questionResponses[0].selectedAnswers.length
      ).toBe(1);
      expect(
        response.body.results.questionResponses[0].selectedAnswers[0]
      ).toHaveProperty("answerText", "Paris");
      expect(
        response.body.results.questionResponses[0].selectedAnswers[0]
      ).toHaveProperty("isCorrect", true);
    });
  });

  describe("Quiz Attempt Errors Handling", () => {
    it("POST /start - should return 404 when starting attempt for non-existent quiz", async () => {
      const response = await request(app)
        .post("/api/quizzes/999999/start")
        .set("Authorization", `Bearer ${token}`)
        .send();
      expect(response.status).toBe(404);
      expect(response.body.message).toBe("Quiz not found");
    });
    it("POST /start - should return 400 when starting attempt for a quiz that is already started", async () => {
      const quiz = await createTestQuiz(userId, "Ongoing Attempt Quiz");
      await request(app)
        .post(`/api/quizzes/${quiz.id}/start`)
        .set("Authorization", `Bearer ${token}`)
        .send();
      const secondStartResponse = await request(app)
        .post(`/api/quizzes/${quiz.id}/start`)
        .set("Authorization", `Bearer ${token}`)
        .send();
      expect(secondStartResponse.status).toBe(400);
      expect(secondStartResponse.body.message).toBe(
        "You have an ongoing attempt for this quiz"
      );
    });
    it("POST /start - should return 400 when starting attempt exceeding attempt limit", async () => {
      const quiz = await createTestQuiz(userId, "Limited Attempt Quiz", 1);
      await request(app)
        .post(`/api/quizzes/${quiz.id}/start`)
        .set("Authorization", `Bearer ${token}`)
        .send();
      const secondAttemptResponse = await request(app)
        .post(`/api/quizzes/${quiz.id}/start`)
        .set("Authorization", `Bearer ${token}`)
        .send();
      expect(secondAttemptResponse.status).toBe(400);
      expect(secondAttemptResponse.body.message).toBe(
        "Attempt limit reached for this quiz"
      );
    });
    it("POST /submit - should return 404 when submitting non-existent attempt", async () => {
      const response = await request(app)
        .post("/api/quizzes/attempts/999999/submit")
        .set("Authorization", `Bearer ${token}`)
        .send({
          answers: [
            {
              question_id: 1,
              selected_option_ids: [1],
            },
          ],
        });
      expect(response.status).toBe(404);
      expect(response.body.message).toBe("Quiz attempt not found");
    });
    it("GET /results - should return 404 when getting results for non-existent attempt", async () => {
      const response = await request(app)
        .get("/api/quizzes/attempts/999999/results")
        .set("Authorization", `Bearer ${token}`)
        .send();
      expect(response.status).toBe(404);
      expect(response.body.message).toBe("Quiz attempt not found");
    });
    it("POST /submit - should return 400 when submitting after attempt is finished", async () => {
      const quiz = await createTestQuiz(userId, "Finished Attempt Quiz");
      const realQuestionId = quiz.questions[0].id;
      const realAnswerOptionId = quiz.questions[0].answer_options.find(
        (opt) => opt.is_correct
      )?.id;
      const startResponse = await request(app)
        .post(`/api/quizzes/${quiz.id}/start`)
        .set("Authorization", `Bearer ${token}`)
        .send();
      const finishedAttemptId = startResponse.body.attempt.id;
      await prisma.quizAttempt.update({
        where: { id: finishedAttemptId },
        data: { finished_at: new Date() },
      });
      const submitResponse = await request(app)
        .post(`/api/quizzes/attempts/${finishedAttemptId}/submit`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          answers: [
            {
              question_id: realQuestionId,
              selected_option_ids: [realAnswerOptionId!],
            },
          ],
        });
      expect(submitResponse.status).toBe(400);
      expect(submitResponse.body.message).toBe(
        "This attempt is already submitted"
      );
    });
  });

  describe("Question Management Flow", () => {
    let questionId: number;
    let createdQuizId: number;

    beforeAll(async () => {
      const quiz = await createTestQuiz(userId, "Question Flow Quiz");
      createdQuizId = quiz.id;
    });

    it("POST /:quizId/questions - should add a new question", async () => {
      const response = await request(app)
        .post(`/api/quizzes/${createdQuizId}/questions`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          question_text: "Integration Test Question",
          question_type: "multiple_choice",
          points: 10,
          options: [
            { answer_text: "Option A", is_correct: true },
            { answer_text: "Option B", is_correct: false },
            { answer_text: "Option C", is_correct: true },
          ],
        });

      expect(response.status).toBe(201);
      expect(response.body.status).toBe("success");
      expect(response.body.question.question_text).toBe(
        "Integration Test Question"
      );
      expect(response.body.question.points).toBe(10);
      expect(response.body.question.answer_options).toHaveLength(3);

      questionId = response.body.question.id;
    });

    it("GET /:quizId/questions/stats - should get stats", async () => {
      const response = await request(app)
        .get(`/api/quizzes/${createdQuizId}/questions/stats`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("success");
      expect(Array.isArray(response.body.stats)).toBe(true);

      const multipleChoiceStat = response.body.stats.find(
        (s: any) => s.question_type === "multiple_choice"
      );
      expect(multipleChoiceStat).toBeDefined();
      expect(multipleChoiceStat._sum.points).toBeGreaterThanOrEqual(10);
    });

    it("PATCH /questions/:id - should update question", async () => {
      const response = await request(app)
        .patch(`/api/quizzes/${createdQuizId}/questions/${questionId}`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          question_text: "Updated Question Text",
          points: 15,
        });

      expect(response.status).toBe(200);
      expect(response.body.question.question_text).toBe(
        "Updated Question Text"
      );
      expect(response.body.question.points).toBe(15);
    });

    it("DELETE /questions/:id - should delete question", async () => {
      const response = await request(app)
        .delete(`/api/quizzes/${createdQuizId}/questions/${questionId}`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(204);
    });

    it("DELETE /questions/:id - should return 404 for deleted question", async () => {
      const response = await request(app)
        .delete(`/api/quizzes/${createdQuizId}/questions/${questionId}`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(404);
    });
  });

  describe("Answer Options Management Flow", () => {
    let answerQuizId: number;
    let answerQuestionId: number;
    let createdAnswerId: number;

    beforeAll(async () => {
      const quiz = await prisma.quiz.create({
        data: {
          title: "Answer Ops Quiz",
          author_id: userId,
          questions: {
            create: [
              {
                question_text: "Base Question?",
                question_type: "single_choice",
                points: 1,
              },
            ],
          },
        },
        include: { questions: true },
      });
      answerQuizId = quiz.id;
      answerQuestionId = quiz.questions[0].id;
    });

    it("POST /:questionId/answers - should add a new answer option", async () => {
      const response = await request(app)
        .post(
          `/api/quizzes/${answerQuizId}/questions/${answerQuestionId}/answers`
        )
        .set("Authorization", `Bearer ${token}`)
        .send({
          answer_text: "New Option",
          is_correct: false,
        });

      expect(response.status).toBe(201);
      expect(response.body.data.answer.answer_text).toBe("New Option");
      expect(response.body.data.answer.is_correct).toBe(false);

      createdAnswerId = response.body.data.answer.id;
    });

    it("POST /:questionId/answers - should fail if answer_text is missing", async () => {
      const response = await request(app)
        .post(
          `/api/quizzes/${answerQuizId}/questions/${answerQuestionId}/answers`
        )
        .set("Authorization", `Bearer ${token}`)
        .send({
          is_correct: true,
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/required/i);
    });

    it("PATCH /answers/:answerId - should update answer text", async () => {
      const response = await request(app)
        .patch(
          `/api/quizzes/${answerQuizId}/questions/answers/${createdAnswerId}`
        )
        .set("Authorization", `Bearer ${token}`)
        .send({
          answer_text: "Updated Option Text",
          is_correct: true,
        });

      expect(response.status).toBe(200);
      expect(response.body.data.answer.answer_text).toBe("Updated Option Text");
      expect(response.body.data.answer.is_correct).toBe(true);
    });

    it("PATCH /answers/:answerId - should forbid updating answer by non-owner", async () => {
      const otherUser = await prisma.user.create({
        data: {
          username: "intruder",
          email: "intruder@test.com",
          password_hash: "hash",
        },
      });
      const otherToken = jwt.sign(
        { id: otherUser.id },
        process.env.JWT_SECRET as string
      );

      const response = await request(app)
        .patch(
          `/api/quizzes/${answerQuizId}/questions/answers/${createdAnswerId}`
        )
        .set("Authorization", `Bearer ${otherToken}`)
        .send({ answer_text: "Hacked" });

      expect(response.status).toBe(403);
      expect(response.body.message).toMatch(/permission/i);
    });

    it("PATCH /answers/:answerId - should return 404 for non-existent answer", async () => {
      const response = await request(app)
        .patch(`/api/quizzes/${answerQuizId}/questions/answers/999999`)
        .set("Authorization", `Bearer ${token}`)
        .send({ answer_text: "Ghost" });

      expect(response.status).toBe(404);
    });

    it("DELETE /answers/:answerId - should delete answer option", async () => {
      const response = await request(app)
        .delete(
          `/api/quizzes/${answerQuizId}/questions/answers/${createdAnswerId}`
        )
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(204);

      const deleted = await prisma.answerOption.findUnique({
        where: { id: createdAnswerId },
      });
      expect(deleted).toBeNull();
    });

    it("DELETE /answers/:answerId - should return 404 if answer already deleted", async () => {
      const response = await request(app)
        .delete(
          `/api/quizzes/${answerQuizId}/questions/answers/${createdAnswerId}`
        )
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(404);
    });
  });
});