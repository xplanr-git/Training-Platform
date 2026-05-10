import React from 'react';
import { 
  BarChart3, Users, Activity, Award, ClipboardCheck, TrendingUp, PieChart, 
  PlayCircle, Clock, CheckSquare, MessageCircle, ClipboardList, Star, X, UserPlus 
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Cell
} from 'recharts';
import { Course } from '@/app/types';
import { 
  allActivitiesData, completionsData, enrollmentsData, atRiskData, 
  quizAttemptsData, topActivitiesData, certificatesData, topPerformersData, 
  quizResultsData 
} from './data';

interface DashboardProps {
  course: Course;
  dashboardTab: string;
  setDashboardTab: (tab: string) => void;
  sections: any[];
  setActiveModalType: (type: 'activity' | 'completions' | 'enrollments' | 'atRisk' | 'topActivities' | 'quizAttempts' | 'certificates' | 'quizResults' | 'topPerformers') => void;
  setShowActivityModal: (show: boolean) => void;
  setSelectedQuizResult: (result: any) => void;
  setShowQuizDetailModal: (show: boolean) => void;
}

export function Dashboard({ 
  course, 
  dashboardTab, 
  setDashboardTab, 
  sections, 
  setActiveModalType, 
  setShowActivityModal,
  setSelectedQuizResult,
  setShowQuizDetailModal
}: DashboardProps) {

  // Mock data for charts
  const enrollmentTrend = [
    { name: 'Jan', students: 182 },
    { name: 'Feb', students: 235 },
    { name: 'Mar', students: 291 },
    { name: 'Apr', students: 263 },
    { name: 'May', students: 344 },
    { name: 'Jun', students: 405 },
  ];

  const progressDistribution = [
    { name: 'Not Started', count: 149, fill: '#ef4444' },
    { name: '1-25%', count: 224, fill: '#f97316' },
    { name: '26-50%', count: 286, fill: '#eab308' },
    { name: '51-75%', count: 187, fill: '#84cc16' },
    { name: '76-99%', count: 125, fill: '#4ade80' },
    { name: 'Completed', count: 276, fill: '#16a34a' },
  ];

  const ratingDistribution = [
    { name: '5 Stars', count: 68, fill: '#16a34a' },
    { name: '4 Stars', count: 22, fill: '#4ade80' },
    { name: '3 Stars', count: 7, fill: '#eab308' },
    { name: '2 Stars', count: 2, fill: '#f97316' },
    { name: '1 Star', count: 1, fill: '#ef4444' },
  ];

  const peakActivityTimes = [
    { day: 'Mon', value: 85 },
    { day: 'Tue', value: 92 },
    { day: 'Wed', value: 88 },
    { day: 'Thu', value: 90 },
    { day: 'Fri', value: 78 },
    { day: 'Sat', value: 45 },
    { day: 'Sun', value: 38 },
  ];

  return (
    <div className="space-y-6">
      {/* Dashboard Sub-Navigation Tabs */}
      <div className="bg-white rounded-lg border border-gray-200 p-1">
        <div className="flex gap-1 overflow-x-auto">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'students', label: 'Students', icon: Users },
            { id: 'activity', label: 'Activity', icon: Activity },
            { id: 'certificates', label: 'Certificates', icon: Award },
            { id: 'quiz', label: 'Quiz', icon: ClipboardCheck },
            { id: 'performance', label: 'Performance', icon: TrendingUp },
            { id: 'analytics', label: 'Analytics', icon: PieChart },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setDashboardTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                dashboardTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <tab.icon className="size-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Tab */}
      {dashboardTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metrics Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Enrollments</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">1,247</p>
                  <p className="text-sm text-green-600 mt-1">↑ 12% this month</p>
                </div>
                <Users className="size-10 text-blue-600" />
              </div>
            </div>
            
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Completion Rate</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">68%</p>
                  <p className="text-sm text-green-600 mt-1">↑ 5% this month</p>
                </div>
                <Award className="size-10 text-green-600" />
              </div>
            </div>
            
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Avg. Rating</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{course.rating}</p>
                  <p className="text-sm text-yellow-600 mt-1">★ {course.students} reviews</p>
                </div>
                <TrendingUp className="size-10 text-yellow-600" />
              </div>
            </div>
            
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Students</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">823</p>
                  <p className="text-sm text-blue-600 mt-1">66% of total</p>
                </div>
                <PlayCircle className="size-10 text-teal-600" />
              </div>
            </div>
          </div>

          {/* Enrollment & Completion Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Enrollment Trends (Last 6 Months)</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={enrollmentTrend}>
                    <defs>
                      <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Area type="monotone" dataKey="students" stroke="#2563eb" fillOpacity={1} fill="url(#colorStudents)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Completion Milestones</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">Students Completed</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">276</p>
                  </div>
                  <Award className="size-8 text-green-600" />
                </div>
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">In Progress</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">822</p>
                  </div>
                  <TrendingUp className="size-8 text-blue-600" />
                </div>
                <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">Avg. Progress</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">64%</p>
                  </div>
                  <BarChart3 className="size-8 text-purple-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Student Progress & Engagement */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Student Progress Distribution</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart layout="vertical" data={progressDistribution} margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 12}} />
                    <Tooltip />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={20}>
                      {progressDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Engagement Metrics</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Clock className="size-5 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Avg. Time Spent</p>
                      <p className="text-xs text-gray-600">Per student</p>
                    </div>
                  </div>
                  <span className="text-lg font-bold text-gray-900">4.2 hrs</span>
                </div>
                
                <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <PlayCircle className="size-5 text-teal-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Video Watch Rate</p>
                      <p className="text-xs text-gray-600">Avg. completion</p>
                    </div>
                  </div>
                  <span className="text-lg font-bold text-gray-900">87%</span>
                </div>
                
                <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckSquare className="size-5 text-green-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Quiz Pass Rate</p>
                      <p className="text-xs text-gray-600">First attempt</p>
                    </div>
                  </div>
                  <span className="text-lg font-bold text-gray-900">74%</span>
                </div>
                
                <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <MessageCircle className="size-5 text-purple-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Discussion Posts</p>
                      <p className="text-xs text-gray-600">Total interactions</p>
                    </div>
                  </div>
                  <span className="text-lg font-bold text-gray-900">1,384</span>
                </div>
                
                <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Award className="size-5 text-yellow-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Certificates Issued</p>
                      <p className="text-xs text-gray-600">Completed students</p>
                    </div>
                  </div>
                  <span className="text-lg font-bold text-gray-900">276</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section Performance */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Section Performance Analysis</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Section</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Completion Rate</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Avg. Time</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Engagement</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Drop-off Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {sections.map((section, index) => {
                    const completionRate = Math.floor(Math.random() * 30) + 60;
                    const avgTime = Math.floor(Math.random() * 40) + 20;
                    const engagement = Math.floor(Math.random() * 25) + 70;
                    const dropOff = Math.floor(Math.random() * 15) + 5;
                    
                    return (
                      <tr key={section.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900">{String(index + 1).padStart(2, '0')}</span>
                            <span className="text-sm text-gray-900">{section.title}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-24 bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${completionRate >= 80 ? 'bg-green-600' : completionRate >= 60 ? 'bg-yellow-600' : 'bg-red-600'}`}
                                style={{ width: `${completionRate}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium text-gray-900">{completionRate}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-sm text-gray-900">{avgTime} min</span>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`text-sm font-medium ${engagement >= 85 ? 'text-green-600' : engagement >= 70 ? 'text-yellow-600' : 'text-red-600'}`}>
                            {engagement}%
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`text-sm font-medium ${dropOff <= 10 ? 'text-green-600' : dropOff <= 15 ? 'text-yellow-600' : 'text-red-600'}`}>
                            {dropOff}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Activity Performance */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Top Performing Activities</h3>
              <button
                onClick={() => {
                  setActiveModalType('topActivities');
                  setShowActivityModal(true);
                }}
                className="text-sm text-teal-600 hover:text-teal-700 font-medium"
              >
                Show All
              </button>
            </div>
            <div className="space-y-3">
              {topActivitiesData.slice(0, 5).map((activity, index) => {
                const getActivityIcon = (type: string) => {
                  if (type === 'video') return <PlayCircle className="size-5" />;
                  if (type === 'quiz') return <Award className="size-5" />;
                  if (type === 'assignment') return <ClipboardList className="size-5" />;
                  if (type === 'discussion') return <MessageCircle className="size-5" />;
                  return <Activity className="size-5" />;
                };
                
                return (
                  <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <div className="text-gray-600">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{activity.title}</p>
                        <p className="text-sm text-gray-600">{activity.section}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Views</p>
                        <p className="text-lg font-bold text-gray-900">{activity.views}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Completions</p>
                        <p className="text-lg font-bold text-gray-900">{activity.completions}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Rating</p>
                        <p className="text-lg font-bold text-yellow-600">★ {activity.rating}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Student Feedback & Reviews */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Rating Distribution</h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart layout="vertical" data={ratingDistribution} margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" width={60} tick={{fontSize: 12}} />
                    <Tooltip />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={20}>
                      {ratingDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Average Rating</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{course.rating}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Total Reviews</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{course.students}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Reviews</h3>
              <div className="space-y-4">
                <div className="pb-4 border-b border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="size-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
                        MK
                      </div>
                      <span className="font-medium text-gray-900">Michael Kim</span>
                    </div>
                    <span className="text-yellow-600">★★★★★</span>
                  </div>
                  <p className="text-sm text-gray-600">Excellent course! Very comprehensive and well-structured. The activities are engaging.</p>
                  <p className="text-xs text-gray-500 mt-2">2 days ago</p>
                </div>
                
                <div className="pb-4 border-b border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="size-8 bg-green-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
                        SJ
                      </div>
                      <span className="font-medium text-gray-900">Sarah Johnson</span>
                    </div>
                    <span className="text-yellow-600">★★★★★</span>
                  </div>
                  <p className="text-sm text-gray-600">Great learning experience! The instructor explains concepts clearly.</p>
                  <p className="text-xs text-gray-500 mt-2">5 days ago</p>
                </div>
                
                <div className="pb-4 border-b border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="size-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
                        AL
                      </div>
                      <span className="font-medium text-gray-900">Alex Lee</span>
                    </div>
                    <span className="text-yellow-600">★★★★☆</span>
                  </div>
                  <p className="text-sm text-gray-600">Very good content. Would appreciate more practical examples.</p>
                  <p className="text-xs text-gray-500 mt-2">1 week ago</p>
                </div>
              </div>
            </div>
          </div>

          {/* Time-based Analytics */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Peak Activity Times</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={peakActivityTimes}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#0d9488" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-sm text-gray-600 mt-4 text-center">
              Peak activity: Wednesday afternoons (2-5 PM)
            </p>
          </div>
        </div>
      )}

      {/* Students Tab */}
      {dashboardTab === 'students' && (
        <div className="space-y-6">
          {/* Recent Course Completions */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Recent Course Completions</h3>
              <button
                onClick={() => {
                  setActiveModalType('completions');
                  setShowActivityModal(true);
                }}
                className="text-sm text-teal-600 hover:text-teal-700 font-medium"
              >
                Show All
              </button>
            </div>
            <div className="space-y-3">
              {completionsData.slice(0, 5).map((student, index) => (
                <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className={`size-10 ${student.color} rounded-full flex items-center justify-center text-white font-medium text-sm`}>
                      {student.avatar}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{student.name}</p>
                      <p className="text-sm text-gray-600">{student.role}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Award className="size-5 text-green-600" />
                    <span className="text-sm text-gray-500">{student.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Certificates Issued */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Certificates Issued</h3>
              <span className="text-sm font-medium text-green-600">276 total</span>
            </div>
            <div className="space-y-3">
              {certificatesData.slice(0, 5).map((student, index) => (
                <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className={`size-10 ${student.color} rounded-full flex items-center justify-center text-white font-medium text-sm`}>
                      {student.avatar}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{student.name}</p>
                      <p className="text-sm text-gray-600">{student.role}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">Score: {student.score}</p>
                    <p className="text-xs text-gray-500">{student.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Enrollments */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Recent Enrollments</h3>
              <button
                onClick={() => {
                  setActiveModalType('enrollments');
                  setShowActivityModal(true);
                }}
                className="text-sm text-teal-600 hover:text-teal-700 font-medium"
              >
                Show All
              </button>
            </div>
            <div className="space-y-3">
              {enrollmentsData.slice(0, 5).map((student, index) => (
                <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className={`size-10 ${student.color} rounded-full flex items-center justify-center text-white font-medium text-sm`}>
                      {student.avatar}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{student.name}</p>
                      <p className="text-sm text-gray-600">{student.role}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <UserPlus className="size-4 text-blue-600" />
                    <span className="text-sm text-gray-500">{student.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Students At Risk */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Students At Risk</h3>
              <button
                onClick={() => {
                  setActiveModalType('atRisk');
                  setShowActivityModal(true);
                }}
                className="text-sm text-teal-600 hover:text-teal-700 font-medium"
              >
                Show All
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">Students who haven't made progress in over 7 days</p>
            <div className="space-y-3">
              {atRiskData.slice(0, 5).map((student, index) => (
                <div key={index} className="flex items-center justify-between p-3 border border-red-200 bg-red-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`size-10 ${student.color} rounded-full flex items-center justify-center text-white font-medium text-sm`}>
                      {student.avatar}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{student.name}</p>
                      <p className="text-sm text-gray-600">{student.role}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-red-600">{student.progress}% complete</p>
                    <p className="text-xs text-gray-500">Last active: {student.lastActive}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Activity Tab */}
      {dashboardTab === 'activity' && (
        <div className="space-y-6">
          {/* Live Activity Feed */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Live Activity Feed</h3>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="size-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-gray-600">Live</span>
                </div>
                <button
                  onClick={() => {
                    setActiveModalType('activity');
                    setShowActivityModal(true);
                  }}
                  className="text-sm text-teal-600 hover:text-teal-700 font-medium"
                >
                  Show All
                </button>
              </div>
            </div>
            <div className="space-y-4">
              {allActivitiesData.slice(0, 10).map((activity, index) => (
                <div key={index} className="flex items-start gap-3 pb-4 border-b border-gray-100 last:border-0">
                  <activity.icon className={`size-5 ${activity.color} mt-0.5`} />
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">{activity.name}</span> {activity.action}{' '}
                      <span className="font-medium">{activity.item}</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Quiz Attempts */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Recent Quiz Attempts</h3>
              <button
                onClick={() => {
                  setActiveModalType('quizAttempts');
                  setShowActivityModal(true);
                }}
                className="text-sm text-teal-600 hover:text-teal-700 font-medium"
              >
                Show All
              </button>
            </div>
            <div className="space-y-3">
              {quizAttemptsData.slice(0, 5).map((attempt, index) => (
                <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className={`size-10 ${attempt.color} rounded-full flex items-center justify-center text-white font-medium text-sm`}>
                      {attempt.avatar}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{attempt.name}</p>
                      <p className="text-sm text-gray-600">{attempt.quiz}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-medium ${attempt.status === 'Passed' ? 'text-green-600' : 'text-red-600'}`}>
                      {attempt.score}% · {attempt.status}
                    </p>
                    <p className="text-xs text-gray-500">{attempt.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Certificates Tab */}
      {dashboardTab === 'certificates' && (
        <div className="space-y-6">
          {/* Certificates Issued */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Certificates Issued</h3>
              <button
                onClick={() => {
                  setActiveModalType('certificates');
                  setShowActivityModal(true);
                }}
                className="text-sm text-teal-600 hover:text-teal-700 font-medium"
              >
                Show All
              </button>
            </div>
            <div className="space-y-3">
              {certificatesData.slice(0, 10).map((student, index) => (
                <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className={`size-10 ${student.color} rounded-full flex items-center justify-center text-white font-medium text-sm`}>
                      {student.avatar}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{student.name}</p>
                      <p className="text-sm text-gray-600">{student.role}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">Score: {student.score}</p>
                    <p className="text-xs text-gray-500">{student.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Quiz Tab */}
      {dashboardTab === 'quiz' && (
        <div className="space-y-6">
          {/* Quiz Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Attempts</p>
                  <p className="text-2xl font-bold text-gray-900">{quizResultsData.length}</p>
                </div>
                <ClipboardCheck className="size-8 text-blue-600" />
              </div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Average Score</p>
                  <p className="text-2xl font-bold text-gray-900">87%</p>
                </div>
                <Star className="size-8 text-yellow-500" />
              </div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Pass Rate</p>
                  <p className="text-2xl font-bold text-green-600">90%</p>
                </div>
                <CheckSquare className="size-8 text-green-600" />
              </div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Failed Attempts</p>
                  <p className="text-2xl font-bold text-red-600">2</p>
                </div>
                <X className="size-8 text-red-600" />
              </div>
            </div>
          </div>

          {/* Quiz Results Table */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Quiz Results</h3>
              <button
                onClick={() => {
                  setActiveModalType('quizResults');
                  setShowActivityModal(true);
                }}
                className="text-sm text-teal-600 hover:text-teal-700 font-medium"
              >
                Show All
              </button>
            </div>
            <div className="space-y-3">
              {quizResultsData.slice(0, 10).map((result, index) => (
                <div 
                  key={index} 
                  onClick={() => {
                    setSelectedQuizResult(result);
                    setShowQuizDetailModal(true);
                  }}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-all hover:shadow-sm"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className={`size-10 ${result.color} rounded-full flex items-center justify-center text-white font-medium text-sm`}>
                      {result.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900">{result.name}</p>
                      <p className="text-sm text-gray-600 truncate">{result.quiz}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className={`text-sm font-medium ${result.status === 'Passed' ? 'text-green-600' : 'text-red-600'}`}>
                        {result.score}
                      </p>
                      <p className="text-xs text-gray-500">{result.attempts} {result.attempts === 1 ? 'attempt' : 'attempts'}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      result.status === 'Passed' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {result.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Performance Tab */}
      {dashboardTab === 'performance' && (
        <div className="space-y-6">
          {/* Top Performers */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Top Performers</h3>
              <button
                onClick={() => {
                  setActiveModalType('topPerformers');
                  setShowActivityModal(true);
                }}
                className="text-sm text-teal-600 hover:text-teal-700 font-medium"
              >
                Show All
              </button>
            </div>
            <div className="space-y-3">
              {topPerformersData.slice(0, 10).map((student, index) => (
                <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="size-8 flex items-center justify-center font-bold text-gray-600">
                      #{student.rank}
                    </div>
                    <div className={`size-10 ${student.color} rounded-full flex items-center justify-center text-white font-medium text-sm`}>
                      {student.avatar}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{student.name}</p>
                      <p className="text-sm text-gray-600">{student.role}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">Score: {student.score}%</p>
                    <p className="text-xs text-gray-500">{student.activities} activities · {student.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Analytics Tab - Same as Overview for now */}
      {dashboardTab === 'analytics' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Advanced Analytics</h3>
            <p className="text-gray-600">Advanced analytics features coming soon...</p>
          </div>
        </div>
      )}
    </div>
  );
}
