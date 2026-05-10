import React from 'react';
import { Plus, ClipboardCheck, MessageCircle, Eye, Edit2 } from 'lucide-react';

export function CourseForms() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Course Forms & Surveys</h3>
          <button className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors">
            <Plus className="size-4" />
            Create Form
          </button>
        </div>
        <div className="space-y-4">
          <div className="p-4 border border-gray-200 rounded-lg flex items-center justify-between hover:bg-gray-50">
            <div className="flex items-center gap-3">
              <ClipboardCheck className="size-5 text-gray-500" />
              <div>
                <h4 className="font-medium text-gray-900">Pre-Course Survey</h4>
                <p className="text-sm text-gray-500">5 questions • 120 responses</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="text-gray-400 hover:text-gray-600 p-2">
                <Eye className="size-4" />
              </button>
              <button className="text-gray-400 hover:text-gray-600 p-2">
                <Edit2 className="size-4" />
              </button>
            </div>
          </div>
          <div className="p-4 border border-gray-200 rounded-lg flex items-center justify-between hover:bg-gray-50">
            <div className="flex items-center gap-3">
              <MessageCircle className="size-5 text-gray-500" />
              <div>
                <h4 className="font-medium text-gray-900">Course Feedback Form</h4>
                <p className="text-sm text-gray-500">10 questions • 45 responses</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="text-gray-400 hover:text-gray-600 p-2">
                <Eye className="size-4" />
              </button>
              <button className="text-gray-400 hover:text-gray-600 p-2">
                <Edit2 className="size-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}