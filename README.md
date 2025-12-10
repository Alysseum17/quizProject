# Quiz System - Database Course Project

## 📋 Project Description

Quiz System is a full-featured backend platform for creating, taking, and evaluating online quizzes. The system allows users to create their own tests with different question types, take quizzes with time and attempt limits, leave reviews, and track their statistics.

**Domain:** Educational platform for online testing

**Authors:** Marchenko Daniil, Zhyla Ivan, Semchecnko Illya

---

## 🛠 Technology Stack

- **Programming Language:** TypeScript 5.9.3 / Node.js 20
- **ORM:** Prisma 7.0.0
- **Database:** PostgreSQL 16
- **Framework:** Express 5.1.0
- **Authentication:** JWT (jsonwebtoken)
- **Validation:** Zod 4.1.13
- **Testing:** Jest 30.2.0 + Supertest 7.1.4
- **Containerization:** Docker + Docker Compose
- **Email:** Nodemailer 7.0.11

---

## 📊 Database Schema

The system includes **9 main tables** connected to each other:

### Main Entities:
- **User** - system users
- **Quiz** - quizzes/tests
- **Question** - quiz questions
- **AnswerOption** - answer options
- **QuizAttempt** - quiz attempts
- **QuestionResponse** - user answers
- **SelectedAnswer** - selected answer options
- **Review** - quiz reviews
- **Bookmark** - user bookmarks

**Detailed schema documentation:** [`docs/schema.md`](docs/schema.md)

---

## 🚀 Quick Start

### Prerequisites

- Docker Desktop installed and running
- Git
- Node.js 20+ (for local development)

### Step 1: Clone the Repository

```bash
git clone https://github.com/your-username/quizProject.git
cd quizProject
```

### Step 2: Configure Environment Variables

```bash
# Create .env file from example
cp .env.example .env

# Edit .env file:
# 1. Generate JWT_SECRET (minimum 32 characters)
openssl rand -base64 32

# 2. Configure EMAIL service (Mailtrap recommended for development)
# 3. Change DATABASE_URL if needed
```

**Important:** For local development use `localhost` in `DATABASE_URL`:
```env
DATABASE_URL="postgresql://quizuser:change_me@localhost:5432/quizdb?schema=public"
```

For Docker use service name `postgres`:
```env
DATABASE_URL="postgresql://quizuser:change_me@postgres:5432/quizdb?schema=public"
```

### Step 3: Run with Docker (Recommended)

```bash
# Start in development mode (dev)
docker-compose --profile dev up -d

# Check container status
docker-compose ps

# View logs
docker-compose logs -f app_dev
```

Application will be available at `http://localhost:3000`

**Optional:** Load demo data:
```bash
docker-compose --profile dev exec app_dev npx prisma db seed
```

### Step 4: Local Development (Without Docker)

```bash
# 1. Start only database in Docker
docker-compose up -d postgres

# 2. Install dependencies
npm install

# 3. Apply migrations
npx prisma migrate deploy

# 4. Generate Prisma Client
npx prisma generate

# 5. Start application
npm run dev
```

---

## 🧪 Running Tests

### All Tests

```bash
# Locally
npm test

# In Docker
docker-compose -f docker-compose.test.yml --env-file .env.test up --abort-on-container-exit
```

### Specific Test Categories

```bash
# Integration tests
npm run test:integration

# Unit tests
npm run test:unit

# Code coverage
npm run test:coverage

# Watch mode (during development)
npm run test:watch
```

### Test Environment Setup

```bash
# Create .env.test
cp .env.test.example .env.test

# Start test database
npm run test:db:up

# Apply migrations for tests
npm run test:migrate

# Stop test database
npm run test:db:down
```

---

## 📁 Project Structure

```
quizProject/
├── prisma/
│   ├── migrations/          # Database migrations
│   ├── schema.prisma        # Prisma schema
│   └── seed.ts             # Seed script for test data
│
├── src/
│   ├── controllers/        # HTTP controllers
│   │   ├── authController.ts
│   │   ├── quizController.ts
│   │   ├── questionController.ts
│   │   ├── reviewController.ts
│   │   ├── bookmarkController.ts
│   │   └── userController.ts
│   │
│   ├── services/           # Business logic
│   │   ├── authService.ts
│   │   ├── quizService.ts
│   │   ├── questionService.ts
│   │   ├── reviewService.ts
│   │   ├── bookmarkService.ts
│   │   └── userService.ts
│   │
│   ├── routers/           # Express routers
│   │   ├── authRouter.ts
│   │   ├── quizRouter.ts
│   │   ├── questionRouter.ts
│   │   ├── reviewRouter.ts
│   │   ├── bookmarkRouter.ts
│   │   └── userRouter.ts
│   │
│   ├── schemas/           # Zod validation schemas
│   │   ├── auth.schema.ts
│   │   ├── quiz.schema.ts
│   │   ├── question.schema.ts
│   │   ├── review.schema.ts
│   │   ├── bookmark.schema.ts
│   │   └── user.schema.ts
│   │
│   ├── utils/            # Utilities
│   │   ├── appError.ts
│   │   ├── catchAsync.ts
│   │   ├── email.ts
│   │   └── authRequestInterface.ts
│   │
│   ├── app.ts           # Express application
│   ├── server.ts        # HTTP server
│   └── prisma.ts        # Prisma client
│
├── test/
│   ├── integration/     # Integration tests
│   │   ├── auth.test.ts
│   │   ├── quiz.test.ts
│   │   ├── bookmark.test.ts
│   │   ├── review.test.ts
│   │   └── user.test.ts
│   │
│   ├── unit/           # Unit tests
│   │   ├── authService.test.ts
│   │   ├── protect.unit.test.ts
│   │   └── schema.unit.test.ts
│   │
│   └── helpers/        # Test utilities
│       └── cleanup.ts
│
├── docs/               # Documentation
│   ├── schema.md      # Database schema description
│   └── queries.md     # Complex queries
│
├── docker-compose.yml           # Production/Dev configuration
├── docker-compose.test.yml      # Test configuration
├── Dockerfile                   # Docker image
├── package.json
├── prisma.config.ts
├── tsconfig.json
├── jest.config.js
└── README.md
```

---

## 🔐 API Endpoints

### Authentication (`/api/users`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/signup` | Register | ❌ |
| POST | `/login` | Login | ❌ |
| POST | `/logout` | Logout | ✅ |
| POST | `/forgot-password` | Password recovery | ❌ |
| POST | `/reset-password/:token` | Reset password | ❌ |
| POST | `/update-password` | Change password | ✅ |
| DELETE | `/delete-account` | Delete account | ✅ |

### Quizzes (`/api/quizzes`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/` | List quizzes (pagination, filters) | ❌ |
| GET | `/:quizId` | Quiz details | ❌ |
| GET | `/name/:name` | Search quizzes by name | ❌ |
| POST | `/` | Create quiz (simple) | ✅ |
| POST | `/complex` | Create quiz with questions | ✅ |
| PUT | `/:id` | Update quiz | ✅ |
| DELETE | `/:id` | Delete quiz (soft delete) | ✅ |
| POST | `/:quizId/start` | Start attempt | ✅ |
| POST | `/attempts/:attemptId/submit` | Submit attempt | ✅ |
| GET | `/attempts/:attemptId/results` | View results | ✅ |

### Questions (`/api/quizzes/:quizId/questions`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/:quizId` | Add question to quiz | ✅ |
| PATCH | `/:questionId` | Update question | ✅ |
| DELETE | `/:questionId` | Delete question | ✅ |
| POST | `/:questionId/answers` | Add answer option | ✅ |
| PATCH | `/answers/:answerId` | Update option | ✅ |
| DELETE | `/answers/:answerId` | Delete option | ✅ |

### Reviews (`/api/quizzes/:quizId/reviews`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/` | List reviews | ❌ |
| POST | `/` | Add review | ✅ |
| PATCH | `/:id` | Update review | ✅ |
| DELETE | `/:id` | Delete review | ✅ |
| GET | `/analytics` | Review analytics | ❌ |

### Bookmarks (`/api/bookmarks`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/` | My bookmarks | ✅ |
| POST | `/:quizId` | Add to bookmarks | ✅ |
| DELETE | `/:quizId` | Remove from bookmarks | ✅ |
| PATCH | `/:quizId` | Update note | ✅ |
| POST | `/bulk` | Bulk add | ✅ |
| DELETE | `/cleanup` | Clean inactive | ✅ |
| GET | `/analytics/top` | Top bookmarked quizzes | ✅ |

### Users (`/api/user-profiles`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/me` | My profile | ✅ |
| GET | `/me/:quizId/stats` | My quiz stats | ✅ |
| GET | `/me/activities` | My activities | ✅ |
| PATCH | `/change-info` | Update profile | ✅ |
| GET | `/:userId` | User profile | ❌ |
| GET | `/email/:email` | Search by email | ❌ |
| GET | `/name/:name` | Search by name | ❌ |
| GET | `/top/quiz-scores` | Top by scores | ❌ |
| GET | `/top/authors/quiz-attempts` | Top authors by attempts | ❌ |
| GET | `/top/authors/quiz-counts` | Top authors by count | ❌ |
| GET | `/top/authors/average-quiz-ratings` | Top authors by rating | ❌ |
| GET | `/top/authors/prolific` | Prolific authors | ❌ |
| GET | `/top/users/high-performance` | High-performance users | ❌ |

---

## 💡 Usage Examples

### Register New User

```bash
curl -X POST http://localhost:3000/api/users/signup \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123",
    "passwordConfirm": "password123"
  }'
```

**Response:**
```json
{
  "status": "success",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "data": {
    "user": {
      "id": 1,
      "username": "testuser",
      "email": "test@example.com",
      "created_at": "2024-12-10T12:00:00.000Z"
    }
  }
}
```

### Create Quiz with Questions

```bash
curl -X POST http://localhost:3000/api/quizzes/complex \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "JavaScript Basics",
    "quiz_description": "Test your JS knowledge",
    "difficulty": "medium",
    "time_limit": 1800,
    "attempt_limit": 3,
    "questions": [
      {
        "question_text": "What is closure in JavaScript?",
        "question_type": "single_choice",
        "points": 10,
        "options": [
          {"answer_text": "A function inside function", "is_correct": true},
          {"answer_text": "A loop construct"},
          {"answer_text": "A data type"}
        ]
      }
    ]
  }'
```

### Take Quiz

```bash
# 1. Start attempt
curl -X POST http://localhost:3000/api/quizzes/1/start \
  -H "Authorization: Bearer YOUR_TOKEN"

# 2. Submit answers
curl -X POST http://localhost:3000/api/quizzes/attempts/1/submit \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "answers": [
      {
        "question_id": 1,
        "selected_option_ids": [2]
      }
    ]
  }'

# 3. View results
curl -X GET http://localhost:3000/api/quizzes/attempts/1/results \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🔍 Complex SQL Queries

The system includes analytical queries for:

1. **Top users by average score** (with `ROW_NUMBER()`)
2. **Top authors by quiz attempts** (with aggregation)
3. **Top most bookmarked quizzes** (with `COUNT` and `GROUP BY`)
4. **Review analytics by quizzes** (with `CASE WHEN` and percentages)
5. **Prolific authors** (authors with quiz count above average, with CTE)
6. **High-performance users** (users with average score above average, with CTE and window functions)
7. **User stats per quiz** (with subquery for last attempt)

**Detailed documentation:** [`docs/queries.md`](docs/queries.md)

---

## 🐳 Docker Commands

```bash
# --- DEVELOPMENT ---
# Start dev environment
docker-compose --profile dev up -d

# Restart after changes
docker-compose --profile dev restart app_dev

# View logs
docker-compose logs -f app_dev

# Execute command in container
docker-compose --profile dev exec app_dev npm run dev

# Seed database
docker-compose --profile dev exec app_dev npx prisma db seed

# --- PRODUCTION ---
# Start production environment
docker-compose --profile prod up -d

# --- STOP ---
# Stop containers
docker-compose --profile dev down

# Stop and remove volumes (DELETES DATA!)
docker-compose --profile dev down -v

# --- TESTING ---
# Run tests in Docker
docker-compose -f docker-compose.test.yml --env-file .env.test up --abort-on-container-exit

# Clean up after tests
docker-compose -f docker-compose.test.yml down -v

# --- TROUBLESHOOTING ---
# Rebuild images
docker-compose --profile dev build --no-cache

# View container status
docker-compose ps

# Remove everything (containers, networks, volumes)
docker-compose down -v
docker system prune -a --volumes
```

---

## 🧹 Useful Commands

```bash
# Apply new migrations
npx prisma migrate deploy

# Create new migration
npx prisma migrate dev --name add_new_field

# Open Prisma Studio (GUI for DB)
npx prisma studio

# Generate Prisma Client after schema changes
npx prisma generate

# Code formatting
npm run format

# Linting
npm run lint

# Build TypeScript
npm run build

# Run production build
npm start
```

---

## 📚 Documentation

- **[Database Schema](docs/schema.md)** - detailed description of tables, relationships, indexes
- **[Complex Queries](docs/queries.md)** - analytical SQL queries with explanations


## 🚧 Troubleshooting

### Database Connection Error

```bash
# Make sure PostgreSQL is running
docker-compose ps

# Check DATABASE_URL in .env
# For local run: localhost:5432
# For Docker: postgres:5432
```

### Tests Failing

```bash
# Make sure .env.test is configured
# Check port in DATABASE_URL (5433 for local tests)

# Clean test database
npm run test:db:down
npm run test:db:up
npm run test:migrate
```

### Prisma Client Outdated

```bash
# Always generate client after schema.prisma changes
npx prisma generate
```

### Permission Errors on Linux/Fedora

```bash
# Check HOST_UID and HOST_GID in .env
id -u  # Your user ID
id -g  # Your group ID

# Update values in .env
HOST_UID=1000
HOST_GID=1000
```

---

## 📝 License

ISC

---

## 👤 Contact

- GitHub: @Alysseum17(https://github.com/Alysseum17)
- Email: ultrasarsenal2006@gmail.com

---

**Last Updated:** December 10, 2024

