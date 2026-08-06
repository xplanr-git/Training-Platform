> **ARCHIVED — DO NOT ACT ON THIS DOCUMENT.**
>
> Archived 2026-08-06. It describes a path this project deliberately did not
> take, and it contradicts the source of truth. See
> [CLAUDE.md](../../CLAUDE.md), and [docs/_archive/README.md](README.md) for
> what specifically is wrong with it. The live schema is `db/schema.ts`; the
> live app is `web/`.

# Outdure Edge - API Specification

## Base URLs

```
Production: https://api.outdureedge.com
Staging: https://api-staging.outdureedge.com
Development: http://localhost:3001
```

## Authentication

All authenticated requests must include:
```
Authorization: Bearer <access_token>
X-Tenant-ID: <tenant_id>
```

---

## 1. AUTHENTICATION & AUTHORIZATION

### POST /auth/register
Register a new user (learner signup).

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "acceptTerms": true
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "refresh_token_here"
}
```

---

### POST /auth/login
Login existing user.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "roles": ["learner"]
  },
  "accessToken": "...",
  "refreshToken": "..."
}
```

---

### POST /auth/refresh
Refresh access token using refresh token.

**Request:**
```json
{
  "refreshToken": "..."
}
```

**Response:**
```json
{
  "accessToken": "...",
  "refreshToken": "..."
}
```

---

### POST /auth/logout
Logout user and invalidate tokens.

**Request:** (No body, token in header)

**Response:**
```json
{
  "message": "Logged out successfully"
}
```

---

### POST /auth/forgot-password
Request password reset email.

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "message": "Password reset email sent"
}
```

---

### POST /auth/reset-password
Reset password with token from email.

**Request:**
```json
{
  "token": "reset_token_from_email",
  "newPassword": "NewSecurePass123!"
}
```

**Response:**
```json
{
  "message": "Password reset successfully"
}
```

---

### GET /auth/me
Get current user info.

**Response:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "roles": ["learner"],
  "permissions": ["courses.view", "progress.track"],
  "tenant": {
    "id": "uuid",
    "name": "Outdure Edge",
    "slug": "outdure-edge"
  }
}
```

---

## 2. TENANTS (SCHOOLS)

### POST /tenants
Create a new school (tenant).

**Request:**
```json
{
  "name": "My Learning Academy",
  "slug": "my-academy",
  "email": "admin@myacademy.com",
  "password": "AdminPass123!",
  "billingPlanId": "uuid"
}
```

**Response:**
```json
{
  "tenant": {
    "id": "uuid",
    "name": "My Learning Academy",
    "slug": "my-academy",
    "status": "active"
  },
  "owner": {
    "id": "uuid",
    "email": "admin@myacademy.com"
  }
}
```

---

### GET /tenants/:id
Get tenant details.

**Response:**
```json
{
  "id": "uuid",
  "name": "Outdure Edge",
  "slug": "outdure-edge",
  "customDomain": "learn.outdure.com",
  "domainVerified": true,
  "branding": {
    "logoUrl": "https://cdn.../logo.png",
    "primaryColor": "#000000",
    "tagline": "Stay Ahead. Stay Relevant."
  },
  "status": "active",
  "billingPlan": {
    "name": "Pro",
    "maxCourses": 50,
    "maxStudents": 1000
  }
}
```

---

### PATCH /tenants/:id
Update tenant settings.

**Request:**
```json
{
  "name": "New School Name",
  "branding": {
    "logoUrl": "https://cdn.../new-logo.png",
    "primaryColor": "#FF5733"
  }
}
```

**Response:**
```json
{
  "id": "uuid",
  "name": "New School Name",
  "branding": { ... }
}
```

---

### POST /tenants/:id/domain
Set up custom domain.

**Request:**
```json
{
  "customDomain": "learn.myschool.com"
}
```

**Response:**
```json
{
  "customDomain": "learn.myschool.com",
  "verificationRecord": {
    "type": "CNAME",
    "name": "learn.myschool.com",
    "value": "proxy.outdureedge.com"
  },
  "status": "pending_verification"
}
```

---

## 3. USERS

### GET /users
List users (admin only).

**Query Parameters:**
- `page`: integer (default: 1)
- `limit`: integer (default: 50, max: 100)
- `role`: string (filter by role)
- `search`: string (search by email/name)
- `status`: string (active, suspended, deleted)

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "roles": ["learner"],
      "status": "active",
      "lastLoginAt": "2025-01-20T10:00:00Z",
      "createdAt": "2025-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 234,
    "totalPages": 5
  }
}
```

---

### GET /users/:id
Get user details.

**Response:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "displayName": "John Doe",
  "avatarUrl": "https://cdn.../avatar.jpg",
  "bio": "Passionate learner",
  "roles": ["learner"],
  "tags": ["premium", "completed_course_1"],
  "enrollments": [
    {
      "courseId": "uuid",
      "courseTitle": "Advanced Marketing",
      "enrolledAt": "2025-01-15T00:00:00Z",
      "progressPercentage": 45.5
    }
  ],
  "certificates": [
    {
      "id": "uuid",
      "courseTitle": "Intro to Business",
      "issuedAt": "2025-01-10T00:00:00Z",
      "certificateUrl": "https://cdn.../cert.pdf"
    }
  ]
}
```

---

### POST /users
Create user (admin only).

**Request:**
```json
{
  "email": "newuser@example.com",
  "firstName": "Jane",
  "lastName": "Smith",
  "password": "TempPass123!",
  "roles": ["learner"],
  "sendWelcomeEmail": true
}
```

**Response:**
```json
{
  "id": "uuid",
  "email": "newuser@example.com",
  "firstName": "Jane",
  "roles": ["learner"]
}
```

---

### PATCH /users/:id
Update user.

**Request:**
```json
{
  "firstName": "Jane",
  "lastName": "Doe",
  "bio": "Learning enthusiast",
  "avatarUrl": "https://cdn.../new-avatar.jpg"
}
```

**Response:**
```json
{
  "id": "uuid",
  "firstName": "Jane",
  "lastName": "Doe",
  "bio": "Learning enthusiast"
}
```

---

### DELETE /users/:id
Delete user (soft delete).

**Response:**
```json
{
  "message": "User deleted successfully"
}
```

---

### POST /users/:id/roles
Assign role to user.

**Request:**
```json
{
  "roleId": "uuid",
  "scopeType": "course",
  "scopeId": "course_uuid"
}
```

**Response:**
```json
{
  "id": "uuid",
  "userId": "uuid",
  "roleId": "uuid",
  "scopeType": "course",
  "scopeId": "course_uuid"
}
```

---

### DELETE /users/:id/roles/:roleAssignmentId
Remove role from user.

**Response:**
```json
{
  "message": "Role removed successfully"
}
```

---

## 4. ROLES & PERMISSIONS

### GET /roles
List all roles for tenant.

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Instructor",
      "slug": "instructor",
      "description": "Can create and manage courses",
      "isSystem": true,
      "permissions": ["courses.create", "courses.manage"]
    }
  ]
}
```

---

### POST /roles
Create custom role.

**Request:**
```json
{
  "name": "Community Moderator",
  "slug": "community-moderator",
  "description": "Can moderate community posts",
  "permissions": ["community.moderate", "posts.remove"]
}
```

**Response:**
```json
{
  "id": "uuid",
  "name": "Community Moderator",
  "slug": "community-moderator",
  "permissions": ["community.moderate", "posts.remove"]
}
```

---

### GET /permissions
List all available permissions.

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "courses.create",
      "category": "courses",
      "description": "Create new courses"
    },
    {
      "id": "uuid",
      "name": "users.manage",
      "category": "users",
      "description": "Manage users"
    }
  ]
}
```

---

## 5. COURSES

### GET /courses
List courses.

**Query Parameters:**
- `page`, `limit`
- `status`: draft, published, archived
- `type`: self_paced, cohort, micro, etc.
- `category`: uuid
- `instructorId`: uuid
- `search`: string

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "title": "Advanced Marketing Strategies",
      "slug": "advanced-marketing",
      "subtitle": "Master modern marketing",
      "description": "Learn cutting-edge marketing techniques...",
      "thumbnailUrl": "https://cdn.../thumb.jpg",
      "type": "self_paced",
      "level": "intermediate",
      "estimatedDurationMinutes": 480,
      "instructor": {
        "id": "uuid",
        "name": "Jane Instructor",
        "avatarUrl": "https://cdn.../avatar.jpg"
      },
      "category": {
        "id": "uuid",
        "name": "Marketing"
      },
      "tags": ["marketing", "digital", "strategy"],
      "status": "published",
      "publishedAt": "2025-01-01T00:00:00Z",
      "enrollmentCount": 150,
      "rating": 4.5,
      "price": 99.00,
      "currency": "USD"
    }
  ],
  "pagination": { ... }
}
```

---

### GET /courses/:id
Get course details.

**Response:**
```json
{
  "id": "uuid",
  "title": "Advanced Marketing Strategies",
  "slug": "advanced-marketing",
  "description": "...",
  "thumbnailUrl": "...",
  "promoVideoUrl": "...",
  "type": "self_paced",
  "level": "intermediate",
  "estimatedDurationMinutes": 480,
  "language": "en",
  "instructor": { ... },
  "coInstructors": [ ... ],
  "category": { ... },
  "tags": [ ... ],
  "certificateTemplate": { ... },
  "allowDiscussions": true,
  "requireSequentialProgress": false,
  "status": "published",
  "modules": [
    {
      "id": "uuid",
      "title": "Introduction to Marketing",
      "description": "...",
      "sortOrder": 0,
      "lessons": [
        {
          "id": "uuid",
          "title": "What is Marketing?",
          "type": "video",
          "sortOrder": 0,
          "estimatedDurationMinutes": 15,
          "isFreePreview": true
        }
      ]
    }
  ],
  "pricing": {
    "plans": [
      {
        "id": "uuid",
        "name": "One-time Purchase",
        "price": 99.00,
        "billingType": "one_time"
      }
    ]
  }
}
```

---

### POST /courses
Create course.

**Request:**
```json
{
  "title": "New Course",
  "subtitle": "Learn something new",
  "description": "Full description...",
  "type": "self_paced",
  "level": "beginner",
  "categoryId": "uuid",
  "tags": ["tag1", "tag2"]
}
```

**Response:**
```json
{
  "id": "uuid",
  "title": "New Course",
  "slug": "new-course",
  "status": "draft"
}
```

---

### PATCH /courses/:id
Update course.

**Request:**
```json
{
  "title": "Updated Course Title",
  "description": "New description",
  "thumbnailUrl": "https://cdn.../new-thumb.jpg"
}
```

**Response:**
```json
{
  "id": "uuid",
  "title": "Updated Course Title",
  ...
}
```

---

### DELETE /courses/:id
Delete course (soft delete).

**Response:**
```json
{
  "message": "Course deleted successfully"
}
```

---

### POST /courses/:id/publish
Publish course.

**Response:**
```json
{
  "id": "uuid",
  "status": "published",
  "publishedAt": "2025-01-29T10:00:00Z"
}
```

---

### POST /courses/:id/duplicate
Duplicate course.

**Response:**
```json
{
  "id": "new_uuid",
  "title": "Advanced Marketing Strategies (Copy)",
  "status": "draft"
}
```

---

## 6. MODULES & LESSONS

### POST /courses/:courseId/modules
Create module.

**Request:**
```json
{
  "title": "Module 1: Introduction",
  "description": "Getting started with the course",
  "sortOrder": 0
}
```

**Response:**
```json
{
  "id": "uuid",
  "courseId": "uuid",
  "title": "Module 1: Introduction",
  "sortOrder": 0
}
```

---

### PATCH /modules/:id
Update module.

**Request:**
```json
{
  "title": "Updated Module Title",
  "sortOrder": 1
}
```

**Response:**
```json
{
  "id": "uuid",
  "title": "Updated Module Title"
}
```

---

### DELETE /modules/:id
Delete module.

**Response:**
```json
{
  "message": "Module deleted successfully"
}
```

---

### POST /modules/:moduleId/lessons
Create lesson.

**Request:**
```json
{
  "title": "Lesson 1: Introduction to Marketing",
  "description": "Learn the basics",
  "type": "video",
  "content": {
    "videoUrl": "https://cdn.../video.mp4",
    "duration": 900,
    "transcriptUrl": "https://cdn.../transcript.vtt"
  },
  "completionRule": "video_percent",
  "completionThreshold": 80,
  "sortOrder": 0,
  "isFreePreview": true
}
```

**Response:**
```json
{
  "id": "uuid",
  "moduleId": "uuid",
  "title": "Lesson 1: Introduction to Marketing",
  "type": "video",
  "sortOrder": 0
}
```

---

### PATCH /lessons/:id
Update lesson.

**Request:**
```json
{
  "title": "Updated Lesson Title",
  "content": {
    "videoUrl": "https://cdn.../new-video.mp4"
  }
}
```

**Response:**
```json
{
  "id": "uuid",
  "title": "Updated Lesson Title"
}
```

---

### DELETE /lessons/:id
Delete lesson.

**Response:**
```json
{
  "message": "Lesson deleted successfully"
}
```

---

## 7. ENROLLMENTS & PROGRESS

### POST /enrollments
Enroll user in course.

**Request:**
```json
{
  "courseId": "uuid",
  "userId": "uuid",
  "enrollmentType": "purchase",
  "accessExpiresAt": "2026-01-29T00:00:00Z"
}
```

**Response:**
```json
{
  "id": "uuid",
  "courseId": "uuid",
  "userId": "uuid",
  "enrolledAt": "2025-01-29T10:00:00Z",
  "progressPercentage": 0
}
```

---

### GET /enrollments/:id
Get enrollment details.

**Response:**
```json
{
  "id": "uuid",
  "course": { ... },
  "user": { ... },
  "enrolledAt": "2025-01-29T10:00:00Z",
  "accessExpiresAt": "2026-01-29T00:00:00Z",
  "progressPercentage": 45.5,
  "completedAt": null,
  "lastAccessedAt": "2025-01-29T09:00:00Z",
  "lessonsCompleted": 12,
  "lessonsTotal": 24
}
```

---

### GET /users/:userId/enrollments
Get user's enrollments.

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "course": {
        "id": "uuid",
        "title": "Advanced Marketing",
        "thumbnailUrl": "..."
      },
      "progressPercentage": 45.5,
      "enrolledAt": "2025-01-15T00:00:00Z",
      "lastAccessedAt": "2025-01-29T09:00:00Z"
    }
  ]
}
```

---

### POST /enrollments/:id/lessons/:lessonId/complete
Mark lesson as complete.

**Request:**
```json
{
  "timeSpentSeconds": 900
}
```

**Response:**
```json
{
  "id": "uuid",
  "enrollmentId": "uuid",
  "lessonId": "uuid",
  "completedAt": "2025-01-29T10:30:00Z",
  "timeSpentSeconds": 900
}
```

---

### GET /enrollments/:id/progress
Get detailed progress for enrollment.

**Response:**
```json
{
  "enrollmentId": "uuid",
  "progressPercentage": 45.5,
  "lessonsCompleted": 12,
  "lessonsTotal": 24,
  "modules": [
    {
      "id": "uuid",
      "title": "Module 1",
      "lessonsCompleted": 5,
      "lessonsTotal": 5,
      "lessons": [
        {
          "id": "uuid",
          "title": "Lesson 1",
          "completed": true,
          "completedAt": "2025-01-20T10:00:00Z",
          "timeSpentSeconds": 900
        }
      ]
    }
  ]
}
```

---

## 8. QUIZZES & ASSESSMENTS

### POST /lessons/:lessonId/quizzes
Create quiz for lesson.

**Request:**
```json
{
  "title": "Module 1 Quiz",
  "description": "Test your knowledge",
  "timeLimitMinutes": 30,
  "passingScore": 80,
  "maxAttempts": 3,
  "randomizeQuestions": true
}
```

**Response:**
```json
{
  "id": "uuid",
  "lessonId": "uuid",
  "title": "Module 1 Quiz",
  "timeLimitMinutes": 30,
  "passingScore": 80
}
```

---

### POST /quizzes/:quizId/questions
Add question to quiz.

**Request:**
```json
{
  "type": "mcq",
  "questionText": "What is marketing?",
  "options": [
    {"id": "a", "text": "Selling products"},
    {"id": "b", "text": "Understanding customer needs"},
    {"id": "c", "text": "Advertising"},
    {"id": "d", "text": "All of the above"}
  ],
  "correctAnswer": {"selectedOption": "b"},
  "points": 10,
  "explanation": "Marketing is about understanding and meeting customer needs."
}
```

**Response:**
```json
{
  "id": "uuid",
  "quizId": "uuid",
  "type": "mcq",
  "questionText": "What is marketing?",
  "points": 10
}
```

---

### POST /quizzes/:quizId/attempts
Start quiz attempt.

**Response:**
```json
{
  "id": "uuid",
  "quizId": "uuid",
  "userId": "uuid",
  "attemptNumber": 1,
  "startedAt": "2025-01-29T10:00:00Z",
  "expiresAt": "2025-01-29T10:30:00Z",
  "questions": [
    {
      "id": "uuid",
      "type": "mcq",
      "questionText": "What is marketing?",
      "options": [ ... ]
    }
  ]
}
```

---

### POST /quizzes/:quizId/attempts/:attemptId/submit
Submit quiz attempt.

**Request:**
```json
{
  "answers": {
    "question_uuid_1": {"selectedOption": "b"},
    "question_uuid_2": {"selectedOptions": ["a", "c"]},
    "question_uuid_3": {"text": "Marketing is..."}
  }
}
```

**Response:**
```json
{
  "id": "uuid",
  "quizId": "uuid",
  "attemptNumber": 1,
  "submittedAt": "2025-01-29T10:25:00Z",
  "totalPoints": 100,
  "earnedPoints": 85,
  "scorePercentage": 85,
  "passed": true,
  "results": [
    {
      "questionId": "uuid",
      "correct": true,
      "pointsEarned": 10,
      "explanation": "..."
    }
  ]
}
```

---

### GET /quizzes/:quizId/attempts
Get user's quiz attempts.

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "attemptNumber": 1,
      "startedAt": "2025-01-29T10:00:00Z",
      "submittedAt": "2025-01-29T10:25:00Z",
      "scorePercentage": 85,
      "passed": true
    }
  ]
}
```

---

## 9. ASSIGNMENTS

### POST /lessons/:lessonId/assignments
Create assignment.

**Request:**
```json
{
  "title": "Module 1 Assignment",
  "description": "Apply what you've learned",
  "instructions": "Write a 500-word essay on...",
  "submissionType": "file_upload",
  "allowedFileTypes": ["pdf", "doc", "docx"],
  "maxFileSizeMb": 10,
  "maxPoints": 100,
  "dueAt": "2025-02-05T23:59:59Z"
}
```

**Response:**
```json
{
  "id": "uuid",
  "lessonId": "uuid",
  "title": "Module 1 Assignment",
  "dueAt": "2025-02-05T23:59:59Z"
}
```

---

### POST /assignments/:assignmentId/submissions
Submit assignment.

**Request:**
```json
{
  "submissionText": "My essay content...",
  "fileUrls": ["https://cdn.../submission.pdf"]
}
```

**Response:**
```json
{
  "id": "uuid",
  "assignmentId": "uuid",
  "userId": "uuid",
  "submittedAt": "2025-01-29T10:30:00Z",
  "isLate": false,
  "status": "submitted"
}
```

---

### POST /assignments/:assignmentId/submissions/:submissionId/grade
Grade assignment.

**Request:**
```json
{
  "grade": 95,
  "feedback": "Excellent work! Well researched and clearly written."
}
```

**Response:**
```json
{
  "id": "uuid",
  "grade": 95,
  "feedback": "Excellent work!",
  "gradedBy": {
    "id": "uuid",
    "name": "Jane Instructor"
  },
  "gradedAt": "2025-01-30T09:00:00Z",
  "status": "graded"
}
```

---

## 10. CERTIFICATES

### GET /certificates
Get user's certificates.

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "certificateNumber": "CERT-2025-001234",
      "course": {
        "id": "uuid",
        "title": "Advanced Marketing"
      },
      "issuedAt": "2025-01-25T00:00:00Z",
      "expiresAt": null,
      "pdfUrl": "https://cdn.../certificates/cert-001234.pdf",
      "verificationUrl": "https://outdureedge.com/verify/001234"
    }
  ]
}
```

---

### GET /certificates/:id
Get certificate details.

**Response:**
```json
{
  "id": "uuid",
  "certificateNumber": "CERT-2025-001234",
  "user": {
    "id": "uuid",
    "name": "John Doe"
  },
  "course": {
    "id": "uuid",
    "title": "Advanced Marketing"
  },
  "issuedAt": "2025-01-25T00:00:00Z",
  "expiresAt": null,
  "pdfUrl": "https://cdn.../cert.pdf",
  "isRevoked": false
}
```

---

### GET /certificates/verify/:certificateNumber
Public endpoint to verify certificate.

**Response:**
```json
{
  "valid": true,
  "certificateNumber": "CERT-2025-001234",
  "recipientName": "John Doe",
  "courseName": "Advanced Marketing",
  "issuedAt": "2025-01-25T00:00:00Z",
  "issuerName": "Outdure Edge"
}
```

---

## 11. COMMERCE

### GET /products
List products (sellable courses/bundles).

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "productType": "course",
      "productId": "course_uuid",
      "course": {
        "id": "uuid",
        "title": "Advanced Marketing",
        "thumbnailUrl": "..."
      },
      "pricingPlans": [
        {
          "id": "uuid",
          "name": "One-time Purchase",
          "price": 99.00,
          "currency": "USD",
          "billingType": "one_time"
        }
      ]
    }
  ]
}
```

---

### GET /products/:id
Get product details with pricing.

**Response:**
```json
{
  "id": "uuid",
  "productType": "course",
  "course": { ... },
  "pricingPlans": [
    {
      "id": "uuid",
      "name": "One-time",
      "price": 99.00,
      "currency": "USD",
      "billingType": "one_time"
    },
    {
      "id": "uuid",
      "name": "Monthly Subscription",
      "price": 19.00,
      "currency": "USD",
      "billingType": "subscription",
      "billingInterval": "monthly"
    }
  ]
}
```

---

### POST /orders
Create order (purchase product).

**Request:**
```json
{
  "items": [
    {
      "productId": "uuid",
      "pricingPlanId": "uuid",
      "quantity": 1
    }
  ],
  "couponCode": "SAVE20",
  "billingEmail": "user@example.com",
  "billingName": "John Doe",
  "paymentMethodId": "pm_stripe_123"
}
```

**Response:**
```json
{
  "id": "uuid",
  "orderNumber": "ORD-2025-001234",
  "subtotal": 99.00,
  "discount": 19.80,
  "tax": 0.00,
  "total": 79.20,
  "currency": "USD",
  "paymentStatus": "succeeded",
  "status": "completed",
  "items": [ ... ],
  "createdAt": "2025-01-29T10:00:00Z"
}
```

---

### GET /orders/:id
Get order details.

**Response:**
```json
{
  "id": "uuid",
  "orderNumber": "ORD-2025-001234",
  "user": { ... },
  "subtotal": 99.00,
  "discount": 19.80,
  "tax": 0.00,
  "total": 79.20,
  "currency": "USD",
  "paymentStatus": "succeeded",
  "status": "completed",
  "items": [
    {
      "id": "uuid",
      "product": {
        "id": "uuid",
        "name": "Advanced Marketing",
        "type": "course"
      },
      "quantity": 1,
      "unitPrice": 99.00,
      "totalPrice": 99.00
    }
  ],
  "invoiceUrl": "https://cdn.../invoices/inv-001234.pdf",
  "createdAt": "2025-01-29T10:00:00Z"
}
```

---

### GET /orders
List orders (user's orders or admin view).

**Query Parameters:**
- `page`, `limit`
- `status`: pending, completed, refunded
- `userId`: uuid (admin only)

**Response:**
```json
{
  "data": [ ... ],
  "pagination": { ... }
}
```

---

### POST /orders/:id/refund
Refund order (admin only).

**Request:**
```json
{
  "amount": 79.20,
  "reason": "Customer request"
}
```

**Response:**
```json
{
  "id": "uuid",
  "orderId": "uuid",
  "amount": 79.20,
  "status": "succeeded",
  "createdAt": "2025-01-30T10:00:00Z"
}
```

---

### GET /coupons
List coupons (admin only).

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "code": "SAVE20",
      "discountType": "percentage",
      "discountValue": 20,
      "maxUses": 100,
      "usesCount": 45,
      "validFrom": "2025-01-01T00:00:00Z",
      "validUntil": "2025-12-31T23:59:59Z",
      "isActive": true
    }
  ]
}
```

---

### POST /coupons
Create coupon.

**Request:**
```json
{
  "code": "SUMMER2025",
  "discountType": "percentage",
  "discountValue": 30,
  "maxUses": 50,
  "validFrom": "2025-06-01T00:00:00Z",
  "validUntil": "2025-08-31T23:59:59Z",
  "productIds": ["uuid1", "uuid2"]
}
```

**Response:**
```json
{
  "id": "uuid",
  "code": "SUMMER2025",
  "discountType": "percentage",
  "discountValue": 30
}
```

---

### POST /coupons/validate
Validate coupon code.

**Request:**
```json
{
  "code": "SAVE20",
  "productIds": ["uuid"]
}
```

**Response:**
```json
{
  "valid": true,
  "coupon": {
    "id": "uuid",
    "code": "SAVE20",
    "discountType": "percentage",
    "discountValue": 20
  },
  "discountAmount": 19.80
}
```

---

## 12. COMMUNITY

### GET /community/spaces
List community spaces.

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "General Discussion",
      "slug": "general",
      "description": "Talk about anything",
      "icon": "💬",
      "scopeType": "school",
      "isPrivate": false,
      "channelsCount": 5,
      "postsCount": 234
    }
  ]
}
```

---

### GET /community/spaces/:spaceId/channels
List channels in space.

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Introductions",
      "slug": "introductions",
      "description": "Introduce yourself",
      "postsCount": 45,
      "latestPost": {
        "id": "uuid",
        "title": "Hello everyone!",
        "author": { ... },
        "createdAt": "2025-01-29T09:00:00Z"
      }
    }
  ]
}
```

---

### GET /community/channels/:channelId/posts
List posts in channel.

**Query Parameters:**
- `page`, `limit`
- `sort`: recent, popular, unanswered

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "type": "text",
      "title": "How to apply this in real life?",
      "content": "I'm struggling to understand...",
      "author": {
        "id": "uuid",
        "name": "John Doe",
        "avatarUrl": "..."
      },
      "isPinned": false,
      "isLocked": false,
      "viewsCount": 125,
      "reactionsCount": 15,
      "commentsCount": 8,
      "createdAt": "2025-01-28T10:00:00Z"
    }
  ],
  "pagination": { ... }
}
```

---

### POST /community/channels/:channelId/posts
Create post.

**Request:**
```json
{
  "type": "text",
  "title": "Need help with Module 3",
  "content": "I'm stuck on the assignment...",
  "imageUrls": ["https://cdn.../image.jpg"]
}
```

**Response:**
```json
{
  "id": "uuid",
  "type": "text",
  "title": "Need help with Module 3",
  "content": "...",
  "author": { ... },
  "createdAt": "2025-01-29T10:00:00Z"
}
```

---

### GET /community/posts/:postId
Get post details with comments.

**Response:**
```json
{
  "id": "uuid",
  "type": "text",
  "title": "Need help with Module 3",
  "content": "...",
  "author": { ... },
  "isPinned": false,
  "isLocked": false,
  "viewsCount": 125,
  "reactions": [
    {"emoji": "👍", "count": 10},
    {"emoji": "❤️", "count": 5}
  ],
  "comments": [
    {
      "id": "uuid",
      "content": "Try checking the video at 5:30...",
      "author": { ... },
      "reactionsCount": 3,
      "createdAt": "2025-01-28T11:00:00Z",
      "replies": [ ... ]
    }
  ],
  "createdAt": "2025-01-28T10:00:00Z"
}
```

---

### POST /community/posts/:postId/comments
Add comment to post.

**Request:**
```json
{
  "content": "Have you tried...",
  "parentCommentId": "uuid"
}
```

**Response:**
```json
{
  "id": "uuid",
  "postId": "uuid",
  "content": "Have you tried...",
  "author": { ... },
  "createdAt": "2025-01-29T10:00:00Z"
}
```

---

### POST /community/posts/:postId/reactions
Add reaction to post.

**Request:**
```json
{
  "emoji": "👍"
}
```

**Response:**
```json
{
  "id": "uuid",
  "postId": "uuid",
  "emoji": "👍",
  "userId": "uuid"
}
```

---

### DELETE /community/posts/:postId/reactions/:emoji
Remove reaction from post.

**Response:**
```json
{
  "message": "Reaction removed"
}
```

---

### POST /community/posts/:postId/report
Report post.

**Request:**
```json
{
  "reason": "spam",
  "description": "This is spam content"
}
```

**Response:**
```json
{
  "id": "uuid",
  "status": "pending",
  "createdAt": "2025-01-29T10:00:00Z"
}
```

---

## 13. ANALYTICS

### GET /analytics/dashboard
Get school dashboard analytics.

**Query Parameters:**
- `startDate`: date
- `endDate`: date

**Response:**
```json
{
  "period": {
    "startDate": "2025-01-01",
    "endDate": "2025-01-31"
  },
  "sales": {
    "revenue": 45000.00,
    "transactions": 450,
    "refunds": 1200.00,
    "conversionRate": 3.5,
    "averageOrderValue": 100.00
  },
  "learners": {
    "totalUsers": 1250,
    "activeUsers": 890,
    "newSignups": 125
  },
  "courses": {
    "totalEnrollments": 2345,
    "completions": 567,
    "avgTimeToComplete": 15.5
  },
  "engagement": {
    "logins": 5600,
    "communityPosts": 234,
    "videoWatchTimeMinutes": 125000
  }
}
```

---

### GET /analytics/courses/:courseId
Get course analytics.

**Response:**
```json
{
  "courseId": "uuid",
  "period": { ... },
  "enrollment": {
    "total": 450,
    "active": 320,
    "completed": 120,
    "dropRate": 2.2
  },
  "progress": {
    "avgCompletionPercentage": 45.5,
    "avgTimePerLesson": 12.5,
    "dropOffPoints": [
      {
        "lessonId": "uuid",
        "lessonTitle": "Lesson 5: Advanced Concepts",
        "dropOffRate": 15.5
      }
    ]
  },
  "assessments": {
    "avgQuizScore": 82.5,
    "passRate": 87.5,
    "avgAttempts": 1.3
  },
  "engagement": {
    "discussionPosts": 45,
    "avgVideoWatchPercentage": 78.5
  }
}
```

---

### GET /analytics/users/:userId
Get learner analytics (instructor/admin view).

**Response:**
```json
{
  "userId": "uuid",
  "enrollments": [
    {
      "courseId": "uuid",
      "courseTitle": "Advanced Marketing",
      "progressPercentage": 45.5,
      "timeSpentMinutes": 450,
      "lastAccessedAt": "2025-01-29T09:00:00Z",
      "quizScores": [
        {
          "quizTitle": "Module 1 Quiz",
          "score": 85,
          "passed": true
        }
      ]
    }
  ],
  "engagement": {
    "totalTimeSpentMinutes": 1200,
    "loginCount": 25,
    "communityPosts": 5
  }
}
```

---

### GET /analytics/organizations/:orgId
Get organization analytics.

**Response:**
```json
{
  "organizationId": "uuid",
  "seats": {
    "purchased": 50,
    "allocated": 45,
    "active": 38
  },
  "enrollments": {
    "total": 180,
    "inProgress": 120,
    "completed": 60
  },
  "progress": {
    "avgCompletionRate": 55.5,
    "avgTimeSpentMinutes": 850
  },
  "topPerformers": [
    {
      "userId": "uuid",
      "name": "John Doe",
      "coursesCompleted": 8,
      "avgScore": 92
    }
  ]
}
```

---

## 14. NOTIFICATIONS

### GET /notifications
Get user's notifications.

**Query Parameters:**
- `page`, `limit`
- `isRead`: boolean

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "type": "lesson_unlocked",
      "title": "New lesson available!",
      "message": "Lesson 5 is now unlocked in Advanced Marketing",
      "actionUrl": "/courses/uuid/lessons/uuid",
      "isRead": false,
      "createdAt": "2025-01-29T09:00:00Z"
    }
  ],
  "unreadCount": 5,
  "pagination": { ... }
}
```

---

### PATCH /notifications/:id/read
Mark notification as read.

**Response:**
```json
{
  "id": "uuid",
  "isRead": true,
  "readAt": "2025-01-29T10:00:00Z"
}
```

---

### POST /notifications/mark-all-read
Mark all notifications as read.

**Response:**
```json
{
  "message": "All notifications marked as read",
  "count": 5
}
```

---

## 15. MEDIA UPLOAD

### POST /media/upload-url
Get presigned URL for file upload.

**Request:**
```json
{
  "filename": "video.mp4",
  "fileType": "video/mp4",
  "fileSize": 104857600,
  "folder": "course-videos"
}
```

**Response:**
```json
{
  "uploadUrl": "https://s3.amazonaws.com/bucket/path?signature=...",
  "fileKey": "tenants/uuid/course-videos/video-uuid.mp4",
  "expiresAt": "2025-01-29T11:00:00Z"
}
```

---

### POST /media/confirm-upload
Confirm file upload completion.

**Request:**
```json
{
  "fileKey": "tenants/uuid/course-videos/video-uuid.mp4",
  "fileUrl": "https://cdn.../video-uuid.mp4"
}
```

**Response:**
```json
{
  "id": "uuid",
  "filename": "video.mp4",
  "fileUrl": "https://cdn.../video-uuid.mp4",
  "fileType": "video/mp4",
  "fileSize": 104857600,
  "status": "processing"
}
```

---

### GET /media
List uploaded media files.

**Query Parameters:**
- `page`, `limit`
- `fileType`: image, video, document, etc.
- `folder`: string

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "filename": "video.mp4",
      "fileUrl": "https://cdn.../video-uuid.mp4",
      "thumbnailUrl": "https://cdn.../thumb.jpg",
      "fileType": "video/mp4",
      "fileSize": 104857600,
      "duration": 900,
      "uploadedBy": { ... },
      "uploadedAt": "2025-01-29T10:00:00Z",
      "usedInCount": 3
    }
  ],
  "pagination": { ... }
}
```

---

## 16. SEARCH

### GET /search
Global search across courses, lessons, community.

**Query Parameters:**
- `q`: search query (required)
- `type`: courses, lessons, community, users (optional, comma-separated)
- `page`, `limit`

**Response:**
```json
{
  "query": "marketing strategies",
  "results": {
    "courses": [
      {
        "id": "uuid",
        "title": "Advanced Marketing Strategies",
        "description": "Learn cutting-edge marketing...",
        "thumbnailUrl": "...",
        "relevanceScore": 0.95
      }
    ],
    "lessons": [
      {
        "id": "uuid",
        "title": "Lesson 3: Digital Marketing",
        "courseTitle": "Advanced Marketing",
        "contentSnippet": "...digital marketing strategies include...",
        "relevanceScore": 0.87
      }
    ],
    "community": [
      {
        "id": "uuid",
        "type": "post",
        "title": "Best marketing strategies for 2025",
        "contentSnippet": "...",
        "author": { ... },
        "relevanceScore": 0.75
      }
    ]
  },
  "total": 25
}
```

---

## Error Responses

All errors follow this format:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  },
  "statusCode": 400
}
```

### Common Error Codes
- `400 BAD_REQUEST`: Invalid input
- `401 UNAUTHORIZED`: Missing or invalid token
- `403 FORBIDDEN`: Insufficient permissions
- `404 NOT_FOUND`: Resource not found
- `409 CONFLICT`: Resource already exists
- `422 VALIDATION_ERROR`: Validation failed
- `429 TOO_MANY_REQUESTS`: Rate limit exceeded
- `500 INTERNAL_SERVER_ERROR`: Server error

---

## Rate Limiting

Rate limits are enforced per user/IP:

- **Public endpoints**: 100 requests/minute
- **Authenticated users**: 1000 requests/minute
- **Uploads**: 10 uploads/minute

Headers returned:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1643461200
```

---

## Pagination

All list endpoints support pagination:

**Query Parameters:**
- `page`: integer (default: 1)
- `limit`: integer (default: 50, max: 100)

**Response:**
```json
{
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 234,
    "totalPages": 5,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

---

## Webhooks

Events sent to registered webhook URLs:

### Event Types
- `course.published`
- `user.enrolled`
- `order.completed`
- `order.refunded`
- `certificate.issued`
- `quiz.completed`
- `assignment.submitted`

### Payload Example
```json
{
  "event": "order.completed",
  "timestamp": "2025-01-29T10:00:00Z",
  "tenantId": "uuid",
  "data": {
    "orderId": "uuid",
    "orderNumber": "ORD-2025-001234",
    "userId": "uuid",
    "total": 99.00,
    "currency": "USD"
  }
}
```

### Signature Verification
Each webhook includes a signature header:
```
X-Webhook-Signature: sha256=<signature>
```

Verify using your webhook secret:
```javascript
const signature = crypto
  .createHmac('sha256', webhookSecret)
  .update(JSON.stringify(payload))
  .digest('hex');
```

---

This API specification covers all core functionality for the Outdure Edge LearnWorlds-style LMS platform.
