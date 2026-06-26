export interface User {
  id: string;
  name: string;
  email: string;
  company: string;
  enrolledCourses: string[];
  completedLessons: string[];
  role?: string; // e.g., "Admin", "Manager", "Employee"
  position?: string; // Job title
  yearsInCompany?: number; // Years at current company
}

export interface CourseCategory {
  id: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string; // lucide icon name
  parentCategoryId?: string; // For subcategories
}

export interface Lesson {
  id: string;
  title: string;
  duration: string;
  type: 'video' | 'quiz' | 'reading' | 'pdf';
  videoUrl?: string;
  pdfUrl?: string;
  content?: string;
  fileName?: string;
}

export interface Module {
  id: string;
  title: string;
  lessons: Lesson[];
}

export interface Course {
  id: string;
  title: string;
  description: string;
  instructor: string;
  duration: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  difficulty?: 'Beginner' | 'Intermediate' | 'Advanced'; // Alias for level
  category: string;
  categoryId?: string; // Link to CourseCategory
  imageUrl: string;
  thumbnail?: string; // Alias for imageUrl
  rating: number;
  studentsEnrolled: number;
  enrolledCount?: number; // Alias for studentsEnrolled
  modules: Module[];
  lessons?: any[]; // Alternative to modules
  price?: string;
  featured?: boolean;
  companyId?: string; // Optional company association
  isPrivate?: boolean; // Visibility setting
  learnerCount?: number; // Number of enrolled learners
  authors?: string[]; // Multiple authors/instructors
  tags?: string[]; // Additional tags for filtering
  
  // Course settings
  language?: string;
  certificateEnabled?: boolean;
  allowComments?: boolean;
  allowReviews?: boolean;
  
  // Access settings
  accessType?: string;
  enrollmentType?: string;
  maxStudents?: number;
  prerequisiteCourses?: string[];
  startDate?: string;
  endDate?: string;
  
  // Pricing settings
  pricingModel?: string;
  currency?: string;
  discountEnabled?: boolean;
  discountPrice?: number;
  
  // Metadata
  createdAt?: string;
  updatedAt?: string;
  completionRate?: number;
}

export type Page = 'home' | 'course-detail' | 'learn' | 'dashboard' | 'login' | 'signup' | 'admin' | 'user-management' | 'admin-courses' | 'admin-analytics' | 'admin-settings';