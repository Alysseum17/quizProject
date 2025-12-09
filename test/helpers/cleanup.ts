import { prisma } from '../../src/prisma.js';


export async function cleanupDatabase() {
    await prisma.selectedAnswer.deleteMany();
    await prisma.questionResponse.deleteMany();
    await prisma.quizAttempt.deleteMany();
    await prisma.review.deleteMany();
    await prisma.bookmark.deleteMany();

    await prisma.answerOption.deleteMany();
    await prisma.question.deleteMany();

    await prisma.quiz.deleteMany();
    
    await prisma.user.deleteMany();
}

export async function cleanupDatabaseTransaction() {
    await prisma.$transaction([
        prisma.selectedAnswer.deleteMany(),
        prisma.questionResponse.deleteMany(),
        prisma.quizAttempt.deleteMany(),
        prisma.review.deleteMany(),
        prisma.bookmark.deleteMany(),
        prisma.answerOption.deleteMany(),
        prisma.question.deleteMany(),
        prisma.quiz.deleteMany(),
        prisma.user.deleteMany(),
    ]);
}