import { X, Plus, Palette } from 'lucide-react';
import { useState } from 'react';
import { CourseCategory } from '@/app/types';

interface CategoryManagerModalProps {
  categories: CourseCategory[];
  onClose: () => void;
  onSave: (categories: CourseCategory[]) => void;
}

export function CategoryManagerModal({ categories, onClose, onSave }: CategoryManagerModalProps) {
  const [editedCategories, setEditedCategories] = useState<CourseCategory[]>([...categories]);
  const [newCategory, setNewCategory] = useState<Partial<CourseCategory>>({});
  const [isAdding, setIsAdding] = useState(false);

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
  };

  const handleUpdateCategory = (id: string, updates: Partial<CourseCategory>) => {
    setEditedCategories(
      editedCategories.map(cat => (cat.id === id ? { ...cat, ...updates } : cat))
    );
  };

  const handleSave = () => {
    onSave(editedCategories);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Manage Categories</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="size-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            {editedCategories.map(category => (
              <div
                key={category.id}
                className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
              >
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: category.color }}
                >
                  <Palette className="size-5 text-gray-700" />
                </div>
                <div className="flex-1">
                  <input
                    type="text"
                    value={category.name}
                    onChange={e => handleUpdateCategory(category.id, { name: e.target.value })}
                    className="font-semibold text-gray-900 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none w-full"
                  />
                  <input
                    type="text"
                    value={category.description || ''}
                    onChange={e => handleUpdateCategory(category.id, { description: e.target.value })}
                    placeholder="Add description..."
                    className="text-sm text-gray-600 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none w-full mt-1"
                  />
                </div>
                <input
                  type="color"
                  value={category.color}
                  onChange={e => handleUpdateCategory(category.id, { color: e.target.value })}
                  className="w-10 h-10 rounded cursor-pointer"
                />
                <button
                  onClick={() => handleDeleteCategory(category.id)}
                  className="text-red-500 hover:text-red-700 transition-colors p-2"
                >
                  <X className="size-5" />
                </button>
              </div>
            ))}

            {/* Add New Category */}
            {isAdding ? (
              <div className="flex items-center gap-4 p-4 border-2 border-dashed border-blue-300 rounded-lg">
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: newCategory.color || '#E3F2FD' }}
                >
                  <Palette className="size-5 text-gray-700" />
                </div>
                <div className="flex-1">
                  <input
                    type="text"
                    value={newCategory.name || ''}
                    onChange={e => setNewCategory({ ...newCategory, name: e.target.value })}
                    placeholder="Category name..."
                    className="font-semibold text-gray-900 border-b border-gray-300 focus:border-blue-500 focus:outline-none w-full"
                    autoFocus
                  />
                  <input
                    type="text"
                    value={newCategory.description || ''}
                    onChange={e => setNewCategory({ ...newCategory, description: e.target.value })}
                    placeholder="Add description..."
                    className="text-sm text-gray-600 border-b border-gray-300 focus:border-blue-500 focus:outline-none w-full mt-1"
                  />
                </div>
                <input
                  type="color"
                  value={newCategory.color || '#E3F2FD'}
                  onChange={e => setNewCategory({ ...newCategory, color: e.target.value })}
                  className="w-10 h-10 rounded cursor-pointer"
                />
                <button
                  onClick={handleAddCategory}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add
                </button>
                <button
                  onClick={() => {
                    setIsAdding(false);
                    setNewCategory({});
                  }}
                  className="text-gray-500 hover:text-gray-700 transition-colors p-2"
                >
                  <X className="size-5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsAdding(true)}
                className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="size-5" />
                <span>Add New Category</span>
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
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