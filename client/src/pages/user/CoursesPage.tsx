import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchCourses } from '@/redux/slices/courseSlice';
import { RootState, AppDispatch } from '@/redux/store';
import { BookOpen } from 'lucide-react';

export default function CoursesPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { courses, loading } = useSelector((state: RootState) => state.course);

  useEffect(() => {
    dispatch(fetchCourses());
  }, [dispatch]);

  if (loading) return <div>Loading courses...</div>;

  return (
    <div>
      <h1 className="text-4xl font-bold mb-8">Trading Courses</h1>

      <div className="grid md:grid-cols-3 gap-6">
        {courses.map((course) => (
          <Link
            key={course._id}
            to={`/dashboard/courses/${course._id}`}
            className="bg-white rounded-lg shadow hover:shadow-lg transition overflow-hidden"
          >
            {course.thumbnail ? (
              <img
                src={course.thumbnail}
                alt={course.title}
                className="w-full h-48 object-cover"
              />
            ) : (
              <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                <BookOpen size={64} className="text-gray-400" />
              </div>
            )}
            <div className="p-6">
              <h3 className="text-xl font-bold mb-2">{course.title}</h3>
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">{course.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">
                  {course.level}
                </span>
                <span className="text-xs text-gray-600">{course.category}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {courses.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-gray-600">No courses available yet</p>
        </div>
      )}
    </div>
  );
}
