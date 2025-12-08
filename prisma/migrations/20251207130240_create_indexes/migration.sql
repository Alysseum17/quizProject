/*
  Warnings:

  - A unique constraint covering the columns `[user_id,quiz_id]` on the table `Review` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE INDEX "AnswerOption_question_id_idx" ON "AnswerOption"("question_id");

-- CreateIndex
CREATE INDEX "Bookmark_user_id_idx" ON "Bookmark"("user_id");

-- CreateIndex
CREATE INDEX "Question_quiz_id_idx" ON "Question"("quiz_id") WHERE is_active = true;

-- CreateIndex
CREATE INDEX "QuestionResponse_quiz_attempt_id_idx" ON "QuestionResponse"("quiz_attempt_id");

-- CreateIndex
CREATE INDEX "QuestionResponse_question_id_idx" ON "QuestionResponse"("question_id");

-- CreateIndex
CREATE INDEX "Quiz_author_id_idx" ON "Quiz"("author_id") WHERE is_active = true;

-- CreateIndex
CREATE INDEX "Quiz_title_idx" ON "Quiz"("title") WHERE is_active = true;

-- CreateIndex
CREATE INDEX "Quiz_created_at_idx" ON "Quiz"("created_at") WHERE is_active = true;

-- CreateIndex
CREATE INDEX "QuizAttempt_user_id_quiz_id_idx" ON "QuizAttempt"("user_id", "quiz_id") WHERE finished_at IS NULL;

-- CreateIndex
CREATE INDEX "QuizAttempt_user_id_started_at_idx" ON "QuizAttempt"("user_id", "started_at");

-- CreateIndex
CREATE INDEX "QuizAttempt_quiz_id_idx" ON "QuizAttempt"("quiz_id");

-- CreateIndex
CREATE INDEX "Review_quiz_id_created_at_idx" ON "Review"("quiz_id", "created_at");

-- CreateIndex
CREATE INDEX "Review_user_id_idx" ON "Review"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "Review_user_id_quiz_id_key" ON "Review"("user_id", "quiz_id");

-- CreateIndex
CREATE INDEX "User_reset_token_reset_token_expires_at_idx" ON "User"("reset_token", "reset_token_expires_at");
