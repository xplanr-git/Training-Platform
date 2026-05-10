import { Lock, Users, DollarSign } from 'lucide-react';
import { Course, CourseCategory } from '@/app/types';

interface CourseCardProps {
  course: Course;
  category?: CourseCategory;
  onClick: () => void;
}

export function CourseCard({ course, category, onClick }: CourseCardProps) {
  // Use a placeholder image if no thumbnail is provided
  const thumbnailUrl = course.thumbnail || course.imageUrl || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=600&fit=crop';
  
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
    >
      {/* Course Image */}
      <div className="relative h-40 bg-gray-100 overflow-hidden">
        <img
          src={thumbnailUrl}
          alt={course.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            // Fallback to placeholder if image fails to load
            e.currentTarget.src = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=600&fit=crop';
          }}
        />
        {course.isPrivate && (
          <div className="absolute top-2 left-2 bg-gray-800 bg-opacity-90 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
            <Lock className="size-3" />
            <span>Private</span>
          </div>
        )}
      </div>

      {/* Course Content */}
      <div className="p-4">
        {/* Title */}
        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 min-h-[3rem]">
          {course.title}
        </h3>

        {/* Category Badge */}
        {category && (
          <div className="mb-3">
            <span
              className="inline-block text-xs px-2 py-1 rounded"
              style={{ backgroundColor: category.color }}
            >
              {category.name}
            </span>
          </div>
        )}

        {/* Metadata */}
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <DollarSign className="size-4" />
            <span className="font-medium">{course.price || 'Free'}</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="size-4" />
            <span>{course.learnerCount || course.studentsEnrolled}</span>
          </div>
        </div>
      </div>
    </div>
  );
}