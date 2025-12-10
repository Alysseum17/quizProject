# Complex SQL Queries Documentation

## Overview

This document describes the analytical SQL queries implemented in the Quiz System. Each query demonstrates advanced SQL concepts including aggregations, window functions, Common Table Expressions (CTEs), subqueries, and complex JOINs.

All queries are implemented in the service layer using Prisma's `$queryRaw` for raw SQL execution while maintaining type safety.

---

## Table of Contents

1. [Top Users by Average Quiz Score](#1-top-users-by-average-quiz-score)
2. [Top Authors by Total Quiz Attempts](#2-top-authors-by-total-quiz-attempts)
3. [Top Authors by Quiz Count](#3-top-authors-by-quiz-count)
4. [Top Authors by Average Quiz Rating](#4-top-authors-by-average-quiz-rating)
5. [Top Bookmarked Quizzes](#5-top-bookmarked-quizzes)
6. [Review Analytics by Quiz](#6-review-analytics-by-quiz)
7. [Prolific Authors (Above Average)](#7-prolific-authors-above-average)
8. [High-Performance Users (Above Average Score)](#8-high-performance-users-above-average-score)
9. [User Quiz Statistics](#9-user-quiz-statistics)
10. [Sorted Quizzes by Rating with Filters](#10-sorted-quizzes-by-rating-with-filters)

---

## 1. Top Users by Average Quiz Score

**Business Question:**  
Who are the top-performing users based on their average quiz scores?

**Location:** `src/services/userService.ts` → `findTopUsersByQuizScore()`

**SQL Query:**
```sql
SELECT 
    u.username, 
    COALESCE(AVG(s.score), 0) as average_score, 
    DENSE_RANK() OVER (ORDER BY AVG(s.score) DESC)::int as rank 
FROM "User" u
INNER JOIN "QuizAttempt" s ON u.user_id = s.user_id
GROUP BY u.user_id, u.username
ORDER BY average_score DESC NULLS LAST
LIMIT ? OFFSET ?
```

**Explanation:**

1. **JOIN**: Connects `User` and `QuizAttempt` tables to get user scores
2. **COALESCE**: Handles NULL values, defaulting to 0 if no scores exist
3. **AVG(s.score)**: Calculates the average score across all attempts per user
4. **GROUP BY**: Groups results by user (aggregation requirement)
5. **DENSE_RANK()**: Assigns rank with no gaps (users with same avg score get same rank)
6. **OVER (ORDER BY ...)**: Window function clause for ranking
7. **NULLS LAST**: Ensures users without scores appear at the end
8. **Pagination**: Uses `LIMIT` and `OFFSET` for page-based results

**Key Concepts:**
- ✅ Window Functions (`DENSE_RANK`)
- ✅ Aggregation (`AVG`, `GROUP BY`)
- ✅ INNER JOIN
- ✅ NULL handling (`COALESCE`)

**Sample Output:**
| username | average_score | rank |
|----------|---------------|------|
| quiz_master | 95.5 | 1 |
| top_student | 92.3 | 2 |
| learner_pro | 88.7 | 3 |

---

## 2. Top Authors by Total Quiz Attempts

**Business Question:**  
Which quiz authors have the most total attempts on their quizzes?

**Location:** `src/services/userService.ts` → `findTopAuthorsByQuizAttempts()`

**SQL Query:**
```sql
SELECT 
    u.username, 
    COUNT(qa.quiz_attempt_id)::int as total_attempts, 
    DENSE_RANK() OVER (ORDER BY COUNT(qa.quiz_attempt_id) DESC)::int as rank 
FROM "User" u
INNER JOIN "Quiz" q ON u.user_id = q.author_id
INNER JOIN "QuizAttempt" qa ON q.quiz_id = qa.quiz_id
GROUP BY u.user_id, u.username
ORDER BY total_attempts DESC NULLS LAST
LIMIT ? OFFSET ?
```

**Explanation:**

1. **First JOIN**: `User → Quiz` connects authors to their created quizzes
2. **Second JOIN**: `Quiz → QuizAttempt` gets all attempts for those quizzes
3. **COUNT(qa.quiz_attempt_id)**: Counts total attempts per author
4. **DENSE_RANK()**: Ranks authors by popularity (attempt count)
5. **Multiple JOINs**: Demonstrates 3-table relationship traversal
6. **::int cast**: Converts PostgreSQL types to integers

**Key Concepts:**
- ✅ Multiple JOINs (3 tables)
- ✅ Aggregation (`COUNT`, `GROUP BY`)
- ✅ Window Functions (`DENSE_RANK`)

**Sample Output:**
| username | total_attempts | rank |
|----------|----------------|------|
| popular_creator | 1250 | 1 |
| quiz_maker_pro | 890 | 2 |
| content_king | 675 | 3 |

---

## 3. Top Authors by Quiz Count

**Business Question:**  
Who are the most prolific quiz creators by total number of quizzes?

**Location:** `src/services/userService.ts` → `findTopAuthorsByQuizCounts()`

**SQL Query:**
```sql
SELECT 
    u.username, 
    COUNT(q.quiz_id)::int as total_quizzes, 
    DENSE_RANK() OVER (ORDER BY COUNT(q.quiz_id) DESC)::int as rank 
FROM "User" u
INNER JOIN "Quiz" q ON u.user_id = q.author_id
GROUP BY u.user_id, u.username
ORDER BY total_quizzes DESC NULLS LAST
LIMIT ? OFFSET ?
```

**Explanation:**

1. **JOIN**: Links users to quizzes they created
2. **COUNT(q.quiz_id)**: Counts quizzes per author
3. **Simple aggregation**: Straightforward metric for productivity
4. **DENSE_RANK()**: Ranks authors by quantity

**Key Concepts:**
- ✅ Basic aggregation
- ✅ Window Functions
- ✅ Simple JOIN

**Sample Output:**
| username | total_quizzes | rank |
|----------|---------------|------|
| quiz_factory | 45 | 1 |
| content_creator | 38 | 2 |
| test_maker | 32 | 3 |

---

## 4. Top Authors by Average Quiz Rating

**Business Question:**  
Which quiz authors have the highest average ratings across all their quizzes?

**Location:** `src/services/userService.ts` → `findTopAuthorsByAverageQuizRating()`

**SQL Query:**
```sql
SELECT 
    u.username, 
    AVG(r.rating) as average_rating, 
    DENSE_RANK() OVER (ORDER BY AVG(r.rating) DESC)::int as rank 
FROM "User" u
INNER JOIN "Quiz" q ON u.user_id = q.author_id
INNER JOIN "Review" r ON q.quiz_id = r.quiz_id
GROUP BY u.user_id, u.username
ORDER BY average_rating DESC NULLS LAST
LIMIT ? OFFSET ?
```

**Explanation:**

1. **User → Quiz → Review**: Traverses 3 tables to connect authors to ratings
2. **AVG(r.rating)**: Calculates average rating across all reviews for author's quizzes
3. **Quality metric**: Unlike attempt count (popularity), this measures quality
4. **DENSE_RANK()**: Authors with same avg rating get same rank

**Key Concepts:**
- ✅ Multiple JOINs (3 tables)
- ✅ Aggregation (`AVG`)
- ✅ Window Functions

**Sample Output:**
| username | average_rating | rank |
|----------|----------------|------|
| quality_creator | 4.8 | 1 |
| excellent_author | 4.7 | 2 |
| top_educator | 4.5 | 3 |

---

## 5. Top Bookmarked Quizzes

**Business Question:**  
Which quizzes are most frequently bookmarked by users?

**Location:** `src/services/bookmarkService.ts` → `getTopBookmarkedQuizzes()`

**SQL Query:**
```sql
SELECT 
    q.quiz_id as quiz_id, 
    q.title,
    COUNT(b.user_id)::int as bookmark_count,
    u.username as author_name
FROM "Quiz" q
LEFT JOIN "Bookmark" b ON q.quiz_id = b.quiz_id
LEFT JOIN "User" u ON q.author_id = u.user_id
GROUP BY q.quiz_id, q.title, u.username
HAVING COUNT(b.user_id) > 0
ORDER BY bookmark_count DESC
LIMIT ?
```

**Explanation:**

1. **LEFT JOIN**: Includes quizzes even if they have no bookmarks
2. **COUNT(b.user_id)**: Counts unique users who bookmarked each quiz
3. **GROUP BY**: Groups by quiz to aggregate bookmarks
4. **HAVING**: Filters to only show quizzes with at least 1 bookmark
5. **Multiple attributes in GROUP BY**: Needed for all selected non-aggregated columns

**Key Concepts:**
- ✅ LEFT JOIN (preserves quizzes without bookmarks)
- ✅ Aggregation with HAVING clause
- ✅ Multiple table JOINs

**Sample Output:**
| quiz_id | title | bookmark_count | author_name |
|---------|-------|----------------|-------------|
| 15 | JavaScript Mastery | 234 | code_guru |
| 8 | Python Basics | 189 | py_teacher |
| 23 | SQL Advanced | 156 | db_expert |

---

## 6. Review Analytics by Quiz

**Business Question:**  
What is the detailed rating distribution and sentiment analysis for each quiz?

**Location:** `src/services/reviewService.ts` → `getReviewAnalytics()`

**SQL Query:**
```sql
SELECT 
    q.title AS quiz_title,
    u.username AS author_name,
    COUNT(r.review_id)::int AS total_reviews,
    ROUND(AVG(r.rating)::numeric, 1)::float AS average_rating,

    SUM(CASE WHEN r.rating = 5 THEN 1 ELSE 0 END)::int AS count_5_stars,
    SUM(CASE WHEN r.rating = 4 THEN 1 ELSE 0 END)::int AS count_4_stars,
    SUM(CASE WHEN r.rating = 3 THEN 1 ELSE 0 END)::int AS count_3_stars,
    SUM(CASE WHEN r.rating = 2 THEN 1 ELSE 0 END)::int AS count_2_stars,
    SUM(CASE WHEN r.rating = 1 THEN 1 ELSE 0 END)::int AS count_1_stars,

    ROUND(
        (SUM(CASE WHEN r.rating >= 4 THEN 1 ELSE 0 END)::numeric / 
         NULLIF(COUNT(r.review_id), 0)) * 100, 
        1
    )::float AS positive_percentage

FROM "Quiz" q
JOIN "Review" r ON q.quiz_id = r.quiz_id
JOIN "User" u ON q.author_id = u.user_id 
GROUP BY q.quiz_id, u.username
ORDER BY total_reviews DESC
```

**Explanation:**

1. **Multiple JOINs**: Connects Quiz → Review → User for complete data
2. **CASE WHEN expressions**: Creates conditional counts for each rating level
3. **SUM(CASE...)**: Aggregates conditional values (counts per rating)
4. **AVG(r.rating)**: Overall average rating
5. **ROUND()**: Formats decimal places for readability
6. **Positive percentage calculation**: 
   - Counts reviews with rating >= 4
   - Divides by total reviews
   - Multiplies by 100 for percentage
7. **NULLIF**: Prevents division by zero if no reviews exist
8. **Type casting**: `::numeric`, `::float`, `::int` for PostgreSQL type system

**Key Concepts:**
- ✅ CASE WHEN expressions (conditional aggregation)
- ✅ Multiple aggregation functions (COUNT, AVG, SUM)
- ✅ Complex calculations
- ✅ NULL handling (NULLIF)

**Sample Output:**
| quiz_title | author_name | total_reviews | average_rating | count_5_stars | count_4_stars | count_3_stars | count_2_stars | count_1_stars | positive_percentage |
|------------|-------------|---------------|----------------|---------------|---------------|---------------|---------------|---------------|---------------------|
| JavaScript Basics | js_guru | 156 | 4.6 | 98 | 42 | 10 | 4 | 2 | 89.7 |
| SQL Mastery | db_expert | 89 | 4.2 | 45 | 32 | 8 | 3 | 1 | 86.5 |

---

## 7. Prolific Authors (Above Average)

**Business Question:**  
Which authors create more quizzes than the platform average?

**Location:** `src/services/userService.ts` → `getProlificAuthors()`

**SQL Query:**
```sql
WITH AuthorQuizCounts AS (
    SELECT 
        u.user_id,
        u.username,
        COUNT(q.quiz_id)::int AS quiz_count
    FROM "User" u
    LEFT JOIN "Quiz" q ON u.user_id = q.author_id AND q.is_active
    GROUP BY u.user_id, u.username
),
AverageQuizCount AS (
    SELECT 
        AVG(quiz_count)::float AS avg_quiz_count
    FROM AuthorQuizCounts
)
SELECT 
    aqc.username,
    aqc.quiz_count,
    DENSE_RANK() OVER (ORDER BY aqc.quiz_count DESC)::int AS rank
FROM AuthorQuizCounts aqc, AverageQuizCount aqc2
WHERE aqc.quiz_count > aqc2.avg_quiz_count
ORDER BY aqc.quiz_count DESC NULLS LAST
LIMIT ? OFFSET ?
```

**Explanation:**

1. **First CTE (AuthorQuizCounts)**: 
   - Calculates quiz count per author
   - LEFT JOIN preserves users with 0 quizzes
   - Filters only active quizzes (`q.is_active`)
   
2. **Second CTE (AverageQuizCount)**:
   - Calculates platform-wide average
   - Single aggregate row
   
3. **Main Query**:
   - Cross join with average (small table, efficient)
   - Filters authors above average
   - Ranks remaining authors
   
4. **DENSE_RANK()**: Window function for ranking

**Key Concepts:**
- ✅ Common Table Expressions (CTEs)
- ✅ Multiple CTEs chained
- ✅ Comparative analysis (above average)
- ✅ Window Functions

**Sample Output:**
| username | quiz_count | rank |
|----------|------------|------|
| super_creator | 67 | 1 |
| quiz_factory | 54 | 2 |
| content_machine | 48 | 3 |

**Note:** If platform average is 15 quizzes, this query returns only authors with 16+ quizzes.

---

## 8. High-Performance Users (Above Average Score)

**Business Question:**  
Which users consistently score above the platform average?

**Location:** `src/services/userService.ts` → `getHighPerformanceUsers()`

**SQL Query:**
```sql
WITH UserAverageScores AS (
    SELECT 
        u.user_id,
        u.username,
        AVG(qa.score) AS average_score
    FROM "User" u
    INNER JOIN "QuizAttempt" qa ON u.user_id = qa.user_id
    GROUP BY u.user_id, u.username
),
AverageOfAverages AS (
    SELECT 
        AVG(average_score) AS avg_of_avg_scores
    FROM UserAverageScores
)
SELECT 
    uas.username,
    uas.average_score,
    DENSE_RANK() OVER (ORDER BY uas.average_score DESC)::int AS rank
FROM UserAverageScores uas, AverageOfAverages aoa
WHERE uas.average_score > aoa.avg_of_avg_scores
ORDER BY uas.average_score DESC NULLS LAST
LIMIT ? OFFSET ?
```

**Explanation:**

1. **First CTE (UserAverageScores)**:
   - Calculates each user's average score across all attempts
   - INNER JOIN excludes users with no attempts
   
2. **Second CTE (AverageOfAverages)**:
   - Calculates the platform-wide average of user averages
   - This is the "average performance" benchmark
   
3. **Main Query**:
   - Filters users performing above platform average
   - Ranks high performers
   
4. **Statistical significance**: 
   - Uses average of averages (not total avg score)
   - Each user weighted equally regardless of attempt count

**Key Concepts:**
- ✅ Nested CTEs
- ✅ Statistical aggregation (average of averages)
- ✅ Comparative filtering
- ✅ Window Functions

**Sample Output:**
| username | average_score | rank |
|----------|---------------|------|
| ace_student | 94.5 | 1 |
| top_performer | 91.2 | 2 |
| quiz_champion | 88.7 | 3 |

---

## 9. User Quiz Statistics

**Business Question:**  
What are a specific user's detailed statistics for a specific quiz?

**Location:** `src/services/userService.ts` → `getUserQuizStats()`

**SQL Query:**
```sql
SELECT 
    qa.user_id,
    qa.quiz_id,
    COUNT(qa.quiz_attempt_id)::int AS total_attempts,
    MAX(qa.score)::int AS best_score,
    MAX(qa.finished_at) AS last_attempt_date,
    (SELECT score 
     FROM "QuizAttempt" qa2 
     WHERE qa2.user_id = qa.user_id 
       AND qa2.quiz_id = qa.quiz_id 
     ORDER BY started_at DESC 
     LIMIT 1)::int AS last_score
FROM "QuizAttempt" qa
WHERE qa.user_id = ? AND qa.quiz_id = ?
GROUP BY qa.user_id, qa.quiz_id
```

**Explanation:**

1. **COUNT**: Total number of attempts
2. **MAX(score)**: Highest score achieved (best performance)
3. **MAX(finished_at)**: Most recent attempt timestamp
4. **Correlated Subquery**:
   - Finds score of most recent attempt (by `started_at`)
   - Subquery executes for each row in outer query
   - Correlation: `qa2.user_id = qa.user_id` references outer query
5. **WHERE clause**: Filters to specific user and quiz
6. **GROUP BY**: Required even though filtering to single user-quiz pair

**Key Concepts:**
- ✅ Correlated subquery
- ✅ Multiple aggregation functions
- ✅ Subquery in SELECT clause

**Sample Output:**
| user_id | quiz_id | total_attempts | best_score | last_attempt_date | last_score |
|---------|---------|----------------|------------|-------------------|------------|
| 42 | 15 | 5 | 95 | 2024-12-08 14:30:00 | 88 |

**Interpretation:** User attempted quiz 5 times, best score 95, most recent score 88 (showing some regression).

---

## 10. Sorted Quizzes by Rating with Filters

**Business Question:**  
Get paginated, sorted list of quizzes with average ratings, filtered by rating range and title search.

**Location:** `src/services/quizService.ts` → `getSortedQuizByRating()`

**SQL Query:**
```sql
-- Pagination metadata query
SELECT COUNT(*)::int as count
FROM (
    SELECT q.quiz_id
    FROM "Quiz" q
    LEFT JOIN "Review" r ON q.quiz_id = r.quiz_id
    WHERE q.title ILIKE ?  -- Pattern: %searchTerm%
    GROUP BY q.quiz_id, q.title
    HAVING COALESCE(AVG(r.rating), 0) >= ? 
       AND COALESCE(AVG(r.rating), 0) <= ?
) AS filtered_quizzes;

-- Main data query
SELECT 
    q.title, 
    COALESCE(AVG(r.rating), 0) as average_rating 
FROM "Quiz" q
LEFT JOIN "Review" r ON q.quiz_id = r.quiz_id
WHERE q.title ILIKE ?
GROUP BY q.quiz_id, q.title
HAVING COALESCE(AVG(r.rating), 0) >= ? 
   AND COALESCE(AVG(r.rating), 0) <= ?
ORDER BY average_rating DESC  -- Can be ASC or custom field
LIMIT ? OFFSET ?
```

**Explanation:**

1. **Two separate queries**:
   - First: Gets total count for pagination metadata
   - Second: Gets actual data page
   
2. **LEFT JOIN**: Includes quizzes with no reviews (rating = 0)

3. **ILIKE**: Case-insensitive pattern matching (PostgreSQL)
   - `%JavaScript%` matches "javascript basics", "Advanced JavaScript"
   
4. **COALESCE(AVG(r.rating), 0)**: 
   - AVG returns NULL if no reviews
   - COALESCE converts NULL to 0
   
5. **HAVING clause**: 
   - Filters on aggregated data (average rating)
   - Cannot use WHERE for aggregated columns
   
6. **Dynamic ORDER BY**: 
   - Can sort by `title`, `average_rating`, or `created_at`
   - Direction: `ASC` or `DESC`
   
7. **Pagination**: 
   - `LIMIT`: Items per page
   - `OFFSET`: Starting position (page * limit)

**Key Concepts:**
- ✅ LEFT JOIN with aggregation
- ✅ HAVING clause for filtered aggregation
- ✅ Pattern matching (ILIKE)
- ✅ Pagination (LIMIT/OFFSET)
- ✅ NULL handling

**Sample Request:**
```typescript
{
  limit: 10,
  page: 2,
  rating: { gte: 4.0, lte: 5.0 },
  name: "JavaScript",
  sort: "desc",
  orderBy: "average_rating"
}
```

**Sample Output:**
| title | average_rating |
|-------|----------------|
| Advanced JavaScript Patterns | 4.9 |
| JavaScript ES6+ Mastery | 4.7 |
| JavaScript Fundamentals | 4.5 |

---

## Performance Considerations

### 1. Index Usage

**Queries leveraging indexes:**
- User lookups → `User.email`, `User.username` (UNIQUE indexes)
- Quiz filtering → `Quiz.title`, `Quiz.author_id` (B-tree indexes)
- Attempt history → `QuizAttempt(user_id, started_at)` (composite index)
- Review sorting → `Review(quiz_id, created_at)` (composite index)

**Conditional indexes:**
- `WHERE is_active = true` leverages partial indexes on Quiz and Question tables

### 2. Query Optimization Techniques

**CTE vs Subquery:**
- CTEs used for readability and reusability (#7, #8)
- Subqueries used for one-time calculations (#9)

**Aggregation strategies:**
- Pre-aggregation in CTEs reduces main query complexity
- HAVING filters after GROUP BY (necessary for aggregated columns)

**Window functions vs Subqueries:**
- Window functions preferred for ranking (more efficient)
- Subqueries used when correlation needed (#9)

### 3. Avoiding N+1 Queries

All queries fetch data in single execution:
- Use JOINs instead of separate queries per record
- Aggregate in database rather than application code

### 4. Pagination Best Practices

**Current implementation:**
```sql
LIMIT ? OFFSET ?
```

**For very large datasets, consider:**
```sql
-- Keyset pagination (more efficient)
WHERE id > last_seen_id
ORDER BY id
LIMIT ?
```

---

## Testing Queries

All complex queries are tested in integration tests:

**Test file:** `test/integration/user.test.ts`

**Example test:**
```typescript
it('GET /top/quiz-scores - should sort users by score', async () => {
  const response = await request(app)
    .get('/api/user-profiles/top/quiz-scores');
  
  expect(response.status).toBe(200);
  const topUsers = response.body.items;
  
  expect(topUsers.length).toBeGreaterThan(0);
  expect(Number(topUsers[0].average_score))
    .toBeGreaterThanOrEqual(Number(topUsers[1].average_score));
});
```

---

## Common Patterns

### Pattern 1: Ranking with Window Functions
```sql
SELECT 
    column,
    DENSE_RANK() OVER (ORDER BY metric DESC) as rank
FROM table
```

### Pattern 2: Average with NULL Handling
```sql
SELECT 
    COALESCE(AVG(column), 0) as average
FROM table
```

### Pattern 3: Conditional Aggregation
```sql
SELECT 
    SUM(CASE WHEN condition THEN 1 ELSE 0 END) as count
FROM table
```

### Pattern 4: CTE for Comparative Analysis
```sql
WITH Metric AS (
    SELECT AVG(value) as avg FROM table
)
SELECT * FROM table, Metric
WHERE value > avg
```

---

## Future Query Enhancements

1. **Time-series analytics:**
   - Daily/weekly/monthly quiz completion trends
   - User engagement over time

2. **Collaborative filtering:**
   - "Users who liked this quiz also liked..."
   - Recommendation engine queries

3. **Cohort analysis:**
   - Compare user groups by signup date
   - Retention metrics

4. **Real-time leaderboards:**
   - Materialized views for performance
   - Incremental updates

---

**Last Updated:** December 10, 2024
