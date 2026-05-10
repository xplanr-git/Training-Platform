# Outdure Edge - Technical Architecture

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Web App     │  │  Mobile App  │  │  Admin Panel │          │
│  │  (React)     │  │  (Phase 3)   │  │  (React)     │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         CDN LAYER                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  CloudFlare  │  │  Static      │  │  Media       │          │
│  │  (SSL/WAF)   │  │  Assets      │  │  Files       │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      APPLICATION LAYER                          │
│  ┌──────────────────────────────────────────────────────┐       │
│  │          Next.js Application (SSR + API Routes)      │       │
│  │  ┌──────────────┐  ┌──────────────┐  ┌───────────┐ │       │
│  │  │  Pages/      │  │  API Routes  │  │  Middleware│ │       │
│  │  │  Components  │  │  /api/*      │  │  (Auth)    │ │       │
│  │  └──────────────┘  └──────────────┘  └───────────┘ │       │
│  └──────────────────────────────────────────────────────┘       │
│                                                                  │
│  ┌──────────────────────────────────────────────────────┐       │
│  │          NestJS Backend API (Microservices)          │       │
│  │  ┌──────────────┐  ┌──────────────┐  ┌───────────┐ │       │
│  │  │  Auth        │  │  Courses     │  │  Commerce │ │       │
│  │  │  Service     │  │  Service     │  │  Service  │ │       │
│  │  └──────────────┘  └──────────────┘  └───────────┘ │       │
│  │  ┌──────────────┐  ┌──────────────┐  ┌───────────┐ │       │
│  │  │  Community   │  │  Analytics   │  │  Notify   │ │       │
│  │  │  Service     │  │  Service     │  │  Service  │ │       │
│  │  └──────────────┘  └──────────────┘  └───────────┘ │       │
│  └──────────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         CACHE LAYER                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Redis       │  │  Redis       │  │  Redis       │          │
│  │  (Session)   │  │  (Cache)     │  │  (Queue)     │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      DATA LAYER                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  PostgreSQL  │  │  PostgreSQL  │  │  Elasticsearch│          │
│  │  (Primary)   │  │  (Replica)   │  │  (Search)     │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      STORAGE LAYER                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  S3          │  │  S3          │  │  Cloudflare  │          │
│  │  (Media)     │  │  (Backups)   │  │  Stream      │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   BACKGROUND WORKERS                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Email       │  │  Video       │  │  Analytics   │          │
│  │  Worker      │  │  Transcoding │  │  Aggregation │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│  ┌──────────────┐  ┌──────────────┐                            │
│  │  Certificate │  │  Automation  │                            │
│  │  Generator   │  │  Engine      │                            │
│  └──────────────┘  └──────────────┘                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   EXTERNAL SERVICES                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Stripe      │  │  SendGrid    │  │  Zoom        │          │
│  │  (Payments)  │  │  (Email)     │  │  (Video)     │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Cloudflare  │  │  Vercel      │  │  DataDog     │          │
│  │  (DNS/CDN)   │  │  (Hosting)   │  │  (Monitoring)│          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

### Frontend
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **UI Library**: React 18+
- **Styling**: Tailwind CSS v4
- **State Management**: Zustand / React Query (TanStack Query)
- **Forms**: React Hook Form + Zod validation
- **Video Player**: Video.js or Plyr.js
- **Charts**: Recharts
- **Rich Text Editor**: TipTap or Lexical
- **Drag & Drop**: dnd-kit
- **Animation**: Framer Motion
- **HTTP Client**: Axios with interceptors

### Backend
- **Framework**: NestJS (Node.js)
- **Language**: TypeScript
- **Architecture**: Modular monolith with microservices-ready structure
- **API Style**: RESTful + GraphQL (optional for complex queries)
- **Authentication**: JWT + Refresh Tokens
- **Authorization**: CASL (attribute-based access control)
- **Validation**: class-validator + class-transformer
- **ORM**: Prisma or TypeORM
- **Queue**: BullMQ (Redis-based)
- **Real-time**: Socket.io (for live sessions, notifications)

### Database
- **Primary**: PostgreSQL 15+
- **Replica**: Read replicas for analytics queries
- **Extensions**: pgcrypto, uuid-ossp, pg_trgm (for full-text search)
- **Connection Pooling**: PgBouncer

### Cache & Queue
- **Redis**: 
  - Session storage
  - Application cache (course structures, user permissions)
  - Rate limiting
  - Queue (BullMQ)
  - Pub/Sub (real-time notifications)

### Search
- **Elasticsearch** or **Typesense**: 
  - Course catalog search
  - Lesson content search
  - Community search
  - Transcript search

### Storage
- **S3-compatible**: AWS S3 or DigitalOcean Spaces
  - Media files (images, documents, raw videos)
  - Backups
  - Certificate PDFs
  - User uploads
- **CDN**: CloudFlare CDN for static assets and media delivery
- **Video Streaming**: 
  - CloudFlare Stream (MVP) or AWS Media Services (phase 2)
  - Adaptive bitrate streaming (HLS)
  - Thumbnail generation
  - Automatic transcription

### Background Jobs
- **Queue System**: BullMQ
- **Workers**:
  - Email sending
  - Video transcoding callbacks
  - Certificate PDF generation
  - Analytics aggregation (daily stats)
  - Automation engine execution
  - Drip content scheduler

### External Services

#### Payments
- **Stripe**: Payment processing, subscriptions, invoices
- **Stripe Connect**: For marketplace features (phase 3)
- **Stripe Tax**: Automated tax calculation (phase 2)

#### Email
- **SendGrid** or **Amazon SES**: Transactional emails
- **MJML**: Email template engine
- **Unsubscribe Management**: Built-in

#### Video Conferencing
- **Zoom**: Live sessions (OAuth integration)
- **Google Meet**: Alternative (OAuth integration)
- **Microsoft Teams**: Enterprise option (phase 2)

#### SSL & CDN
- **CloudFlare**: 
  - DNS management
  - SSL/TLS certificates
  - DDoS protection
  - WAF (Web Application Firewall)
  - CDN for global delivery

#### Monitoring & Logging
- **DataDog** or **New Relic**: Application performance monitoring
- **Sentry**: Error tracking
- **LogDNA** or **CloudWatch Logs**: Centralized logging
- **Prometheus + Grafana**: Infrastructure monitoring (self-hosted option)

#### Analytics
- **Google Analytics**: Page tracking (optional, privacy-compliant)
- **Plausible** or **Fathom**: Privacy-friendly analytics alternative
- **Custom Analytics**: In-database event tracking

---

## Architecture Patterns

### Multi-Tenancy Implementation

**Strategy**: Shared database with tenant isolation

```typescript
// Middleware: Tenant Context
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Extract tenant from subdomain or custom domain
    const host = req.hostname;
    const tenant = await this.tenantService.findByDomain(host);
    
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }
    
    // Set tenant context for request
    req['tenant'] = tenant;
    next();
  }
}

// Prisma: Tenant Isolation
export class BaseRepository {
  constructor(private prisma: PrismaService) {}
  
  async findAll(tenantId: string) {
    return this.prisma.courses.findMany({
      where: { tenantId }
    });
  }
}

// Row-Level Security (RLS) in PostgreSQL
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON courses
  USING (tenant_id = current_setting('app.current_tenant')::uuid);
```

### Authentication Flow

```
1. User Login
   ↓
2. Validate Credentials (email + password hash)
   ↓
3. Generate Access Token (JWT, 15min expiry)
   ↓
4. Generate Refresh Token (secure, 7 days expiry)
   ↓
5. Set HTTP-only Cookie (refresh token)
   ↓
6. Return Access Token (response body)

Refresh Flow:
1. Access Token Expired
   ↓
2. Send Refresh Token (from cookie)
   ↓
3. Validate Refresh Token
   ↓
4. Generate New Access Token
   ↓
5. Return New Access Token
```

### Authorization Model (RBAC + ABAC)

```typescript
// Permission Check Decorator
@UseGuards(PermissionsGuard)
@RequirePermissions('courses.create')
export async createCourse() { ... }

// CASL Ability Definition
defineAbilitiesFor(user: User) {
  const { can, cannot, build } = new AbilityBuilder(Ability);
  
  if (user.role === 'owner') {
    can('manage', 'all');
  }
  
  if (user.role === 'instructor') {
    can('create', 'Course');
    can('manage', 'Course', { instructorId: user.id });
    cannot('delete', 'Course').because('Only owners can delete courses');
  }
  
  if (user.role === 'learner') {
    can('read', 'Course', { status: 'published' });
    can('read', 'Lesson', { courseId: { $in: user.enrolledCourseIds } });
  }
  
  return build();
}
```

### API Rate Limiting

```typescript
// Redis-based rate limiter
@UseGuards(RateLimitGuard)
@RateLimit({ points: 100, duration: 60 }) // 100 requests per minute
export async getCourses() { ... }

// Implement with 'rate-limiter-flexible' package
const rateLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: 'rate_limit',
  points: 100,
  duration: 60,
});
```

### Caching Strategy

**Cache Layers**:
1. **CDN Cache**: Static assets, images, videos (long TTL)
2. **Application Cache**: Course structures, user permissions (medium TTL)
3. **Database Cache**: Query results (short TTL)

```typescript
// Cache-Aside Pattern
@Injectable()
export class CourseService {
  async getCourse(id: string, tenantId: string) {
    const cacheKey = `course:${tenantId}:${id}`;
    
    // Check cache
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);
    
    // Fetch from database
    const course = await this.prisma.course.findUnique({
      where: { id, tenantId },
      include: { modules: true, lessons: true }
    });
    
    // Set cache (TTL: 5 minutes)
    await this.redis.setex(cacheKey, 300, JSON.stringify(course));
    
    return course;
  }
  
  async updateCourse(id: string, data: any) {
    // Update database
    const course = await this.prisma.course.update({ where: { id }, data });
    
    // Invalidate cache
    await this.redis.del(`course:${course.tenantId}:${id}`);
    
    return course;
  }
}
```

### Media Upload & Processing

```typescript
// Upload Flow
1. Client requests signed URL from backend
   POST /api/media/upload-url
   Body: { filename, fileType, fileSize }
   ↓
2. Backend generates signed S3 URL (presigned PUT)
   Returns: { uploadUrl, fileKey, expiresAt }
   ↓
3. Client uploads file directly to S3 (no backend load)
   PUT https://s3.amazonaws.com/bucket/fileKey
   ↓
4. Client notifies backend of upload completion
   POST /api/media/confirm-upload
   Body: { fileKey, fileUrl }
   ↓
5. Backend creates media record in database
   (for videos, enqueue transcoding job)

// Video Transcoding
@Processor('video')
export class VideoProcessor {
  @Process('transcode')
  async transcode(job: Job) {
    const { fileKey } = job.data;
    
    // Use CloudFlare Stream API or AWS MediaConvert
    await this.videoService.transcode(fileKey, {
      formats: ['720p', '1080p'],
      generateThumbnails: true,
      generateTranscript: true
    });
    
    // Update database with processed video URLs
    await this.mediaService.updateVideoStatus(fileKey, 'ready');
  }
}
```

### Real-Time Features (Socket.io)

```typescript
// Live Session Example
@WebSocketGateway({ namespace: '/live-session' })
export class LiveSessionGateway {
  @SubscribeMessage('join-session')
  async handleJoinSession(
    @ConnectedSocket() client: Socket,
    @MessageBody() { sessionId }: { sessionId: string }
  ) {
    // Authenticate user
    const user = await this.authService.validateSocketToken(client.handshake.auth.token);
    
    // Join room
    client.join(`session:${sessionId}`);
    
    // Track attendance
    await this.sessionService.recordAttendance(sessionId, user.id, 'joined');
    
    // Notify others
    this.server.to(`session:${sessionId}`).emit('user-joined', { userId: user.id, name: user.name });
  }
  
  @SubscribeMessage('send-message')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() { sessionId, message }: any
  ) {
    const user = client.data.user;
    
    // Broadcast message to session
    this.server.to(`session:${sessionId}`).emit('new-message', {
      userId: user.id,
      name: user.name,
      message,
      timestamp: new Date()
    });
  }
}
```

### Background Jobs (BullMQ)

```typescript
// Email Queue
@Injectable()
export class EmailService {
  constructor(
    @InjectQueue('email') private emailQueue: Queue
  ) {}
  
  async sendWelcomeEmail(user: User, tenant: Tenant) {
    await this.emailQueue.add('welcome', {
      to: user.email,
      tenantId: tenant.id,
      userId: user.id,
      template: 'welcome',
      data: { firstName: user.firstName, schoolName: tenant.name }
    }, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 }
    });
  }
}

@Processor('email')
export class EmailProcessor {
  @Process('welcome')
  async processWelcome(job: Job) {
    const { to, template, data } = job.data;
    
    // Render template
    const html = await this.templateEngine.render(template, data);
    
    // Send via SendGrid
    await this.sendgrid.send({
      to,
      from: 'noreply@outdureedge.com',
      subject: 'Welcome to Outdure Edge',
      html
    });
  }
}
```

### Event-Driven Architecture

```typescript
// Event Emitter Pattern
@Injectable()
export class CourseService {
  constructor(private eventEmitter: EventEmitter2) {}
  
  async enrollUser(courseId: string, userId: string) {
    const enrollment = await this.enrollmentRepository.create({ courseId, userId });
    
    // Emit event
    this.eventEmitter.emit('course.enrolled', {
      courseId,
      userId,
      enrollmentId: enrollment.id,
      enrolledAt: new Date()
    });
    
    return enrollment;
  }
}

// Event Listeners
@Injectable()
export class CourseEventsListener {
  @OnEvent('course.enrolled')
  async handleCourseEnrolled(payload: CourseEnrolledEvent) {
    // Send welcome email
    await this.emailService.sendCourseWelcome(payload.userId, payload.courseId);
    
    // Create notification
    await this.notificationService.create({
      userId: payload.userId,
      type: 'course_enrolled',
      title: 'Welcome to the course!',
      message: 'You have been enrolled in a new course.'
    });
    
    // Trigger automations
    await this.automationEngine.trigger('course.enrolled', payload);
    
    // Track analytics
    await this.analyticsService.trackEvent('course_enrolled', payload);
  }
}
```

### Automation Engine

```typescript
@Injectable()
export class AutomationEngine {
  async trigger(eventType: string, context: any) {
    // Find active automations for this event
    const automations = await this.automationRepository.findActive(eventType);
    
    for (const automation of automations) {
      // Check conditions
      if (!this.evaluateConditions(automation.conditions, context)) {
        continue;
      }
      
      // Execute actions
      for (const action of automation.actions) {
        await this.executeAction(action, context);
      }
      
      // Log run
      await this.automationRunRepository.create({
        automationId: automation.id,
        userId: context.userId,
        status: 'completed'
      });
    }
  }
  
  private async executeAction(action: any, context: any) {
    switch (action.type) {
      case 'send_email':
        await this.emailService.send(action.templateId, context.userId);
        break;
      case 'add_tag':
        await this.userTagService.add(context.userId, action.tag);
        break;
      case 'grant_access':
        await this.enrollmentService.create(context.userId, action.courseId);
        break;
      case 'webhook':
        await this.webhookService.send(action.url, context);
        break;
    }
  }
}
```

### Analytics Aggregation

```typescript
// Daily Stats Aggregation (Cron Job)
@Injectable()
export class AnalyticsAggregator {
  @Cron('0 1 * * *') // Run at 1 AM daily
  async aggregateDailyStats() {
    const yesterday = subDays(new Date(), 1);
    
    // Aggregate revenue per tenant
    const revenueStats = await this.orderRepository.aggregate({
      where: { createdAt: { gte: startOfDay(yesterday), lte: endOfDay(yesterday) } },
      groupBy: ['tenantId'],
      _sum: { total: true },
      _count: true
    });
    
    for (const stat of revenueStats) {
      await this.dailyStatsRepository.create({
        tenantId: stat.tenantId,
        statDate: yesterday,
        metricType: 'revenue',
        metricValue: stat._sum.total
      });
    }
    
    // Similar aggregations for enrollments, completions, active users, etc.
  }
}
```

---

## Security

### Data Encryption
- **At Rest**: Database encryption (AWS RDS encryption, S3 server-side encryption)
- **In Transit**: TLS 1.3 for all connections
- **Application**: Encrypt sensitive fields (API keys, credentials) with AES-256

### Authentication Security
- **Password**: bcrypt with salt rounds = 12
- **JWT**: HS256 or RS256, short expiry (15 min)
- **Refresh Token**: Stored in HTTP-only, Secure, SameSite cookies
- **MFA**: TOTP-based (Google Authenticator) for admin accounts (phase 2)

### API Security
- **Rate Limiting**: 100 req/min per IP (public), 1000 req/min per API key (authenticated)
- **CORS**: Whitelist allowed origins per tenant
- **CSRF Protection**: Double-submit cookie pattern
- **Input Validation**: All inputs validated with class-validator
- **SQL Injection Prevention**: Parameterized queries (Prisma ORM)
- **XSS Prevention**: Sanitize user inputs, Content-Security-Policy headers

### Authorization
- **RBAC**: Role-based access control with granular permissions
- **ABAC**: Attribute-based (owner, tenant, scope)
- **API Keys**: Scoped permissions, revocable

### Audit Logging
- Log all admin actions (user created, course published, etc.)
- Log authentication events (login, logout, failed attempts)
- Log permission changes
- Retention: 1 year

### Compliance
- **GDPR**: 
  - User data export (JSON)
  - Right to be forgotten (anonymize or delete)
  - Consent tracking for marketing emails
  - Data processing agreements
- **PCI DSS**: Use Stripe for payment processing (PCI-compliant)
- **COPPA**: Age verification for users under 13 (if applicable)

---

## Performance

### Optimization Strategies

#### Frontend
- **Code Splitting**: Dynamic imports for routes and heavy components
- **Image Optimization**: Next.js Image component (WebP, lazy loading, responsive)
- **Bundle Size**: Keep main bundle < 200KB gzipped
- **Lazy Loading**: Load below-the-fold content on scroll
- **Prefetching**: Prefetch critical routes on hover

#### Backend
- **Database Queries**:
  - Use indexes on all foreign keys and frequently queried columns
  - Avoid N+1 queries (use eager loading)
  - Use pagination (limit 50 items per page)
  - Use database views for complex reports
- **Caching**:
  - Cache course structures (5 min TTL)
  - Cache user permissions (10 min TTL)
  - Cache aggregated analytics (1 hour TTL)
- **Connection Pooling**: Max 100 connections per instance

#### Video Delivery
- **Adaptive Bitrate**: HLS with 360p, 720p, 1080p variants
- **CDN**: Serve videos from CloudFlare CDN (global edge locations)
- **Preloading**: Preload first 30 seconds for instant playback
- **Thumbnail Sprites**: For video scrubbing

### Performance Targets
- **TTFB**: < 200ms (p95)
- **Page Load**: < 2s (p95)
- **API Response**: < 500ms (p95)
- **Video Start**: < 3s (p95)
- **Search Query**: < 200ms (p95)

---

## Scalability

### Horizontal Scaling
- **Application**: Stateless servers, auto-scale based on CPU/memory
- **Database**: Read replicas for analytics queries
- **Redis**: Redis Cluster for high availability
- **Queue Workers**: Scale workers independently based on queue depth

### Database Scaling
- **Partitioning**: Partition analytics_events by month
- **Archiving**: Move old data to cold storage (S3) after 90 days
- **Indexing**: Regular index maintenance, analyze query performance

### CDN & Caching
- **CloudFlare**: Global CDN with edge caching
- **Cache TTL**: 
  - Static assets: 1 year
  - Media files: 1 month
  - API responses (GET): 5 minutes

### Load Balancing
- **Application Load Balancer**: Distribute traffic across multiple instances
- **Health Checks**: Automatic removal of unhealthy instances
- **Session Affinity**: Not required (stateless JWT auth)

---

## Monitoring & Observability

### Application Monitoring
- **APM**: DataDog or New Relic
  - Request/response times
  - Error rates
  - Database query performance
  - External API latency

### Error Tracking
- **Sentry**: Real-time error alerts with stack traces
- **Error Budget**: 99.9% uptime SLA

### Logging
- **Structured Logging**: JSON format with context (tenant, user, request ID)
- **Log Levels**: ERROR, WARN, INFO, DEBUG
- **Centralized**: CloudWatch Logs or LogDNA
- **Retention**: 30 days

### Metrics
- **System**: CPU, memory, disk, network
- **Application**: Requests/sec, error rate, latency
- **Business**: Revenue, signups, enrollments, completions

### Alerting
- **Critical**: 
  - API error rate > 5%
  - Response time > 2s (p95)
  - Database connection pool exhausted
- **Warning**:
  - Disk usage > 80%
  - Queue depth > 1000
  - Failed jobs > 10/hour

---

## Disaster Recovery

### Backups
- **Database**: Daily automated backups (retention: 30 days)
- **Media Files**: S3 versioning enabled
- **Point-in-Time Recovery**: 7 days

### High Availability
- **Multi-AZ Deployment**: Database and application in multiple availability zones
- **Automatic Failover**: RDS automatic failover (< 1 min)
- **Redis**: Redis Cluster with replication

### Incident Response
1. **Detection**: Automated alerts trigger incident
2. **Assessment**: On-call engineer evaluates severity
3. **Mitigation**: Execute runbook, rollback if needed
4. **Communication**: Status page updates, customer notifications
5. **Post-Mortem**: Root cause analysis, preventive measures

---

## Development & Deployment

### CI/CD Pipeline
```
1. Code Push (Git)
   ↓
2. Run Tests (Unit, Integration, E2E)
   ↓
3. Build Docker Images
   ↓
4. Push to Container Registry
   ↓
5. Deploy to Staging (Auto)
   ↓
6. Run Smoke Tests
   ↓
7. Manual Approval
   ↓
8. Deploy to Production (Blue-Green)
   ↓
9. Health Check
   ↓
10. Route Traffic (or Rollback)
```

### Environments
- **Local**: Docker Compose
- **Development**: Shared dev environment
- **Staging**: Production-like environment
- **Production**: Multi-region deployment

### Testing Strategy
- **Unit Tests**: 80%+ coverage (Jest)
- **Integration Tests**: API endpoints (Supertest)
- **E2E Tests**: Critical user flows (Playwright or Cypress)
- **Load Tests**: Simulate 1000 concurrent users (k6)
- **Security Tests**: OWASP Top 10 (OWASP ZAP)

### Database Migrations
- **Tool**: Prisma Migrate or TypeORM migrations
- **Process**: 
  1. Write migration
  2. Test on staging
  3. Review schema changes
  4. Deploy with rollback plan
  5. Run migration (zero-downtime strategy)

---

## Cost Optimization

### Infrastructure Costs (Estimated Monthly for 10K Users)
- **Compute**: $500 (AWS EC2 or DigitalOcean Droplets)
- **Database**: $300 (Managed PostgreSQL)
- **Redis**: $100 (Managed Redis)
- **Storage**: $200 (S3 + CloudFlare Stream)
- **CDN**: $100 (CloudFlare Pro)
- **Email**: $50 (SendGrid)
- **Monitoring**: $100 (DataDog)
- **Total**: ~$1,350/month

### Optimization Strategies
- **Auto-Scaling**: Scale down during off-peak hours
- **Reserved Instances**: 30% savings with 1-year commitment
- **S3 Lifecycle**: Move old media to Glacier after 6 months
- **CDN Caching**: Reduce origin requests by 90%

---

This architecture is designed for scalability, reliability, and maintainability, supporting the full LearnWorlds-style LMS platform.
