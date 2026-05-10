import React from 'react';
import { Zap, TrendingUp, AlertCircle, CheckCircle2, Lightbulb, Users } from 'lucide-react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, BarChart, Bar, XAxis, Tooltip } from 'recharts';

export function AICourseInsights() {
  const skillsData = [
    { subject: 'Engagement', A: 120, fullMark: 150 },
    { subject: 'Content', A: 98, fullMark: 150 },
    { subject: 'Clarity', A: 86, fullMark: 150 },
    { subject: 'Pacing', A: 99, fullMark: 150 },
    { subject: 'Difficulty', A: 85, fullMark: 150 },
    { subject: 'Relevance', A: 65, fullMark: 150 },
  ];

  const sentimentData = [
    { name: 'Positive', value: 75, fill: '#4ade80' },
    { name: 'Neutral', value: 15, fill: '#fbbf24' },
    { name: 'Negative', value: 10, fill: '#f87171' },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-100 p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-white rounded-lg shadow-sm">
            <Zap className="size-6 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">AI Analysis Summary</h3>
            <p className="text-sm text-gray-600 mt-1 max-w-3xl">
              Based on student behavior and feedback, your course is performing well in engagement but students are struggling with the pacing in Section 3.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quality Score Radar */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Course Quality Score</h3>
            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">8.5/10 Overall</span>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={skillsData}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#6b7280', fontSize: 12 }} />
                <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
                <Radar
                  name="Course Score"
                  dataKey="A"
                  stroke="#8b5cf6"
                  fill="#8b5cf6"
                  fillOpacity={0.6}
                />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Actionable Insights */}
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Actionable Recommendations</h3>
            
            <div className="space-y-4">
              <div className="flex gap-3 p-3 bg-amber-50 rounded-lg border border-amber-100">
                <AlertCircle className="size-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-amber-900 text-sm">Review Quiz Difficulty</h4>
                  <p className="text-xs text-amber-800 mt-1">
                    "Module 3 Assessment" has a 45% fail rate. Consider reviewing the questions or adding more preparatory material.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                <Lightbulb className="size-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900 text-sm">Engagement Opportunity</h4>
                  <p className="text-xs text-blue-800 mt-1">
                    Students who participate in discussions are 3x more likely to complete the course. Prompt more discussions in Section 2.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 p-3 bg-green-50 rounded-lg border border-green-100">
                <CheckCircle2 className="size-5 text-green-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-green-900 text-sm">Strong Performance</h4>
                  <p className="text-xs text-green-800 mt-1">
                    Video completion rates are 15% higher than industry average. Your video content style is working well.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Student Sentiment Analysis</h3>
             <div className="h-[150px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sentimentData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }} barSize={20}>
                  <XAxis type="number" hide />
                  <Tooltip cursor={{fill: 'transparent'}} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} background={{ fill: '#f3f4f6' }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
             <div className="flex justify-between mt-2 text-xs text-gray-500 px-2">
                <span>Positive (75%)</span>
                <span>Neutral (15%)</span>
                <span>Negative (10%)</span>
              </div>
          </div>
        </div>
      </div>
    </div>
  );
}
