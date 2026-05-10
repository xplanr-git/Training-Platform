# Permission Model & RBAC System Design

## Overview

The platform implements a comprehensive Role-Based Access Control (RBAC) system with:
- **System Roles**: Pre-defined roles with fixed permissions
- **Custom Roles**: School-specific roles with configurable permissions
- **Scoped Permissions**: Permissions can be scoped to school, course, or organization level
- **Granular Actions**: Fine-grained control over who can do what

---

## Permission Structure

### Permission Format
```
{domain}.{action}.{resource}
```

**Examples:**
- `courses.create.*` - Can create any course
- `courses.update.own` - Can update only owned courses
- `courses.update.all` - Can update all courses
- `users.manage.all` - Can manage all users
- `analytics.view.school` - Can view school-level analytics
- `analytics.view.course` - Can view course-level analytics

---

## Permission Domains

### 1. SITE
Manage site-wide settings and branding

| Permission | Description | Who Has It |
|------------|-------------|------------|
| `site.manage.all` | Full site management | Super Admin, School Owner |
| `site.manage.theme` | Edit theme & branding | School Owner, School Admin |
| `site.manage.pages` | Edit pages | School Owner, School Admin |
| `site.manage.navigation` | Edit navigation menus | School Owner, School Admin |
| `site.manage.domain` | Manage custom domain | School Owner |
| `site.view.settings` | View site settings | All admins |

### 2. COURSES
Manage courses and curriculum

| Permission | Description | Who Has It |
|------------|-------------|------------|
| `courses.create.*` | Create any course | School Admin, Instructor |
| `courses.read.all` | View all courses | School Admin |
| `courses.read.own` | View own courses | Instructor, TA |
| `courses.read.enrolled` | View enrolled courses | Learner |
| `courses.update.all` | Edit any course | School Admin |
| `courses.update.own` | Edit own courses | Instructor |
| `courses.delete.all` | Delete any course | School Owner, School Admin |
| `courses.delete.own` | Delete own courses | Instructor |
| `courses.publish.all` | Publish any course | School Admin |
| `courses.publish.own` | Publish own courses | Instructor |
| `courses.manage.pricing` | Set pricing | School Owner, School Admin, Instructor |
| `courses.manage.instructors` | Assign instructors | School Admin |
| `courses.manage.curriculum` | Edit modules/lessons | Instructor, TA (assigned courses) |

### 3. USERS
Manage users and roles

| Permission | Description | Who Has It |
|------------|-------------|------------|
| `users.create.all` | Create/invite users | School Owner, School Admin |
| `users.read.all` | View all users | School Owner, School Admin |
| `users.read.course` | View course enrollees | Instructor (for their courses) |
| `users.read.org` | View org members | Org Manager |
| `users.update.all` | Edit any user | School Owner, School Admin |
| `users.update.self` | Edit own profile | All users |
| `users.delete.all` | Delete users | School Owner, School Admin |
| `users.manage.roles` | Assign roles | School Owner, School Admin |
| `users.manage.enrollments` | Manage enrollments | School Admin, Instructor (own courses) |
| `users.view.progress` | View user progress | School Admin, Instructor (own courses) |
| `users.export.data` | Export user data | School Owner, School Admin |

### 4. COMMERCE
Manage sales, payments, and pricing

| Permission | Description | Who Has It |
|------------|-------------|------------|
| `commerce.manage.products` | Manage product catalog | School Admin |
| `commerce.manage.pricing` | Set pricing | School Owner, School Admin |
| `commerce.manage.coupons` | Create/edit coupons | School Admin |
| `commerce.manage.orders` | View/manage orders | School Admin |
| `commerce.manage.refunds` | Process refunds | School Owner, School Admin |
| `commerce.view.revenue` | View revenue analytics | School Owner, School Admin |
| `commerce.view.own_revenue` | View own course revenue | Instructor (own courses) |
| `commerce.manage.affiliates` | Manage affiliate program | School Admin |
| `commerce.manage.payouts` | Process affiliate payouts | School Owner |

### 5. COMMUNITY
Manage community spaces and moderation

| Permission | Description | Who Has It |
|------------|-------------|------------|
| `community.create.spaces` | Create community spaces | School Admin |
| `community.manage.spaces` | Manage spaces/channels | School Admin |
| `community.post.create` | Create posts | All enrolled users |
| `community.post.reply` | Reply to posts | All enrolled users |
| `community.moderate.all` | Moderate all posts | School Admin, Moderator |
| `community.moderate.course` | Moderate course community | Instructor (own courses) |
| `community.delete.own` | Delete own posts | Post author |
| `community.delete.all` | Delete any post | School Admin, Moderator |
| `community.pin.posts` | Pin posts | School Admin, Moderator, Instructor |
| `community.lock.posts` | Lock posts | School Admin, Moderator |
| `community.view.reports` | View reported content | School Admin, Moderator |

### 6. ANALYTICS
Access analytics and reports

| Permission | Description | Who Has It |
|------------|-------------|------------|
| `analytics.view.school` | View school-level analytics | School Owner, School Admin |
| `analytics.view.course.all` | View all course analytics | School Admin |
| `analytics.view.course.own` | View own course analytics | Instructor |
| `analytics.view.org` | View org analytics | Org Manager |
| `analytics.view.revenue` | View revenue analytics | School Owner, School Admin |
| `analytics.export.all` | Export all analytics | School Owner, School Admin |
| `analytics.export.course` | Export course analytics | Instructor (own courses) |

### 7. INTEGRATIONS
Manage third-party integrations

| Permission | Description | Who Has It |
|------------|-------------|------------|
| `integrations.manage.all` | Manage all integrations | School Owner, School Admin |
| `integrations.manage.stripe` | Manage Stripe | School Owner |
| `integrations.manage.webhooks` | Manage webhooks | School Admin |
| `integrations.manage.api_keys` | Manage API keys | School Owner |
| `integrations.view.all` | View integration status | School Admin |

### 8. SUPPORT
Support and customer service

| Permission | Description | Who Has It |
|------------|-------------|------------|
| `support.view.tickets` | View support tickets | School Admin |
| `support.respond.tickets` | Respond to tickets | School Admin |
| `support.impersonate.users` | Impersonate users | Super Admin only |
| `support.view.logs` | View audit logs | School Owner, Super Admin |

### 9. ASSESSMENTS
Manage quizzes and assignments

| Permission | Description | Who Has It |
|------------|-------------|------------|
| `assessments.create.all` | Create assessments | Instructor |
| `assessments.manage.all` | Edit any assessment | School Admin |
| `assessments.manage.own` | Edit own assessments | Instructor |
| `assessments.grade.all` | Grade any submission | School Admin |
| `assessments.grade.course` | Grade course submissions | Instructor, TA (assigned) |
| `assessments.view.results.all` | View all results | School Admin |
| `assessments.view.results.own` | View own results | Learner |

### 10. CERTIFICATES
Manage certificates and badges

| Permission | Description | Who Has It |
|------------|-------------|------------|
| `certificates.manage.templates` | Edit certificate templates | School Admin |
| `certificates.issue.all` | Issue certificates manually | School Admin |
| `certificates.issue.course` | Issue for own courses | Instructor |
| `certificates.revoke.all` | Revoke certificates | School Owner, School Admin |
| `certificates.view.all` | View all certificates | School Admin |
| `certificates.view.own` | View own certificates | Learner |

### 11. ORGANIZATIONS
Manage B2B organizations

| Permission | Description | Who Has It |
|------------|-------------|------------|
| `organizations.create.all` | Create organizations | School Admin |
| `organizations.manage.all` | Manage all orgs | School Admin |
| `organizations.manage.own` | Manage own org | Org Manager |
| `organizations.view.all` | View all orgs | School Admin |
| `organizations.view.own` | View own org | Org Manager |
| `organizations.manage.members` | Manage org members | Org Manager |
| `organizations.assign.courses` | Assign courses to members | Org Manager |
| `organizations.view.analytics` | View org analytics | Org Manager |

---

## System Roles

### 1. Platform Super Admin
**Scope:** Global (all schools)
**Use Case:** Internal team managing platform

**Permissions:**
- ALL permissions across ALL schools
- `support.impersonate.users`
- `platform.manage.schools`
- `platform.view.system_analytics`
- `platform.manage.billing`
- Can access any school's admin panel

**Restrictions:**
- Cannot be assigned by school owners
- System-level role only

---

### 2. School Owner
**Scope:** School-level
**Use Case:** Business owner who created the school

**Permissions:**
- `site.*` - Full site management
- `courses.*` - Full course management
- `users.*` - Full user management
- `commerce.*` - Full commerce management
- `community.*` - Full community management
- `analytics.*` - Full analytics access
- `integrations.*` - Full integration management
- `organizations.*` - Full org management
- `assessments.*` - Full assessment management
- `certificates.*` - Full certificate management

**Special Abilities:**
- Manage billing & subscription
- Transfer ownership
- Delete school
- Access all revenue data

**Restrictions:**
- Cannot access other schools

---

### 3. School Admin
**Scope:** School-level
**Use Case:** Trusted administrator helping manage the school

**Permissions:**
Same as School Owner EXCEPT:
- Cannot manage billing
- Cannot transfer ownership
- Cannot delete school
- Cannot remove owner's access

**Granted By:** School Owner only

---

### 4. Instructor / Author
**Scope:** School-level + Course-scoped
**Use Case:** Creates and manages courses

**Permissions:**
- `courses.create.*`
- `courses.read.all` (browse catalog)
- `courses.update.own`
- `courses.delete.own`
- `courses.publish.own`
- `courses.manage.pricing` (own courses)
- `courses.manage.curriculum` (own courses)
- `users.read.course` (their enrollees)
- `users.view.progress` (their students)
- `users.manage.enrollments` (their courses)
- `assessments.create.all` (for their courses)
- `assessments.manage.own`
- `assessments.grade.course` (their courses)
- `analytics.view.course.own`
- `analytics.export.course`
- `commerce.view.own_revenue`
- `community.moderate.course` (their course community)
- `community.pin.posts` (their course)
- `certificates.issue.course`

**Cannot:**
- See other instructors' courses (unless enrolled/assigned)
- Access school-level analytics
- Manage users globally
- Change site settings
- Access billing

**Granted By:** School Owner, School Admin

---

### 5. Teaching Assistant / Grader
**Scope:** Course-scoped
**Use Case:** Helps instructor with grading and moderation

**Permissions:**
- `courses.read.own` (assigned courses)
- `users.read.course` (assigned courses)
- `users.view.progress` (assigned courses)
- `assessments.grade.course` (assigned courses)
- `community.moderate.course` (assigned courses)

**Cannot:**
- Edit course content
- Create new courses
- Publish courses
- View revenue
- Issue certificates

**Granted By:** Instructor, School Admin

---

### 6. Learner / Student
**Scope:** School-level
**Use Case:** Consumes course content

**Permissions:**
- `courses.read.enrolled`
- `users.update.self`
- `community.post.create`
- `community.post.reply`
- `community.delete.own`
- `assessments.view.results.own`
- `certificates.view.own`

**Cannot:**
- Create courses
- Access admin areas
- View other users' data
- Moderate community

**Granted By:** Automatic on enrollment

---

### 7. Organization Manager (B2B Client Admin)
**Scope:** Organization-scoped
**Use Case:** Manages company's learners and licenses

**Permissions:**
- `organizations.manage.own`
- `organizations.view.own`
- `organizations.manage.members` (their org)
- `organizations.assign.courses` (their org)
- `organizations.view.analytics` (their org)
- `users.read.org` (their org)
- `users.view.progress` (their org members)
- `commerce.manage.orders` (org purchases only)

**Cannot:**
- See other orgs
- Access school-wide data
- Manage school settings
- Create courses

**Granted By:** School Admin or auto-assigned on org creation

---

### 8. Organization Learner
**Scope:** Organization-scoped
**Use Case:** Employee learning through company account

**Permissions:**
Same as regular Learner, plus:
- Part of an organization
- Access org-assigned courses

**Granted By:** Org Manager assigns

---

### 9. Affiliate / Partner
**Scope:** School-level
**Use Case:** Promotes courses for commission

**Permissions:**
- `courses.read.all` (public catalog)
- `affiliates.view.own_dashboard`
- `affiliates.view.own_stats`
- `affiliates.request.payout`

**Cannot:**
- Access admin areas
- See other affiliates' data
- Edit courses

**Granted By:** School Admin approves affiliate application

---

### 10. Community Moderator (Custom Role Example)
**Scope:** School-level or Course-scoped
**Use Case:** Moderates community without course admin access

**Permissions:**
- `community.moderate.all` (or `community.moderate.course`)
- `community.pin.posts`
- `community.lock.posts`
- `community.delete.all`
- `community.view.reports`

**Cannot:**
- Edit courses
- Manage users
- Access analytics

**Granted By:** School Admin (custom role)

---

## Permission Inheritance & Scoping

### Hierarchy
```
Platform Super Admin (global)
  └─ School Owner (school)
      ├─ School Admin (school)
      ├─ Instructor (school + course)
      │   └─ Teaching Assistant (course)
      ├─ Organization Manager (organization)
      │   └─ Organization Learner (organization)
      ├─ Learner (school)
      └─ Affiliate (school)
```

### Scoping Rules

#### Global Scope
- Platform Super Admin only
- Access across all schools

#### School Scope
- School Owner, School Admin
- All resources within one school
- Cannot access other schools

#### Course Scope
- Instructor, Teaching Assistant
- Limited to specific courses
- Example: Instructor can only edit courses they own/are assigned

#### Organization Scope
- Organization Manager, Organization Learner
- Limited to organization's members and purchases
- Cannot see other organizations

---

## Permission Checking Flow

### 1. Authentication
```
Is user logged in?
  └─ No → 401 Unauthorized
  └─ Yes → Continue
```

### 2. School Context
```
Does user have membership in this school?
  └─ No → 403 Forbidden
  └─ Yes → Continue
```

### 3. Role Check
```
What roles does user have?
  └─ Get user_roles for this school
  └─ Load role_permissions for each role
  └─ Merge all permissions
```

### 4. Permission Check
```
Does user have required permission?
  └─ Check exact match: courses.update.all
  └─ Check wildcard: courses.*
  └─ Check domain wildcard: *.*
  └─ No match → 403 Forbidden
  └─ Match → Continue
```

### 5. Scope Check
```
Is permission scoped?
  └─ No → Allow
  └─ Yes → Check scope:
      ├─ "own": Is user the resource owner?
      ├─ "course": Is user assigned to this course?
      ├─ "org": Is user member of this org?
      └─ Match → Allow
      └─ No match → 403 Forbidden
```

### 6. Resource-Level Check
```
Additional business rules:
  ├─ Is resource published?
  ├─ Is user enrolled?
  ├─ Has access expired?
  └─ Allow or deny
```

---

## Permission Implementation Examples

### Example 1: Instructor Editing Course

**Request:** `PATCH /courses/abc123`
**User:** instructor@example.com
**Role:** Instructor

**Check:**
1. ✅ Authenticated
2. ✅ Member of school
3. ✅ Has role "Instructor"
4. ✅ Has permission `courses.update.own`
5. ✅ Scope check: Is user owner/assigned to course abc123?
   - Query: `SELECT * FROM course_instructors WHERE course_id='abc123' AND user_id='user123'`
   - Result: Found
6. ✅ **ALLOW**

---

### Example 2: Learner Trying to Delete Course

**Request:** `DELETE /courses/abc123`
**User:** learner@example.com
**Role:** Learner

**Check:**
1. ✅ Authenticated
2. ✅ Member of school
3. ✅ Has role "Learner"
4. ❌ Has permission `courses.delete.*`?
   - Learner permissions: `courses.read.enrolled` only
5. ❌ **DENY** → 403 Forbidden

---

### Example 3: Organization Manager Viewing Org Analytics

**Request:** `GET /organizations/org456/analytics`
**User:** manager@company.com
**Role:** Organization Manager (org456)

**Check:**
1. ✅ Authenticated
2. ✅ Member of school
3. ✅ Has role "Organization Manager"
4. ✅ Has permission `organizations.view.analytics`
5. ✅ Scope check: Is org456 their organization?
   - Query: `SELECT * FROM organization_memberships WHERE org_id='org456' AND user_id='user789' AND role='manager'`
   - Result: Found
6. ✅ **ALLOW**

---

### Example 4: School Admin Accessing Another School

**Request:** `GET /schools/school999/analytics`
**User:** admin@school123.com
**Role:** School Admin (school123)

**Check:**
1. ✅ Authenticated
2. ❌ Member of school999?
   - User is member of school123 only
3. ❌ **DENY** → 403 Forbidden

(Exception: Platform Super Admin can access any school)

---

## Custom Roles

Schools can create custom roles for specific needs:

### Example: "Content Reviewer"
**Use Case:** Reviews course content before publishing

**Custom Permissions:**
- `courses.read.all`
- `courses.update.all` (edit mode)
- Cannot publish or delete

**Created By:** School Admin selects from permission list

---

### Example: "Sales Manager"
**Use Case:** Manages sales, coupons, but not content

**Custom Permissions:**
- `commerce.*`
- `analytics.view.revenue`
- `users.read.all` (see customers)
- No course or content permissions

---

## Permission Migration Strategy

### Initial Setup (Seed Data)
1. Create default system roles:
   - Super Admin
   - School Owner
   - School Admin
   - Instructor
   - Teaching Assistant
   - Learner
   - Org Manager
   - Org Learner
   - Affiliate

2. Create all permissions (domains + actions + resources)

3. Map permissions to system roles

### Per-School Setup
1. On school creation:
   - Assign creator as School Owner
   - Copy system roles to school (for customization)
   - Enable role-based features per plan tier

---

## Access Control Middleware (API)

```typescript
// Pseudo-code for permission middleware

async function requirePermission(
  permission: string,
  scope?: 'own' | 'course' | 'org',
  resourceGetter?: (req) => string
) {
  return async (req, res, next) => {
    const user = req.user; // from JWT
    const schoolId = req.params.school_id || req.headers['x-school-id'];
    
    // Check school membership
    const membership = await getUserSchoolMembership(user.id, schoolId);
    if (!membership) {
      return res.status(403).json({ error: 'Not a member of this school' });
    }
    
    // Get user permissions
    const permissions = await getUserPermissions(user.id, schoolId);
    
    // Check permission
    const hasPermission = permissions.includes(permission) 
      || permissions.includes(permission.split('.').slice(0, -1).join('.') + '.*')
      || permissions.includes('*.*');
    
    if (!hasPermission) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    // Check scope
    if (scope && resourceGetter) {
      const resourceId = resourceGetter(req);
      const hasScope = await checkScope(user.id, scope, resourceId);
      if (!hasScope) {
        return res.status(403).json({ error: 'Access denied to this resource' });
      }
    }
    
    next();
  };
}

// Usage:
router.patch(
  '/courses/:course_id',
  requirePermission('courses.update.own', 'own', (req) => req.params.course_id)
);
```

---

## Audit Trail

All permission-sensitive actions are logged:

**Log Entry:**
```json
{
  "id": "uuid",
  "school_id": "uuid",
  "user_id": "uuid",
  "action": "courses.update",
  "resource_type": "course",
  "resource_id": "abc123",
  "changes": {
    "before": { "title": "Old Title" },
    "after": { "title": "New Title" }
  },
  "ip_address": "192.168.1.1",
  "user_agent": "...",
  "created_at": "2024-01-20T10:00:00Z"
}
```

**Who Can View Logs:**
- Super Admin: All logs
- School Owner: School logs
- School Admin: School logs (limited)

---

## Security Considerations

### 1. Principle of Least Privilege
- Users start with minimal permissions
- Explicitly grant permissions as needed
- Regularly audit and revoke unused permissions

### 2. Permission Caching
- Cache user permissions for 5 minutes
- Invalidate on role/permission changes
- Use Redis for distributed caching

### 3. Rate Limiting
- Stricter limits for destructive actions (delete, refund)
- Per-role rate limits

### 4. Sensitive Actions Require Re-authentication
- Billing changes
- Ownership transfer
- Mass deletions
- Require password confirmation

### 5. Impersonation Safeguards
- Only Super Admins can impersonate
- All actions logged with original admin ID
- Cannot access billing/payment methods while impersonating
- Session expires after 1 hour

---

This RBAC system provides:
✅ Granular, domain-based permissions
✅ Flexible role system (system + custom)
✅ Multi-level scoping (global, school, course, org)
✅ Clear hierarchy and inheritance
✅ Scalable for complex scenarios
✅ Secure by default
✅ Auditable
✅ Multi-tenant isolation
