import React from 'react';

interface AccessSettings {
  accessType: string;
  enrollmentType: string;
  maxStudents: number;
  prerequisiteCourses: string[];
  startDate: string;
  endDate: string;
}

interface AccessSettingsProps {
  settings: AccessSettings;
  onUpdate: (settings: AccessSettings) => void;
}

export function AccessSettings({ settings, onUpdate }: AccessSettingsProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Access & Enrollment</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Access Type</label>
          <select
            value={settings.accessType}
            onChange={(e) => onUpdate({...settings, accessType: e.target.value})}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          >
            <option value="enrolled">Enrolled Students Only</option>
            <option value="public">Public (Anyone can view)</option>
            <option value="private">Private (Invitation only)</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Enrollment Type</label>
          <select
            value={settings.enrollmentType}
            onChange={(e) => onUpdate({...settings, enrollmentType: e.target.value})}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          >
            <option value="open">Open enrollment</option>
            <option value="approval">Requires approval</option>
            <option value="invite">Invite only</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Maximum Students (0 = unlimited)</label>
          <input
            type="number"
            value={settings.maxStudents}
            onChange={(e) => onUpdate({...settings, maxStudents: parseInt(e.target.value)})}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Start Date (Optional)</label>
            <input
              type="date"
              value={settings.startDate}
              onChange={(e) => onUpdate({...settings, startDate: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">End Date (Optional)</label>
            <input
              type="date"
              value={settings.endDate}
              onChange={(e) => onUpdate({...settings, endDate: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>
    </div>
  );
}