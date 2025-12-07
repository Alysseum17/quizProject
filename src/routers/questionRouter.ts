import express from "express";
import * as questionController from "../controllers/questionController.js";
import { protect } from "../controllers/authCotroller.js";

const router = express.Router({ mergeParams: true });

router.use(protect);

router.route("/").post(questionController.createQuestion);

router
  .route("/:id")
  .patch(questionController.updateQuestion)
  .delete(questionController.deleteQuestion);

export default router;
