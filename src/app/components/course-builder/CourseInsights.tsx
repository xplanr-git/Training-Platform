import React from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';
import { Users, BookOpen, Star, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import { enrollmentsData, topActivitiesData, completionsData } from './data';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export function CourseInsights() {
  // Process data for charts
  const enrollmentTrend = [
    { name: 'Jan', students: 65 },
    { name: 'Feb', students: 85 },
    { name: 'Mar', students: 120 },
    { name: 'Apr', students: 90 },
    { name: 'May', students: 160 },
    { name: 'Jun', students: 240 },
  ];

  const deviceData = [
    { name: 'Desktop', value: 65 },
    { name: 'Mobile', value: 25 },
    { name: 'Tablet', value: 10 },
  ];

  const activityCompletionData = topActivitiesData.slice(0, 5).map(item => ({
    name: item.title.length > 20 ? item.title.substring(0, 20) + '...' : item.title,
    completions: item.completions,
    views: item.views
  }));

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Enrolled</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">1,247</h3>
              <p className="text-xs text-green-600 mt-1 flex items-center">
                <TrendingUp className="size-3 mr-1" />
                +12% from last month
              </p>
            </div>
            <div className="p-3 bg-blue-50 rounded-full">
              <Users className="size-6 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Active Students</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">843</h3>
              <p className="text-xs text-green-600 mt-1 flex items-center">
                <TrendingUp className="size-3 mr-1" />
                +5% from last month
              </p>
            </div>
            <div className="p-3 bg-teal-50 rounded-full">
              <BookOpen className="size-6 text-teal-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Avg. Rating</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">4.8</h3>
              <p className="text-xs text-gray-500 mt-1">Based on 156 reviews</p>
            </div>
            <div className="p-3 bg-yellow-50 rounded-full">
              <Star className="size-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Completion Rate</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">68%</h3>
              <p className="text-xs text-green-600 mt-1 flex items-center">
                <TrendingUp className="size-3 mr-1" />
                +2% from last month
              </p>
            </div>
            <div className="p-3 bg-purple-50 rounded-full">
              <CheckCircle className="size-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Enrollment Trend */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Enrollment Growth</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={enrollmentTrend}>
                <defs>
                  <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#009689" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#009689" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6B7280'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#6B7280'}} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #E5E7EB', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                  cursor={{ stroke: '#009689', strokeWidth: 1, strokeDasharray: '5 5' }}
                />
                <Area type="monotone" dataKey="students" stroke="#009689" strokeWidth={3} fillOpacity={1} fill="url(#colorStudents)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Device Distribution */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Device Usage</h3>
          <div className="h-[300px] w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={deviceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                >
                  {deviceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Performance */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Content Performance</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={activityCompletionData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#E5E7EB" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={150} tick={{fontSize: 12, fill: '#4B5563'}} />
                <Tooltip cursor={{fill: '#F3F4F6'}} />
                <Legend />
                <Bar dataKey="views" name="Views" fill="#8884d8" radius={[0, 4, 4, 0]} barSize={20} />
                <Bar dataKey="completions" name="Completions" fill="#00C49F" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Time Spent Distribution */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Average Time Spent per Section</h3>
          <div className="space-y-4">
            {[
              { label: 'Section 1: Introduction', time: '45 mins', pct: 90, color: 'bg-blue-500' },
              { label: 'Section 2: Core Concepts', time: '120 mins', pct: 75, color: 'bg-indigo-500' },
              { label: 'Section 3: Advanced Topics', time: '90 mins', pct: 60, color: 'bg-purple-500' },
              { label: 'Section 4: Projects', time: '180 mins', pct: 45, color: 'bg-pink-500' },
              { label: 'Section 5: Conclusion', time: '30 mins', pct: 85, color: 'bg-green-500' },
            ].map((item, idx) => (
              <div key={idx}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700 font-medium">{item.label}</span>
                  <span className="text-gray-500">{item.time}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${item.color}`} 
                    style={{ width: `${item.pct}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
