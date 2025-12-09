import express from "express";
import * as quizController from "../controllers/quizController.js";
import { protect } from "../controllers/authController.js";
import questionRouter from "./questionRouter.js";

const router = express.Router();

router.use("/:quizId/questions", questionRouter);

router.get("/", quizController.getSortedQuizByRating);
router.get("/name/:name", quizController.findQuizByName);
router.get("/:quizId", quizController.getFullyDetailedQuizById);
router.post("/", protect, quizController.createQuiz);
router.post("/complex", protect, quizController.createQuizComplex);
router.post("/:quizId/start", protect, quizController.startQuizAttempt);
router.post("/attempts/:attemptId/submit", protect, quizController.submitQuizAttempt);
router.get("/attempts/:attemptId/results", protect, quizController.getQuizResults);
router.put("/:id", protect, quizController.updateQuiz);
router.delete("/:id", protect, quizController.softDeleteQuiz);


export default router;
