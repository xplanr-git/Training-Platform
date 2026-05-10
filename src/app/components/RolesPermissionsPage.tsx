import { ArrowLeft, Shield, Users, Settings, Plus, Edit2, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface RolesPermissionsPageProps {
  onNavigate: (page: string) => void;
}

interface Role {
  id: string;
  name: string;
  description: string;
  userCount: number;
  permissions: string[];
}

export function RolesPermissionsPage({ onNavigate }: RolesPermissionsPageProps) {
  const [roles] = useState<Role[]>([
    {
      id: 'company-admin',
      name: 'Company Admin',
      description: 'Full control over company instance and all sub-roles',
      userCount: 0,
      permissions: ['All Permissions'],
    },
    {
      id: 'developer',
      name: 'Developer',
      description: 'Technical role with course creation and editing capabilities',
      userCount: 0,
      permissions: ['Create Courses', 'Edit Courses', 'View Analytics'],
    },
    {
      id: 'sales-manager',
      name: 'Sales Manager',
      description: 'View business analytics and sales metrics',
      userCount: 0,
      permissions: ['View Analytics', 'Export Reports'],
    },
    {
      id: 'user-manager',
      name: 'User Manager',
      description: 'Manage employee accounts and enrollments',
      userCount: 0,
      permissions: ['Manage Users', 'Enroll Users', 'View Progress'],
    },
    {
      id: 'instructor',
      name: 'Instructor',
      description: 'Create and manage courses and lessons',
      userCount: 0,
      permissions: ['Create Courses', 'Edit Courses', 'Manage Content', 'View Course Analytics'],
    },
    {
      id: 'user',
      name: 'User (Employee)',
      description: 'Regular employee with course access',
      userCount: 0,
      permissions: ['Take Courses', 'View Progress', 'Download Certificates'],
    },
  ]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start gap-4">
          <button
            onClick={() => onNavigate('admin')}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <ArrowLeft className="size-5 text-gray-700" />
          </button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">Roles & Permissions</h1>
            <p className="text-gray-600 mt-1">Configure user roles and their permissions across the platform</p>
          </div>
          <button
            className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
            disabled
          >
            <Plus className="size-5" />
            Add Custom Role
          </button>
        </div>

        {/* Role Hierarchy Overview */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="size-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Role Hierarchy</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="size-10 bg-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
                SA
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Super Admin (Platform Admin)</h3>
                <p className="text-sm text-gray-600">Managed by Outdure team • Full platform visibility and control</p>
              </div>
            </div>
            
            <div className="ml-8 border-l-2 border-gray-300 pl-8 space-y-3">
              <div className="flex items-start gap-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="size-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
                  CA
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Company Admin</h3>
                  <p className="text-sm text-gray-600">Created when company signs up • Full control over company instance</p>
                </div>
              </div>
              
              <div className="ml-8 border-l-2 border-gray-300 pl-8 space-y-2">
                <div className="flex items-start gap-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="size-8 bg-green-600 rounded-lg flex items-center justify-center text-white text-sm font-bold">
                    D
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">Developer</h4>
                    <p className="text-xs text-gray-600">Technical course management</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="size-8 bg-green-600 rounded-lg flex items-center justify-center text-white text-sm font-bold">
                    SM
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">Sales Manager</h4>
                    <p className="text-xs text-gray-600">Analytics and reporting</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="size-8 bg-green-600 rounded-lg flex items-center justify-center text-white text-sm font-bold">
                    UM
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">User Manager</h4>
                    <p className="text-xs text-gray-600">Employee account management</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="size-8 bg-green-600 rounded-lg flex items-center justify-center text-white text-sm font-bold">
                    I
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">Instructor</h4>
                    <p className="text-xs text-gray-600">Course creation and content</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="size-8 bg-gray-600 rounded-lg flex items-center justify-center text-white text-sm font-bold">
                    U
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">User (Employee)</h4>
                    <p className="text-xs text-gray-600">Course access and learning</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Roles List */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <Users className="size-5 text-gray-700" />
              <h2 className="text-lg font-semibold text-gray-900">Manage Roles</h2>
            </div>
            <p className="text-sm text-gray-600 mt-1">Configure permissions for each role type</p>
          </div>
          
          <div className="divide-y divide-gray-200">
            {roles.map((role) => (
              <div key={role.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{role.name}</h3>
                      <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
                        {role.userCount} users
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{role.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {role.permissions.map((permission, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full"
                        >
                          {permission}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      disabled
                    >
                      <Edit2 className="size-4" />
                    </button>
                    {role.id !== 'company-admin' && role.id !== 'user' && (
                      <button
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        disabled
                      >
                        <Trash2 className="size-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Coming Soon Notice */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Settings className="size-5 text-yellow-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-gray-900">Configuration Coming Soon</h3>
              <p className="text-sm text-gray-700 mt-1">
                Role permission management will be available in a future update. You'll be able to customize permissions, 
                create custom roles, and configure access levels for each role type.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
