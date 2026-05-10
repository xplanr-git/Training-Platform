import React from 'react';

export function PendingReviews() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Pending Reviews</h3>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="size-10 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center font-bold">
                  S{i}
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Student {i} - Assignment {i}</h4>
                  <p className="text-sm text-gray-500">Submitted 2 days ago</p>
                </div>
              </div>
              <button className="px-3 py-1.5 text-sm font-medium text-teal-600 border border-teal-600 rounded-lg hover:bg-teal-50">
                Review
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}