import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/redux/store';
import { fetchCourseById } from '@/redux/slices/courseSlice';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import api from '@/lib/api';
import QuestionPanel from '@/components/course/QuestionPanel';
import ResourcesPanel from '@/components/course/ResourcesPanel';

export default function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { currentCourse, lessons, loading } = useSelector((state: RootState) => state.course);
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [videoProgress, setVideoProgress] = useState<{ [key: string]: number }>({});
  const lastSaveTimeRef = useRef<{ [key: string]: number }>({});

  useEffect(() => {
    if (id) {
      dispatch(fetchCourseById(id));
      loadUserProgress(id);
    }
  }, [id, dispatch]);

  const loadUserProgress = async (courseId: string) => {
    try {
      const response = await api.get(`/courses/progress/${courseId}`);
      if (response.data.success && response.data.data.progress) {
        const progressMap: { [key: string]: number } = {};
        response.data.data.progress.forEach((p: any) => {
          if (p.lesson && p.lesson.duration) {
            const progressPercent = (p.watchedDuration / p.lesson.duration) * 100;
            progressMap[p.lesson._id] = Math.min(progressPercent, 100);
          }
        });
        setVideoProgress(progressMap);
      }
    } catch (error) {
      console.error('Failed to load progress:', error);
    }
  };

  const currentLesson = lessons?.[currentLessonIndex];

  const handleVideoProgress = async (lessonId: string, progress: number, currentTime: number) => {
    setVideoProgress((prev) => ({ ...prev, [lessonId]: progress }));
    
    // Throttle saves to every 5 seconds or at completion
    const now = Date.now();
    const lastSave = lastSaveTimeRef.current[lessonId] || 0;
    const timeSinceLastSave = now - lastSave;
    const shouldSave = timeSinceLastSave >= 5000 || progress >= 90;
    
    if (shouldSave) {
      lastSaveTimeRef.current[lessonId] = now;
      
      try {
        await api.post('/courses/progress', {
          lessonId,
          watchedDuration: Math.floor(currentTime),
          completed: progress >= 90,
        });
      } catch (error: any) {
        // Silently fail if not authenticated, don't break video playback
        if (error?.response?.status !== 401 && error?.response?.status !== 429) {
          console.error('Failed to update progress:', error);
        }
      }
    }
  };

  const goToNextLesson = () => {
    if (lessons && currentLessonIndex < lessons.length - 1) {
      setCurrentLessonIndex(currentLessonIndex + 1);
    }
  };

  const goToPreviousLesson = () => {
    if (currentLessonIndex > 0) {
      setCurrentLessonIndex(currentLessonIndex - 1);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!currentCourse) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Course not found</h2>
        <Button onClick={() => navigate('/dashboard/courses')}>Back to Courses</Button>
      </div>
    );
  }

  const completionPercentage = lessons
    ? Math.floor(
        (Object.values(videoProgress).filter((p) => p >= 90).length / lessons.length) * 100
      )
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2">{currentCourse.title}</h1>
          <p className="text-gray-600">{currentCourse.description}</p>
        </div>
        <Button variant="outline" onClick={() => navigate('/dashboard/courses')}>
          Back to Courses
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Course Progress</CardTitle>
            <Badge variant={completionPercentage === 100 ? 'success' : 'default'}>
              {completionPercentage}% Complete
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{currentLesson?.title || 'Select a lesson'}</CardTitle>
            </CardHeader>
            <CardContent>
              {currentLesson?.videoUrl ? (
                <div className="space-y-4">
                  <video
                    key={currentLesson._id}
                    controls
                    className="w-full rounded-lg bg-black"
                    onTimeUpdate={(e) => {
                      const video = e.currentTarget;
                      const progress = (video.currentTime / video.duration) * 100;
                      handleVideoProgress(currentLesson._id, progress, video.currentTime);
                    }}
                    onError={(e) => {
                      console.error('Video error:', e);
                      console.error('Video URL:', `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}${currentLesson.videoUrl}`);
                    }}
                    onLoadedMetadata={(e) => {
                      console.log('Video loaded successfully');
                    }}
                  >
                    <source src={`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}${currentLesson.videoUrl}`} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>

                  <div className="flex items-center justify-between">
                    <Button
                      onClick={goToPreviousLesson}
                      disabled={currentLessonIndex === 0}
                      variant="outline"
                    >
                      ← Previous Lesson
                    </Button>
                    <span className="text-sm text-gray-600">
                      Lesson {currentLessonIndex + 1} of {lessons?.length || 0}
                    </span>
                    <Button
                      onClick={goToNextLesson}
                      disabled={
                        !lessons || currentLessonIndex === lessons.length - 1
                      }
                    >
                      Next Lesson →
                    </Button>
                  </div>

                  {currentLesson.content && (
                    <div className="prose max-w-none mt-6">
                      <h3 className="text-lg font-semibold mb-2">Lesson Notes</h3>
                      <p className="text-gray-700">{currentLesson.content}</p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-12">No video available for this lesson</p>
              )}
            </CardContent>
          </Card>

          {/* Questions & Answers */}
          {currentLesson && (
            <QuestionPanel
              courseId={id!}
              lessonId={currentLesson._id}
              onSeekToTime={(time) => {
                const video = document.querySelector('video');
                if (video) video.currentTime = time;
              }}
            />
          )}

          {/* PDF Resources */}
          {currentLesson && currentLesson.resources && currentLesson.resources.length > 0 && (
            <ResourcesPanel resources={currentLesson.resources} />
          )}
        </div>

        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Course Content</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {lessons?.map((lesson, index) => (
                  <button
                    key={lesson._id}
                    onClick={() => setCurrentLessonIndex(index)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      index === currentLessonIndex
                        ? 'bg-primary text-white'
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{lesson.title}</p>
                        {lesson.duration && (
                          <p className={`text-xs mt-1 ${index === currentLessonIndex ? 'text-white/80' : 'text-gray-500'}`}>
                            {Math.floor(lesson.duration / 60)} min
                          </p>
                        )}
                      </div>
                      {videoProgress[lesson._id] >= 90 && (
                        <span className="text-green-500 text-xl">✓</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
