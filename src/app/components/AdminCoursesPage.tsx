import { Course, CourseCategory } from '@/app/types';
import { Plus, Search, Edit, Trash2, Eye, Filter, Building2, Award, Info, X, ChevronDown } from 'lucide-react';
import { useState } from 'react';
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
  onCoursesRefresh?: () => void;
}

export function AdminCoursesPage({ courses, categories, companyId, currentSubPage = 'all-courses', onSubPageChange, onCourseClick, onUpdateCategories, onCoursesRefresh }: AdminCoursesPageProps) {
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
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
                <Plus className="size-4" />
                Create Template
              </button>
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <p className="text-sm text-gray-600 mb-1">Total Issued</p>
              <p className="text-3xl font-bold text-gray-900">2,847</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <p className="text-sm text-gray-600 mb-1">This Month</p>
              <p className="text-3xl font-bold text-gray-900">156</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <p className="text-sm text-gray-600 mb-1">Templates</p>
              <p className="text-3xl font-bold text-gray-900">8</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Certificate Templates</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {['Professional Certificate', 'Course Completion', 'Excellence Award', 'Mastery Certificate'].map((template, index) => (
                <div key={index} className="border-2 border-gray-200 rounded-lg p-4 hover:border-blue-500 transition-colors cursor-pointer">
                  <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg h-32 mb-3 flex items-center justify-center">
                    <Award className="size-12 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900">{template}</h3>
                  <p className="text-sm text-gray-600 mt-1">Used in {Math.floor(Math.random() * 20 + 5)} courses</p>
                  <div className="flex gap-2 mt-3">
                    <button className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm">
                      Edit
                    </button>
                    <button className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
                      Preview
                    </button>
                  </div>
                </div>
              ))}
            </div>
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

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Reviews</h2>
            <div className="space-y-4">
              {[
                { student: 'John Smith', course: 'Leadership Fundamentals', rating: 5, comment: 'Excellent course! Very practical and well-structured.', time: '2 hours ago' },
                { student: 'Sarah Johnson', course: 'Data Analytics', rating: 4, comment: 'Good content but could use more hands-on examples.', time: '5 hours ago' },
                { student: 'Michael Chen', course: 'Project Management', rating: 5, comment: 'Best course I have taken. Instructor is amazing!', time: '1 day ago' },
              ].map((review, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-gray-900">{review.student}</p>
                      <p className="text-sm text-gray-600">{review.course}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className={i < review.rating ? 'text-yellow-500' : 'text-gray-300'}>★</span>
                      ))}
                    </div>
                  </div>
                  <p className="text-gray-700 mb-2">{review.comment}</p>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500">{review.time}</p>
                    <button className="text-sm text-blue-600 hover:text-blue-700">Reply</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
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