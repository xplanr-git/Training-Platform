import React from 'react';
import { Award } from 'lucide-react';

export function CertificateSettings() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Certificate Settings</h3>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
          <Award className="size-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">Certificate Template</h4>
          <p className="text-gray-500 mb-6">Upload a custom certificate background or choose from our templates.</p>
          <button className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium">
            Configure Certificate
          </button>
        </div>
      </div>
    </div>
  );
}