import {
  X, Plus, Palette, BookOpen, ChevronRight, Search,
  Video, Award, Users, BarChart2, Briefcase, Heart,
  Code, Globe, Zap, Star, Target, Shield, Mic, Camera,
  Music, Cpu, DollarSign, TrendingUp, Wrench, FlaskConical,
  Headphones, PenTool, Layers, Leaf, Rocket, GraduationCap,
  Megaphone, ClipboardList, Building2, LucideIcon,
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { Course, CourseCategory } from '@/app/types';

// ── Icon catalogue ────────────────────────────────────────────────
const ICON_OPTIONS: { name: string; Icon: LucideIcon }[] = [
  { name: 'Palette',       Icon: Palette },
  { name: 'BookOpen',      Icon: BookOpen },
  { name: 'GraduationCap', Icon: GraduationCap },
  { name: 'Video',         Icon: Video },
  { name: 'Award',         Icon: Award },
  { name: 'Users',         Icon: Users },
  { name: 'BarChart2',     Icon: BarChart2 },
  { name: 'Briefcase',     Icon: Briefcase },
  { name: 'Heart',         Icon: Heart },
  { name: 'Code',          Icon: Code },
  { name: 'Globe',         Icon: Globe },
  { name: 'Zap',           Icon: Zap },
  { name: 'Star',          Icon: Star },
  { name: 'Target',        Icon: Target },
  { name: 'Shield',        Icon: Shield },
  { name: 'Mic',           Icon: Mic },
  { name: 'Camera',        Icon: Camera },
  { name: 'Music',         Icon: Music },
  { name: 'Cpu',           Icon: Cpu },
  { name: 'DollarSign',    Icon: DollarSign },
  { name: 'TrendingUp',    Icon: TrendingUp },
  { name: 'Wrench',        Icon: Wrench },
  { name: 'FlaskConical',  Icon: FlaskConical },
  { name: 'Headphones',    Icon: Headphones },
  { name: 'PenTool',       Icon: PenTool },
  { name: 'Layers',        Icon: Layers },
  { name: 'Leaf',          Icon: Leaf },
  { name: 'Rocket',        Icon: Rocket },
  { name: 'Megaphone',     Icon: Megaphone },
  { name: 'ClipboardList', Icon: ClipboardList },
  { name: 'Building2',     Icon: Building2 },
];

function CategoryIcon({ iconName, className }: { iconName?: string; className?: string }) {
  const match = ICON_OPTIONS.find(o => o.name === iconName);
  const Icon = match?.Icon ?? Palette;
  return <Icon className={className ?? 'size-4 text-gray-700'} />;
}

interface CategoryManagerModalProps {
  categories: CourseCategory[];
  courses?: Course[];
  onClose: () => void;
  onSave: (categories: CourseCategory[]) => void;
  onSaveCourses?: (updates: { id: string; categoryId?: string }[]) => void;
}

export function CategoryManagerModal({
  categories,
  courses = [],
  onClose,
  onSave,
  onSaveCourses,
}: CategoryManagerModalProps) {
  const [editedCategories, setEditedCategories] = useState<CourseCategory[]>([...categories]);
  const [newCategory, setNewCategory] = useState<Partial<CourseCategory>>({});
  const [isAdding, setIsAdding] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  // Local course→category assignment map (courseId → categoryId | undefined)
  const [courseAssignments, setCourseAssignments] = useState<Record<string, string | undefined>>(
    () => Object.fromEntries(courses.map(c => [c.id, c.categoryId]))
  );

  // Search state for the "add courses" picker
  const [addSearch, setAddSearch] = useState('');
  const [showAddPicker, setShowAddPicker] = useState(false);

  const selectedCategory = editedCategories.find(c => c.id === selectedCategoryId) ?? null;

  // Courses currently assigned to the selected category (using local assignment state)
  const categoryCourses = useMemo(
    () => courses.filter(c => courseAssignments[c.id] === selectedCategoryId),
    [courses, courseAssignments, selectedCategoryId]
  );

  // Courses NOT assigned to the selected category (available to add)
  const availableCourses = useMemo(
    () =>
      courses.filter(c => {
        if (courseAssignments[c.id] === selectedCategoryId) return false;
        if (!addSearch) return true;
        return c.title.toLowerCase().includes(addSearch.toLowerCase());
      }),
    [courses, courseAssignments, selectedCategoryId, addSearch]
  );

  // Count per category using local assignments
  const countForCategory = (catId: string) =>
    courses.filter(c => courseAssignments[c.id] === catId).length;

  const handleAddCategory = () => {
    if (newCategory.name) {
      const category: CourseCategory = {
        id: `cat-${Date.now()}`,
        name: newCategory.name,
        description: newCategory.description || '',
        color: newCategory.color || '#E3F2FD',
        parentCategoryId: newCategory.parentCategoryId,
      };
      setEditedCategories([...editedCategories, category]);
      setNewCategory({});
      setIsAdding(false);
    }
  };

  const handleDeleteCategory = (id: string) => {
    setEditedCategories(editedCategories.filter(cat => cat.id !== id));
    if (selectedCategoryId === id) setSelectedCategoryId(null);
  };

  const handleUpdateCategory = (id: string, updates: Partial<CourseCategory>) => {
    setEditedCategories(
      editedCategories.map(cat => (cat.id === id ? { ...cat, ...updates } : cat))
    );
  };

  const handleRemoveCourseFromCategory = (courseId: string) => {
    setCourseAssignments(prev => ({ ...prev, [courseId]: undefined }));
  };

  const handleAddCourseToCategory = (courseId: string) => {
    if (!selectedCategoryId) return;
    setCourseAssignments(prev => ({ ...prev, [courseId]: selectedCategoryId }));
    setAddSearch('');
    setShowAddPicker(false);
  };

  const handleSave = () => {
    onSave(editedCategories);
    if (onSaveCourses) {
      const updates = courses
        .filter(c => courseAssignments[c.id] !== c.categoryId)
        .map(c => ({ id: c.id, categoryId: courseAssignments[c.id] }));
      if (updates.length > 0) onSaveCourses(updates);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div
        className="bg-white rounded-lg shadow-xl w-full max-h-[90vh] overflow-hidden flex flex-col transition-all duration-300"
        style={{ maxWidth: selectedCategory ? '900px' : '672px' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-gray-900">Manage Categories</h2>
            {selectedCategory && (
              <>
                <ChevronRight className="size-5 text-gray-400" />
                <span
                  className="text-base font-semibold px-2 py-0.5 rounded-md"
                  style={{ backgroundColor: selectedCategory.color || '#E3F2FD' }}
                >
                  {selectedCategory.name}
                </span>
              </>
            )}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="size-6" />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left: category list */}
          <div
            className="flex flex-col overflow-hidden shrink-0"
            style={{
              width: selectedCategory ? '340px' : '100%',
              borderRight: selectedCategory ? '1px solid #e5e7eb' : 'none',
            }}
          >
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-3">
                {editedCategories.map(category => (
                  <div
                    key={category.id}
                    onClick={() =>
                      setSelectedCategoryId(
                        category.id === selectedCategoryId ? null : category.id
                      )
                    }
                    className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedCategoryId === category.id
                        ? 'border-blue-400 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: category.color || '#E3F2FD' }}
                    >
                      <CategoryIcon iconName={category.icon} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm truncate">{category.name}</p>
                      {category.description && (
                        <p className="text-xs text-gray-500 truncate">{category.description}</p>
                      )}
                    </div>
                    <span className="text-xs text-gray-400 shrink-0">
                      {countForCategory(category.id)} courses
                    </span>
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        handleDeleteCategory(category.id);
                      }}
                      className="text-red-400 hover:text-red-600 transition-colors p-1 shrink-0"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                ))}

                {/* Add New Category */}
                {isAdding ? (
                  <div className="flex items-center gap-3 p-3 border-2 border-dashed border-blue-300 rounded-lg">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: newCategory.color || '#E3F2FD' }}
                    >
                      <CategoryIcon iconName={newCategory.icon} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <input
                        type="text"
                        value={newCategory.name || ''}
                        onChange={e => setNewCategory({ ...newCategory, name: e.target.value })}
                        placeholder="Category name..."
                        className="font-semibold text-sm text-gray-900 border-b border-gray-300 focus:border-blue-500 focus:outline-none w-full bg-transparent"
                        autoFocus
                        onKeyDown={e => e.key === 'Enter' && handleAddCategory()}
                      />
                      <input
                        type="text"
                        value={newCategory.description || ''}
                        onChange={e =>
                          setNewCategory({ ...newCategory, description: e.target.value })
                        }
                        placeholder="Add description..."
                        className="text-xs text-gray-600 border-b border-gray-300 focus:border-blue-500 focus:outline-none w-full mt-1 bg-transparent"
                      />
                    </div>
                    <input
                      type="color"
                      value={newCategory.color || '#E3F2FD'}
                      onChange={e => setNewCategory({ ...newCategory, color: e.target.value })}
                      className="w-8 h-8 rounded cursor-pointer shrink-0"
                    />
                    <button
                      onClick={handleAddCategory}
                      className="bg-blue-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors shrink-0"
                    >
                      Add
                    </button>
                    <button
                      onClick={() => {
                        setIsAdding(false);
                        setNewCategory({});
                      }}
                      className="text-gray-400 hover:text-gray-600 transition-colors shrink-0"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsAdding(true)}
                    className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center justify-center gap-2 text-sm"
                  >
                    <Plus className="size-4" />
                    <span>Add New Category</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right: detail panel */}
          {selectedCategory && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Editable fields */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                    Category Details
                  </h3>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Name</label>
                    <input
                      type="text"
                      value={selectedCategory.name}
                      onChange={e =>
                        handleUpdateCategory(selectedCategory.id, { name: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-semibold text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Description
                    </label>
                    <textarea
                      value={selectedCategory.description || ''}
                      onChange={e =>
                        handleUpdateCategory(selectedCategory.id, { description: e.target.value })
                      }
                      placeholder="Add a description..."
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2">Colour</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={selectedCategory.color || '#E3F2FD'}
                        onChange={e =>
                          handleUpdateCategory(selectedCategory.id, { color: e.target.value })
                        }
                        className="w-10 h-10 rounded-lg cursor-pointer border border-gray-200"
                      />
                      <div
                        className="flex-1 h-10 rounded-lg border border-gray-200 flex items-center px-3 text-sm text-gray-500"
                        style={{ backgroundColor: selectedCategory.color || '#E3F2FD' }}
                      >
                        {selectedCategory.color || '#E3F2FD'}
                      </div>
                    </div>
                  </div>

                  {/* Icon picker */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2">Icon</label>
                    <div className="grid grid-cols-8 gap-1.5">
                      {ICON_OPTIONS.map(({ name, Icon }) => (
                        <button
                          key={name}
                          title={name}
                          onClick={() => handleUpdateCategory(selectedCategory.id, { icon: name })}
                          className={`flex items-center justify-center w-9 h-9 rounded-lg border transition-colors ${
                            (selectedCategory.icon ?? 'Palette') === name
                              ? 'border-blue-500 bg-blue-50 text-blue-600'
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-600'
                          }`}
                        >
                          <Icon className="size-4" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Courses section */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                      Courses
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
                        {categoryCourses.length}
                      </span>
                      <button
                        onClick={() => {
                          setShowAddPicker(p => !p);
                          setAddSearch('');
                        }}
                        className="flex items-center gap-1 text-xs bg-blue-600 text-white px-2.5 py-1 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Plus className="size-3" />
                        Add course
                      </button>
                    </div>
                  </div>

                  {/* Add-course picker */}
                  {showAddPicker && (
                    <div className="mb-3 border border-blue-200 rounded-lg overflow-hidden shadow-sm">
                      <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border-b border-blue-200">
                        <Search className="size-3.5 text-blue-400 shrink-0" />
                        <input
                          autoFocus
                          type="text"
                          value={addSearch}
                          onChange={e => setAddSearch(e.target.value)}
                          placeholder="Search courses to add..."
                          className="flex-1 text-sm bg-transparent focus:outline-none text-gray-700 placeholder-gray-400"
                        />
                        <button
                          onClick={() => setShowAddPicker(false)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <X className="size-4" />
                        </button>
                      </div>
                      <div className="max-h-48 overflow-y-auto divide-y divide-gray-100">
                        {availableCourses.length === 0 ? (
                          <p className="text-sm text-gray-400 text-center py-4">
                            No courses available
                          </p>
                        ) : (
                          availableCourses.map(course => (
                            <button
                              key={course.id}
                              onClick={() => handleAddCourseToCategory(course.id)}
                              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-blue-50 transition-colors text-left"
                            >
                              <img
                                src={course.imageUrl || course.thumbnail}
                                alt={course.title}
                                className="w-8 h-8 rounded object-cover shrink-0"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {course.title}
                                </p>
                                <p className="text-xs text-gray-500 truncate">
                                  {(course.authors && course.authors[0]) || course.instructor}
                                  {courseAssignments[course.id] && (
                                    <span className="ml-1 text-gray-400">
                                      · currently in{' '}
                                      {editedCategories.find(
                                        c => c.id === courseAssignments[course.id]
                                      )?.name ?? 'another category'}
                                    </span>
                                  )}
                                </p>
                              </div>
                              <Plus className="size-4 text-blue-500 shrink-0" />
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  {/* Assigned courses list */}
                  {categoryCourses.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 border-2 border-dashed border-gray-200 rounded-lg text-gray-400">
                      <BookOpen className="size-8 mb-2 opacity-40" />
                      <p className="text-sm">No courses in this category</p>
                      <p className="text-xs mt-1">Click "Add course" to assign one</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {categoryCourses.map(course => (
                        <div
                          key={course.id}
                          className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group"
                        >
                          <img
                            src={course.imageUrl || course.thumbnail}
                            alt={course.title}
                            className="w-10 h-10 rounded object-cover shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {course.title}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {(course.authors && course.authors[0]) || course.instructor}
                            </p>
                          </div>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium shrink-0">
                            {course.level || 'Beginner'}
                          </span>
                          <button
                            onClick={() => handleRemoveCourseFromCategory(course.id)}
                            title="Remove from category"
                            className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-all p-1 shrink-0"
                          >
                            <X className="size-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2 text-gray-700 hover:text-gray-900 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
