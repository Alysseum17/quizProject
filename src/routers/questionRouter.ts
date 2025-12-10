import express from "express";
import * as questionController from "../controllers/questionController.js";
import { protect } from "../controllers/authController.js";

const router = express.Router({ mergeParams: true });

router.use(protect);

router.get("/stats", questionController.getQuestionStats);

router.post("/", questionController.createQuestion);

router
  .route("/:questionId")
  .patch(questionController.updateQuestion)
  .delete(questionController.deleteQuestion);

router.post("/:questionId/answers", questionController.addAnswerOption);

router
  .route("/answers/:answerId")
  .patch(questionController.updateAnswerOption)
  .delete(questionController.deleteAnswerOption);

export default router;