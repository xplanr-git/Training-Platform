# API Design - Multi-Tenant LMS Platform

## API Architecture

**Style:** RESTful API with standard HTTP methods
**Format:** JSON request/response bodies
**Authentication:** JWT tokens (access + refresh)
**Authorization:** RBAC with permission checks on every endpoint
**Rate Limiting:** 100 req/min per user, 1000 req/min per school
**Versioning:** URL-based (e.g., `/api/v1/`)

---

## Base URL Structure

```
https://{school-slug}.outdure-edge.com/api/v1/{resource}
or
https://api.outdure-edge.com/api/v1/{resource}
```

**Headers:**
```
Authorization: Bearer {jwt_token}
X-School-ID: {school_id}  // for multi-school access scenarios
Content-Type: application/json
```

---

## 1. AUTHENTICATION & AUTHORIZATION

### `POST /auth/register`
Register a new user account
```json
Request:
{
  "email": "user@example.com",
  "password": "secure_password",
  "first_name": "John",
  "last_name": "Doe"
}

Response: 201
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe"
  },
  "tokens": {
    "access_token": "jwt...",
    "refresh_token": "jwt...",
    "expires_in": 3600
  }
}
```

### `POST /auth/login`
Login with email/password
```json
Request:
{
  "email": "user@example.com",
  "password": "password"
}

Response: 200
{
  "user": {...},
  "tokens": {...}
}
```

### `POST /auth/login/magic-link`
Request magic link login
```json
Request:
{
  "email": "user@example.com",
  "redirect_url": "https://school.com/dashboard"
}

Response: 200
{
  "message": "Magic link sent to email"
}
```

### `POST /auth/refresh`
Refresh access token
```json
Request:
{
  "refresh_token": "jwt..."
}

Response: 200
{
  "access_token": "jwt...",
  "expires_in": 3600
}
```

### `POST /auth/logout`
Invalidate tokens
```json
Response: 204
```

### `POST /auth/password/forgot`
Request password reset
```json
Request:
{
  "email": "user@example.com"
}

Response: 200
{
  "message": "Password reset email sent"
}
```

### `POST /auth/password/reset`
Reset password with token
```json
Request:
{
  "token": "reset_token",
  "password": "new_password"
}

Response: 200
{
  "message": "Password reset successful"
}
```

### `GET /auth/me`
Get current user profile
```json
Response: 200
{
  "id": "uuid",
  "email": "user@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "avatar_url": "https://...",
  "roles": [
    {
      "id": "uuid",
      "name": "Learner",
      "school_id": "uuid"
    }
  ],
  "permissions": ["courses.read", "community.post"]
}
```

---

## 2. SCHOOLS (TENANT MANAGEMENT)

### `POST /schools`
Create a new school (platform admin only)
```json
Request:
{
  "name": "Acme Learning",
  "slug": "acme-learning",
  "subdomain": "acme",
  "owner_email": "owner@acme.com",
  "plan_tier": "professional"
}

Response: 201
{
  "school": {...},
  "owner": {...}
}
```

### `GET /schools/{school_id}`
Get school details
```json
Response: 200
{
  "id": "uuid",
  "name": "Acme Learning",
  "slug": "acme-learning",
  "domain": "learn.acme.com",
  "subdomain": "acme",
  "plan_tier": "professional",
  "logo_url": "https://...",
  "primary_color": "#000000",
  "settings": {...}
}
```

### `PATCH /schools/{school_id}`
Update school settings (owner/admin only)
```json
Request:
{
  "name": "Acme Learning Academy",
  "logo_url": "https://...",
  "primary_color": "#FF5733",
  "settings": {
    "enable_certificates": true,
    "enable_community": true
  }
}

Response: 200
{
  "school": {...}
}
```

### `POST /schools/{school_id}/domain`
Configure custom domain
```json
Request:
{
  "domain": "learn.acme.com"
}

Response: 200
{
  "domain": "learn.acme.com",
  "dns_records": [
    {
      "type": "CNAME",
      "host": "learn",
      "value": "schools.outdure-edge.com"
    }
  ],
  "ssl_status": "pending"
}
```

### `GET /schools/{school_id}/analytics`
Get school-level analytics
```json
Query params: ?from=2024-01-01&to=2024-01-31&metrics=revenue,enrollments

Response: 200
{
  "period": {
    "from": "2024-01-01",
    "to": "2024-01-31"
  },
  "metrics": {
    "revenue": {
      "total": 15000.00,
      "currency": "USD",
      "growth": 12.5
    },
    "enrollments": {
      "total": 450,
      "growth": 8.3
    },
    "active_users": 342,
    "completion_rate": 68.5
  },
  "charts": {...}
}
```

---

## 3. USERS & ROLES

### `GET /users`
List users in school (admin only)
```json
Query params: ?page=1&limit=20&role=learner&search=john&status=active

Response: 200
{
  "users": [
    {
      "id": "uuid",
      "email": "john@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "roles": ["Learner"],
      "status": "active",
      "created_at": "2024-01-15T10:00:00Z"
    }
  ],
  "pagination": {
    "total": 342,
    "page": 1,
    "limit": 20,
    "pages": 18
  }
}
```

### `POST /users`
Create/invite user (admin only)
```json
Request:
{
  "email": "newuser@example.com",
  "first_name": "Jane",
  "last_name": "Smith",
  "role_ids": ["uuid"],
  "send_invite": true
}

Response: 201
{
  "user": {...},
  "invite_sent": true
}
```

### `GET /users/{user_id}`
Get user details
```json
Response: 200
{
  "id": "uuid",
  "email": "user@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "avatar_url": "https://...",
  "roles": [...],
  "tags": ["premium", "active"],
  "enrollments_count": 12,
  "completed_courses": 8,
  "certificates_count": 5,
  "created_at": "2024-01-15T10:00:00Z"
}
```

### `PATCH /users/{user_id}`
Update user profile
```json
Request:
{
  "first_name": "John",
  "last_name": "Doe",
  "avatar_url": "https://...",
  "timezone": "America/New_York"
}

Response: 200
{
  "user": {...}
}
```

### `DELETE /users/{user_id}`
Delete user account (soft delete)
```json
Response: 204
```

### `POST /users/{user_id}/roles`
Assign role to user (admin only)
```json
Request:
{
  "role_id": "uuid",
  "scope": "course",
  "scope_id": "course_uuid"
}

Response: 201
{
  "user_role": {...}
}
```

### `DELETE /users/{user_id}/roles/{role_id}`
Remove role from user
```json
Response: 204
```

### `GET /users/{user_id}/enrollments`
Get user's enrollments
```json
Response: 200
{
  "enrollments": [
    {
      "id": "uuid",
      "product": {...},
      "progress_percentage": 45.5,
      "status": "active",
      "enrolled_at": "2024-01-15T10:00:00Z",
      "last_accessed_at": "2024-01-20T14:30:00Z"
    }
  ]
}
```

### `GET /users/{user_id}/certificates`
Get user's certificates
```json
Response: 200
{
  "certificates": [
    {
      "id": "uuid",
      "certificate_number": "CERT-2024-001",
      "product": {...},
      "issued_at": "2024-01-20T10:00:00Z",
      "expires_at": null,
      "verification_url": "https://...",
      "pdf_url": "https://..."
    }
  ]
}
```

---

## 4. ROLES & PERMISSIONS

### `GET /roles`
List roles in school
```json
Response: 200
{
  "roles": [
    {
      "id": "uuid",
      "name": "Instructor",
      "slug": "instructor",
      "is_system_role": false,
      "permissions_count": 25
    }
  ]
}
```

### `POST /roles`
Create custom role (admin only)
```json
Request:
{
  "name": "Community Moderator",
  "slug": "community-moderator",
  "description": "Can moderate community posts",
  "permission_ids": ["uuid1", "uuid2"]
}

Response: 201
{
  "role": {...}
}
```

### `GET /roles/{role_id}`
Get role details with permissions
```json
Response: 200
{
  "id": "uuid",
  "name": "Instructor",
  "permissions": [
    {
      "id": "uuid",
      "domain": "courses",
      "action": "create",
      "resource": "own"
    }
  ]
}
```

### `PATCH /roles/{role_id}`
Update role
```json
Request:
{
  "name": "Senior Instructor",
  "permission_ids": ["uuid1", "uuid2", "uuid3"]
}

Response: 200
{
  "role": {...}
}
```

### `GET /permissions`
List all available permissions
```json
Response: 200
{
  "permissions": [
    {
      "id": "uuid",
      "domain": "courses",
      "action": "create",
      "resource": "*",
      "description": "Create any course"
    }
  ]
}
```

---

## 5. PRODUCTS & COURSES

### `GET /products`
List products (course catalog)
```json
Query params: ?page=1&limit=20&type=course&status=published&category=marketing&search=seo

Response: 200
{
  "products": [
    {
      "id": "uuid",
      "type": "course",
      "name": "SEO Masterclass",
      "slug": "seo-masterclass",
      "tagline": "Learn SEO from scratch",
      "thumbnail_url": "https://...",
      "instructor": {
        "id": "uuid",
        "name": "John Doe",
        "avatar_url": "https://..."
      },
      "pricing": {
        "min_price": 99.00,
        "currency": "USD"
      },
      "rating": 4.8,
      "students_count": 1250,
      "duration_hours": 12.5,
      "status": "published"
    }
  ],
  "pagination": {...}
}
```

### `POST /products`
Create product (instructor/admin only)
```json
Request:
{
  "type": "course",
  "name": "Advanced React",
  "slug": "advanced-react",
  "description": "Deep dive into React",
  "thumbnail_url": "https://...",
  "category_ids": ["uuid1"],
  "visibility": "public"
}

Response: 201
{
  "product": {...}
}
```

### `GET /products/{product_id}`
Get product details (public or enrolled)
```json
Response: 200
{
  "id": "uuid",
  "type": "course",
  "name": "Advanced React",
  "slug": "advanced-react",
  "description": "...",
  "thumbnail_url": "https://...",
  "video_preview_url": "https://...",
  "instructors": [...],
  "pricing_plans": [
    {
      "id": "uuid",
      "name": "Full Access",
      "price": 199.00,
      "currency": "USD",
      "pricing_type": "one_time",
      "is_default": true
    }
  ],
  "curriculum": [
    {
      "id": "module_uuid",
      "title": "Module 1: Introduction",
      "lessons_count": 5,
      "duration_seconds": 3600,
      "lessons": [
        {
          "id": "lesson_uuid",
          "title": "Welcome to the course",
          "type": "video",
          "duration_seconds": 300,
          "is_free_preview": true
        }
      ]
    }
  ],
  "what_you_will_learn": ["Skill 1", "Skill 2"],
  "requirements": ["Basic JavaScript"],
  "level": "intermediate",
  "language": "en",
  "has_certificate": true,
  "rating": 4.8,
  "reviews_count": 342,
  "students_count": 1250
}
```

### `PATCH /products/{product_id}`
Update product (instructor/admin only)
```json
Request:
{
  "name": "Advanced React 2024",
  "description": "Updated content",
  "status": "published"
}

Response: 200
{
  "product": {...}
}
```

### `DELETE /products/{product_id}`
Delete product (soft delete)
```json
Response: 204
```

### `POST /products/{product_id}/publish`
Publish product
```json
Response: 200
{
  "product": {...},
  "published_at": "2024-01-20T10:00:00Z"
}
```

### `GET /products/{product_id}/analytics`
Get product analytics (instructor/admin only)
```json
Query params: ?from=2024-01-01&to=2024-01-31

Response: 200
{
  "enrollments": {
    "total": 125,
    "new": 45,
    "growth": 12.5
  },
  "completion_rate": 68.5,
  "avg_progress": 45.2,
  "revenue": 12450.00,
  "rating": 4.8,
  "engagement": {
    "avg_watch_time": 3600,
    "drop_off_points": [...]
  }
}
```

---

## 6. COURSE CURRICULUM

### `GET /courses/{course_id}/curriculum`
Get full course structure
```json
Response: 200
{
  "modules": [
    {
      "id": "uuid",
      "title": "Module 1",
      "description": "...",
      "sort_order": 1,
      "lessons": [
        {
          "id": "uuid",
          "title": "Lesson 1",
          "type": "video",
          "duration_seconds": 600,
          "is_free_preview": false,
          "sort_order": 1
        }
      ]
    }
  ]
}
```

### `POST /courses/{course_id}/modules`
Create module (instructor/admin only)
```json
Request:
{
  "title": "Module 2: Advanced Topics",
  "description": "...",
  "sort_order": 2
}

Response: 201
{
  "module": {...}
}
```

### `PATCH /modules/{module_id}`
Update module
```json
Request:
{
  "title": "Module 2: Updated Title",
  "description": "..."
}

Response: 200
{
  "module": {...}
}
```

### `DELETE /modules/{module_id}`
Delete module
```json
Response: 204
```

### `POST /modules/{module_id}/reorder`
Reorder modules
```json
Request:
{
  "module_ids": ["uuid1", "uuid2", "uuid3"]
}

Response: 200
{
  "modules": [...]
}
```

### `POST /modules/{module_id}/lessons`
Create lesson
```json
Request:
{
  "title": "Introduction to React Hooks",
  "type": "video",
  "description": "...",
  "sort_order": 1,
  "content": {
    "video_url": "https://...",
    "video_provider": "self_hosted",
    "duration_seconds": 600
  },
  "is_free_preview": false
}

Response: 201
{
  "lesson": {...}
}
```

### `GET /lessons/{lesson_id}`
Get lesson details (enrolled users only)
```json
Response: 200
{
  "id": "uuid",
  "title": "Introduction to React Hooks",
  "type": "video",
  "description": "...",
  "content": {
    "video_url": "https://...",
    "thumbnail_url": "https://...",
    "duration_seconds": 600,
    "has_transcript": true,
    "transcript_text": "...",
    "interactive_data": {
      "hotspots": [...],
      "questions": [...]
    }
  },
  "resources": [
    {
      "title": "Slides",
      "url": "https://..."
    }
  ],
  "next_lesson_id": "uuid",
  "prev_lesson_id": "uuid"
}
```

### `PATCH /lessons/{lesson_id}`
Update lesson
```json
Request:
{
  "title": "Updated Title",
  "content": {...}
}

Response: 200
{
  "lesson": {...}
}
```

### `DELETE /lessons/{lesson_id}`
Delete lesson
```json
Response: 204
```

---

## 7. ENROLLMENTS & PROGRESS

### `POST /products/{product_id}/enroll`
Enroll in product (free or after purchase)
```json
Request:
{
  "enrollment_type": "purchase",
  "order_id": "uuid"
}

Response: 201
{
  "enrollment": {
    "id": "uuid",
    "product_id": "uuid",
    "user_id": "uuid",
    "status": "active",
    "progress_percentage": 0,
    "enrolled_at": "2024-01-20T10:00:00Z"
  }
}
```

### `GET /enrollments/{enrollment_id}`
Get enrollment details with progress
```json
Response: 200
{
  "id": "uuid",
  "product": {...},
  "user": {...},
  "status": "active",
  "progress_percentage": 45.5,
  "lessons_completed": 12,
  "lessons_total": 26,
  "enrolled_at": "2024-01-20T10:00:00Z",
  "last_accessed_at": "2024-01-25T14:30:00Z",
  "current_lesson": {...},
  "certificate_issued": false
}
```

### `GET /enrollments/{enrollment_id}/progress`
Get detailed progress
```json
Response: 200
{
  "modules": [
    {
      "id": "uuid",
      "title": "Module 1",
      "completion_percentage": 100,
      "lessons": [
        {
          "id": "uuid",
          "title": "Lesson 1",
          "completed": true,
          "completed_at": "2024-01-21T10:00:00Z",
          "watch_percentage": 100
        }
      ]
    }
  ]
}
```

### `POST /lessons/{lesson_id}/complete`
Mark lesson as complete
```json
Request:
{
  "enrollment_id": "uuid",
  "completion_data": {
    "watch_percentage": 95,
    "quiz_score": 85
  }
}

Response: 200
{
  "lesson_completion": {...},
  "enrollment": {
    "progress_percentage": 48.5
  }
}
```

### `POST /lessons/{lesson_id}/video-progress`
Track video watch progress
```json
Request:
{
  "enrollment_id": "uuid",
  "watch_percentage": 45,
  "last_position_seconds": 270,
  "watch_duration_seconds": 180
}

Response: 200
{
  "message": "Progress tracked"
}
```

### `GET /enrollments/{enrollment_id}/notes`
Get user's notes for enrollment
```json
Response: 200
{
  "notes": [
    {
      "id": "uuid",
      "lesson": {...},
      "timestamp_seconds": 120,
      "note_text": "Important point about hooks",
      "created_at": "2024-01-21T10:00:00Z"
    }
  ]
}
```

### `POST /lessons/{lesson_id}/notes`
Create note
```json
Request:
{
  "timestamp_seconds": 120,
  "note_text": "Important point"
}

Response: 201
{
  "note": {...}
}
```

### `GET /enrollments/{enrollment_id}/bookmarks`
Get user's bookmarks
```json
Response: 200
{
  "bookmarks": [...]
}
```

### `POST /lessons/{lesson_id}/bookmarks`
Create bookmark
```json
Request:
{
  "timestamp_seconds": 300,
  "title": "Important section"
}

Response: 201
{
  "bookmark": {...}
}
```

---

## 8. QUIZZES & ASSESSMENTS

### `GET /quizzes/{quiz_id}`
Get quiz details
```json
Response: 200
{
  "id": "uuid",
  "lesson_id": "uuid",
  "title": "Module 1 Quiz",
  "description": "...",
  "time_limit_minutes": 30,
  "attempts_allowed": 3,
  "passing_score": 70,
  "questions_count": 10,
  "user_attempts": 1,
  "best_score": 85
}
```

### `POST /quizzes/{quiz_id}/start`
Start quiz attempt
```json
Response: 201
{
  "attempt": {
    "id": "uuid",
    "attempt_number": 1,
    "questions": [
      {
        "id": "uuid",
        "type": "mcq",
        "question_text": "What is React?",
        "options": [
          {"id": "opt1", "text": "A library"},
          {"id": "opt2", "text": "A framework"}
        ],
        "points": 1
      }
    ],
    "started_at": "2024-01-21T10:00:00Z",
    "expires_at": "2024-01-21T10:30:00Z"
  }
}
```

### `POST /quiz-attempts/{attempt_id}/submit`
Submit quiz answers
```json
Request:
{
  "answers": [
    {
      "question_id": "uuid",
      "answer": "opt1"
    }
  ]
}

Response: 200
{
  "attempt": {
    "id": "uuid",
    "score": 8.5,
    "max_score": 10,
    "percentage": 85,
    "passed": true,
    "submitted_at": "2024-01-21T10:15:00Z",
    "time_spent_seconds": 900,
    "answers": [
      {
        "question_id": "uuid",
        "user_answer": "opt1",
        "correct_answer": "opt1",
        "is_correct": true,
        "points_earned": 1,
        "explanation": "..."
      }
    ]
  }
}
```

### `GET /quiz-attempts/{attempt_id}`
Get attempt results
```json
Response: 200
{
  "attempt": {...}
}
```

### `POST /quizzes`
Create quiz (instructor/admin only)
```json
Request:
{
  "lesson_id": "uuid",
  "title": "Module 1 Quiz",
  "time_limit_minutes": 30,
  "attempts_allowed": 3,
  "passing_score": 70,
  "questions": [...]
}

Response: 201
{
  "quiz": {...}
}
```

---

## 9. ASSIGNMENTS

### `GET /assignments/{assignment_id}`
Get assignment details
```json
Response: 200
{
  "id": "uuid",
  "lesson_id": "uuid",
  "title": "Build a React App",
  "description": "...",
  "max_points": 100,
  "due_date": "2024-02-01T23:59:59Z",
  "submission_types": ["file", "url"],
  "user_submission": {
    "id": "uuid",
    "status": "submitted",
    "score": 85,
    "submitted_at": "2024-01-25T10:00:00Z"
  }
}
```

### `POST /assignments/{assignment_id}/submit`
Submit assignment
```json
Request:
{
  "submission_type": "file",
  "submission_data": {
    "files": [
      {
        "name": "project.zip",
        "url": "https://..."
      }
    ]
  }
}

Response: 201
{
  "submission": {
    "id": "uuid",
    "submitted_at": "2024-01-25T10:00:00Z",
    "status": "submitted"
  }
}
```

### `GET /assignments/{assignment_id}/submissions`
Get all submissions (instructor/admin only)
```json
Response: 200
{
  "submissions": [
    {
      "id": "uuid",
      "user": {...},
      "submitted_at": "2024-01-25T10:00:00Z",
      "status": "submitted",
      "score": null
    }
  ]
}
```

### `POST /assignment-submissions/{submission_id}/grade`
Grade submission (instructor/admin only)
```json
Request:
{
  "score": 85,
  "feedback": "Great work! Consider..."
}

Response: 200
{
  "submission": {
    "score": 85,
    "feedback": "...",
    "graded_at": "2024-01-26T10:00:00Z",
    "graded_by": {...}
  }
}
```

---

## 10. CERTIFICATES

### `GET /certificates/{certificate_id}`
Get certificate details
```json
Response: 200
{
  "id": "uuid",
  "certificate_number": "CERT-2024-001",
  "user": {...},
  "product": {...},
  "issued_at": "2024-01-26T10:00:00Z",
  "expires_at": null,
  "verification_url": "https://school.com/verify/CERT-2024-001",
  "pdf_url": "https://..."
}
```

### `GET /certificates/verify/{certificate_number}`
Verify certificate (public)
```json
Response: 200
{
  "valid": true,
  "certificate": {...},
  "user": {
    "name": "John Doe"
  },
  "product": {
    "name": "Advanced React"
  },
  "issued_at": "2024-01-26T10:00:00Z"
}
```

### `POST /certificates/{certificate_id}/download`
Download certificate PDF
```json
Response: 200 (binary PDF)
```

---

## 11. COMMERCE

### `GET /pricing-plans`
Get pricing plans for a product
```json
Query params: ?product_id=uuid

Response: 200
{
  "plans": [
    {
      "id": "uuid",
      "name": "Full Access",
      "pricing_type": "one_time",
      "price": 199.00,
      "currency": "USD",
      "is_default": true
    },
    {
      "id": "uuid",
      "name": "Monthly Subscription",
      "pricing_type": "subscription",
      "price": 29.00,
      "billing_interval": "monthly"
    }
  ]
}
```

### `POST /checkout`
Create checkout session
```json
Request:
{
  "items": [
    {
      "product_id": "uuid",
      "pricing_plan_id": "uuid",
      "quantity": 1
    }
  ],
  "coupon_code": "SAVE20",
  "success_url": "https://school.com/success",
  "cancel_url": "https://school.com/cancel"
}

Response: 200
{
  "checkout_url": "https://checkout.stripe.com/...",
  "order": {
    "id": "uuid",
    "order_number": "ORD-2024-001",
    "subtotal": 199.00,
    "discount_amount": 39.80,
    "total_amount": 159.20,
    "currency": "USD"
  }
}
```

### `POST /coupons/validate`
Validate coupon code
```json
Request:
{
  "code": "SAVE20",
  "product_ids": ["uuid1"]
}

Response: 200
{
  "valid": true,
  "coupon": {
    "id": "uuid",
    "code": "SAVE20",
    "discount_type": "percentage",
    "discount_value": 20,
    "valid_until": "2024-12-31T23:59:59Z"
  },
  "discount_amount": 39.80
}
```

### `GET /orders`
List user's orders
```json
Response: 200
{
  "orders": [
    {
      "id": "uuid",
      "order_number": "ORD-2024-001",
      "total_amount": 159.20,
      "currency": "USD",
      "status": "completed",
      "items": [...],
      "created_at": "2024-01-20T10:00:00Z",
      "invoice_url": "https://..."
    }
  ]
}
```

### `GET /orders/{order_id}`
Get order details
```json
Response: 200
{
  "id": "uuid",
  "order_number": "ORD-2024-001",
  "user": {...},
  "items": [
    {
      "product": {...},
      "pricing_plan": {...},
      "quantity": 1,
      "price": 199.00,
      "total": 199.00
    }
  ],
  "subtotal": 199.00,
  "discount_amount": 39.80,
  "tax_amount": 0,
  "total_amount": 159.20,
  "currency": "USD",
  "status": "completed",
  "payment_status": "paid",
  "invoice_url": "https://...",
  "receipt_url": "https://...",
  "created_at": "2024-01-20T10:00:00Z"
}
```

### `POST /orders/{order_id}/refund`
Request refund (admin only)
```json
Request:
{
  "amount": 159.20,
  "reason": "Customer request"
}

Response: 200
{
  "refund": {
    "id": "uuid",
    "amount": 159.20,
    "status": "pending",
    "created_at": "2024-01-22T10:00:00Z"
  }
}
```

### `GET /coupons` (Admin)
List all coupons
```json
Response: 200
{
  "coupons": [...]
}
```

### `POST /coupons` (Admin)
Create coupon
```json
Request:
{
  "code": "NEWYEAR2024",
  "discount_type": "percentage",
  "discount_value": 25,
  "max_uses": 100,
  "valid_from": "2024-01-01T00:00:00Z",
  "valid_until": "2024-01-31T23:59:59Z",
  "product_ids": ["uuid1", "uuid2"]
}

Response: 201
{
  "coupon": {...}
}
```

---

## 12. ORGANIZATIONS (B2B)

### `GET /organizations`
List organizations in school (admin only)
```json
Response: 200
{
  "organizations": [
    {
      "id": "uuid",
      "name": "Acme Corp",
      "members_count": 45,
      "seats_total": 50,
      "seats_used": 42,
      "status": "active"
    }
  ]
}
```

### `POST /organizations`
Create organization (admin only)
```json
Request:
{
  "name": "Acme Corp",
  "slug": "acme-corp",
  "contact_email": "admin@acme.com"
}

Response: 201
{
  "organization": {...}
}
```

### `GET /organizations/{org_id}`
Get organization details
```json
Response: 200
{
  "id": "uuid",
  "name": "Acme Corp",
  "slug": "acme-corp",
  "members_count": 45,
  "seats": [
    {
      "product": {...},
      "seats_purchased": 50,
      "seats_used": 42,
      "expires_at": "2024-12-31T23:59:59Z"
    }
  ]
}
```

### `POST /organizations/{org_id}/purchase-seats`
Purchase seats for organization
```json
Request:
{
  "product_id": "uuid",
  "seats": 50,
  "expires_at": "2024-12-31T23:59:59Z"
}

Response: 201
{
  "seat_purchase": {...},
  "order": {...}
}
```

### `POST /organizations/{org_id}/members`
Add member to organization
```json
Request:
{
  "email": "user@acme.com",
  "first_name": "Jane",
  "last_name": "Doe",
  "send_invite": true
}

Response: 201
{
  "member": {...}
}
```

### `DELETE /organizations/{org_id}/members/{user_id}`
Remove member from organization
```json
Response: 204
```

### `POST /organizations/{org_id}/assign-course`
Assign course to org member
```json
Request:
{
  "user_id": "uuid",
  "product_id": "uuid",
  "seat_purchase_id": "uuid"
}

Response: 201
{
  "enrollment": {...}
}
```

### `GET /organizations/{org_id}/analytics`
Get organization analytics (org admin only)
```json
Response: 200
{
  "members_count": 45,
  "active_members": 38,
  "total_enrollments": 120,
  "completion_rate": 65.5,
  "avg_progress": 48.2,
  "top_courses": [...]
}
```

---

## 13. COMMUNITY

### `GET /community/spaces`
List community spaces
```json
Response: 200
{
  "spaces": [
    {
      "id": "uuid",
      "name": "General Discussion",
      "slug": "general",
      "channels_count": 5,
      "posts_count": 342
    }
  ]
}
```

### `GET /community/spaces/{space_id}/channels`
List channels in space
```json
Response: 200
{
  "channels": [
    {
      "id": "uuid",
      "name": "Announcements",
      "slug": "announcements",
      "posts_count": 15
    }
  ]
}
```

### `GET /community/channels/{channel_id}/posts`
List posts in channel
```json
Query params: ?page=1&limit=20&sort=latest

Response: 200
{
  "posts": [
    {
      "id": "uuid",
      "user": {...},
      "title": "Welcome!",
      "content": "...",
      "post_type": "text",
      "is_pinned": true,
      "likes_count": 25,
      "comments_count": 12,
      "created_at": "2024-01-20T10:00:00Z"
    }
  ],
  "pagination": {...}
}
```

### `POST /community/channels/{channel_id}/posts`
Create post
```json
Request:
{
  "title": "Question about React",
  "content": "How do I...",
  "post_type": "text"
}

Response: 201
{
  "post": {...}
}
```

### `GET /community/posts/{post_id}`
Get post with replies
```json
Response: 200
{
  "post": {...},
  "replies": [
    {
      "id": "uuid",
      "user": {...},
      "content": "Here's the answer...",
      "likes_count": 5,
      "created_at": "2024-01-20T11:00:00Z"
    }
  ]
}
```

### `POST /community/posts/{post_id}/reply`
Reply to post
```json
Request:
{
  "content": "Great question! ..."
}

Response: 201
{
  "reply": {...}
}
```

### `POST /community/posts/{post_id}/like`
Like/unlike post
```json
Response: 200
{
  "liked": true,
  "likes_count": 26
}
```

### `POST /community/posts/{post_id}/pin` (Moderator)
Pin/unpin post
```json
Response: 200
{
  "post": {
    "is_pinned": true
  }
}
```

### `POST /community/posts/{post_id}/lock` (Moderator)
Lock/unlock post
```json
Response: 200
{
  "post": {
    "is_locked": true
  }
}
```

### `POST /community/posts/{post_id}/report`
Report post
```json
Request:
{
  "reason": "spam",
  "details": "..."
}

Response: 201
{
  "report": {...}
}
```

---

## 14. SITE BUILDER

### `GET /pages`
List pages (admin only)
```json
Response: 200
{
  "pages": [
    {
      "id": "uuid",
      "title": "Home",
      "slug": "home",
      "page_type": "home",
      "is_published": true,
      "updated_at": "2024-01-20T10:00:00Z"
    }
  ]
}
```

### `GET /pages/{page_id}`
Get page with content
```json
Response: 200
{
  "id": "uuid",
  "title": "Home",
  "slug": "home",
  "content": {
    "blocks": [
      {
        "type": "hero",
        "data": {
          "title": "Welcome",
          "subtitle": "...",
          "image_url": "https://...",
          "cta_text": "Get Started",
          "cta_url": "/courses"
        }
      }
    ]
  },
  "seo_title": "...",
  "seo_description": "..."
}
```

### `POST /pages`
Create page (admin only)
```json
Request:
{
  "title": "About Us",
  "slug": "about",
  "page_type": "custom",
  "content": {...}
}

Response: 201
{
  "page": {...}
}
```

### `PATCH /pages/{page_id}`
Update page
```json
Request:
{
  "title": "About Our School",
  "content": {...}
}

Response: 200
{
  "page": {...}
}
```

### `GET /themes`
Get active theme
```json
Response: 200
{
  "theme": {
    "id": "uuid",
    "name": "Default Theme",
    "primary_color": "#000000",
    "secondary_color": "#FFFFFF",
    "font_heading": "Inter",
    "font_body": "Inter",
    "settings": {...}
  }
}
```

### `PATCH /themes/{theme_id}`
Update theme (admin only)
```json
Request:
{
  "primary_color": "#FF5733",
  "font_heading": "Poppins"
}

Response: 200
{
  "theme": {...}
}
```

### `GET /navigation-menus`
Get navigation menus
```json
Response: 200
{
  "menus": [
    {
      "name": "header",
      "items": [
        {
          "label": "Courses",
          "url": "/courses",
          "children": [...]
        }
      ]
    }
  ]
}
```

### `PATCH /navigation-menus/{menu_name}`
Update navigation menu (admin only)
```json
Request:
{
  "items": [...]
}

Response: 200
{
  "menu": {...}
}
```

---

## 15. AUTOMATIONS

### `GET /automation-rules`
List automation rules (admin only)
```json
Response: 200
{
  "rules": [
    {
      "id": "uuid",
      "name": "Welcome Email",
      "trigger_type": "enrollment",
      "is_active": true
    }
  ]
}
```

### `POST /automation-rules`
Create automation rule
```json
Request:
{
  "name": "Course Completion Email",
  "trigger_type": "completion",
  "trigger_config": {
    "product_ids": ["uuid1"]
  },
  "actions": [
    {
      "type": "send_email",
      "config": {
        "template_id": "uuid",
        "delay_minutes": 0
      }
    },
    {
      "type": "issue_certificate",
      "config": {}
    }
  ],
  "is_active": true
}

Response: 201
{
  "rule": {...}
}
```

### `PATCH /automation-rules/{rule_id}`
Update automation rule
```json
Request:
{
  "is_active": false
}

Response: 200
{
  "rule": {...}
}
```

---

## 16. MEDIA LIBRARY

### `GET /media`
List media files (admin only)
```json
Query params: ?page=1&limit=20&type=image&search=logo

Response: 200
{
  "files": [
    {
      "id": "uuid",
      "file_name": "logo.png",
      "file_type": "image",
      "file_size_bytes": 45678,
      "storage_url": "https://...",
      "cdn_url": "https://...",
      "thumbnail_url": "https://...",
      "uploaded_at": "2024-01-20T10:00:00Z"
    }
  ],
  "pagination": {...}
}
```

### `POST /media/upload`
Upload media file
```json
Request: multipart/form-data
{
  file: <binary>
}

Response: 201
{
  "file": {
    "id": "uuid",
    "file_name": "image.jpg",
    "storage_url": "https://...",
    "cdn_url": "https://..."
  }
}
```

### `DELETE /media/{file_id}`
Delete media file
```json
Response: 204
```

---

## 17. NOTIFICATIONS

### `GET /notifications`
List user's notifications
```json
Query params: ?page=1&limit=20&unread=true

Response: 200
{
  "notifications": [
    {
      "id": "uuid",
      "type": "lesson_unlocked",
      "title": "New lesson available",
      "message": "Module 2 is now available",
      "action_url": "/courses/react/module-2",
      "is_read": false,
      "created_at": "2024-01-20T10:00:00Z"
    }
  ],
  "unread_count": 5,
  "pagination": {...}
}
```

### `PATCH /notifications/{notification_id}/read`
Mark notification as read
```json
Response: 200
{
  "notification": {
    "is_read": true
  }
}
```

### `POST /notifications/mark-all-read`
Mark all notifications as read
```json
Response: 200
{
  "message": "All notifications marked as read"
}
```

### `GET /notification-preferences`
Get notification preferences
```json
Response: 200
{
  "preferences": [
    {
      "notification_type": "lesson_unlocked",
      "channel_email": true,
      "channel_in_app": true
    }
  ]
}
```

### `PATCH /notification-preferences`
Update notification preferences
```json
Request:
{
  "preferences": [
    {
      "notification_type": "lesson_unlocked",
      "channel_email": false
    }
  ]
}

Response: 200
{
  "preferences": [...]
}
```

---

## 18. ANALYTICS

### `GET /analytics/dashboard`
Get dashboard analytics
```json
Query params: ?from=2024-01-01&to=2024-01-31

Response: 200
{
  "period": {...},
  "overview": {
    "revenue": 15000.00,
    "enrollments": 450,
    "active_users": 342,
    "completion_rate": 68.5
  },
  "revenue_chart": [...],
  "enrollments_chart": [...],
  "top_products": [...],
  "recent_orders": [...]
}
```

### `GET /analytics/revenue`
Get revenue analytics (admin only)
```json
Query params: ?from=2024-01-01&to=2024-01-31&group_by=day

Response: 200
{
  "total_revenue": 15000.00,
  "currency": "USD",
  "growth": 12.5,
  "chart_data": [
    {
      "date": "2024-01-01",
      "revenue": 500.00
    }
  ],
  "by_product": [...]
}
```

### `GET /analytics/learners`
Get learner analytics
```json
Response: 200
{
  "total_learners": 1250,
  "active_learners": 842,
  "new_learners": 125,
  "engagement": {
    "avg_session_duration": 1800,
    "avg_lessons_per_week": 3.5
  }
}
```

---

## 19. WEBHOOKS (Outgoing)

### `GET /webhooks`
List webhooks (admin only)
```json
Response: 200
{
  "webhooks": [
    {
      "id": "uuid",
      "url": "https://app.com/webhook",
      "events": ["enrollment_created", "purchase_completed"],
      "is_active": true
    }
  ]
}
```

### `POST /webhooks`
Create webhook
```json
Request:
{
  "url": "https://app.com/webhook",
  "events": ["enrollment_created"],
  "secret": "webhook_secret_123"
}

Response: 201
{
  "webhook": {...}
}
```

### `GET /webhooks/{webhook_id}/deliveries`
List webhook deliveries
```json
Response: 200
{
  "deliveries": [
    {
      "id": "uuid",
      "event_type": "enrollment_created",
      "response_status": 200,
      "delivered_at": "2024-01-20T10:00:00Z"
    }
  ]
}
```

---

## 20. SEARCH

### `GET /search`
Global search
```json
Query params: ?q=react&types=products,lessons&limit=20

Response: 200
{
  "results": {
    "products": [
      {
        "id": "uuid",
        "type": "product",
        "name": "Advanced React",
        "thumbnail_url": "https://...",
        "url": "/courses/advanced-react"
      }
    ],
    "lessons": [...]
  },
  "total_results": 25
}
```

---

## 21. AFFILIATES

### `GET /affiliates/dashboard`
Get affiliate dashboard (affiliate only)
```json
Response: 200
{
  "affiliate": {
    "id": "uuid",
    "affiliate_code": "JOHN123",
    "referral_url": "https://school.com?ref=JOHN123",
    "commission_rate": 10.00
  },
  "stats": {
    "total_clicks": 250,
    "total_conversions": 15,
    "total_revenue": 2985.00,
    "total_commission": 298.50,
    "pending_commission": 150.00,
    "paid_commission": 148.50
  },
  "recent_conversions": [...]
}
```

### `GET /affiliates/commissions`
List affiliate commissions
```json
Response: 200
{
  "commissions": [
    {
      "id": "uuid",
      "order": {...},
      "amount": 19.90,
      "commission_rate": 10.00,
      "status": "approved",
      "created_at": "2024-01-20T10:00:00Z"
    }
  ]
}
```

### `POST /affiliates/payout-request`
Request payout
```json
Request:
{
  "amount": 298.50,
  "payment_method": "paypal",
  "payment_details": {
    "paypal_email": "affiliate@example.com"
  }
}

Response: 201
{
  "payout_request": {...}
}
```

---

## ERROR RESPONSES

All errors follow this format:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Email is required"
      }
    ]
  }
}
```

**Common HTTP Status Codes:**
- 400 Bad Request - Validation errors
- 401 Unauthorized - Missing/invalid token
- 403 Forbidden - Insufficient permissions
- 404 Not Found - Resource not found
- 409 Conflict - Resource already exists
- 422 Unprocessable Entity - Business logic error
- 429 Too Many Requests - Rate limit exceeded
- 500 Internal Server Error - Server error

---

## PAGINATION

Standard pagination format:
```json
{
  "data": [...],
  "pagination": {
    "total": 342,
    "page": 1,
    "limit": 20,
    "pages": 18,
    "has_next": true,
    "has_prev": false
  }
}
```

---

## WEBHOOKS (Incoming from Stripe)

### `POST /webhooks/stripe`
Stripe webhook handler
```json
Headers:
{
  "stripe-signature": "..."
}

Events handled:
- payment_intent.succeeded
- payment_intent.payment_failed
- customer.subscription.created
- customer.subscription.updated
- customer.subscription.deleted
- invoice.paid
- invoice.payment_failed
```

---

This API design provides:
✅ Complete CRUD for all resources
✅ Proper authentication & authorization
✅ Pagination & search
✅ File uploads
✅ Webhook integrations
✅ Analytics endpoints
✅ Multi-tenant isolation
✅ RBAC enforcement
✅ Standard error handling
