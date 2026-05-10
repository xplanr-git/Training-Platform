import { useState } from 'react';
import { ChevronLeft, ChevronRight, CheckCircle, PlayCircle, FileText, Menu, X } from 'lucide-react';
import { Course, User, Lesson } from '@/app/types';

interface LearningPageProps {
  course: Course;
  currentUser: User;
  onLessonComplete: (lessonId: string) => void;
  onBack: () => void;
}

export function LearningPage({ course, currentUser, onLessonComplete, onBack }: LearningPageProps) {
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const currentModule = course.modules[currentModuleIndex];
  const currentLesson = currentModule.lessons[currentLessonIndex];

  const isLessonCompleted = (lessonId: string) => {
    return currentUser.completedLessons.includes(lessonId);
  };

  const handleNextLesson = () => {
    if (currentLessonIndex < currentModule.lessons.length - 1) {
      setCurrentLessonIndex(currentLessonIndex + 1);
    } else if (currentModuleIndex < course.modules.length - 1) {
      setCurrentModuleIndex(currentModuleIndex + 1);
      setCurrentLessonIndex(0);
    }
  };

  const handlePreviousLesson = () => {
    if (currentLessonIndex > 0) {
      setCurrentLessonIndex(currentLessonIndex - 1);
    } else if (currentModuleIndex > 0) {
      setCurrentModuleIndex(currentModuleIndex - 1);
      const previousModule = course.modules[currentModuleIndex - 1];
      setCurrentLessonIndex(previousModule.lessons.length - 1);
    }
  };

  const goToLesson = (moduleIndex: number, lessonIndex: number) => {
    setCurrentModuleIndex(moduleIndex);
    setCurrentLessonIndex(lessonIndex);
  };

  const handleMarkComplete = () => {
    if (!isLessonCompleted(currentLesson.id)) {
      onLessonComplete(currentLesson.id);
    }
    handleNextLesson();
  };

  const totalLessons = course.modules.reduce((acc, module) => acc + module.lessons.length, 0);
  const completedCount = currentUser.completedLessons.filter(lessonId =>
    course.modules.some(module => module.lessons.some(lesson => lesson.id === lessonId))
  ).length;
  const progressPercentage = (completedCount / totalLessons) * 100;

  const hasPrevious = currentModuleIndex > 0 || currentLessonIndex > 0;
  const hasNext =
    currentModuleIndex < course.modules.length - 1 ||
    currentLessonIndex < currentModule.lessons.length - 1;

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      {/* Top Navigation */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-gray-300 hover:text-white lg:hidden"
          >
            {sidebarOpen ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>
          <button
            onClick={onBack}
            className="text-gray-300 hover:text-white transition-colors"
          >
            ← Exit Course
          </button>
        </div>
        
        <div className="flex-1 max-w-md mx-4 hidden sm:block">
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <span className="text-sm text-gray-300 whitespace-nowrap">
              {completedCount}/{totalLessons}
            </span>
          </div>
        </div>

        <div className="text-sm text-gray-300 hidden md:block">
          {course.title}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Course Content */}
        <div
          className={`${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } lg:translate-x-0 fixed lg:relative inset-y-0 left-0 z-30 w-80 bg-gray-800 border-r border-gray-700 flex flex-col transition-transform duration-300`}
        >
          <div className="p-4 border-b border-gray-700">
            <h2 className="font-semibold text-white">Course Content</h2>
            <div className="mt-2 text-sm text-gray-400">
              {completedCount} of {totalLessons} complete
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {course.modules.map((module, moduleIndex) => (
              <div key={module.id} className="border-b border-gray-700">
                <div className="p-4 bg-gray-750">
                  <h3 className="font-medium text-white text-sm">{module.title}</h3>
                  <div className="text-xs text-gray-400 mt-1">
                    {module.lessons.length} lessons
                  </div>
                </div>
                <div>
                  {module.lessons.map((lesson, lessonIndex) => {
                    const isCompleted = isLessonCompleted(lesson.id);
                    const isCurrent =
                      moduleIndex === currentModuleIndex && lessonIndex === currentLessonIndex;

                    return (
                      <button
                        key={lesson.id}
                        onClick={() => goToLesson(moduleIndex, lessonIndex)}
                        className={`w-full px-4 py-3 flex items-center gap-3 text-left transition-colors ${
                          isCurrent
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-300 hover:bg-gray-700'
                        }`}
                      >
                        {lesson.type === 'video' && (
                          <PlayCircle className="size-4 flex-shrink-0" />
                        )}
                        {lesson.type === 'pdf' && (
                          <FileText className="size-4 flex-shrink-0" />
                        )}
                        {lesson.type === 'quiz' && (
                          <FileText className="size-4 flex-shrink-0" />
                        )}
                        {lesson.type === 'reading' && (
                          <FileText className="size-4 flex-shrink-0" />
                        )}

                        <div className="flex-1 min-w-0">
                          <div className="text-sm truncate">{lesson.title}</div>
                          <div className="text-xs opacity-70">{lesson.duration}</div>
                        </div>

                        {isCompleted && (
                          <CheckCircle className="size-4 text-green-400 flex-shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col bg-black">
          {/* Video/Content Area */}
          <div className="flex-1 flex items-center justify-center bg-black">
            {currentLesson.type === 'video' ? (
              <div className="w-full h-full flex items-center justify-center">
                <iframe
                  src={currentLesson.videoUrl}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title={currentLesson.title}
                />
              </div>
            ) : currentLesson.type === 'pdf' ? (
              <div className="w-full h-full flex items-center justify-center bg-gray-900 p-4">
                <iframe
                  src={currentLesson.pdfUrl || (currentLesson as any).pdf_url || currentLesson.content || (currentLesson as any).embedCode || (currentLesson.description?.startsWith('data:') ? currentLesson.description : undefined)}
                  className="w-full h-full rounded-lg bg-white"
                  title={currentLesson.title}
                />
              </div>
            ) : currentLesson.type === 'quiz' ? (
              <div className="max-w-2xl w-full p-8">
                <div className="bg-gray-800 rounded-lg p-8 text-white">
                  <h2 className="text-2xl font-bold mb-6">{currentLesson.title}</h2>
                  <p className="text-gray-300 mb-6">
                    This is a quiz lesson. In a production environment, this would contain
                    interactive quiz questions.
                  </p>
                  <div className="space-y-4">
                    <div className="p-4 bg-gray-700 rounded-lg">
                      <p className="font-medium mb-2">Sample Question 1</p>
                      <p className="text-sm text-gray-400">
                        What is the most important aspect of effective leadership?
                      </p>
                    </div>
                    <div className="p-4 bg-gray-700 rounded-lg">
                      <p className="font-medium mb-2">Sample Question 2</p>
                      <p className="text-sm text-gray-400">
                        How do you handle team conflicts?
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="max-w-3xl w-full p-8">
                <div className="bg-gray-800 rounded-lg p-8 text-white">
                  <h2 className="text-2xl font-bold mb-6">{currentLesson.title}</h2>
                  <div className="prose prose-invert">
                    <p className="text-gray-300 leading-relaxed">
                      This is reading material. In a production environment, this would contain
                      the actual lesson content, formatted text, images, and other educational
                      materials.
                    </p>
                    <p className="text-gray-300 leading-relaxed mt-4">
                      Students would read through the content at their own pace and then mark
                      the lesson as complete when finished.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Navigation */}
          <div className="bg-gray-800 border-t border-gray-700 px-6 py-4">
            <div className="max-w-4xl mx-auto flex items-center justify-between">
              <button
                onClick={handlePreviousLesson}
                disabled={!hasPrevious}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  hasPrevious
                    ? 'bg-gray-700 text-white hover:bg-gray-600'
                    : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                }`}
              >
                <ChevronLeft className="size-4" />
                <span>Previous</span>
              </button>

              <div className="text-center">
                <h3 className="text-white font-medium">{currentLesson.title}</h3>
                <p className="text-sm text-gray-400 mt-1">
                  Module {currentModuleIndex + 1} • Lesson {currentLessonIndex + 1}
                </p>
              </div>

              <button
                onClick={handleMarkComplete}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <span>{isLessonCompleted(currentLesson.id) ? 'Next' : 'Complete & Next'}</span>
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
