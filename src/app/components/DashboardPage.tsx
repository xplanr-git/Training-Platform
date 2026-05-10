import { User, Course } from '@/app/types';
import { CourseCard } from '@/app/components/CourseCard';
import { TrendingUp, Award, Clock, Target } from 'lucide-react';

interface DashboardPageProps {
  currentUser: User;
  courses: Course[];
  onCourseClick: (courseId: string) => void;
  onContinueLearning: (courseId: string) => void;
}

export function DashboardPage({ currentUser, courses, onCourseClick, onContinueLearning }: DashboardPageProps) {
  const enrolledCourses = courses.filter(course => 
    currentUser.enrolledCourses.includes(course.id)
  );

  const getCourseProgress = (course: Course): number => {
    const totalLessons = course.modules.reduce((acc, module) => acc + module.lessons.length, 0);
    const completedLessons = currentUser.completedLessons.filter(lessonId =>
      course.modules.some(module => module.lessons.some(lesson => lesson.id === lessonId))
    ).length;
    return totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;
  };

  const totalCoursesEnrolled = enrolledCourses.length;
  const completedCourses = enrolledCourses.filter(course => getCourseProgress(course) === 100).length;
  const inProgressCourses = enrolledCourses.filter(course => {
    const progress = getCourseProgress(course);
    return progress > 0 && progress < 100;
  }).length;
  const totalLessonsCompleted = currentUser.completedLessons.length;

  const coursesInProgress = enrolledCourses
    .filter(course => {
      const progress = getCourseProgress(course);
      return progress > 0 && progress < 100;
    })
    .sort((a, b) => getCourseProgress(b) - getCourseProgress(a));

  const notStartedCourses = enrolledCourses.filter(course => getCourseProgress(course) === 0);
  const completedCoursesList = enrolledCourses.filter(course => getCourseProgress(course) === 100);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Learning Dashboard</h1>
              <p className="text-gray-600 mt-2">Welcome back, {currentUser.name}!</p>
            </div>
            <div className="text-sm text-gray-600">
              <div>{currentUser.company}</div>
              <div>{currentUser.email}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Enrolled Courses</p>
                <p className="text-3xl font-bold text-gray-900">{totalCoursesEnrolled}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <TrendingUp className="size-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">In Progress</p>
                <p className="text-3xl font-bold text-gray-900">{inProgressCourses}</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Clock className="size-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Completed</p>
                <p className="text-3xl font-bold text-gray-900">{completedCourses}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <Award className="size-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Lessons Completed</p>
                <p className="text-3xl font-bold text-gray-900">{totalLessonsCompleted}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Target className="size-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Continue Learning Section */}
        {coursesInProgress.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Continue Learning</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {coursesInProgress.map(course => (
                <CourseCard
                  key={course.id}
                  course={course}
                  onClick={() => onContinueLearning(course.id)}
                  enrolled={true}
                  progress={getCourseProgress(course)}
                />
              ))}
            </div>
          </section>
        )}

        {/* Not Started Section */}
        {notStartedCourses.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Ready to Start</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {notStartedCourses.map(course => (
                <CourseCard
                  key={course.id}
                  course={course}
                  onClick={() => onContinueLearning(course.id)}
                  enrolled={true}
                  progress={0}
                />
              ))}
            </div>
          </section>
        )}

        {/* Completed Courses Section */}
        {completedCoursesList.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Completed Courses</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {completedCoursesList.map(course => (
                <CourseCard
                  key={course.id}
                  course={course}
                  onClick={() => onCourseClick(course.id)}
                  enrolled={true}
                  progress={100}
                />
              ))}
            </div>
          </section>
        )}

        {/* Empty State */}
        {enrolledCourses.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <Award className="size-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Courses Yet</h3>
            <p className="text-gray-600 mb-6">
              Start your learning journey by enrolling in a course.
            </p>
            <button
              onClick={() => onCourseClick('')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Browse Courses
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
