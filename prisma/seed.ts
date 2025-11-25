import { Difficulty, QuestionType } from '@prisma/client';
import {prisma} from '../src/prisma';

async function main() {
  console.log('Starting database seeding...');

  await prisma.selectedAnswer.deleteMany();
  await prisma.questionResponse.deleteMany();
  await prisma.quizAttempt.deleteMany();
  await prisma.bookmark.deleteMany();
  await prisma.answerOption.deleteMany();
  await prisma.question.deleteMany();
  await prisma.review.deleteMany();
  await prisma.quiz.deleteMany();
  await prisma.user.deleteMany();

  console.log('Database cleaned');

  await prisma.user.createMany({
    data: [
      { user_id: 1, username: 'shadow_specter', email: 'specter@example.net', password_hash: 'hash_specter_01', avatar_url: 'https://example.com/avatars/specter.png', created_at: new Date('2023-05-15T10:30:00Z') },
      { user_id: 2, username: 'nebula_nomad', email: 'nomad@example.org', password_hash: 'hash_nomad_02', avatar_url: null, created_at: new Date('2022-11-20T18:45:10Z') },
      { user_id: 3, username: 'circuit_charmer', email: 'charmer@example.com', password_hash: 'hash_charmer_03', avatar_url: 'https://example.com/avatars/charmer.png', created_at: new Date('2024-01-05T12:00:00Z') },
      { user_id: 4, username: 'fusion_fanatic', email: 'fanatic@example.net', password_hash: 'hash_fanatic_04', avatar_url: 'https://example.com/avatars/fanatic.png', created_at: new Date('2023-08-01T22:15:30Z') },
      { user_id: 5, username: 'vector_voyager', email: 'voyager@example.org', password_hash: 'hash_voyager_05', avatar_url: null, created_at: new Date('2021-07-19T09:05:25Z') },
      { user_id: 6, username: 'phoenix_phreak', email: 'phreak@example.com', password_hash: 'hash_phreak_06', avatar_url: 'https://example.com/avatars/phreak.png', created_at: new Date('2024-03-22T14:20:00Z') },
      { user_id: 7, username: 'zenith_zephyr', email: 'zephyr@example.net', password_hash: 'hash_zephyr_07', avatar_url: null, created_at: new Date('2022-02-10T23:55:45Z') },
      { user_id: 8, username: 'iron_impulse', email: 'impulse@example.com', password_hash: 'hash_impulse_08', avatar_url: 'https://example.com/avatars/impulse.png', created_at: new Date('2023-12-30T08:10:15Z') },
      { user_id: 9, username: 'karma_kernel', email: 'kernel@example.org', password_hash: 'hash_kernel_09', avatar_url: null, created_at: new Date('2020-09-25T17:00:00Z') },
      { user_id: 10, username: 'omega_operator', email: 'operator@example.com', password_hash: 'hash_operator_10', avatar_url: 'https://example.com/avatars/operator.png', created_at: new Date('2024-05-01T11:11:11Z') },
    ]
  });
  console.log('Users created');

  await prisma.quiz.createMany({
    data: [
      { quiz_id: 1, author_id: 1, title: 'SQL Basics', quiz_description: 'Test your knowledge of basic SELECT, INSERT, UPDATE commands.', time_limit: 600, attempt_limit: 3, difficulty: Difficulty.easy, created_at: new Date('2023-06-01T11:00:00Z') },
      { quiz_id: 2, author_id: 7, title: 'History of Ukraine', quiz_description: null, time_limit: 1200, attempt_limit: 2, difficulty: Difficulty.medium, created_at: new Date('2023-07-15T15:30:00Z') },
      { quiz_id: 3, author_id: 3, title: '20th Century Literature', quiz_description: 'Identify the author by a quote or a book title.', time_limit: 900, attempt_limit: null, difficulty: Difficulty.hard, created_at: new Date('2023-09-10T18:00:00Z') },
      { quiz_id: 4, author_id: 3, title: 'General Geography', quiz_description: 'Capitals, rivers, and mountains of the world.', time_limit: null, attempt_limit: 5, difficulty: Difficulty.easy, created_at: new Date('2023-10-22T20:10:00Z') },
      { quiz_id: 5, author_id: 5, title: 'Docker for Beginners', quiz_description: null, time_limit: 750, attempt_limit: 3, difficulty: Difficulty.medium, created_at: new Date('2024-01-20T12:45:00Z') },
      { quiz_id: 6, author_id: 7, title: 'Wildlife Trivia', quiz_description: 'Interesting facts about wild animals from around the world.', time_limit: null, attempt_limit: null, difficulty: Difficulty.easy, created_at: new Date('2024-02-14T09:00:00Z') },
      { quiz_id: 7, author_id: 7, title: 'Algorithmic Challenges', quiz_description: 'Test logic and basic algorithm solving skills.', time_limit: 1800, attempt_limit: 1, difficulty: Difficulty.hard, created_at: new Date('2024-03-05T22:00:00Z') },
      { quiz_id: 8, author_id: 8, title: 'Space Discoveries', quiz_description: null, time_limit: 1000, attempt_limit: 4, difficulty: Difficulty.medium, created_at: new Date('2024-04-12T10:25:00Z') },
      { quiz_id: 9, author_id: 9, title: 'Traffic Rules', quiz_description: 'Test for checking knowledge of Traffic Laws.', time_limit: null, attempt_limit: 2, difficulty: Difficulty.medium, created_at: new Date('2024-05-01T19:50:00Z') },
      { quiz_id: 10, author_id: 10, title: 'English Phrasal Verbs', quiz_description: 'Check your knowledge of popular phrasal verbs.', time_limit: 600, attempt_limit: null, difficulty: Difficulty.hard, created_at: new Date('2024-05-10T17:00:00Z') },
      { quiz_id: 11, author_id: 5, title: 'Guess the Flag', quiz_description: null, time_limit: 450, attempt_limit: 5, difficulty: null, created_at: new Date('2024-05-15T14:00:00Z') },
      { quiz_id: 12, author_id: 8, title: '90s Movie Classics', quiz_description: 'Recognize a cult movie by a frame or quote.', time_limit: null, attempt_limit: null, difficulty: null, created_at: new Date('2024-05-20T18:30:00Z') },
    ]
  });
  console.log('Quizzes created');

  await prisma.review.createMany({
    data: [
      { user_id: 3, quiz_id: 1, rating: 5, review_text: 'Excellent test for beginners! Clear and on point.', created_at: new Date('2023-06-03T12:15:00Z') },
      { user_id: 5, quiz_id: 1, rating: 4, review_text: 'Not bad, but I wanted more complex questions.', created_at: new Date('2023-06-04T09:00:00Z') },
      { user_id: 1, quiz_id: 2, rating: 5, review_text: 'Very interesting and educational. Learned a lot.', created_at: new Date('2023-08-01T16:45:00Z') },
      { user_id: 7, quiz_id: 5, rating: 3, review_text: 'Too hard for beginners, some questions are unclear.', created_at: new Date('2024-02-01T11:30:00Z') },
      { user_id: 3, quiz_id: 7, rating: 5, review_text: null, created_at: new Date('2024-03-10T21:00:00Z') },
      { user_id: 9, quiz_id: 10, rating: 4, review_text: 'Good test for practice!', created_at: new Date('2024-05-12T14:05:21Z') },
      { user_id: 2, quiz_id: 4, rating: 4, review_text: null, created_at: new Date('2023-11-01T13:00:00Z') },
    ]
  });
  console.log('Reviews created');

  await prisma.question.createMany({
    data: [
      { question_id: 1, quiz_id: 1, question_text: 'Which command is used to select data from a table?', question_type: QuestionType.single_choice, points: 10 },
      { question_id: 2, quiz_id: 1, question_text: 'Which of these operators are used to filter data?', question_type: QuestionType.multiple_choice, points: 15 },
      { question_id: 3, quiz_id: 1, question_text: 'What is the process of combining data from multiple tables called?', question_type: QuestionType.free_text, points: 10 },
      { question_id: 4, quiz_id: 2, question_text: 'In which year was the independence of Ukraine proclaimed?', question_type: QuestionType.single_choice, points: 10 },
      { question_id: 5, quiz_id: 2, question_text: 'Who was the Hetman of Zaporizhian Host during the Battle of Konotop?', question_type: QuestionType.free_text, points: 15 },
      { question_id: 6, quiz_id: 3, question_text: 'Who wrote the novel "The Master and Margarita"?', question_type: QuestionType.single_choice, points: 10 },
      { question_id: 7, quiz_id: 3, question_text: 'Name a Ukrainian poet, a representative of the "Executed Renaissance".', question_type: QuestionType.free_text, points: 15 },
      { question_id: 8, quiz_id: 4, question_text: 'Which of these rivers flow in South America?', question_type: QuestionType.multiple_choice, points: 15 },
      { question_id: 9, quiz_id: 4, question_text: 'What is the largest desert in the world?', question_type: QuestionType.free_text, points: 10 },
      { question_id: 10, quiz_id: 5, question_text: 'Which command is used to create an image from a Dockerfile?', question_type: QuestionType.single_choice, points: 10 },
      { question_id: 11, quiz_id: 5, question_text: 'What is a Docker container?', question_type: QuestionType.free_text, points: 15 },
      { question_id: 12, quiz_id: 6, question_text: 'What is the largest animal on Earth?', question_type: QuestionType.single_choice, points: 10 },
      { question_id: 13, quiz_id: 6, question_text: 'Which bird cannot fly but is an excellent swimmer?', question_type: QuestionType.free_text, points: 10 },
      { question_id: 14, quiz_id: 7, question_text: 'What is the worst-case time complexity of Bubble Sort?', question_type: QuestionType.single_choice, points: 15 },
      { question_id: 15, quiz_id: 7, question_text: 'What is recursion in programming?', question_type: QuestionType.free_text, points: 10 },
      { question_id: 16, quiz_id: 8, question_text: 'Which planets of the Solar System are gas giants?', question_type: QuestionType.multiple_choice, points: 15 },
      { question_id: 17, quiz_id: 8, question_text: 'Who was the first human to conduct a spacewalk?', question_type: QuestionType.free_text, points: 10 },
      { question_id: 18, quiz_id: 9, question_text: 'What does a red traffic light mean?', question_type: QuestionType.single_choice, points: 5 },
      { question_id: 19, quiz_id: 9, question_text: 'What is a "main road"?', question_type: QuestionType.free_text, points: 10 },
      { question_id: 20, quiz_id: 10, question_text: 'What does the phrasal verb "give up" mean?', question_type: QuestionType.single_choice, points: 10 },
      { question_id: 21, quiz_id: 10, question_text: 'Give an example sentence with "look forward to".', question_type: QuestionType.free_text, points: 10 },
      { question_id: 22, quiz_id: 11, question_text: 'Which country\'s flag consists of a red circle on a white background?', question_type: QuestionType.single_choice, points: 10 },
      { question_id: 23, quiz_id: 11, question_text: 'Describe the flag of Canada.', question_type: QuestionType.free_text, points: 10 },
      { question_id: 24, quiz_id: 12, question_text: 'Which of these movies were directed by Quentin Tarantino?', question_type: QuestionType.multiple_choice, points: 15 },
      { question_id: 25, quiz_id: 12, question_text: 'From which movie is the quote "I\'ll be back"?', question_type: QuestionType.free_text, points: 10 },
    ]
  });
  console.log('Questions created');

  await prisma.answerOption.createMany({
    data: [
      { question_id: 1, answer_text: 'SELECT', is_correct: true }, { question_id: 1, answer_text: 'UPDATE', is_correct: false }, { question_id: 1, answer_text: 'DELETE', is_correct: false },
      { question_id: 2, answer_text: 'WHERE', is_correct: true }, { question_id: 2, answer_text: 'HAVING', is_correct: true }, { question_id: 2, answer_text: 'ORDER BY', is_correct: false }, { question_id: 2, answer_text: 'GROUP BY', is_correct: false },
      { question_id: 4, answer_text: '1989', is_correct: false }, { question_id: 4, answer_text: '1991', is_correct: true }, { question_id: 4, answer_text: '1996', is_correct: false },
      { question_id: 6, answer_text: 'Fyodor Dostoevsky', is_correct: false }, { question_id: 6, answer_text: 'Leo Tolstoy', is_correct: false }, { question_id: 6, answer_text: 'Mikhail Bulgakov', is_correct: true },
      { question_id: 8, answer_text: 'Nile', is_correct: false }, { question_id: 8, answer_text: 'Amazon', is_correct: true }, { question_id: 8, answer_text: 'Parana', is_correct: true }, { question_id: 8, answer_text: 'Yangtze', is_correct: false },
      { question_id: 10, answer_text: 'docker run', is_correct: false }, { question_id: 10, answer_text: 'docker build', is_correct: true }, { question_id: 10, answer_text: 'docker pull', is_correct: false },
      { question_id: 12, answer_text: 'Elephant', is_correct: false }, { question_id: 12, answer_text: 'Blue Whale', is_correct: true }, { question_id: 12, answer_text: 'Giraffe', is_correct: false },
      { question_id: 14, answer_text: 'O(n)', is_correct: false }, { question_id: 14, answer_text: 'O(n log n)', is_correct: false }, { question_id: 14, answer_text: 'O(n^2)', is_correct: true },
      { question_id: 16, answer_text: 'Mars', is_correct: false }, { question_id: 16, answer_text: 'Jupiter', is_correct: true }, { question_id: 16, answer_text: 'Saturn', is_correct: true }, { question_id: 16, answer_text: 'Venus', is_correct: false },
      { question_id: 18, answer_text: 'Traffic allowed', is_correct: false }, { question_id: 18, answer_text: 'Traffic forbidden', is_correct: true }, { question_id: 18, answer_text: 'Get ready to move', is_correct: false },
      { question_id: 20, answer_text: 'Continue', is_correct: false }, { question_id: 20, answer_text: 'Surrender/Quit', is_correct: true }, { question_id: 20, answer_text: 'Start', is_correct: false },
      { question_id: 22, answer_text: 'China', is_correct: false }, { question_id: 22, answer_text: 'Japan', is_correct: true }, { question_id: 22, answer_text: 'Turkey', is_correct: false },
      { question_id: 24, answer_text: 'Pulp Fiction', is_correct: true }, { question_id: 24, answer_text: 'Forrest Gump', is_correct: false }, { question_id: 24, answer_text: 'Reservoir Dogs', is_correct: true }, { question_id: 24, answer_text: 'The Matrix', is_correct: false },
    ]
  });
  console.log('Answer options created');

  await prisma.quizAttempt.createMany({
    data: [
      { user_id: 1, quiz_id: 1, started_at: new Date('2025-10-14T17:10:00Z'), finished_at: new Date('2025-10-14T17:18:30Z'), score: 85 },
      { user_id: 1, quiz_id: 1, started_at: new Date('2025-10-14T19:00:00Z'), finished_at: new Date('2025-10-14T19:15:00Z'), score: 70 },
      { user_id: 1, quiz_id: 1, started_at: new Date('2025-10-14T21:30:00Z'), finished_at: new Date('2025-10-14T21:42:00Z'), score: 95 },
      { user_id: 2, quiz_id: 2, started_at: new Date('2025-10-11T11:05:00Z'), finished_at: new Date('2025-10-11T11:24:15Z'), score: 78 },
      { user_id: 3, quiz_id: 1, started_at: new Date('2025-09-20T18:00:00Z'), finished_at: new Date('2025-09-20T18:11:45Z'), score: 80 },
      { user_id: 3, quiz_id: 1, started_at: new Date('2025-09-21T19:15:00Z'), finished_at: new Date('2025-09-21T19:25:10Z'), score: 70 },
      { user_id: 4, quiz_id: 5, started_at: new Date('2025-08-30T22:30:00Z'), finished_at: new Date('2025-08-30T22:42:05Z'), score: 100 },
      { user_id: 5, quiz_id: 4, started_at: new Date('2025-07-15T14:00:00Z'), finished_at: new Date('2025-07-15T14:11:30Z'), score: 85 },
      { user_id: 8, quiz_id: 2, started_at: new Date('2025-10-12T13:00:00Z'), finished_at: new Date('2025-10-12T13:19:00Z'), score: 88 },
      { user_id: 2, quiz_id: 1, started_at: new Date('2025-10-14T08:30:00Z'), finished_at: new Date('2025-10-14T08:39:22Z'), score: 75 },
      { user_id: 6, quiz_id: 7, started_at: new Date('2025-10-14T22:00:00Z'), finished_at: null, score: null },
    ]
  });
  console.log('Quiz attempts created');

  await prisma.bookmark.createMany({
    data: [
      { user_id: 1, quiz_id: 2 },
      { user_id: 1, quiz_id: 3 },
      { user_id: 2, quiz_id: 1 },
      { user_id: 5, quiz_id: 10 },
    ]
  });
  console.log('Bookmarks created');


  
const tables = [
    { name: 'User', pk: 'user_id' },
    { name: 'Quiz', pk: 'quiz_id' },
    { name: 'Review', pk: 'review_id' },
    { name: 'Question', pk: 'question_id' },
    { name: 'AnswerOption', pk: 'answer_option_id' },
    { name: 'QuizAttempt', pk: 'quiz_attempt_id' },
    { name: 'QuestionResponse', pk: 'question_response_id' },
  ];

  for (const table of tables) {
    await prisma.$executeRawUnsafe(
      `SELECT setval(pg_get_serial_sequence('"${table.name}"', '${table.pk}'), coalesce(max("${table.pk}")+1, 1), false) FROM "${table.name}";`
    );
  }

  console.log('Auto-increment sequences reset.');
  console.log('Seeding finished successfully!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });