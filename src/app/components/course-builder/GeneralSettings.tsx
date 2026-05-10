import React from 'react';

interface CourseSettings {
  title: string;
  description: string;
  category: string;
  level: string;
  language: string;
  instructor: string;
  duration?: string;
  certificateEnabled: boolean;
  allowComments: boolean;
  allowReviews: boolean;
}

interface GeneralSettingsProps {
  settings: CourseSettings;
  onUpdate: (settings: CourseSettings) => void;
}

export function GeneralSettings({ settings, onUpdate }: GeneralSettingsProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Course Information</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Course Title</label>
          <input
            type="text"
            value={settings.title}
            onChange={(e) => onUpdate({...settings, title: e.target.value})}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
          <textarea
            value={settings.description}
            onChange={(e) => onUpdate({...settings, description: e.target.value})}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select
              value={settings.category}
              onChange={(e) => onUpdate({...settings, category: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
              <option>Technology</option>
              <option>Business</option>
              <option>Design</option>
              <option>Marketing</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Level</label>
            <select
              value={settings.level}
              onChange={(e) => onUpdate({...settings, level: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
              <option>Beginner</option>
              <option>Intermediate</option>
              <option>Advanced</option>
            </select>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Instructor</label>
            <input
              type="text"
              value={settings.instructor}
              onChange={(e) => onUpdate({...settings, instructor: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
            <select
              value={settings.language}
              onChange={(e) => onUpdate({...settings, language: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
              <option>English</option>
              <option>Spanish</option>
              <option>French</option>
              <option>German</option>
            </select>
          </div>
        </div>
        
        <div className="border-t border-gray-200 pt-4 mt-6">
          <h4 className="font-medium text-gray-900 mb-3">Course Features</h4>
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.certificateEnabled}
                onChange={(e) => onUpdate({...settings, certificateEnabled: e.target.checked})}
                className="rounded"
              />
              <span className="text-sm text-gray-700">Enable course completion certificate</span>
            </label>
            
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.allowComments}
                onChange={(e) => onUpdate({...settings, allowComments: e.target.checked})}
                className="rounded"
              />
              <span className="text-sm text-gray-700">Allow student comments</span>
            </label>
            
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.allowReviews}
                onChange={(e) => onUpdate({...settings, allowReviews: e.target.checked})}
                className="rounded"
              />
              <span className="text-sm text-gray-700">Allow course reviews and ratings</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}