import { Star, Clock, Users, Award, ChevronDown, ChevronUp, PlayCircle, FileText, CheckCircle } from 'lucide-react';
import { Course, User } from '@/app/types';
import { ImageWithFallback } from '@/app/components/figma/ImageWithFallback';
import { useState } from 'react';

interface CourseDetailPageProps {
  course: Course;
  currentUser: User | null;
  onEnroll: (courseId: string) => void;
  onStartLearning: (courseId: string) => void;
  onBack: () => void;
}

export function CourseDetailPage({ course, currentUser, onEnroll, onStartLearning, onBack }: CourseDetailPageProps) {
  const [expandedModules, setExpandedModules] = useState<string[]>(course.modules?.[0]?.id ? [course.modules[0].id] : []);
  const isEnrolled = currentUser?.enrolledCourses.includes(course.id);

  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev =>
      prev.includes(moduleId)
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  const totalLessons = course.modules?.reduce((acc, module) => acc + (module.lessons?.length || 0), 0) || 0;
  const totalDuration = course.modules?.reduce((acc, module) => {
    return acc + (module.lessons?.reduce((sum, lesson) => {
      const minutes = parseInt(lesson.duration);
      return sum + (isNaN(minutes) ? 0 : minutes);
    }, 0) || 0);
  }, 0) || 0;

  const completedLessons = currentUser?.completedLessons.filter(lessonId =>
    course.modules?.some(module => module.lessons?.some(lesson => lesson.id === lessonId))
  ).length || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Back Button */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={onBack}
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            ← Back to Courses
          </button>
        </div>
      </div>

      {/* Course Header */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm">
                  {course.category}
                </span>
                <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm">
                  {course.level}
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-4">{course.title}</h1>
              <p className="text-xl text-blue-100 mb-6">{course.description}</p>
              
              <div className="flex flex-wrap items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <Star className="size-5 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold">{course.rating || 0}</span>
                  <span className="text-blue-200">({course.studentsEnrolled || 0} students)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="size-5" />
                  <span>by {course.instructor}</span>
                </div>
              </div>

              {isEnrolled && (
                <div className="mt-6 p-4 bg-white/10 backdrop-blur-sm rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm">Your Progress</span>
                    <span className="text-sm font-semibold">
                      {completedLessons} / {totalLessons} lessons
                    </span>
                  </div>
                  <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-white transition-all duration-300"
                      style={{ width: `${(completedLessons / totalLessons) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-xl overflow-hidden text-gray-900">
                <div className="aspect-video relative">
                  <ImageWithFallback
                    src={course.imageUrl}
                    alt={course.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6">
                  {course.price && (
                    <div className="text-3xl font-bold mb-4">{course.price}</div>
                  )}
                  
                  {isEnrolled ? (
                    <button
                      onClick={() => onStartLearning(course.id)}
                      className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      Continue Learning
                    </button>
                  ) : (
                    <button
                      onClick={() => currentUser ? onEnroll(course.id) : alert('Please sign in to enroll')}
                      className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      Enroll Now
                    </button>
                  )}

                  <div className="mt-6 space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Duration</span>
                      <span className="font-medium">{course.duration}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Total Lessons</span>
                      <span className="font-medium">{totalLessons}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Level</span>
                      <span className="font-medium">{course.level}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Students Enrolled</span>
                      <span className="font-medium">{(course.studentsEnrolled || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Course Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Course Curriculum</h2>
              
              {(!course.modules || course.modules.length === 0) ? (
                <div className="text-center py-12 text-gray-500">
                  <p>No modules available yet.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {course.modules.map((module, moduleIndex) => (
                    <div key={module.id} className="border border-gray-200 rounded-lg overflow-hidden">
                      <button
                        onClick={() => toggleModule(module.id)}
                        className="w-full px-6 py-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="flex items-center justify-center size-8 bg-blue-100 text-blue-600 rounded-full text-sm font-semibold">
                            {moduleIndex + 1}
                          </span>
                          <span className="font-semibold text-gray-900">{module.title}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-sm text-gray-500">{module.lessons?.length || 0} lessons</span>
                          {expandedModules.includes(module.id) ? (
                            <ChevronUp className="size-5 text-gray-400" />
                          ) : (
                            <ChevronDown className="size-5 text-gray-400" />
                          )}
                        </div>
                      </button>

                      {expandedModules.includes(module.id) && (
                        <div className="bg-white">
                          {module.lessons?.map((lesson, lessonIndex) => {
                            const isCompleted = currentUser?.completedLessons.includes(lesson.id);
                            return (
                              <div
                                key={lesson.id}
                                className="px-6 py-4 flex items-center gap-4 border-t border-gray-100 hover:bg-gray-50"
                              >
                                {lesson.type === 'video' && (
                                  <PlayCircle className="size-5 text-blue-600 flex-shrink-0" />
                                )}
                                {lesson.type === 'quiz' && (
                                  <FileText className="size-5 text-purple-600 flex-shrink-0" />
                                )}
                                {lesson.type === 'reading' && (
                                  <FileText className="size-5 text-green-600 flex-shrink-0" />
                                )}
                                
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-900">{lesson.title}</span>
                                    {isCompleted && (
                                      <CheckCircle className="size-4 text-green-600 fill-green-600" />
                                    )}
                                  </div>
                                </div>
                                
                                <span className="text-sm text-gray-500">{lesson.duration}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-24">
              <h3 className="font-semibold text-gray-900 mb-4">What You'll Learn</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <CheckCircle className="size-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-600">
                    Master essential {course.category.toLowerCase()} concepts
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="size-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-600">
                    Apply real-world strategies and techniques
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="size-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-600">
                    Gain practical skills through hands-on exercises
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="size-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-600">
                    Earn a certificate of completion
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}