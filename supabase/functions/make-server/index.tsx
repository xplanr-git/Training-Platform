import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "jsr:@supabase/supabase-js@2.49.8";
import * as kv from "./kv_store.tsx";

// Initialize the Hono app without a base path to handle all incoming requests
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

// Enable logger for all requests
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization", "x-client-info", "apikey"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length", "X-Kuma-Revision"],
    maxAge: 600,
  }),
);

// Handle OPTIONS requests explicitly for better CORS support
app.options("*", (c) => {
  return c.text("", 204);
});

// Define the API routes in a separate router
const api = new Hono();

// Health check endpoint
api.get("/health", (c) => {
  return c.json({ status: "ok" });
});

// Signup endpoint
api.post("/auth/signup", async (c) => {
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
api.post("/auth/signin", async (c) => {
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
api.get("/auth/me", async (c) => {
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
api.post("/auth/init-admin", async (c) => {
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
api.post("/admin/create", async (c) => {
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
api.get("/admin/list", async (c) => {
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
api.delete("/admin/:adminId", async (c) => {
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
api.get("/companies", async (c) => {
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
api.get("/company/:companyId", async (c) => {
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
api.post("/courses", async (c) => {
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
api.get("/courses/company/:companyId", async (c) => {
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
api.get("/courses/:courseId", async (c) => {
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
api.put("/courses/:courseId", async (c) => {
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
api.delete("/courses/:courseId", async (c) => {
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
const saveSectionsHandler = async (c: any) => {
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
};

api.put("/courses/:courseId/sections", saveSectionsHandler);

// Save single activity endpoint (for direct updates)
const saveActivityHandler = async (c: any) => {
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

    console.log(`Directly saving activity: ${activityId} for course: ${courseId}`);

    // Construct the KV key
    const key = `course-activity:${courseId}:${sectionId}:${activityId}`;
    
    // Ensure all IDs match
    const activityData = {
      ...activity,
      id: activityId,
      courseId,
      sectionId,
      updatedAt: new Date().toISOString()
    };

    // Save to KV store
    await kv.set(key, activityData);
    
    console.log(`Activity saved successfully: ${activityId}`);

    return c.json({ 
      success: true,
      message: 'Activity saved successfully',
      activity: activityData
    });
  } catch (error: any) {
    console.error('Save activity error:', error);
    return c.json({ error: error.message || 'Failed to save activity' }, 500);
  }
};

api.put("/courses/:courseId/sections/:sectionId/activities/:activityId", saveActivityHandler);

// Get course sections endpoint
const getSectionsHandler = async (c: any) => {
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
};

api.get("/courses/:courseId/sections", getSectionsHandler);

// Save course settings endpoint (general, access, pricing)
const saveSettingsHandler = async (c: any) => {
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
};

api.put("/courses/:courseId/settings", saveSettingsHandler);

// Mount the API router at both standard and legacy paths
app.route("/functions/v1/make-server", api);
app.route("/make-server", api);
// Fallback for direct invocations where path might be stripped
app.route("/", api);

Deno.serve(app.fetch);
