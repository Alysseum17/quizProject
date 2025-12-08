import express from "express";
import * as quizController from "../controllers/quizController.js";
import { protect } from "../controllers/authController.js";
import questionRouter from "./questionRouter.js";

const router = express.Router();

router.use("/:quizId/questions", questionRouter);

router.get("/", quizController.getAllQuiz);
router.get("/rating", quizController.getSortedQuizByRating);
router.get("/name/:name", quizController.findQuizByName);
router.get("/:id", quizController.findQuizById);
router.post("/", protect, quizController.createQuiz);
router.post("/complex", protect, quizController.createQuizComplex);
router.post("/:quizId/start", protect, quizController.startQuizAttempt);
router.put("/:id", quizController.updateQuiz);
router.delete("/:id", quizController.softDeleteQuiz);

export default router;
