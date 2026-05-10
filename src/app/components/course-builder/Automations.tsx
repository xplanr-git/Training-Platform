import React from 'react';
import { Plus, Zap, Edit2 } from 'lucide-react';

export function Automations() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Email Automations</h3>
        <button className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors">
          <Plus className="size-4" />
          New Automation
        </button>
      </div>

      <div className="space-y-4">
        {[
          { title: 'Welcome Email', trigger: 'When student enrolls', status: 'Active', sent: 1247 },
          { title: 'Course Completion', trigger: 'When student completes course', status: 'Active', sent: 276 },
          { title: 'Inactivity Reminder', trigger: 'When student is inactive for 7 days', status: 'Paused', sent: 45 },
          { title: 'Module 1 Follow-up', trigger: 'When student completes Section 1', status: 'Active', sent: 892 },
        ].map((automation, i) => (
          <div key={i} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-4">
              <div className={`size-10 rounded-lg flex items-center justify-center ${
                automation.status === 'Active' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'
              }`}>
                <Zap className="size-5" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">{automation.title}</h4>
                <p className="text-sm text-gray-500">{automation.trigger}</p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{automation.sent}</p>
                <p className="text-xs text-gray-500">Emails sent</p>
              </div>
              <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                automation.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
              }`}>
                {automation.status}
              </div>
              <button className="text-gray-400 hover:text-gray-600">
                <Edit2 className="size-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}