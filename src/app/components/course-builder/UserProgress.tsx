import React from 'react';
import { Settings } from 'lucide-react';

export function UserProgress() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">User Progress</h3>
        <div className="flex gap-2">
          <button className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
            Export CSV
          </button>
          <button className="px-3 py-1.5 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors">
            Reset Progress
          </button>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Student</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Progress</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Last Active</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {[
              { name: 'Sarah Mitchell', email: 'sarah@example.com', progress: 100, lastActive: '2 hours ago', status: 'Completed' },
              { name: 'James Wilson', email: 'james@example.com', progress: 75, lastActive: '5 hours ago', status: 'In Progress' },
              { name: 'Michael Brown', email: 'michael@example.com', progress: 45, lastActive: '1 day ago', status: 'In Progress' },
              { name: 'Emily Chen', email: 'emily@example.com', progress: 12, lastActive: '3 days ago', status: 'At Risk' },
              { name: 'David Lee', email: 'david@example.com', progress: 90, lastActive: 'Just now', status: 'In Progress' },
            ].map((student, i) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600">
                      {student.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{student.name}</div>
                      <div className="text-xs text-gray-500">{student.email}</div>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-100 rounded-full w-24">
                      <div 
                        className={`h-2 rounded-full ${
                          student.progress === 100 ? 'bg-green-500' : 
                          student.progress < 20 ? 'bg-red-500' : 'bg-blue-500'
                        }`} 
                        style={{ width: `${student.progress}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600">{student.progress}%</span>
                  </div>
                </td>
                <td className="py-3 px-4 text-sm text-gray-600">{student.lastActive}</td>
                <td className="py-3 px-4">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    student.status === 'Completed' ? 'bg-green-100 text-green-700' :
                    student.status === 'At Risk' ? 'bg-red-100 text-red-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {student.status}
                  </span>
                </td>
                <td className="py-3 px-4 text-right">
                  <button className="text-gray-400 hover:text-gray-600">
                    <Settings className="size-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}