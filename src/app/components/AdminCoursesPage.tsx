import { Course, CourseCategory } from '@/app/types';
import { Plus, Search, Edit, Trash2, Eye, Filter, Building2, Award, Info, X, ChevronDown, Download, TrendingUp, LayoutTemplate, Upload, FileUp, CheckCircle2 } from 'lucide-react';
import { useState, useRef } from 'react';
import { CourseCatalog } from './CourseCatalog';
import { CourseBuilderPage } from './CourseBuilderPage';
import { supabase } from '/utils/supabase/client';

interface AdminCoursesPageProps {
  courses: Course[];
  categories: CourseCategory[];
  companyId?: string | null;
  currentSubPage?: string;
  onSubPageChange?: (subPage: string) => void;
  onCourseClick?: (courseId: string) => void;
  onUpdateCategories?: (categories: CourseCategory[]) => void;
  onUpdateCourseAssignments?: (updates: { id: string; categoryId?: string }[]) => void;
  onCoursesRefresh?: () => void;
  onNavigateToEmailTemplates?: () => void;
  onNavigateToPushNotifications?: () => void;
}

export function AdminCoursesPage({ courses, categories, companyId, currentSubPage = 'all-courses', onSubPageChange, onCourseClick, onUpdateCategories, onUpdateCourseAssignments, onCoursesRefresh, onNavigateToEmailTemplates, onNavigateToPushNotifications }: AdminCoursesPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [manageSearchQuery, setManageSearchQuery] = useState('');
  const [manageCategoryFilter, setManageCategoryFilter] = useState<string>('all');
  const [manageLevelFilter, setManageLevelFilter] = useState<string>('all');
  const [manageInstructorFilter, setManageInstructorFilter] = useState<string>('all');
  const [activePopover, setActivePopover] = useState<string | null>(null);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [selectedCourseForBuilder, setSelectedCourseForBuilder] = useState<Course | null>(null);
  const [showCreateProgramModal, setShowCreateProgramModal] = useState(false);
  const [programName, setProgramName] = useState('');
  const [programDescription, setProgramDescription] = useState('');
  const [programType, setProgramType] = useState<'free' | 'one-time' | 'installment' | 'subscription'>('free');

  // Certificate template state
  const defaultCertFields = {
    instructor: 'Course Instructor',
    organisation: 'Outdure Academy',
    department: 'Human Resources',
    dateOfIssue: 'May 13, 2026',
    duration: '',
    certNumber: '',
    secondSignatory: '',
    footerNote: 'This certificate is awarded in recognition of successful course completion.',
    showLogo: true,
    showSignatureLine: true,
    showDateLine: true,
    showCourseName: true,
    showDuration: false,
    showCertNumber: false,
    showSecondSignatory: false,
    // Uploaded certificate fields
    uploadedFileUrl: '',
    uploadedFileName: '',
    overlayTint: '#000000',
    overlayTintOpacity: 0,
    // Per-element overlay config (uploaded certs) — x/y = % from top-left
    overlayNameX: 50,    overlayNameY: 44,    overlayNameColor: '#1a1a1a', overlayNameFontSize: 28, overlayNameBold: true,  overlayNameItalic: true,  overlayNameVisible: true,
    overlayCourseX: 50,  overlayCourseY: 58,  overlayCourseColor: '#374151', overlayCourseFontSize: 16, overlayCourseBold: true,  overlayCourseItalic: false, overlayCourseVisible: true,
    overlayDateX: 50,    overlayDateY: 70,    overlayDateColor: '#6b7280', overlayDateFontSize: 13, overlayDateBold: false, overlayDateItalic: false, overlayDateVisible: true,
    overlayInstructorX: 30, overlayInstructorY: 82, overlayInstructorColor: '#374151', overlayInstructorFontSize: 12, overlayInstructorBold: false, overlayInstructorItalic: false, overlayInstructorVisible: false,
    overlayCertNumX: 50, overlayCertNumY: 90, overlayCertNumColor: '#9ca3af', overlayCertNumFontSize: 10, overlayCertNumBold: false, overlayCertNumItalic: false, overlayCertNumVisible: false,
  };
  const [certTemplates, setCertTemplates] = useState([
    { id: 0, name: 'Professional Certificate', courses: 15, color: '#1d4ed8', accent: '#3b82f6', description: 'Awarded to professionals who complete advanced training.', ...defaultCertFields },
    { id: 1, name: 'Course Completion',        courses: 8,  color: '#047857', accent: '#10b981', description: 'Awarded upon successful completion of a course.',         ...defaultCertFields },
    { id: 2, name: 'Excellence Award',          courses: 12, color: '#7c3aed', accent: '#8b5cf6', description: 'Recognises outstanding performance and dedication.',       ...defaultCertFields },
    { id: 3, name: 'Mastery Certificate',       courses: 23, color: '#b45309', accent: '#f59e0b', description: 'Awarded to learners who demonstrate deep mastery.',        ...defaultCertFields },
  ]);
  const [editingCertId, setEditingCertId] = useState<number | null>(null);
  const [previewingCertId, setPreviewingCertId] = useState<number | null>(null);
  const [certDraft, setCertDraft] = useState<typeof certTemplates[0] | null>(null);
  const [certIsNew, setCertIsNew] = useState(false);
  const [reviewFilter, setReviewFilter] = useState<'all' | 'unreviewed' | 'reviewed'>('all');
  const [replyModal, setReplyModal] = useState<{ student: string; initials: string; color: string; course: string; rating: number; comment: string; time: string; replied: boolean; existingReply?: string } | null>(null);
  const [replyText, setReplyText] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadDragging, setUploadDragging] = useState(false);
  const [uploadTemplateName, setUploadTemplateName] = useState('');
  const [uploadDone, setUploadDone] = useState(false);
  const uploadInputRef = useRef<HTMLInputElement>(null);

  // Course creation form state
  const [isCreatingCourse, setIsCreatingCourse] = useState(false);
  const [courseFormData, setCourseFormData] = useState({
    title: '',
    description: '',
    duration: '',
    instructor: '',
    category: 'Uncategorized',
    difficulty: 'Beginner'
  });

  // If a course is selected for building, show the course builder
  if (selectedCourseForBuilder) {
    return (
      <CourseBuilderPage
        course={selectedCourseForBuilder}
        onBack={() => {
          setSelectedCourseForBuilder(null);
          // Refresh courses when returning from course builder
          if (onCoursesRefresh) {
            onCoursesRefresh();
          }
        }}
        onNavigateToEmailTemplates={onNavigateToEmailTemplates}
        onNavigateToPushNotifications={onNavigateToPushNotifications}
        onSave={(updatedCourse) => {
          // Update the selected course with the new data
          setSelectedCourseForBuilder(updatedCourse);
          // Trigger courses refresh
          if (onCoursesRefresh) {
            onCoursesRefresh();
          }
        }}
      />
    );
  }

  // Helper function to get company name from company ID
  const getCompanyName = (companyId: string) => {
    const companyNames: Record<string, string> = {
      'tech-corp': 'TechCorp Solutions',
      'global-industries': 'Global Industries Ltd',
      'innovate-startup': 'Innovate Startup Inc',
      'enterprise-solutions': 'Enterprise Solutions Group',
      'digital-services': 'Digital Services Co'
    };
    return companyNames[companyId] || companyId;
  };

  // Filter courses by company if companyId is provided
  const companyCourses = companyId 
    ? (courses || []).filter(course => course.companyId === companyId)
    : (courses || []);

  // Get unique categories from filtered courses
  const courseCategories = ['all', ...new Set(companyCourses.map(course => course.category))];
  
  // Get unique instructors from filtered courses
  const instructors = ['all', ...new Set(companyCourses.map(course => course.instructor))];

  // Handle course creation
  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!companyId) {
      alert('Company ID is required to create a course');
      return;
    }

    if (!courseFormData.title) {
      alert('Please enter a course title');
      return;
    }

    setIsCreatingCourse(true);

    try {
      const { data: newCourse, error } = await supabase
        .from('courses')
        .insert({
          company_id: companyId,
          title: courseFormData.title,
          description: courseFormData.description || '',
          duration: courseFormData.duration || '',
          instructor: courseFormData.instructor || '',
          category: courseFormData.category || 'Uncategorized',
          level: courseFormData.difficulty || 'Beginner',
          image_url: '',
          rating: 0,
          students_enrolled: 0,
        })
        .select()
        .single();

      if (error) throw new Error(error.message);

      // Reset form
      setCourseFormData({
        title: '',
        description: '',
        duration: '',
        instructor: '',
        category: 'Uncategorized',
        difficulty: 'Beginner',
      });

      // Trigger courses refresh in parent
      if (onCoursesRefresh) {
        onCoursesRefresh();
      }

      // Map DB row → Course interface and open the course builder
      setSelectedCourseForBuilder({
        id: newCourse.id,
        title: newCourse.title,
        description: newCourse.description,
        instructor: newCourse.instructor,
        duration: newCourse.duration,
        level: newCourse.level,
        difficulty: newCourse.level,
        category: newCourse.category,
        imageUrl: newCourse.image_url,
        rating: newCourse.rating,
        studentsEnrolled: newCourse.students_enrolled,
        modules: [],
        companyId: newCourse.company_id,
      });
    } catch (error) {
      console.error('Error creating course:', error);
      alert(error instanceof Error ? error.message : 'Failed to create course');
    } finally {
      setIsCreatingCourse(false);
    }
  };

  // Filter courses
  const filteredCourses = companyCourses.filter(course => {
    const matchesSearch = 
      course.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.instructor?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || course.category === categoryFilter;
    const matchesLevel = levelFilter === 'all' || course.level === levelFilter;
    
    return matchesSearch && matchesCategory && matchesLevel;
  });
  
  // Filter courses for Manage Content view
  const filteredManageCourses = companyCourses.filter(course => {
    const matchesSearch = 
      course.title?.toLowerCase().includes(manageSearchQuery.toLowerCase()) ||
      course.instructor?.toLowerCase().includes(manageSearchQuery.toLowerCase()) ||
      course.description?.toLowerCase().includes(manageSearchQuery.toLowerCase());
    
    const matchesCategory = manageCategoryFilter === 'all' || course.category === manageCategoryFilter;
    const matchesLevel = manageLevelFilter === 'all' || course.level === manageLevelFilter;
    const matchesInstructor = manageInstructorFilter === 'all' || course.instructor === manageInstructorFilter;
    
    return matchesSearch && matchesCategory && matchesLevel && matchesInstructor;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Course Catalog View */}
      {currentSubPage === 'course-catalog' && (
        <CourseCatalog
          courses={companyCourses}
          categories={categories}
          onCourseClick={(courseId) => {
            const course = companyCourses.find(c => c.id === courseId);
            if (course) {
              setSelectedCourseForBuilder(course);
            }
          }}
          onCreateCourse={() => onSubPageChange?.('add-course')}
          onImportCourse={() => {
            // Handle import course
            alert('Import course functionality coming soon!');
          }}
          onUpdateCategories={onUpdateCategories}
          onUpdateCourseAssignments={onUpdateCourseAssignments}
        />
      )}

      {/* All Courses View */}
      {currentSubPage === 'all-courses' && (
        <>
          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">All Courses</h1>
                <p className="text-gray-600">{filteredCourses.length} courses available</p>
              </div>
              <button 
                onClick={() => onSubPageChange?.('add-course')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Plus className="size-4" />
                Add New Course
              </button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search courses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
              >
                {courseCategories.map(category => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category}
                  </option>
                ))}
              </select>
              <select
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="all">All Levels</option>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>
          </div>

          {/* Courses Table */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Course</th>
                    {!companyId && <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Company</th>}
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Category</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Instructor</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Students</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Rating</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Level</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Duration</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCourses.map((course) => (
                    <tr key={course.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <img 
                            src={course.imageUrl} 
                            alt={course.title}
                            className="size-12 rounded object-cover"
                          />
                          <div>
                            <p className="font-medium text-gray-900">{course.title}</p>
                            <p className="text-sm text-gray-600">{course.modules?.length || 0} modules</p>
                          </div>
                        </div>
                      </td>
                      {!companyId && (
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <Building2 className="size-4 text-gray-400" />
                            <span className="text-gray-700">{getCompanyName(course.companyId)}</span>
                          </div>
                        </td>
                      )}
                      <td className="py-4 px-4 text-gray-600">{course.category}</td>
                      <td className="py-4 px-4 text-gray-600">{course.instructor}</td>
                      <td className="py-4 px-4 text-gray-600">{course.studentsEnrolled.toLocaleString()}</td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1">
                          <span className="text-yellow-500">★</span>
                          <span className="text-gray-900">{course.rating}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          course.level === 'Beginner' ? 'bg-green-100 text-green-700' :
                          course.level === 'Intermediate' ? 'bg-blue-100 text-blue-700' :
                          'bg-purple-100 text-purple-700'
                        }`}>
                          {course.level}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-gray-600">{course.duration}</td>
                      <td className="py-4 px-4">
                        <div className="flex gap-2">
                          <button className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors">
                            <Eye className="size-4" />
                          </button>
                          <button 
                            onClick={() => setSelectedCourseForBuilder(course)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded transition-colors"
                          >
                            <Edit className="size-4" />
                          </button>
                          <button className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors">
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <p className="text-sm text-gray-600 mb-1">Total Courses</p>
              <p className="text-3xl font-bold text-gray-900">{companyCourses.length}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <p className="text-sm text-gray-600 mb-1">Total Students</p>
              <p className="text-3xl font-bold text-gray-900">
                {companyCourses.reduce((sum, course) => sum + course.studentsEnrolled, 0).toLocaleString()}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <p className="text-sm text-gray-600 mb-1">Avg Rating</p>
              <p className="text-3xl font-bold text-gray-900">
                {companyCourses.length > 0 
                  ? (companyCourses.reduce((sum, course) => sum + course.rating, 0) / companyCourses.length).toFixed(1)
                  : '0.0'}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <p className="text-sm text-gray-600 mb-1">Total Modules</p>
              <p className="text-3xl font-bold text-gray-900">
                {companyCourses.reduce((sum, course) => sum + (course.modules?.length || 0), 0)}
              </p>
            </div>
          </div>
        </>
      )}

      {/* Add New Course View */}
      {currentSubPage === 'add-course' && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Add New Course</h1>
          <form 
            className="space-y-6 max-w-3xl"
            onSubmit={handleCreateCourse}
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Course Title *</label>
              <input
                type="text"
                required
                value={courseFormData.title}
                onChange={(e) => setCourseFormData({ ...courseFormData, title: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter course title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={courseFormData.description}
                onChange={(e) => setCourseFormData({ ...courseFormData, description: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
                placeholder="Enter course description"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cover Image <span className="text-gray-500 text-xs font-normal">(optional)</span>
              </label>
              <input
                type="file"
                accept="image/*"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100"
              />
              <p className="mt-1 text-sm text-gray-500">Upload a course thumbnail or cover image</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Course URL</label>
              <div className="flex items-center">
                <span className="px-4 py-3 bg-gray-100 border border-r-0 border-gray-300 rounded-l-lg text-gray-600">
                  teachly.com/
                </span>
                <input
                  type="text"
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="course-url-slug"
                />
              </div>
              <p className="mt-1 text-sm text-gray-500">Choose a unique URL for this course</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Course Access</label>
                <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>Select access type</option>
                  <option>Draft</option>
                  <option>Free</option>
                  <option>Coming Soon</option>
                  <option>Paid</option>
                  <option>Private</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Duration</label>
                <input
                  type="text"
                  value={courseFormData.duration}
                  onChange={(e) => setCourseFormData({ ...courseFormData, duration: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 8 hours"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Instructor</label>
                <input
                  type="text"
                  value={courseFormData.instructor}
                  onChange={(e) => setCourseFormData({ ...courseFormData, instructor: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Instructor name"
                />
              </div>
            </div>
            <div className="flex gap-4">
              <button 
                type="submit" 
                disabled={isCreatingCourse}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreatingCourse ? 'Creating...' : 'Create Course'}
              </button>
              <button 
                type="button" 
                onClick={() => onSubPageChange?.('course-catalog')}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Manage Content View */}
      {currentSubPage === 'manage-courses' && (
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Manage Content</h1>
                <p className="text-gray-600">{filteredManageCourses.length} of {companyCourses.length} courses</p>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="size-5 text-gray-600" />
              <h2 className="font-semibold text-gray-900">Filter Courses</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search courses..."
                  value={manageSearchQuery}
                  onChange={(e) => setManageSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <select
                value={manageCategoryFilter}
                onChange={(e) => setManageCategoryFilter(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
              >
                {courseCategories.map(category => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category}
                  </option>
                ))}
              </select>
              <select
                value={manageLevelFilter}
                onChange={(e) => setManageLevelFilter(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="all">All Levels</option>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
              <select
                value={manageInstructorFilter}
                onChange={(e) => setManageInstructorFilter(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
              >
                {instructors.map(instructor => (
                  <option key={instructor} value={instructor}>
                    {instructor === 'all' ? 'All Instructors' : instructor}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Course List */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="space-y-4">
              {filteredManageCourses.length > 0 ? (
                filteredManageCourses.map((course) => (
                  <div key={course.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-500 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <img 
                          src={course.imageUrl} 
                          alt={course.title}
                          className="size-16 rounded object-cover"
                        />
                        <div>
                          <h3 className="font-semibold text-gray-900">{course.title}</h3>
                          <div className="flex items-center gap-3 mt-1">
                            <p className="text-sm text-gray-600">{course.modules?.length || 0} modules</p>
                            <span className="text-gray-300">•</span>
                            <p className="text-sm text-gray-600">{course.studentsEnrolled} students</p>
                            <span className="text-gray-300">•</span>
                            <p className="text-sm text-gray-600">{course.instructor}</p>
                            <span className="text-gray-300">•</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              course.level === 'Beginner' ? 'bg-green-100 text-green-700' :
                              course.level === 'Intermediate' ? 'bg-blue-100 text-blue-700' :
                              'bg-purple-100 text-purple-700'
                            }`}>
                              {course.level}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => setSelectedCourseForBuilder(course)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                        >
                          <Edit className="size-4" />
                          Edit Modules
                        </button>
                        <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2">
                          <Eye className="size-4" />
                          Preview
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-lg">No courses found matching your filters.</p>
                  <p className="text-gray-400 text-sm mt-2">Try adjusting your search criteria.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Course Performance View */}
      {currentSubPage === 'course-analytics' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Course Performance</h1>
            <p className="text-gray-600">Analyze course metrics and student engagement</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <p className="text-sm text-gray-600 mb-1">Total Enrollments</p>
              <p className="text-3xl font-bold text-gray-900">
                {companyCourses.reduce((sum, course) => sum + course.studentsEnrolled, 0).toLocaleString()}
              </p>
              <p className="text-sm text-green-600 mt-2">↑ 12% from last month</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <p className="text-sm text-gray-600 mb-1">Completion Rate</p>
              <p className="text-3xl font-bold text-gray-900">78%</p>
              <p className="text-sm text-green-600 mt-2">↑ 5% from last month</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <p className="text-sm text-gray-600 mb-1">Average Rating</p>
              <p className="text-3xl font-bold text-gray-900">
                {companyCourses.length > 0 
                  ? (companyCourses.reduce((sum, course) => sum + course.rating, 0) / companyCourses.length).toFixed(1)
                  : '0.0'}
              </p>
              <p className="text-sm text-green-600 mt-2">↑ 0.3 from last month</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Top Performing Courses</h2>
            <div className="space-y-3">
              {companyCourses
                .sort((a, b) => b.studentsEnrolled - a.studentsEnrolled)
                .slice(0, 5)
                .map((course, index) => (
                  <div key={course.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                    <div className="flex items-center gap-4">
                      <span className="text-2xl font-bold text-gray-300">#{index + 1}</span>
                      <div>
                        <p className="font-medium text-gray-900">{course.title}</p>
                        <p className="text-sm text-gray-600">{course.category}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{course.studentsEnrolled.toLocaleString()} students</p>
                      <p className="text-sm text-gray-600">★ {course.rating}</p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Programs/Subscription View */}
      {currentSubPage === 'programs-subscription' && (
        <div className="space-y-6">
          {/* Header Section */}
          <div className="bg-white rounded-lg shadow-sm p-6 relative">
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">Programs / Subscriptions</h1>
              <button 
                onClick={() => setActivePopover(activePopover === 'programs' ? null : 'programs')}
                className="hover:bg-blue-50 rounded-full p-1 transition-colors"
              >
                <Info className="size-3.5 text-blue-600 cursor-pointer" />
              </button>
            </div>
            <p className="text-gray-600 mb-4">Create and manage learning paths or course collections. Offer them for free, as one-time purchases, with installment plans, subscriptions, or even tiered subscription options.</p>
            <button 
              onClick={() => setShowCreateProgramModal(true)}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors flex items-center gap-2"
            >
              Create program/subscription
            </button>
            {activePopover === 'programs' && (
              <div className="absolute top-20 left-6 right-6 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-20">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">About Programs & Subscriptions</h3>
                  <button onClick={() => setActivePopover(null)} className="text-gray-400 hover:text-gray-600">
                    <X className="size-4" />
                  </button>
                </div>
                <p className="text-sm text-gray-600">
                  Create structured learning paths by bundling multiple courses together. Programs help organize training into cohesive curriculum while subscriptions give learners ongoing access to your content library.
                </p>
              </div>
            )}
          </div>

          {/* Build Learning Programs Section */}
          <div className="bg-white rounded-lg shadow-sm p-8">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Build Learning Programs that power purposeful progress</h2>
              <p className="text-gray-600 mb-6">
                With Learning Programs, you can offer related courses in one structured experience—from onboarding and role-specific upskilling to audit-ready compliance—guiding every employee from day one to job-ready.
              </p>
              <button 
                onClick={() => setShowCreateProgramModal(true)}
                className="px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors flex items-center gap-2"
              >
                Create a learning program
              </button>
            </div>
          </div>

          {/* Why choose Learning Programs Section */}
          <div className="bg-gray-50 rounded-lg shadow-sm p-8">
            <h2 className="text-3xl font-semibold text-gray-900 text-center mb-4">Why choose Learning Programs to train your people?</h2>
            <p className="text-gray-600 text-center max-w-4xl mx-auto">
              Learning Programs give every team a clear, organized learning experience. Use paths or collections to help learners navigate your content, track progress, and move confidently through onboarding, skill growth, or compliance.
            </p>
          </div>

          {/* Create Program Modal */}
          {showCreateProgramModal && (
            <div className="fixed inset-0 backdrop-blur-sm bg-white/30 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-gray-900">Create Learning Program</h2>
                    <button 
                      onClick={() => {
                        setShowCreateProgramModal(false);
                        setProgramName('');
                        setProgramDescription('');
                        setProgramType('free');
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="size-6" />
                    </button>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  {/* Program Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Program Name *
                    </label>
                    <input
                      type="text"
                      value={programName}
                      onChange={(e) => setProgramName(e.target.value)}
                      placeholder="e.g., Employee Onboarding Program"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  </div>

                  {/* Program Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={programDescription}
                      onChange={(e) => setProgramDescription(e.target.value)}
                      placeholder="Describe the learning program and its objectives..."
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                    />
                  </div>

                  {/* Program Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Access Type *
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        onClick={() => setProgramType('free')}
                        className={`p-4 border-2 rounded-lg text-left transition-all ${
                          programType === 'free'
                            ? 'border-teal-600 bg-teal-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="font-semibold text-gray-900">Free</div>
                        <div className="text-sm text-gray-600 mt-1">No cost to access</div>
                      </button>
                      <button
                        onClick={() => setProgramType('one-time')}
                        className={`p-4 border-2 rounded-lg text-left transition-all ${
                          programType === 'one-time'
                            ? 'border-teal-600 bg-teal-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="font-semibold text-gray-900">One-Time Purchase</div>
                        <div className="text-sm text-gray-600 mt-1">Single payment</div>
                      </button>
                      <button
                        onClick={() => setProgramType('installment')}
                        className={`p-4 border-2 rounded-lg text-left transition-all ${
                          programType === 'installment'
                            ? 'border-teal-600 bg-teal-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="font-semibold text-gray-900">Installment Plan</div>
                        <div className="text-sm text-gray-600 mt-1">Split payments</div>
                      </button>
                      <button
                        onClick={() => setProgramType('subscription')}
                        className={`p-4 border-2 rounded-lg text-left transition-all ${
                          programType === 'subscription'
                            ? 'border-teal-600 bg-teal-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="font-semibold text-gray-900">Subscription</div>
                        <div className="text-sm text-gray-600 mt-1">Recurring payments</div>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-6 border-t border-gray-200 flex gap-3 justify-end">
                  <button
                    onClick={() => {
                      setShowCreateProgramModal(false);
                      setProgramName('');
                      setProgramDescription('');
                      setProgramType('free');
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      // TODO: Handle program creation
                      console.log('Creating program:', { programName, programDescription, programType });
                      setShowCreateProgramModal(false);
                      setProgramName('');
                      setProgramDescription('');
                      setProgramType('free');
                    }}
                    disabled={!programName}
                    className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Create Program
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Gradebook View */}
      {currentSubPage === 'gradebook' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm p-6 relative pb-20">
            <div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <h1 className="text-3xl font-bold text-gray-900">Gradebook</h1>
                  <button 
                    onClick={() => setActivePopover(activePopover === 'gradebook' ? null : 'gradebook')}
                    className="hover:bg-blue-50 rounded-full p-1 transition-colors"
                  >
                    <Info className="size-3.5 text-blue-600 cursor-pointer" />
                  </button>
                </div>
                <p className="text-gray-600">Monitor user performance and manage your students' grades in exams, assignments, and certifications.</p>
              </div>
              <div className="absolute bottom-6 left-6 flex gap-3">
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Export Grades
                </button>
                <button className="px-4 py-2 bg-blue-600 text-white border border-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
                  Export grades with all tries
                </button>
              </div>
            </div>
            {activePopover === 'gradebook' && (
              <div className="absolute top-20 left-6 right-6 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-20">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">About Gradebook</h3>
                  <button onClick={() => setActivePopover(null)} className="text-gray-400 hover:text-gray-600">
                    <X className="size-4" />
                  </button>
                </div>
                <p className="text-sm text-gray-600">
                  Track and monitor student performance across all courses. View grades, progress percentages, and activity status in one centralized location. Export grade reports for administrative purposes or student records.
                </p>
              </div>
            )}
          </div>

          {/* Course Selection Section */}
          <div className="bg-white rounded-lg shadow-sm p-8">
            <div className="max-w-2xl mx-auto text-center space-y-6">
              <h2 className="text-2xl font-semibold text-gray-900">Select a course to access its gradebook</h2>
              
              <select className="w-full max-w-md mx-auto px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-600">
                <option>Select a course</option>
                {companyCourses.map(course => (
                  <option key={course.id}>{course.title}</option>
                ))}
              </select>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <Info className="size-5 text-green-600" />
                </div>
                <div className="text-left">
                  <p className="text-gray-700">
                    Unlock the power of knowledge! Dive into our{' '}
                    <a href="#" className="text-blue-600 hover:underline">Learn more section</a>
                    {' '}for all the details.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Activity Matrix View */}
      {currentSubPage === 'activity-matrix' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm p-6 relative">
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">Activity Matrix</h1>
              <button 
                onClick={() => setActivePopover(activePopover === 'activity-matrix' ? null : 'activity-matrix')}
                className="hover:bg-blue-50 rounded-full p-1 transition-colors"
              >
                <Info className="size-3.5 text-blue-600 cursor-pointer" />
              </button>
            </div>
            <p className="text-gray-600">Monitor user progress and engagement for each course in a single view with the activity matrix</p>
            {activePopover === 'activity-matrix' && (
              <div className="absolute top-20 left-6 right-6 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-20">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">About Activity Matrix</h3>
                  <button onClick={() => setActivePopover(null)} className="text-gray-400 hover:text-gray-600">
                    <X className="size-4" />
                  </button>
                </div>
                <p className="text-sm text-gray-600">
                  Get real-time insights into learner engagement and activity patterns. Monitor who's actively learning, track session times, and identify trends in course completion to optimize your training programs.
                </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <p className="text-sm text-gray-600 mb-1">Total Activities</p>
              <p className="text-3xl font-bold text-gray-900">1,247</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <p className="text-sm text-gray-600 mb-1">Active Users</p>
              <p className="text-3xl font-bold text-gray-900">432</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <p className="text-sm text-gray-600 mb-1">Avg. Session Time</p>
              <p className="text-3xl font-bold text-gray-900">28m</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <p className="text-sm text-gray-600 mb-1">Completion Rate</p>
              <p className="text-3xl font-bold text-gray-900">82%</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activities</h2>
            <div className="space-y-3">
              {[
                { user: 'John Smith', activity: 'Completed lesson', course: 'Leadership Fundamentals', time: '5 minutes ago' },
                { user: 'Sarah Johnson', activity: 'Started course', course: 'Data Analytics', time: '12 minutes ago' },
                { user: 'Michael Chen', activity: 'Submitted assignment', course: 'Project Management', time: '18 minutes ago' },
                { user: 'Emily Davis', activity: 'Passed quiz', course: 'Marketing Basics', time: '25 minutes ago' },
                { user: 'David Wilson', activity: 'Watched video', course: 'Sales Techniques', time: '32 minutes ago' },
              ].map((activity, index) => (
                <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                  <div className="flex items-center gap-4">
                    <div className="size-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-blue-600 font-semibold text-sm">{activity.user.split(' ').map(n => n[0]).join('')}</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{activity.user} - {activity.activity}</p>
                      <p className="text-sm text-gray-600">{activity.course}</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500">{activity.time}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Certificates View */}
      {currentSubPage === 'certificates' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm p-6 relative">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <h1 className="text-3xl font-bold text-gray-900">Certificates</h1>
                  <button 
                    onClick={() => setActivePopover(activePopover === 'certificates' ? null : 'certificates')}
                    className="hover:bg-blue-50 rounded-full p-1 transition-colors"
                  >
                    <Info className="size-3.5 text-blue-600 cursor-pointer" />
                  </button>
                </div>
                <p className="text-gray-600">Manage course completion certificates</p>
              </div>
              <div className="flex items-center gap-2">
              <button
                onClick={() => { setUploadFile(null); setUploadTemplateName(''); setUploadDone(false); setShowUploadModal(true); }}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm font-medium">
                <Upload className="size-4" />
                Upload Certificate
              </button>
              <button
                onClick={() => {
                  const newId = Date.now();
                  const newTpl = { id: newId, name: 'New Template', courses: 0, color: '#1d4ed8', accent: '#3b82f6', description: 'Enter a description for this certificate.', ...defaultCertFields };
                  setCertTemplates(prev => [...prev, newTpl]);
                  setCertDraft(newTpl);
                  setEditingCertId(newId);
                  setCertIsNew(true);
                  setPreviewingCertId(null);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
                <Plus className="size-4" />
                Create Template
              </button>
              </div>
            </div>
            {activePopover === 'certificates' && (
              <div className="absolute top-20 left-6 right-6 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-20">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">About Certificates</h3>
                  <button onClick={() => setActivePopover(null)} className="text-gray-400 hover:text-gray-600">
                    <X className="size-4" />
                  </button>
                </div>
                <p className="text-sm text-gray-600">
                  Create professional certificate templates to recognize course completion. Customize designs, manage issuance, and track certificate distribution to motivate learners and validate their achievements.
                </p>
              </div>
            )}
          </div>

          {/* Certificate Analytics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Issued',      value: '2,847', sub: '+12% vs last month',  icon: Award,       color: 'text-blue-600',   bg: 'bg-blue-50',   border: 'border-l-4 border-blue-500' },
              { label: 'Issued This Month', value: '156',   sub: '↑ 23 from last month',    icon: TrendingUp,      color: 'text-green-600',  bg: 'bg-green-50',  border: 'border-l-4 border-green-500' },
              { label: 'Revoked',           value: '14',    sub: '0.49% of total issued',   icon: X,               color: 'text-red-500',    bg: 'bg-red-50',    border: 'border-l-4 border-red-400' },
              { label: 'Active Templates',  value: '4',     sub: '4 in use across courses', icon: LayoutTemplate,  color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-l-4 border-purple-500' },
            ].map(({ label, value, sub, icon: Icon, color, bg, border }) => (
              <div key={label} className={`bg-white rounded-lg shadow-sm p-5 ${border}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{label}</p>
                    <p className="text-3xl font-bold text-gray-900">{value}</p>
                    <p className="text-xs text-gray-400 mt-1">{sub}</p>
                  </div>
                  <div className={`size-10 ${bg} rounded-lg flex items-center justify-center shrink-0`}>
                    <Icon className={`size-5 ${color}`} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Most Awarded + Issuance Trend side-by-side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

            {/* Most Awarded Certificates */}
            <div className="bg-white rounded-lg shadow-sm p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Most Awarded Certificates</h3>
              <div className="space-y-3">
                {[
                  { name: 'Professional Certificate', count: 1204, pct: 100 },
                  { name: 'Course Completion',        count: 892,  pct: 74  },
                  { name: 'Excellence Award',          count: 481,  pct: 40  },
                  { name: 'Mastery Certificate',       count: 270,  pct: 22  },
                ].map(({ name, count, pct }) => (
                  <div key={name}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-700 flex items-center gap-2">
                        <Award className="size-3.5 text-blue-500" />
                        {name}
                      </span>
                      <span className="text-sm font-semibold text-gray-900">{count.toLocaleString()}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Monthly Issuance Breakdown */}
            <div className="bg-white rounded-lg shadow-sm p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Monthly Issuance (Last 6 Months)</h3>
              <div className="space-y-2.5">
                {[
                  { month: 'May 2026',      count: 156, max: 210 },
                  { month: 'April 2026',    count: 210, max: 210 },
                  { month: 'March 2026',    count: 184, max: 210 },
                  { month: 'February 2026', count: 143, max: 210 },
                  { month: 'January 2026',  count: 98,  max: 210 },
                  { month: 'December 2025', count: 127, max: 210 },
                ].map(({ month, count, max }) => (
                  <div key={month} className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 w-28 shrink-0">{month}</span>
                    <div className="flex-1 h-5 bg-gray-100 rounded overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded flex items-center justify-end pr-2 transition-all"
                        style={{ width: `${(count / max) * 100}%` }}
                      >
                        <span className="text-[10px] text-white font-semibold">{count}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                <span className="text-xs text-gray-400">Peak month: April 2026</span>
                <span className="text-xs font-semibold text-blue-600">918 total in period</span>
              </div>
            </div>
          </div>

          {/* Awards Issued */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Awards Issued</h2>
                <p className="text-sm text-gray-500 mt-0.5">Certificates and awards granted to learners</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search learners..."
                    className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent w-52"
                  />
                </div>
                <button className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                  <Filter className="size-4" />
                  Filter
                </button>
                <button className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                  <Download className="size-4" />
                  Export
                </button>
              </div>
            </div>

            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide pb-3 pr-4">Learner</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide pb-3 pr-4">Certificate</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide pb-3 pr-4">Course</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide pb-3 pr-4">Date Issued</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide pb-3 pr-4">Status</th>
                  <th className="pb-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {[
                  { name: 'Sarah Johnson',  email: 'sarah.j@example.com',  initials: 'SJ', color: 'bg-purple-100 text-purple-700', cert: 'Professional Certificate', course: 'React Advanced',        date: 'May 10, 2026', status: 'Active' },
                  { name: 'Mike Chen',      email: 'mike.c@example.com',   initials: 'MC', color: 'bg-blue-100 text-blue-700',   cert: 'Course Completion',        course: 'Python for Data',      date: 'May 8, 2026',  status: 'Active' },
                  { name: 'Emma Davis',     email: 'emma.d@example.com',   initials: 'ED', color: 'bg-green-100 text-green-700', cert: 'Excellence Award',          course: 'UI/UX Design',         date: 'May 5, 2026',  status: 'Active' },
                  { name: 'John Smith',     email: 'john.s@example.com',   initials: 'JS', color: 'bg-orange-100 text-orange-700',cert: 'Mastery Certificate',      course: 'Node.js Fundamentals', date: 'Apr 29, 2026', status: 'Active' },
                  { name: 'Aisha Patel',    email: 'aisha.p@example.com',  initials: 'AP', color: 'bg-teal-100 text-teal-700',   cert: 'Course Completion',        course: 'Cloud Architecture',   date: 'Apr 22, 2026', status: 'Active' },
                  { name: 'Lucas Wright',   email: 'lucas.w@example.com',  initials: 'LW', color: 'bg-red-100 text-red-700',     cert: 'Professional Certificate', course: 'Cybersecurity Basics', date: 'Apr 18, 2026', status: 'Revoked' },
                  { name: 'Chloe Martinez', email: 'chloe.m@example.com',  initials: 'CM', color: 'bg-pink-100 text-pink-700',   cert: 'Excellence Award',          course: 'Digital Marketing',    date: 'Apr 10, 2026', status: 'Expired' },
                ].map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition-colors group">
                    {/* Learner */}
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-3">
                        <div className={`size-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${row.color}`}>
                          {row.initials}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{row.name}</p>
                          <p className="text-xs text-gray-400">{row.email}</p>
                        </div>
                      </div>
                    </td>
                    {/* Certificate */}
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <Award className="size-4 text-blue-500 shrink-0" />
                        <span className="text-gray-700">{row.cert}</span>
                      </div>
                    </td>
                    {/* Course */}
                    <td className="py-3 pr-4 text-gray-600">{row.course}</td>
                    {/* Date */}
                    <td className="py-3 pr-4 text-gray-500">{row.date}</td>
                    {/* Status */}
                    <td className="py-3 pr-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        row.status === 'Active'  ? 'bg-green-100 text-green-700' :
                        row.status === 'Expired' ? 'bg-gray-100 text-gray-500'  :
                                                   'bg-red-100 text-red-600'
                      }`}>
                        {row.status}
                      </span>
                    </td>
                    {/* Actions */}
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button title="View certificate" className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                          <Eye className="size-4" />
                        </button>
                        <button title="Download" className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                          <Download className="size-4" />
                        </button>
                        <button title="Revoke" className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-5 pt-4 border-t border-gray-100">
              <p className="text-sm text-gray-500">Showing 7 of 2,847 awards</p>
              <div className="flex items-center gap-1">
                <button className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 disabled:opacity-40" disabled>Previous</button>
                <button className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">1</button>
                <button className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">2</button>
                <button className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">3</button>
                <button className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">Next</button>
              </div>
            </div>
          </div>

          {/* Certificate Templates */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-semibold text-gray-900">Certificate Templates</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  <Upload className="size-4" /> Upload Certificate
                </button>
                <button
                  onClick={() => {
                    const newId = Date.now();
                    const newTpl = { id: newId, name: 'New Template', courses: 0, color: '#1d4ed8', accent: '#3b82f6', description: 'Enter a description for this certificate.', ...defaultCertFields };
                    setCertTemplates(prev => [...prev, newTpl]);
                    setCertDraft(newTpl);
                    setEditingCertId(newId);
                    setCertIsNew(true);
                    setPreviewingCertId(null);
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  <Plus className="size-4" /> Create Template
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {certTemplates.map((tpl) => (
                <div key={tpl.id} className="border-2 border-gray-200 hover:border-blue-300 rounded-lg p-4 transition-colors">
                  {/* Thumbnail */}
                  <div
                    className="rounded-lg h-32 mb-3 flex items-center justify-center relative overflow-hidden"
                    style={{ background: `linear-gradient(135deg, ${tpl.color}18, ${tpl.accent}30)` }}
                  >
                    <div className="absolute inset-3 border-2 rounded flex flex-col items-center justify-center" style={{ borderColor: `${tpl.accent}60` }}>
                      <Award className="size-7 mb-1" style={{ color: tpl.color }} />
                      <span className="text-[9px] font-bold text-center px-2 leading-tight" style={{ color: tpl.color }}>
                        {tpl.name}
                      </span>
                    </div>
                  </div>
                  <h3 className="font-semibold text-gray-900">{tpl.name}</h3>
                  <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{tpl.description}</p>
                  <p className="text-xs text-gray-400 mt-1">Used in {tpl.courses} courses</p>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => { setEditingCertId(tpl.id); setCertDraft({ ...tpl }); setCertIsNew(false); setPreviewingCertId(null); }}
                      className="flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors border border-gray-300 text-gray-700 hover:bg-gray-50"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => { setPreviewingCertId(tpl.id); setEditingCertId(null); setCertDraft(null); }}
                      className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      Preview
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* ── Edit Modal ───────────────────────────────────────────────── */}
            {editingCertId !== null && certDraft && (
              <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => { setEditingCertId(null); setCertDraft(null); }}>
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden" onClick={e => e.stopPropagation()}>

                  {/* Modal header */}
                  <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-900">{certIsNew ? 'Create Certificate Template' : 'Edit Certificate Template'}</h2>
                    <button
                      onClick={() => { setEditingCertId(null); setCertDraft(null); }}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <X className="size-5" />
                    </button>
                  </div>

                  {/* Modal body */}
                  <div className="flex divide-x divide-gray-100" style={{ height: 'min(72vh, 640px)', overflow: 'hidden' }}>

                    {/* Left — all editable fields */}
                    <div className="flex-1 p-6 overflow-y-auto space-y-5">

                      {/* ── Identity ── */}
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Identity</p>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Template Name</label>
                            <input type="text" value={certDraft.name}
                              onChange={e => setCertDraft({ ...certDraft, name: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Organisation / Issuer</label>
                            <input type="text" value={certDraft.organisation}
                              onChange={e => setCertDraft({ ...certDraft, organisation: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Issuing Department</label>
                            <input type="text" value={certDraft.department}
                              onChange={e => setCertDraft({ ...certDraft, department: e.target.value })}
                              placeholder="e.g. HR, Safety Officer"
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Certificate Number</label>
                            <input type="text" value={certDraft.certNumber}
                              onChange={e => setCertDraft({ ...certDraft, certNumber: e.target.value })}
                              placeholder="e.g. CERT-2026-001 (leave blank to auto-generate)"
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                            <textarea value={certDraft.description}
                              onChange={e => setCertDraft({ ...certDraft, description: e.target.value })}
                              rows={3}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none" />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Footer Note</label>
                            <textarea value={certDraft.footerNote}
                              onChange={e => setCertDraft({ ...certDraft, footerNote: e.target.value })}
                              rows={2}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none" />
                          </div>
                        </div>
                      </div>

                      {/* ── Signature & Date ── */}
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Signature & Date</p>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Training Facilitator / Signatory</label>
                            <input type="text" value={certDraft.instructor}
                              onChange={e => setCertDraft({ ...certDraft, instructor: e.target.value })}
                              placeholder="e.g. Course Instructor"
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Second Signatory <span className="text-gray-400 font-normal">(HR Manager / Department Head)</span></label>
                            <input type="text" value={certDraft.secondSignatory}
                              onChange={e => setCertDraft({ ...certDraft, secondSignatory: e.target.value })}
                              placeholder="e.g. HR Manager"
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Date of Issue</label>
                            <input type="text" value={certDraft.dateOfIssue}
                              onChange={e => setCertDraft({ ...certDraft, dateOfIssue: e.target.value })}
                              placeholder="e.g. May 13, 2026"
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Training Duration</label>
                            <input type="text" value={certDraft.duration}
                              onChange={e => setCertDraft({ ...certDraft, duration: e.target.value })}
                              placeholder="e.g. 8 hours, 2 days"
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                          </div>
                        </div>
                      </div>

                      {/* ── Appearance ── */}
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Appearance</p>
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Primary Colour</label>
                            <div className="flex items-center gap-2">
                              <input type="color" value={certDraft.color}
                                onChange={e => setCertDraft({ ...certDraft, color: e.target.value })}
                                className="h-9 w-12 rounded border border-gray-200 cursor-pointer" />
                              <span className="text-xs text-gray-500 font-mono">{certDraft.color}</span>
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Accent Colour</label>
                            <div className="flex items-center gap-2">
                              <input type="color" value={certDraft.accent}
                                onChange={e => setCertDraft({ ...certDraft, accent: e.target.value })}
                                className="h-9 w-12 rounded border border-gray-200 cursor-pointer" />
                              <span className="text-xs text-gray-500 font-mono">{certDraft.accent}</span>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          {[
                            { key: 'showLogo',             label: 'Show award icon / logo' },
                            { key: 'showCourseName',       label: 'Show course name pill' },
                            { key: 'showSignatureLine',    label: 'Show training facilitator signature' },
                            { key: 'showSecondSignatory',  label: 'Show second signatory line' },
                            { key: 'showDateLine',         label: 'Show date of issue line' },
                            { key: 'showDuration',         label: 'Show training duration' },
                            { key: 'showCertNumber',       label: 'Show certificate number' },
                          ].map(({ key, label }) => (
                            <div key={key} className="flex items-center gap-2.5 cursor-pointer group"
                              onClick={() => setCertDraft(d => ({ ...d!, [key]: !(d as any)[key] }))}>
                              <div
                                className={`relative inline-flex h-5 w-9 rounded-full transition-colors shrink-0 ${(certDraft as any)[key] ? 'bg-blue-500' : 'bg-gray-300'}`}
                              >
                                <span className={`inline-block h-4 w-4 mt-0.5 rounded-full bg-white shadow transition-transform ${(certDraft as any)[key] ? 'translate-x-4' : 'translate-x-0.5'}`} />
                              </div>
                              <span className="text-sm text-gray-700">{label}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>

                    {/* Right — live preview / overlay canvas */}
                    <div className="flex-1 p-4 flex flex-col bg-gray-50 overflow-y-auto">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                        {(certDraft as any).uploadedFileUrl ? 'Certificate Preview' : 'Live Preview'}
                      </p>

                      {/* ── Uploaded certificate preview ── */}
                      {(certDraft as any).uploadedFileUrl ? (
                        <div className="flex-1 rounded-xl overflow-hidden border border-gray-200 bg-white flex items-center justify-center" style={{ minHeight: '400px' }}>
                          {!(certDraft as any).uploadedFileName?.endsWith('.pdf') ? (
                            <img src={(certDraft as any).uploadedFileUrl} alt="Certificate" className="w-full h-full object-contain" />
                          ) : (
                            <div className="flex flex-col items-center justify-center gap-2 text-gray-400">
                              <FileUp className="size-10" />
                              <p className="text-xs">{(certDraft as any).uploadedFileName}</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        /* ── Generated template preview ── */
                        <div
                          className="flex-1 rounded-xl relative overflow-hidden border flex items-center justify-center"
                          style={{ background: `linear-gradient(135deg, ${certDraft.color}10, ${certDraft.accent}1e)`, borderColor: `${certDraft.accent}40`, minHeight: '320px' }}
                        >
                          {/* Corner accents */}
                          <div className="absolute top-3 left-3 size-5 border-t-2 border-l-2" style={{ borderColor: certDraft.accent }} />
                          <div className="absolute top-3 right-3 size-5 border-t-2 border-r-2" style={{ borderColor: certDraft.accent }} />
                          <div className="absolute bottom-3 left-3 size-5 border-b-2 border-l-2" style={{ borderColor: certDraft.accent }} />
                          <div className="absolute bottom-3 right-3 size-5 border-b-2 border-r-2" style={{ borderColor: certDraft.accent }} />

                          <div className="text-center px-8 py-6 w-full">
                            {certDraft.showLogo && <Award className="size-10 mx-auto mb-2" style={{ color: certDraft.color }} />}
                            <p className="text-[8px] font-bold uppercase tracking-[0.3em] mb-0 text-gray-400">{certDraft.organisation}</p>
                            <p className="text-[7px] uppercase tracking-[0.15em] text-gray-300 mb-1">{certDraft.department}</p>
                            <p className="text-[9px] font-bold uppercase tracking-[0.2em] mb-2" style={{ color: certDraft.accent }}>This is to certify that</p>
                            <p className="text-lg font-bold text-gray-800 italic mb-0.5">Student Full Name</p>
                            <p className="text-[10px] text-gray-400 mb-3">has successfully completed</p>
                            {certDraft.showCourseName && (
                              <div className="inline-block px-4 py-1 rounded-full mb-1" style={{ backgroundColor: `${certDraft.color}18` }}>
                                <p className="text-sm font-bold" style={{ color: certDraft.color }}>{certDraft.name || 'Template Name'}</p>
                              </div>
                            )}
                            {certDraft.showDuration && certDraft.duration && (
                              <p className="text-[9px] text-gray-400 mt-1">Duration: <span className="font-semibold text-gray-600">{certDraft.duration}</span></p>
                            )}
                            <p className="text-[10px] text-gray-400 mt-1 line-clamp-2 max-w-[220px] mx-auto">{certDraft.description}</p>
                            {(certDraft.showSignatureLine || certDraft.showSecondSignatory || certDraft.showDateLine) && (
                              <div className="flex items-end justify-center gap-5 mt-4 flex-wrap">
                                {certDraft.showSignatureLine && (
                                  <div className="text-center">
                                    <div className="h-px w-20 mb-1" style={{ backgroundColor: certDraft.accent }} />
                                    <p className="text-[9px] font-semibold text-gray-700">{certDraft.instructor || 'Facilitator'}</p>
                                    <p className="text-[7px] text-gray-400">Training Facilitator</p>
                                  </div>
                                )}
                                {certDraft.showSecondSignatory && certDraft.secondSignatory && (
                                  <div className="text-center">
                                    <div className="h-px w-20 mb-1" style={{ backgroundColor: certDraft.accent }} />
                                    <p className="text-[9px] font-semibold text-gray-700">{certDraft.secondSignatory}</p>
                                    <p className="text-[7px] text-gray-400">HR Manager</p>
                                  </div>
                                )}
                                {certDraft.showDateLine && (
                                  <div className="text-center">
                                    <div className="h-px w-20 mb-1" style={{ backgroundColor: certDraft.accent }} />
                                    <p className="text-[9px] font-semibold text-gray-700">{certDraft.dateOfIssue}</p>
                                    <p className="text-[7px] text-gray-400">Date of Issue</p>
                                  </div>
                                )}
                              </div>
                            )}
                            {(certDraft.showCertNumber && certDraft.certNumber) && (
                              <p className="text-[7px] text-gray-300 mt-3 font-mono tracking-wider">№ {certDraft.certNumber}</p>
                            )}
                            {certDraft.footerNote && (
                              <p className="text-[8px] text-gray-300 mt-2 max-w-[200px] mx-auto leading-relaxed">{certDraft.footerNote}</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Modal footer */}
                  <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50">
                    <button
                      onClick={() => { setCertTemplates(prev => prev.filter(t => t.id !== editingCertId)); setEditingCertId(null); setCertDraft(null); }}
                      className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="size-4" /> Delete template
                    </button>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => { setEditingCertId(null); setCertDraft(null); }}
                        className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => { setCertTemplates(prev => prev.map(t => t.id === editingCertId ? { ...certDraft } : t)); setEditingCertId(null); setCertDraft(null); }}
                        className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Save changes
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Upload Certificate Modal ── */}
            {showUploadModal && (
              <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowUploadModal(false)}>
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden" onClick={e => e.stopPropagation()}>
                  {/* Header */}
                  <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">Upload Certificate</h2>
                      <p className="text-xs text-gray-400 mt-0.5">Upload an existing certificate design (PDF or image)</p>
                    </div>
                    <button onClick={() => setShowUploadModal(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                      <X className="size-5" />
                    </button>
                  </div>

                  {/* Body */}
                  <div className="p-6 space-y-5">
                    {!uploadDone ? (
                      <>
                        {/* Template name */}
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Certificate Template Name</label>
                          <input
                            type="text"
                            value={uploadTemplateName}
                            onChange={e => setUploadTemplateName(e.target.value)}
                            placeholder="e.g. Safety Training Certificate"
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>

                        {/* Drop zone */}
                        <div
                          onDragOver={e => { e.preventDefault(); setUploadDragging(true); }}
                          onDragLeave={() => setUploadDragging(false)}
                          onDrop={e => {
                            e.preventDefault();
                            setUploadDragging(false);
                            const f = e.dataTransfer.files[0];
                            if (f) setUploadFile(f);
                          }}
                          onClick={() => uploadInputRef.current?.click()}
                          className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                            uploadDragging ? 'border-blue-400 bg-blue-50' : uploadFile ? 'border-green-400 bg-green-50' : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/40'
                          }`}
                        >
                          <input
                            ref={uploadInputRef}
                            type="file"
                            accept=".pdf,.png,.jpg,.jpeg,.svg"
                            className="hidden"
                            onChange={e => { const f = e.target.files?.[0]; if (f) setUploadFile(f); }}
                          />
                          {uploadFile ? (
                            <>
                              <FileUp className="size-10 mx-auto mb-3 text-green-500" />
                              <p className="text-sm font-semibold text-green-700">{uploadFile.name}</p>
                              <p className="text-xs text-green-500 mt-1">{(uploadFile.size / 1024).toFixed(1)} KB — click to replace</p>
                            </>
                          ) : (
                            <>
                              <Upload className="size-10 mx-auto mb-3 text-gray-300" />
                              <p className="text-sm font-semibold text-gray-600">Drag & drop your file here</p>
                              <p className="text-xs text-gray-400 mt-1">or click to browse — PDF, PNG, JPG, SVG up to 10 MB</p>
                            </>
                          )}
                        </div>

                        {/* Supported formats note */}
                        <div className="flex flex-wrap gap-2">
                          {['PDF', 'PNG', 'JPG', 'SVG'].map(fmt => (
                            <span key={fmt} className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded font-mono">.{fmt.toLowerCase()}</span>
                          ))}
                          <span className="text-xs text-gray-400 self-center ml-1">Max 10 MB per file</span>
                        </div>
                      </>
                    ) : (
                      /* Success state */
                      <div className="text-center py-6">
                        <CheckCircle2 className="size-14 mx-auto mb-4 text-green-500" />
                        <p className="text-lg font-semibold text-gray-800">Certificate uploaded!</p>
                        <p className="text-sm text-gray-400 mt-1">
                          <span className="font-medium text-gray-600">{uploadTemplateName || uploadFile?.name}</span> has been added to your templates.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
                    {!uploadDone ? (
                      <>
                        <button onClick={() => setShowUploadModal(false)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                          Cancel
                        </button>
                        <button
                          disabled={!uploadFile}
                          onClick={() => {
                            if (!uploadFile) return;
                            const newId = Date.now();
                            const label = uploadTemplateName.trim() || uploadFile.name.replace(/\.[^.]+$/, '');
                            const previewUrl = URL.createObjectURL(uploadFile);
                            const newTpl = {
                              ...defaultCertFields,
                              id: newId,
                              name: label,
                              courses: 0,
                              color: '#047857',
                              accent: '#10b981',
                              description: `Uploaded from ${uploadFile.name}`,
                              organisation: uploadTemplateName || label,
                              uploadedFileUrl: previewUrl,
                              uploadedFileName: uploadFile.name,
                            };
                            setCertTemplates(prev => [...prev, newTpl as any]);
                            setUploadDone(true);
                          }}
                          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                        >
                          <Upload className="size-4" /> Upload & Add Template
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setShowUploadModal(false)}
                        className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Done
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Full Preview Modal Overlay */}
            {previewingCertId !== null && (() => {
              const tpl = certTemplates.find(t => t.id === previewingCertId);
              if (!tpl) return null;
              return (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6" onClick={() => setPreviewingCertId(null)}>
                  <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-2" onClick={e => e.stopPropagation()}>
                    {/* Certificate */}
                    <div
                      className="rounded-xl p-10 relative overflow-hidden"
                      style={{ background: `linear-gradient(135deg, ${tpl.color}12, ${tpl.accent}20)` }}
                    >
                      {/* Decorative corner accents */}
                      <div className="absolute top-4 left-4 size-8 border-t-2 border-l-2 rounded-tl" style={{ borderColor: tpl.accent }} />
                      <div className="absolute top-4 right-4 size-8 border-t-2 border-r-2 rounded-tr" style={{ borderColor: tpl.accent }} />
                      <div className="absolute bottom-4 left-4 size-8 border-b-2 border-l-2 rounded-bl" style={{ borderColor: tpl.accent }} />
                      <div className="absolute bottom-4 right-4 size-8 border-b-2 border-r-2 rounded-br" style={{ borderColor: tpl.accent }} />

                      <div className="text-center">
                        <Award className="size-14 mx-auto mb-4" style={{ color: tpl.color }} />
                        <p className="text-xs font-bold uppercase tracking-[0.3em] mb-2" style={{ color: tpl.accent }}>This is to certify that</p>
                        <p className="text-3xl font-bold text-gray-800 mb-1 italic">Student Full Name</p>
                        <p className="text-sm text-gray-500 mb-6">has successfully completed</p>
                        <div className="inline-block px-6 py-2 rounded-full mb-2" style={{ backgroundColor: `${tpl.color}18` }}>
                          <p className="text-xl font-bold" style={{ color: tpl.color }}>{tpl.name}</p>
                        </div>
                        <p className="text-sm text-gray-500 mt-2 mb-8 max-w-sm mx-auto">{tpl.description}</p>

                        <div className="flex items-end justify-center gap-16 mt-4">
                          <div className="text-center">
                            <div className="h-px w-32 mb-2" style={{ backgroundColor: tpl.accent }} />
                            <p className="text-xs font-semibold text-gray-700">Instructor Signature</p>
                            <p className="text-[10px] text-gray-400">Course Instructor</p>
                          </div>
                          <div className="text-center">
                            <div className="h-px w-32 mb-2" style={{ backgroundColor: tpl.accent }} />
                            <p className="text-xs font-semibold text-gray-700">May 13, 2026</p>
                            <p className="text-[10px] text-gray-400">Date of Issue</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Modal footer */}
                    <div className="flex items-center justify-between px-4 py-3">
                      <p className="text-sm text-gray-500">Preview only — actual certificates include real student data</p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => { setPreviewingCertId(null); setEditingCertId(tpl.id); setCertDraft({ ...tpl }); setCertIsNew(false); }}
                          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition-colors"
                        >
                          Edit Template
                        </button>
                        <button onClick={() => setPreviewingCertId(null)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors">
                          Close
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

        </div>
      )}

      {/* Review Center View */}
      {currentSubPage === 'review-center' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm p-6 relative">
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">Review Center</h1>
              <button 
                onClick={() => setActivePopover(activePopover === 'review-center' ? null : 'review-center')}
                className="hover:bg-blue-50 rounded-full p-1 transition-colors"
              >
                <Info className="size-3.5 text-blue-600 cursor-pointer" />
              </button>
            </div>
            <p className="text-gray-600">Manage course reviews and student feedback</p>
            {activePopover === 'review-center' && (
              <div className="absolute top-20 left-6 right-6 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-20">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">About Review Center</h3>
                  <button onClick={() => setActivePopover(null)} className="text-gray-400 hover:text-gray-600">
                    <X className="size-4" />
                  </button>
                </div>
                <p className="text-sm text-gray-600">
                  Monitor and respond to student feedback on your courses. Track ratings, read detailed reviews, and engage with learners to continuously improve course quality and address concerns.
                </p>
              </div>
            )}
          </div>



          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Recent Reviews</h2>
              <span className="text-sm text-gray-400">Showing latest 5</span>
            </div>

            {/* Filter tabs */}
            <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg w-fit mb-5">
              {([
                { key: 'all',        label: 'All' },
                { key: 'unreviewed', label: 'Unreviewed / Ungraded' },
                { key: 'reviewed',   label: 'Reviewed / Graded' },
              ] as const).map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setReviewFilter(tab.key)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    reviewFilter === tab.key
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              {[
                { student: 'John Smith',    initials: 'JS', color: 'bg-blue-100 text-blue-700',    course: 'Leadership Fundamentals', rating: 5, comment: 'Excellent course! Very practical and well-structured.',          time: '2 hours ago', replied: true,  existingReply: 'Thank you, John! We are thrilled you found the course practical and well-structured. Your feedback means a lot to our team.' },
                { student: 'Sarah Johnson', initials: 'SJ', color: 'bg-purple-100 text-purple-700', course: 'Data Analytics',          rating: 4, comment: 'Good content but could use more hands-on examples.',           time: '5 hours ago', replied: false },
                { student: 'Michael Chen',  initials: 'MC', color: 'bg-green-100 text-green-700',   course: 'Project Management',      rating: 5, comment: 'Best course I have taken. Instructor is amazing!',             time: '1 day ago',   replied: true,  existingReply: 'We are so glad to hear that, Michael! We will pass your kind words on to the instructor. Hope to see you in future courses!' },
                { student: 'Aisha Patel',   initials: 'AP', color: 'bg-amber-100 text-amber-700',   course: 'Cloud Architecture',      rating: 3, comment: 'Content is solid but pacing felt rushed in module 3.',         time: '2 days ago',  replied: false },
                { student: 'Lucas Wright',  initials: 'LW', color: 'bg-rose-100 text-rose-700',     course: 'Cybersecurity Basics',    rating: 5, comment: 'Incredibly thorough. Would recommend to any IT professional.', time: '3 days ago',  replied: false },
              ].filter(r =>
                reviewFilter === 'all' ? true :
                reviewFilter === 'reviewed' ? r.replied :
                !r.replied
              ).map((review, index) => (
                <div key={index} className="border border-gray-100 rounded-xl p-4 hover:border-gray-200 hover:bg-gray-50/50 transition-colors">
                  {/* Course badge + rating */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-100 text-xs font-medium text-blue-700">
                      <Award className="size-3" />
                      {review.course}
                    </span>
                    <div className="flex items-center gap-1">
                      <div className="flex items-center gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <span key={i} className={`text-base leading-none ${i < review.rating ? 'text-yellow-400' : 'text-gray-200'}`}>★</span>
                        ))}
                      </div>
                      {review.replied ? (
                        <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 border border-green-100 text-[10px] font-medium text-green-700">
                          <CheckCircle2 className="size-3" /> Replied
                        </span>
                      ) : (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full bg-amber-50 border border-amber-100 text-[10px] font-medium text-amber-700">
                          Awaiting reply
                        </span>
                      )}
                    </div>
                  </div>
                  {/* Reviewer + comment */}
                  <div className="flex items-start gap-3">
                    <div className={`size-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${review.color}`}>
                      {review.initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 leading-tight">{review.student}</p>
                      <p className="text-sm text-gray-600 mt-1">{review.comment}</p>
                    </div>
                  </div>
                  {/* Footer */}
                  <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-gray-100">
                    <p className="text-xs text-gray-400">{review.time}</p>
                    <button
                      onClick={() => { setReplyModal(review as any); setReplyText(''); }}
                      className="text-xs font-medium text-blue-600 hover:text-blue-700 px-2.5 py-1 rounded-lg hover:bg-blue-50 transition-colors"
                    >
                      {review.replied ? 'View reply' : 'Reply'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <p className="text-sm text-gray-600 mb-1">Total Reviews</p>
              <p className="text-3xl font-bold text-gray-900">1,534</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <p className="text-sm text-gray-600 mb-1">Average Rating</p>
              <p className="text-3xl font-bold text-gray-900">4.6</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <p className="text-sm text-gray-600 mb-1">Pending Review</p>
              <p className="text-3xl font-bold text-gray-900">23</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <p className="text-sm text-gray-600 mb-1">Response Rate</p>
              <p className="text-3xl font-bold text-gray-900">94%</p>
            </div>
          </div>

          {/* ── Reply Modal ── */}
          {replyModal && (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setReplyModal(null)}>
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                  <h3 className="text-base font-semibold text-gray-900">
                    {replyModal.replied ? 'Review & Reply' : 'Reply to Review'}
                  </h3>
                  <button onClick={() => setReplyModal(null)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600">
                    <X className="size-4" />
                  </button>
                </div>

                <div className="px-6 py-5 space-y-4">
                  {/* Course badge */}
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-100 text-xs font-medium text-blue-700">
                    <Award className="size-3" />
                    {replyModal.course}
                  </span>

                  {/* Review card */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className={`size-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${replyModal.color}`}>
                          {replyModal.initials}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900 leading-tight">{replyModal.student}</p>
                          <p className="text-xs text-gray-400">{replyModal.time}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <span key={i} className={`text-sm leading-none ${i < replyModal.rating ? 'text-yellow-400' : 'text-gray-200'}`}>★</span>
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">{replyModal.comment}</p>
                  </div>

                  {/* Existing reply (if any) */}
                  {replyModal.replied && replyModal.existingReply && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Your reply</p>
                      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="size-6 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                            <span className="text-[10px] font-bold text-white">A</span>
                          </div>
                          <p className="text-xs font-semibold text-blue-800">Admin</p>
                        </div>
                        <p className="text-sm text-blue-900 leading-relaxed">{replyModal.existingReply}</p>
                      </div>
                    </div>
                  )}

                  {/* Reply textarea */}
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                      {replyModal.replied ? 'Write a follow-up' : 'Write a reply'}
                    </p>
                    <textarea
                      rows={3}
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                      placeholder="Write your response to this review..."
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    />
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100">
                  <button onClick={() => setReplyModal(null)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100 transition-colors">
                    Cancel
                  </button>
                  <button
                    disabled={!replyText.trim()}
                    onClick={() => setReplyModal(null)}
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Send reply
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Question Banks View */}
      {currentSubPage === 'question-banks' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm p-6 relative">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <h1 className="text-3xl font-bold text-gray-900">Question Banks</h1>
                  <button 
                    onClick={() => setActivePopover(activePopover === 'question-banks' ? null : 'question-banks')}
                    className="hover:bg-blue-50 rounded-full p-1 transition-colors"
                  >
                    <Info className="size-3.5 text-blue-600 cursor-pointer" />
                  </button>
                </div>
                <p className="text-gray-600">Manage assessment questions and quiz content</p>
              </div>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
                <Plus className="size-4" />
                Add Question
              </button>
            </div>
            {activePopover === 'question-banks' && (
              <div className="absolute top-20 left-6 right-6 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-20">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">About Question Banks</h3>
                  <button onClick={() => setActivePopover(null)} className="text-gray-400 hover:text-gray-600">
                    <X className="size-4" />
                  </button>
                </div>
                <p className="text-sm text-gray-600">
                  Build comprehensive question libraries for assessments and quizzes. Organize questions by category, difficulty, and type (multiple choice, true/false, short answer) to create effective knowledge checks.
                </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <p className="text-sm text-gray-600 mb-1">Total Questions</p>
              <p className="text-3xl font-bold text-gray-900">487</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <p className="text-sm text-gray-600 mb-1">Multiple Choice</p>
              <p className="text-3xl font-bold text-gray-900">312</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <p className="text-sm text-gray-600 mb-1">True/False</p>
              <p className="text-3xl font-bold text-gray-900">98</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <p className="text-sm text-gray-600 mb-1">Short Answer</p>
              <p className="text-3xl font-bold text-gray-900">77</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Question Categories</h2>
              <div className="flex gap-3">
                <select className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>All Categories</option>
                  <option>Leadership</option>
                  <option>Technology</option>
                  <option>Marketing</option>
                  <option>Finance</option>
                </select>
                <select className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>All Types</option>
                  <option>Multiple Choice</option>
                  <option>True/False</option>
                  <option>Short Answer</option>
                </select>
              </div>
            </div>
            
            <div className="space-y-3">
              {[
                { question: 'What are the key principles of effective leadership?', type: 'Multiple Choice', category: 'Leadership', difficulty: 'Medium' },
                { question: 'Explain the concept of servant leadership.', type: 'Short Answer', category: 'Leadership', difficulty: 'Hard' },
                { question: 'True or False: Emotional intelligence is crucial for team management.', type: 'True/False', category: 'Leadership', difficulty: 'Easy' },
              ].map((q, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 hover:border-blue-500 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 mb-2">{q.question}</p>
                      <div className="flex items-center gap-3">
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">{q.type}</span>
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">{q.category}</span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          q.difficulty === 'Easy' ? 'bg-green-100 text-green-700' :
                          q.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>{q.difficulty}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors">
                        <Edit className="size-4" />
                      </button>
                      <button className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors">
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Course Forms View */}
      {currentSubPage === 'course-forms' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm p-6 relative">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <h1 className="text-3xl font-bold text-gray-900">Course Forms</h1>
                  <button 
                    onClick={() => setActivePopover(activePopover === 'course-forms' ? null : 'course-forms')}
                    className="hover:bg-blue-50 rounded-full p-1 transition-colors"
                  >
                    <Info className="size-3.5 text-blue-600 cursor-pointer" />
                  </button>
                </div>
                <p className="text-gray-600">Create and manage course registration and feedback forms</p>
              </div>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
                <Plus className="size-4" />
                Create Form
              </button>
            </div>
            {activePopover === 'course-forms' && (
              <div className="absolute top-20 left-6 right-6 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-20">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">About Course Forms</h3>
                  <button onClick={() => setActivePopover(null)} className="text-gray-400 hover:text-gray-600">
                    <X className="size-4" />
                  </button>
                </div>
                <p className="text-sm text-gray-600">
                  Design custom forms for course enrollment, feedback collection, and certificate requests. Track responses, analyze completion rates, and streamline your course administration process.
                </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <p className="text-sm text-gray-600 mb-1">Active Forms</p>
              <p className="text-3xl font-bold text-gray-900">24</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <p className="text-sm text-gray-600 mb-1">Total Responses</p>
              <p className="text-3xl font-bold text-gray-900">1,892</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <p className="text-sm text-gray-600 mb-1">Completion Rate</p>
              <p className="text-3xl font-bold text-gray-900">87%</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Form Templates</h2>
            <div className="space-y-4">
              {[
                { name: 'Course Registration Form', type: 'Registration', responses: 342, status: 'Active' },
                { name: 'Course Feedback Survey', type: 'Feedback', responses: 567, status: 'Active' },
                { name: 'Pre-Assessment Form', type: 'Assessment', responses: 189, status: 'Active' },
                { name: 'Certificate Request Form', type: 'Request', responses: 234, status: 'Active' },
              ].map((form, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 hover:border-blue-500 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900">{form.name}</h3>
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                          {form.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-600">{form.type}</span>
                        <span className="text-gray-300">•</span>
                        <span className="text-sm text-gray-600">{form.responses} responses</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2">
                        <Eye className="size-4" />
                        View
                      </button>
                      <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2">
                        <Edit className="size-4" />
                        Edit
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}