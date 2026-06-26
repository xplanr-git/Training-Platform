import { useState } from 'react';
import { Search, Grid, List, Plus, Upload, Settings2, Info, X } from 'lucide-react';
import { Course, CourseCategory } from '@/app/types';
import { CourseCard } from './CourseCard';
import { CategoryManagerModal } from './CategoryManagerModal';

interface CourseCatalogProps {
  courses: Course[];
  categories: CourseCategory[];
  onCourseClick: (courseId: string) => void;
  onCreateCourse?: () => void;
  onImportCourse?: () => void;
  onUpdateCategories?: (categories: CourseCategory[]) => void;
  onUpdateCourseAssignments?: (updates: { id: string; categoryId?: string }[]) => void;
}

export function CourseCatalog({
  courses,
  categories,
  onCourseClick,
  onCreateCourse,
  onImportCourse,
  onUpdateCategories,
  onUpdateCourseAssignments,
}: CourseCatalogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedAuthor, setSelectedAuthor] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [showLearnMore, setShowLearnMore] = useState(false);

  // Get unique authors
  const authors = Array.from(new Set(courses.flatMap(c => c.authors || [c.instructor])));

  // Filter courses
  const filteredCourses = courses.filter(course => {
    const matchesSearch =
      searchQuery === '' ||
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === 'all' || course.categoryId === selectedCategory;

    const matchesAuthor =
      selectedAuthor === 'all' ||
      (course.authors || [course.instructor]).includes(selectedAuthor);

    return matchesSearch && matchesCategory && matchesAuthor;
  });

  // Get category by ID
  const getCategoryById = (categoryId?: string) => {
    return categories.find(cat => cat.id === categoryId);
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200 pb-6 relative">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">Course manager</h1>
              <button 
                onClick={() => setShowLearnMore(!showLearnMore)}
                className="hover:bg-blue-50 rounded-full p-1 transition-colors"
              >
                <Info className="size-3.5 text-blue-600 cursor-pointer" />
              </button>
            </div>
            <p className="text-gray-600 text-sm mt-1">
              Review and manage your school courses.
            </p>
          </div>
        </div>
        
        {/* Learn More Popover */}
        {showLearnMore && (
          <div className="absolute top-20 left-0 right-0 mx-6 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-20">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-gray-900">About Course Manager</h3>
              <button onClick={() => setShowLearnMore(false)} className="text-gray-400 hover:text-gray-600">
                <X className="size-4" />
              </button>
            </div>
            <p className="text-sm text-gray-600">
              The Course Manager is your central hub for creating, organizing, and maintaining all training content. Browse courses in grid or list view, filter by category and instructor, and manage course details efficiently.
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-3 mb-6">
          {onCreateCourse && (
            <button
              onClick={onCreateCourse}
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700 transition-colors"
            >
              <Plus className="size-4" />
              Create course
            </button>
          )}
          {onImportCourse && (
            <button
              onClick={onImportCourse}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
            >
              <Upload className="size-4" />
              Import course
            </button>
          )}
          {onUpdateCategories && (
            <button
              onClick={() => setShowCategoryManager(true)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
            >
              <Settings2 className="size-4" />
              Manage categories
            </button>
          )}
        </div>

        {/* Filters Row */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Course Filter */}
          <select
            value={selectedCourse}
            onChange={e => setSelectedCourse(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="all">All courses</option>
            <option value="public">Public courses</option>
            <option value="private">Private courses</option>
          </select>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="all">All categories</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>

          {/* Author Filter */}
          <select
            value={selectedAuthor}
            onChange={e => setSelectedAuthor(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="all">All authors</option>
            {authors.map(author => (
              <option key={author} value={author}>
                {author}
              </option>
            ))}
          </select>

          {/* View Toggle */}
          <div className="flex items-center gap-1 ml-auto border border-gray-300 rounded overflow-hidden">
            <button
              onClick={() => {
                console.log('Switching to grid view');
                setViewMode('grid');
              }}
              className={`p-2 ${
                viewMode === 'grid' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Grid className="size-4" />
            </button>
            <button
              onClick={() => {
                console.log('Switching to list view');
                setViewMode('list');
              }}
              className={`p-2 ${
                viewMode === 'list' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <List className="size-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Course Count */}
      <div className="text-sm text-gray-600">
        Showing <strong>{filteredCourses.length}</strong> courses
      </div>

      {/* Course Views */}
      {viewMode === 'list' ? (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr_0.8fr_0.8fr_0.8fr_1fr_1fr] gap-4 px-4 py-3 bg-gray-50 border-b border-gray-200 text-sm font-medium text-gray-700">
            <div>Course</div>
            <div>Company</div>
            <div>Category</div>
            <div>Instructor</div>
            <div>Students</div>
            <div>Rating</div>
            <div>Level</div>
            <div>Duration</div>
            <div>Actions</div>
          </div>
          
          {/* Table Rows */}
          <div className="divide-y divide-gray-200">
            {filteredCourses.map(course => (
              <div
                key={course.id}
                className="grid grid-cols-[2fr_1fr_1fr_1fr_0.8fr_0.8fr_0.8fr_1fr_1fr] gap-4 px-4 py-4 hover:bg-gray-50 transition-colors items-center"
              >
                {/* Course Info */}
                <div className="flex items-center gap-3">
                  <img
                    src={course.imageUrl}
                    alt={course.title}
                    className="w-12 h-12 object-cover rounded"
                  />
                  <div>
                    <h3 className="font-medium text-gray-900 text-sm">{course.title}</h3>
                    <p className="text-xs text-gray-500">{course.modules?.length || 1} modules</p>
                  </div>
                </div>

                {/* Company */}
                <div className="text-sm text-gray-600 flex items-center gap-1">
                  <span className="text-gray-400">🏢</span>
                  {course.company || 'outdure'}
                </div>

                {/* Category */}
                <div>
                  {getCategoryById(course.categoryId) ? (
                    <span className="text-sm text-gray-700">
                      {getCategoryById(course.categoryId)?.name}
                    </span>
                  ) : (
                    <span className="text-sm text-gray-400">-</span>
                  )}
                </div>

                {/* Instructor */}
                <div className="text-sm text-gray-600">
                  {(course.authors && course.authors[0]) || course.instructor}
                </div>

                {/* Students */}
                <div className="text-sm text-gray-600 text-center">
                  {course.learnerCount || course.studentsEnrolled || 0}
                </div>

                {/* Rating */}
                <div className="flex items-center gap-1 text-sm">
                  <span className="text-yellow-500">⭐</span>
                  <span className="text-gray-700">{course.rating || '4.8'}</span>
                </div>

                {/* Level */}
                <div>
                  <span className="inline-block text-xs px-2 py-1 rounded bg-green-100 text-green-700 font-medium">
                    {course.level || 'Beginner'}
                  </span>
                </div>

                {/* Duration */}
                <div className="text-sm text-gray-600">
                  {course.duration || '2 weeks'}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button 
                    className="text-blue-600 hover:text-blue-700"
                    title="View"
                    onClick={() => onCourseClick(course.id)}
                  >
                    👁️
                  </button>
                  <button 
                    className="text-blue-600 hover:text-blue-700"
                    title="Edit"
                  >
                    ✏️
                  </button>
                  <button 
                    className="text-red-600 hover:text-red-700"
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map(course => (
            <CourseCard
              key={course.id}
              course={course}
              onClick={() => onCourseClick(course.id)}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {filteredCourses.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No courses found matching your filters.</p>
        </div>
      )}

      {/* Category Manager Modal */}
      {showCategoryManager && onUpdateCategories && (
        <CategoryManagerModal
          categories={categories}
          courses={courses}
          onClose={() => setShowCategoryManager(false)}
          onSave={onUpdateCategories}
          onSaveCourses={onUpdateCourseAssignments}
        />
      )}
    </div>
  );
}