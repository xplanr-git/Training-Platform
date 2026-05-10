import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "jsr:@supabase/supabase-js@2";
import * as kv from "./kv_store.tsx";
const app = new Hono();

// Create Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

// Create a separate client for auth operations (uses anon key)
const supabaseAuth = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_ANON_KEY') ?? '',
);

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-d60f2898/health", (c) => {
  return c.json({ status: "ok" });
});

// Signup endpoint
app.post("/make-server-d60f2898/auth/signup", async (c) => {
  try {
    const body = await c.req.json();
    const { email, password, name, company } = body;

    if (!email || !password || !name || !company) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    console.log(`Signup attempt for email: ${email}, company: ${company}`);

    // Create user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { 
        name,
        company,
        role: 'company_admin', // First user from a company becomes admin
        created_at: new Date().toISOString()
      },
      // Automatically confirm the user's email since an email server hasn't been configured.
      email_confirm: true
    });

    if (authError) {
      console.error('Signup auth error:', authError);
      return c.json({ error: authError.message }, 400);
    }

    console.log(`User created successfully in Supabase Auth: ${authData.user?.id}`);

    // Store user profile in KV store
    const userId = authData.user?.id;
    if (userId) {
      await kv.set(`user:${userId}`, {
        id: userId,
        email,
        name,
        company,
        role: 'company_admin',
        enrolledCourses: [],
        completedLessons: [],
        createdAt: new Date().toISOString()
      });

      console.log(`User profile stored in KV store for: ${email}`);

      // Create company record if it doesn't exist
      const companyId = company.toLowerCase().replace(/\s+/g, '-');
      const existingCompany = await kv.get(`company:${companyId}`);
      
      if (!existingCompany) {
        await kv.set(`company:${companyId}`, {
          id: companyId,
          name: company,
          adminUserId: userId,
          createdAt: new Date().toISOString(),
          settings: {}
        });
        console.log(`Company created: ${companyId}`);
      } else {
        console.log(`Company already exists: ${companyId}`);
      }
    }

    return c.json({ 
      success: true,
      user: {
        id: userId,
        email,
        name,
        company,
        role: 'company_admin'
      }
    });
  } catch (error: any) {
    console.error('Signup error:', error);
    return c.json({ error: error.message || 'Failed to create account' }, 500);
  }
});

// Signin endpoint
app.post("/make-server-d60f2898/auth/signin", async (c) => {
  try {
    const body = await c.req.json();
    const { email, password } = body;

    if (!email || !password) {
      return c.json({ error: 'Missing email or password' }, 400);
    }

    console.log(`Login attempt for email: ${email}`);

    // Check for hard-coded admin credentials
    const ADMIN_EMAIL = 'curtis@outdure.com';
    const ADMIN_PASSWORD = 'outdure';
    
    if (email.toLowerCase() === ADMIN_EMAIL.toLowerCase() && password === ADMIN_PASSWORD) {
      // Return hard-coded admin user
      const adminUser = {
        id: 'admin-001',
        email: ADMIN_EMAIL,
        name: 'Curtis Matthews',
        company: 'Outdure',
        role: 'platform_admin',
        enrolledCourses: [],
        completedLessons: []
      };

      // Generate a mock access token for the admin
      const accessToken = `admin-token-${Date.now()}`;
      
      console.log('Hard-coded admin login successful');
      
      return c.json({ 
        success: true,
        accessToken,
        user: adminUser
      });
    }

    // Regular user authentication via Supabase client
    console.log('Attempting Supabase authentication via client...');
    
    const { data: authData, error: authError } = await supabaseAuth.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      console.error('Signin auth error:', authError);
      console.error('Failed login attempt for email:', email);
      return c.json({ 
        error: 'Invalid email or password. Please check your credentials and try again.',
        details: authError 
      }, 401);
    }

    const userId = authData.user?.id;
    const accessToken = authData.session?.access_token;

    // Get user profile from KV store
    const userProfile = await kv.get(`user:${userId}`);

    console.log('User profile retrieved:', userProfile ? 'found' : 'not found');

    return c.json({ 
      success: true,
      accessToken,
      user: userProfile || {
        id: userId,
        email: authData.user?.email,
        name: authData.user?.user_metadata?.name || email.split('@')[0],
        company: authData.user?.user_metadata?.company || 'Unknown',
        role: authData.user?.user_metadata?.role || 'employee',
        enrolledCourses: [],
        completedLessons: []
      }
    });
  } catch (error: any) {
    console.error('Signin error:', error);
    return c.json({ error: error.message || 'Failed to sign in' }, 500);
  }
});

// Get current user endpoint (for checking session)
app.get("/make-server-d60f2898/auth/me", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const accessToken = authHeader?.split(' ')[1];

    if (!accessToken) {
      return c.json({ error: 'No authorization token' }, 401);
    }

    // Check if it's the hard-coded admin token
    if (accessToken.startsWith('admin-token-')) {
      return c.json({ 
        success: true,
        user: {
          id: 'admin-001',
          email: 'curtis@outdure.com',
          name: 'Curtis Matthews',
          company: 'Outdure',
          role: 'platform_admin',
          enrolledCourses: [],
          completedLessons: []
        }
      });
    }

    // Regular user token validation
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);

    if (error || !user) {
      return c.json({ error: 'Invalid or expired token' }, 401);
    }

    // Get user profile from KV store
    const userProfile = await kv.get(`user:${user.id}`);

    return c.json({ 
      success: true,
      user: userProfile || {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || user.email?.split('@')[0],
        company: user.user_metadata?.company || 'Unknown',
        role: user.user_metadata?.role || 'employee',
        enrolledCourses: [],
        completedLessons: []
      }
    });
  } catch (error: any) {
    console.error('Get user error:', error);
    return c.json({ error: error.message || 'Failed to get user' }, 500);
  }
});

// Initialize admin user endpoint (one-time setup)
app.post("/make-server-d60f2898/auth/init-admin", async (c) => {
  try {
    const email = 'curtis@outdure.com';
    const password = 'outdure';
    const name = 'Curtis Matthews';
    const company = 'Outdure';

    // Check if user already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const userExists = existingUsers?.users?.some(u => u.email === email);

    if (userExists) {
      return c.json({ message: 'Admin user already exists', email });
    }

    // Create admin user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { 
        name,
        company,
        role: 'platform_admin', // Platform admin has access to all companies
        created_at: new Date().toISOString()
      },
      email_confirm: true
    });

    if (authError) {
      console.error('Init admin error:', authError);
      return c.json({ error: authError.message }, 400);
    }

    // Store user profile in KV store
    const userId = authData.user?.id;
    if (userId) {
      await kv.set(`user:${userId}`, {
        id: userId,
        email,
        name,
        company,
        role: 'platform_admin',
        enrolledCourses: [],
        completedLessons: [],
        createdAt: new Date().toISOString()
      });

      // Create Outdure company record
      const companyId = 'outdure';
      await kv.set(`company:${companyId}`, {
        id: companyId,
        name: company,
        adminUserId: userId,
        createdAt: new Date().toISOString(),
        settings: {}
      });
    }

    return c.json({ 
      success: true,
      message: 'Admin user created successfully',
      user: {
        id: userId,
        email,
        name,
        company
      }
    });
  } catch (error: any) {
    console.error('Init admin error:', error);
    return c.json({ error: error.message || 'Failed to create admin user' }, 500);
  }
});

// Create platform admin endpoint
app.post("/make-server-d60f2898/admin/create", async (c) => {
  try {
    const body = await c.req.json();
    const { email, password, name } = body;

    if (!email || !password || !name) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    console.log(`Creating new platform admin: ${email}`);

    // Create admin user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { 
        name,
        company: 'Outdure',
        role: 'platform_admin',
        created_at: new Date().toISOString()
      },
      email_confirm: true
    });

    if (authError) {
      console.error('Create admin error:', authError);
      console.error('Error details:', JSON.stringify(authError, null, 2));
      return c.json({ error: authError.message }, 400);
    }

    console.log('Admin user created in Supabase Auth successfully');

    // Store user profile in KV store
    const userId = authData.user?.id;
    if (userId) {
      console.log(`Storing admin profile in KV store with ID: ${userId}`);
      
      await kv.set(`user:${userId}`, {
        id: userId,
        email,
        name,
        company: 'Outdure',
        role: 'platform_admin',
        enrolledCourses: [],
        completedLessons: [],
        createdAt: new Date().toISOString()
      });

      // Store admin in admin list
      await kv.set(`admin:${userId}`, {
        id: userId,
        email,
        name,
        createdAt: new Date().toISOString(),
        isOwner: false
      });
      
      console.log('Admin profile stored successfully');
    }

    return c.json({ 
      success: true,
      admin: {
        id: userId,
        email,
        name,
        createdAt: new Date().toISOString(),
        lastLogin: 'Never',
        isOwner: false
      }
    });
  } catch (error: any) {
    console.error('Create admin error:', error);
    return c.json({ error: error.message || 'Failed to create admin' }, 500);
  }
});

// Get all platform admins endpoint
app.get("/make-server-d60f2898/admin/list", async (c) => {
  try {
    // Get all admin records
    const adminRecords = await kv.getByPrefix('admin:');
    
    // Always include the hard-coded owner admin
    const ownerAdmin = {
      id: 'admin-001',
      name: 'Curtis Matthews',
      email: 'curtis@outdure.com',
      createdAt: '2024-01-01',
      lastLogin: '2 hours ago',
      isOwner: true
    };

    const admins = [ownerAdmin, ...adminRecords.map(record => ({
      ...record,
      lastLogin: 'Never' // TODO: Track actual last login
    }))];

    return c.json({ 
      success: true,
      admins
    });
  } catch (error: any) {
    console.error('List admins error:', error);
    return c.json({ error: error.message || 'Failed to list admins' }, 500);
  }
});

// Delete platform admin endpoint
app.delete("/make-server-d60f2898/admin/:adminId", async (c) => {
  try {
    const adminId = c.req.param('adminId');

    if (!adminId) {
      return c.json({ error: 'Missing admin ID' }, 400);
    }

    // Prevent deleting the owner
    if (adminId === 'admin-001') {
      return c.json({ error: 'Cannot delete owner admin' }, 403);
    }

    // Delete from Supabase Auth
    const { error: authError } = await supabase.auth.admin.deleteUser(adminId);
    
    if (authError) {
      console.error('Delete admin auth error:', authError);
      // Continue even if auth deletion fails
    }

    // Delete from KV store
    await kv.del(`user:${adminId}`);
    await kv.del(`admin:${adminId}`);

    return c.json({ 
      success: true,
      message: 'Admin deleted successfully'
    });
  } catch (error: any) {
    console.error('Delete admin error:', error);
    return c.json({ error: error.message || 'Failed to delete admin' }, 500);
  }
});

// Get all companies with statistics endpoint
app.get("/make-server-d60f2898/companies", async (c) => {
  try {
    console.log('Fetching all companies...');
    
    // Get all companies from KV store
    const companies = await kv.getByPrefix('company:');
    console.log(`Found ${companies.length} companies`);
    
    // Get all users from KV store
    const users = await kv.getByPrefix('user:');
    console.log(`Found ${users.length} users`);
    
    // Get all courses from KV store
    const courses = await kv.getByPrefix('course:');
    console.log(`Found ${courses.length} courses`);
    
    // Calculate statistics for each company
    const companiesWithStats = companies.map(company => {
      // Filter users by company name
      const companyUsers = users.filter(user => 
        user.company?.toLowerCase() === company.name?.toLowerCase()
      );
      
      // Filter courses by company
      const companyCourses = courses.filter(course => 
        course.companyId === company.id
      );
      
      // Calculate active users (users created in last 30 days or have recent activity)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const activeUsers = companyUsers.filter(user => {
        const createdAt = new Date(user.createdAt || user.created_at || 0);
        return createdAt > thirtyDaysAgo;
      }).length;
      
      // Calculate completion rate (mock for now, can be enhanced later)
      const completionRate = companyCourses.length > 0 
        ? Math.round(Math.random() * 30 + 50) // Mock: 50-80%
        : 0;
      
      // Calculate last active time
      const companyCreatedAt = new Date(company.createdAt || Date.now());
      const daysSinceCreation = Math.floor((Date.now() - companyCreatedAt.getTime()) / (1000 * 60 * 60 * 24));
      
      let lastActive;
      if (daysSinceCreation === 0) {
        lastActive = 'Today';
      } else if (daysSinceCreation === 1) {
        lastActive = '1 day ago';
      } else if (daysSinceCreation < 7) {
        lastActive = `${daysSinceCreation} days ago`;
      } else if (daysSinceCreation < 30) {
        const weeks = Math.floor(daysSinceCreation / 7);
        lastActive = `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
      } else {
        const months = Math.floor(daysSinceCreation / 30);
        lastActive = `${months} ${months === 1 ? 'month' : 'months'} ago`;
      }
      
      // Determine status
      let status = 'active';
      if (companyUsers.length === 0) {
        status = 'inactive';
      } else if (daysSinceCreation < 30 && companyCourses.length < 5) {
        status = 'trial';
      } else if (activeUsers === 0 && daysSinceCreation > 14) {
        status = 'inactive';
      }
      
      return {
        id: company.id,
        name: company.name,
        totalUsers: companyUsers.length,
        activeUsers: activeUsers,
        totalCourses: companyCourses.length,
        completionRate: completionRate,
        avgProgress: completionRate, // Same as completion rate for now
        joinedDate: company.createdAt || new Date().toISOString(),
        lastActive: lastActive,
        status: status,
        isSuspended: false
      };
    });
    
    console.log(`Returning ${companiesWithStats.length} companies with statistics`);
    
    return c.json({ 
      success: true,
      companies: companiesWithStats
    });
  } catch (error: any) {
    console.error('Get companies error:', error);
    return c.json({ error: error.message || 'Failed to get companies' }, 500);
  }
});

// Get company details by ID endpoint
app.get("/make-server-d60f2898/company/:companyId", async (c) => {
  try {
    const companyId = c.req.param('companyId');
    
    if (!companyId) {
      return c.json({ error: 'Missing company ID' }, 400);
    }

    console.log(`Fetching company details for: ${companyId}`);
    
    // Get company from KV store
    const company = await kv.get(`company:${companyId}`);
    
    if (!company) {
      return c.json({ error: 'Company not found' }, 404);
    }

    // Get admin user details if available
    let adminUser = null;
    if (company.adminUserId) {
      adminUser = await kv.get(`user:${company.adminUserId}`);
    }
    
    console.log(`Company details found: ${company.name}`);
    
    return c.json({ 
      success: true,
      company: {
        id: company.id,
        name: company.name,
        description: company.description || '',
        email: adminUser?.email || company.email || '',
        adminEmail: adminUser?.email || '',
        adminName: adminUser?.name || '',
        createdAt: company.createdAt,
        settings: company.settings || {}
      }
    });
  } catch (error: any) {
    console.error('Get company details error:', error);
    return c.json({ error: error.message || 'Failed to get company details' }, 500);
  }
});

// Create course endpoint
app.post("/make-server-d60f2898/courses", async (c) => {
  try {
    const body = await c.req.json();
    const { 
      title, 
      description, 
      category, 
      difficulty, 
      duration, 
      instructor,
      thumbnail,
      companyId,
      lessons = []
    } = body;

    if (!title || !companyId) {
      return c.json({ error: 'Missing required fields: title and companyId' }, 400);
    }

    console.log(`Creating course "${title}" for company: ${companyId}`);

    // Generate course ID
    const courseId = `course-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    // Create course object
    const course = {
      id: courseId,
      title,
      description: description || '',
      category: category || 'Uncategorized',
      difficulty: difficulty || 'Beginner',
      duration: duration || '0 hours',
      instructor: instructor || 'Unknown',
      thumbnail: thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=600&fit=crop',
      companyId,
      lessons,
      enrolledCount: 0,
      completionRate: 0,
      rating: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Save course to KV store
    await kv.set(`course:${courseId}`, course);
    
    console.log(`Course created successfully: ${courseId}`);

    return c.json({ 
      success: true,
      course
    });
  } catch (error: any) {
    console.error('Create course error:', error);
    return c.json({ error: error.message || 'Failed to create course' }, 500);
  }
});

// Get courses by company ID endpoint
app.get("/make-server-d60f2898/courses/company/:companyId", async (c) => {
  try {
    const companyId = c.req.param('companyId');
    
    if (!companyId) {
      return c.json({ error: 'Missing company ID' }, 400);
    }

    console.log(`Fetching courses for company: ${companyId}`);
    
    // Get all courses from KV store
    const allCourses = await kv.getByPrefix('course:');
    
    // Filter courses by company ID
    const companyCourses = allCourses.filter(course => course.companyId === companyId);
    
    console.log(`Found ${companyCourses.length} courses for company ${companyId}`);
    
    return c.json({ 
      success: true,
      courses: companyCourses
    });
  } catch (error: any) {
    console.error('Get company courses error:', error);
    return c.json({ error: error.message || 'Failed to get courses' }, 500);
  }
});

// Get single course endpoint
app.get("/make-server-d60f2898/courses/:courseId", async (c) => {
  try {
    const courseId = c.req.param('courseId');
    
    if (!courseId) {
      return c.json({ error: 'Missing course ID' }, 400);
    }

    console.log(`Fetching course: ${courseId}`);
    
    // Get course from KV store
    const course = await kv.get(`course:${courseId}`);
    
    if (!course) {
      return c.json({ error: 'Course not found' }, 404);
    }
    
    return c.json({ 
      success: true,
      course
    });
  } catch (error: any) {
    console.error('Get course error:', error);
    return c.json({ error: error.message || 'Failed to get course' }, 500);
  }
});

// Update course endpoint
app.put("/make-server-d60f2898/courses/:courseId", async (c) => {
  try {
    const courseId = c.req.param('courseId');
    const body = await c.req.json();
    
    if (!courseId) {
      return c.json({ error: 'Missing course ID' }, 400);
    }

    console.log(`Updating course: ${courseId}`);
    
    // Get existing course
    const existingCourse = await kv.get(`course:${courseId}`);
    
    if (!existingCourse) {
      return c.json({ error: 'Course not found' }, 404);
    }

    // Update course with new data
    const updatedCourse = {
      ...existingCourse,
      ...body,
      id: courseId, // Ensure ID doesn't change
      companyId: existingCourse.companyId, // Ensure company ID doesn't change
      updatedAt: new Date().toISOString()
    };

    // Save updated course
    await kv.set(`course:${courseId}`, updatedCourse);
    
    console.log(`Course updated successfully: ${courseId}`);

    return c.json({ 
      success: true,
      course: updatedCourse
    });
  } catch (error: any) {
    console.error('Update course error:', error);
    return c.json({ error: error.message || 'Failed to update course' }, 500);
  }
});

// Delete course endpoint
app.delete("/make-server-d60f2898/courses/:courseId", async (c) => {
  try {
    const courseId = c.req.param('courseId');
    
    if (!courseId) {
      return c.json({ error: 'Missing course ID' }, 400);
    }

    console.log(`Deleting course: ${courseId}`);
    
    // Check if course exists
    const course = await kv.get(`course:${courseId}`);
    
    if (!course) {
      return c.json({ error: 'Course not found' }, 404);
    }

    // Delete course from KV store
    await kv.del(`course:${courseId}`);
    
    // Delete all sections for this course
    const sections = await kv.getByPrefix(`course-section:${courseId}:`);
    for (const section of sections) {
      await kv.del(`course-section:${courseId}:${section.id}`);
      
      // Delete all activities for this section
      const activities = await kv.getByPrefix(`course-activity:${courseId}:${section.id}:`);
      for (const activity of activities) {
        await kv.del(`course-activity:${courseId}:${section.id}:${activity.id}`);
      }
    }
    
    console.log(`Course deleted successfully: ${courseId}`);

    return c.json({ 
      success: true,
      message: 'Course deleted successfully'
    });
  } catch (error: any) {
    console.error('Delete course error:', error);
    return c.json({ error: error.message || 'Failed to delete course' }, 500);
  }
});

// Save course sections endpoint
app.put("/make-server-d60f2898/courses/:courseId/sections", async (c) => {
  try {
    const courseId = c.req.param('courseId');
    const body = await c.req.json();
    const { sections } = body;
    
    if (!courseId) {
      return c.json({ error: 'Missing course ID' }, 400);
    }

    if (!sections || !Array.isArray(sections)) {
      return c.json({ error: 'Invalid sections data' }, 400);
    }

    console.log(`Saving ${sections.length} sections for course: ${courseId}`);
    
    // Delete all existing sections and activities for this course
    const existingSections = await kv.getByPrefix(`course-section:${courseId}:`);
    for (const section of existingSections) {
      await kv.del(`course-section:${courseId}:${section.id}`);
      
      // Delete all activities for this section
      const activities = await kv.getByPrefix(`course-activity:${courseId}:${section.id}:`);
      for (const activity of activities) {
        await kv.del(`course-activity:${courseId}:${section.id}:${activity.id}`);
      }
    }
    
    // Save new sections and activities
    for (const section of sections) {
      const sectionData = {
        id: section.id,
        title: section.title,
        isFree: section.isFree || false,
        order: section.order || 0,
        courseId,
        createdAt: section.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      await kv.set(`course-section:${courseId}:${section.id}`, sectionData);
      
      // Save activities for this section
      if (section.activities && Array.isArray(section.activities)) {
        for (const activity of section.activities) {
          const activityData = {
            id: activity.id,
            type: activity.type,
            title: activity.title,
            duration: activity.duration || '',
            content: activity.content || '',
            order: activity.order || 0,
            // Additional activity fields
            fileUrl: activity.fileUrl || '',
            fileName: activity.fileName || '',
            description: activity.description || '',
            embedCode: activity.embedCode || '',
            videoUrl: activity.videoUrl || '',
            audioUrl: activity.audioUrl || '',
            pdfUrl: activity.pdfUrl || '',
            presentationUrl: activity.presentationUrl || '',
            courseId,
            sectionId: section.id,
            createdAt: activity.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          
          await kv.set(`course-activity:${courseId}:${section.id}:${activity.id}`, activityData);
        }
      }
    }
    
    // Update course's updatedAt timestamp
    const course = await kv.get(`course:${courseId}`);
    if (course) {
      await kv.set(`course:${courseId}`, {
        ...course,
        updatedAt: new Date().toISOString()
      });
    }
    
    console.log(`Sections saved successfully for course: ${courseId}`);

    return c.json({ 
      success: true,
      message: 'Sections saved successfully'
    });
  } catch (error: any) {
    console.error('Save sections error:', error);
    return c.json({ error: error.message || 'Failed to save sections' }, 500);
  }
});

// Get course sections endpoint
app.get("/make-server-d60f2898/courses/:courseId/sections", async (c) => {
  try {
    const courseId = c.req.param('courseId');
    
    if (!courseId) {
      return c.json({ error: 'Missing course ID' }, 400);
    }

    console.log(`Fetching sections for course: ${courseId}`);
    
    // Get all sections for this course
    const sections = await kv.getByPrefix(`course-section:${courseId}:`);
    
    // Get activities for each section
    const sectionsWithActivities = await Promise.all(
      sections.map(async (section) => {
        const activities = await kv.getByPrefix(`course-activity:${courseId}:${section.id}:`);
        
        // Sort activities by order
        const sortedActivities = activities.sort((a, b) => (a.order || 0) - (b.order || 0));
        
        return {
          ...section,
          activities: sortedActivities,
          isExpanded: true // Default to expanded
        };
      })
    );
    
    // Sort sections by order
    const sortedSections = sectionsWithActivities.sort((a, b) => (a.order || 0) - (b.order || 0));
    
    console.log(`Found ${sortedSections.length} sections for course ${courseId}`);
    
    return c.json({ 
      success: true,
      sections: sortedSections
    });
  } catch (error: any) {
    console.error('Get sections error:', error);
    return c.json({ error: error.message || 'Failed to get sections' }, 500);
  }
});

// Save course settings endpoint (general, access, pricing)
app.put("/make-server-d60f2898/courses/:courseId/settings", async (c) => {
  try {
    const courseId = c.req.param('courseId');
    const body = await c.req.json();
    const { courseSettings, accessSettings, pricingSettings } = body;
    
    if (!courseId) {
      return c.json({ error: 'Missing course ID' }, 400);
    }

    console.log(`Saving settings for course: ${courseId}`);
    
    // Get existing course
    const existingCourse = await kv.get(`course:${courseId}`);
    
    if (!existingCourse) {
      return c.json({ error: 'Course not found' }, 404);
    }

    // Update course with new settings
    const updatedCourse = {
      ...existingCourse,
      // Course settings
      title: courseSettings?.title || existingCourse.title,
      description: courseSettings?.description || existingCourse.description,
      category: courseSettings?.category || existingCourse.category,
      level: courseSettings?.level || existingCourse.level,
      language: courseSettings?.language || existingCourse.language,
      instructor: courseSettings?.instructor || existingCourse.instructor,
      duration: courseSettings?.duration || existingCourse.duration,
      certificateEnabled: courseSettings?.certificateEnabled ?? existingCourse.certificateEnabled,
      allowComments: courseSettings?.allowComments ?? existingCourse.allowComments,
      allowReviews: courseSettings?.allowReviews ?? existingCourse.allowReviews,
      
      // Access settings
      accessType: accessSettings?.accessType || existingCourse.accessType,
      enrollmentType: accessSettings?.enrollmentType || existingCourse.enrollmentType,
      maxStudents: accessSettings?.maxStudents ?? existingCourse.maxStudents,
      prerequisiteCourses: accessSettings?.prerequisiteCourses || existingCourse.prerequisiteCourses,
      startDate: accessSettings?.startDate || existingCourse.startDate,
      endDate: accessSettings?.endDate || existingCourse.endDate,
      
      // Pricing settings
      pricingModel: pricingSettings?.pricingModel || existingCourse.pricingModel,
      price: pricingSettings?.price ?? existingCourse.price,
      currency: pricingSettings?.currency || existingCourse.currency,
      discountEnabled: pricingSettings?.discountEnabled ?? existingCourse.discountEnabled,
      discountPrice: pricingSettings?.discountPrice ?? existingCourse.discountPrice,
      
      updatedAt: new Date().toISOString()
    };

    // Save updated course
    await kv.set(`course:${courseId}`, updatedCourse);
    
    console.log(`Settings saved successfully for course: ${courseId}`);

    return c.json({ 
      success: true,
      course: updatedCourse
    });
  } catch (error: any) {
    console.error('Save settings error:', error);
    return c.json({ error: error.message || 'Failed to save settings' }, 500);
  }
});

// Update single activity endpoint
app.put("/make-server-d60f2898/courses/:courseId/sections/:sectionId/activities/:activityId", async (c) => {
  try {
    const courseId = c.req.param('courseId');
    const sectionId = c.req.param('sectionId');
    const activityId = c.req.param('activityId');
    const body = await c.req.json();
    const { activity } = body;

    if (!courseId || !sectionId || !activityId) {
      return c.json({ error: 'Missing required parameters' }, 400);
    }

    if (!activity) {
      return c.json({ error: 'Missing activity data' }, 400);
    }

    console.log(`Updating single activity: ${activityId} in section ${sectionId}`);

    const activityKey = `course-activity:${courseId}:${sectionId}:${activityId}`;
    
    // Get existing to preserve fields if needed
    const existingActivity = await kv.get(activityKey);
    
    const updatedActivity = {
      ...(existingActivity || {}),
      ...activity,
      id: activityId,
      sectionId,
      courseId,
      updatedAt: new Date().toISOString()
    };

    // Ensure specific backend fields are set if provided in the payload
    // This helps persist the fields that might be stripped by the frontend logic
    if (activity.page_count !== undefined) updatedActivity.page_count = activity.page_count;
    if (activity.pdf_url !== undefined) updatedActivity.pdf_url = activity.pdf_url;
    if (activity.file_name !== undefined) updatedActivity.file_name = activity.file_name;
    if (activity.file_url !== undefined) updatedActivity.file_url = activity.file_url;

    await kv.set(activityKey, updatedActivity);
    
    console.log(`Activity updated successfully: ${activityId}`);

    return c.json({ 
      success: true,
      activity: updatedActivity
    });
  } catch (error: any) {
    console.error('Update activity error:', error);
    return c.json({ error: error.message || 'Failed to update activity' }, 500);
  }
});

// Save website configuration endpoint
app.post("/make-server-d60f2898/website/:companyId", async (c) => {
  try {
    const companyId = c.req.param('companyId');
    const body = await c.req.json();
    const { sections, pages } = body;
    
    if (!companyId) {
      return c.json({ error: 'Missing company ID' }, 400);
    }

    console.log(`Saving website configuration for company: ${companyId}`);
    
    // Save both sections (backward compat) and pages
    await kv.set(`website-config:${companyId}`, { sections, pages });
    
    return c.json({ 
      success: true,
      message: 'Website configuration saved successfully'
    });
  } catch (error: any) {
    console.error('Save website config error:', error);
    return c.json({ error: error.message || 'Failed to save website configuration' }, 500);
  }
});

// Save website settings endpoint
app.post("/make-server-d60f2898/website-settings/:companyId", async (c) => {
  try {
    const companyId = c.req.param('companyId');
    const body = await c.req.json();
    const { settings } = body;
    
    if (!companyId) {
      return c.json({ error: 'Missing company ID' }, 400);
    }

    console.log(`Saving website settings for company: ${companyId}`);
    
    await kv.set(`website-settings:${companyId}`, settings);
    
    return c.json({ 
      success: true,
      message: 'Website settings saved successfully'
    });
  } catch (error: any) {
    console.error('Save website settings error:', error);
    return c.json({ error: error.message || 'Failed to save website settings' }, 500);
  }
});

// Get website configuration endpoint
app.get("/make-server-d60f2898/website/:companyId", async (c) => {
  try {
    const companyId = c.req.param('companyId');
    
    if (!companyId) {
      return c.json({ error: 'Missing company ID' }, 400);
    }

    console.log(`Fetching website configuration for company: ${companyId}`);
    
    const data = await kv.get(`website-config:${companyId}`);
    
    // Handle both old format (array of sections) and new format (object with sections and pages)
    let sections = [];
    let pages = [];
    
    if (Array.isArray(data)) {
      sections = data;
    } else if (data && typeof data === 'object') {
      sections = data.sections || [];
      pages = data.pages || [];
    }
    
    return c.json({ 
      success: true,
      sections,
      pages
    });
  } catch (error: any) {
    console.error('Get website config error:', error);
    return c.json({ error: error.message || 'Failed to get website configuration' }, 500);
  }
});

// Get website settings endpoint
app.get("/make-server-d60f2898/website-settings/:companyId", async (c) => {
  try {
    const companyId = c.req.param('companyId');
    
    if (!companyId) {
      return c.json({ error: 'Missing company ID' }, 400);
    }

    console.log(`Fetching website settings for company: ${companyId}`);
    
    const settings = await kv.get(`website-settings:${companyId}`);
    
    return c.json({ 
      success: true,
      settings: settings || null
    });
  } catch (error: any) {
    console.error('Get website settings error:', error);
    return c.json({ error: error.message || 'Failed to get website settings' }, 500);
  }
});

// Get course player settings endpoint
app.get("/make-server-d60f2898/courses/:courseId/player-settings", async (c) => {
  try {
    const courseId = c.req.param('courseId');
    if (!courseId) {
      return c.json({ error: 'Missing course ID' }, 400);
    }
    console.log(`Fetching player settings for course: ${courseId}`);
    const settings = await kv.get(`course-player-settings:${courseId}`);
    return c.json({ success: true, settings: settings || null });
  } catch (error: any) {
    console.error('Get player settings error:', error);
    return c.json({ error: error.message || 'Failed to get player settings' }, 500);
  }
});

// Save course player settings endpoint
app.put("/make-server-d60f2898/courses/:courseId/player-settings", async (c) => {
  try {
    const courseId = c.req.param('courseId');
    const body = await c.req.json();
    const { settings } = body;
    if (!courseId) {
      return c.json({ error: 'Missing course ID' }, 400);
    }
    if (!settings) {
      return c.json({ error: 'Missing settings data' }, 400);
    }
    console.log(`Saving player settings for course: ${courseId}`);
    await kv.set(`course-player-settings:${courseId}`, {
      ...settings,
      updatedAt: new Date().toISOString()
    });
    return c.json({ success: true, message: 'Player settings saved successfully' });
  } catch (error: any) {
    console.error('Save player settings error:', error);
    return c.json({ error: error.message || 'Failed to save player settings' }, 500);
  }
});

// ─── Video Library ───────────────────────────────────────────────────────────

const VIDEO_BUCKET = 'make-d60f2898-videos';

// Ensure video-library bucket exists (idempotent on startup)
(async () => {
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    const exists = (buckets as any[])?.some((b: any) => b.name === VIDEO_BUCKET);
    if (!exists) {
      await supabase.storage.createBucket(VIDEO_BUCKET);
      console.log(`Created storage bucket: ${VIDEO_BUCKET}`);
    }
  } catch (err) {
    console.error('Failed to ensure video bucket:', err);
  }
})();

// Get a signed upload URL so the frontend can PUT a video file directly
app.post('/make-server-d60f2898/courses/:courseId/video-library/upload-url', async (c) => {
  try {
    const courseId = c.req.param('courseId');
    const { fileName, fileType } = await c.req.json();
    if (!courseId || !fileName) {
      return c.json({ error: 'Missing courseId or fileName' }, 400);
    }
    const ext = fileName.split('.').pop() || 'mp4';
    const storagePath = `${courseId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { data, error } = await supabase.storage
      .from(VIDEO_BUCKET)
      .createSignedUploadUrl(storagePath);
    if (error || !data) {
      console.error('Error creating signed upload URL:', error);
      return c.json({ error: (error as any)?.message || 'Failed to create upload URL' }, 500);
    }
    return c.json({ success: true, signedUrl: (data as any).signedUrl, path: storagePath });
  } catch (err: any) {
    console.error('Upload URL route error:', err);
    return c.json({ error: err.message || 'Failed to create upload URL' }, 500);
  }
});

// Save video metadata after the upload completes
app.post('/make-server-d60f2898/courses/:courseId/video-library', async (c) => {
  try {
    const courseId = c.req.param('courseId');
    const { title, fileName, storagePath, fileSize, mimeType } = await c.req.json();
    if (!courseId || !storagePath) {
      return c.json({ error: 'Missing required fields: courseId, storagePath' }, 400);
    }
    const videoId = `vid-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const metadata: any = {
      id: videoId,
      courseId,
      title: title || fileName || 'Untitled Video',
      fileName: fileName || '',
      storagePath,
      fileSize: fileSize || 0,
      mimeType: mimeType || 'video/mp4',
      uploadedAt: new Date().toISOString(),
    };
    await kv.set(`course-video-library:${courseId}:${videoId}`, metadata);
    const { data: signedData } = await supabase.storage
      .from(VIDEO_BUCKET)
      .createSignedUrl(storagePath, 7 * 24 * 3600);
    return c.json({ success: true, video: { ...metadata, signedUrl: (signedData as any)?.signedUrl ?? null } });
  } catch (err: any) {
    console.error('Save video metadata error:', err);
    return c.json({ error: err.message || 'Failed to save video metadata' }, 500);
  }
});

// List all videos uploaded to a course's video library
app.get('/make-server-d60f2898/courses/:courseId/video-library', async (c) => {
  try {
    const courseId = c.req.param('courseId');
    if (!courseId) return c.json({ error: 'Missing courseId' }, 400);
    const videos = await kv.getByPrefix(`course-video-library:${courseId}:`);
    const videosWithUrls = await Promise.all(
      videos.map(async (v: any) => {
        const { data } = await supabase.storage
          .from(VIDEO_BUCKET)
          .createSignedUrl(v.storagePath, 7 * 24 * 3600);
        return { ...v, signedUrl: (data as any)?.signedUrl ?? null };
      })
    );
    videosWithUrls.sort((a: any, b: any) =>
      new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    );
    return c.json({ success: true, videos: videosWithUrls });
  } catch (err: any) {
    console.error('List video library error:', err);
    return c.json({ error: err.message || 'Failed to list videos' }, 500);
  }
});

Deno.serve(app.fetch);