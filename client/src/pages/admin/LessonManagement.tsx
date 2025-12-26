import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ArrowLeft, Upload, FileText, Trash2, Play } from 'lucide-react';
import api from '@/lib/api';

interface Lesson {
  _id: string;
  title: string;
  description: string;
  videoUrl: string;
  duration: number;
  order: number;
  isFree: boolean;
  isPublished: boolean;
  resources: {
    _id: string;
    name: string;
    url: string;
  }[];
}

interface Course {
  _id: string;
  title: string;
  description: string;
}

export default function LessonManagement() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLessonDialogOpen, setIsLessonDialogOpen] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [lessonFormData, setLessonFormData] = useState({
    title: '',
    description: '',
    isFree: false,
    order: 1,
  });
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);

  useEffect(() => {
    fetchCourseAndLessons();
  }, [courseId]);

  const fetchCourseAndLessons = async () => {
    try {
      const { data } = await api.get(`/courses/${courseId}`);
      setCourse(data.data.course);
      setLessons(data.data.lessons || []);
    } catch (error) {
      console.error('Failed to fetch course:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLesson = () => {
    setSelectedLesson(null);
    setLessonFormData({
      title: '',
      description: '',
      isFree: false,
      order: lessons.length + 1,
    });
    setVideoFile(null);
    setIsLessonDialogOpen(true);
  };

  const handleSubmitLesson = async () => {
    if (!videoFile && !selectedLesson) {
      alert('Please select a video file');
      return;
    }

    setUploadingVideo(true);
    try {
      const formData = new FormData();
      formData.append('title', lessonFormData.title);
      formData.append('description', lessonFormData.description);
      formData.append('course', courseId!);
      formData.append('isFree', lessonFormData.isFree.toString());
      formData.append('order', lessonFormData.order.toString());
      
      if (videoFile) {
        formData.append('video', videoFile);
      }

      if (selectedLesson) {
        await api.put(`/courses/lessons/${selectedLesson._id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        alert('Lesson updated successfully!');
      } else {
        await api.post('/courses/lessons', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        alert('Lesson created successfully!');
      }
      
      setIsLessonDialogOpen(false);
      setVideoFile(null);
      fetchCourseAndLessons();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to save lesson');
    } finally {
      setUploadingVideo(false);
    }
  };

  const handleUploadPdfResource = async (lessonId: string) => {
    if (!pdfFile) {
      alert('Please select a PDF file');
      return;
    }

    setUploadingPdf(true);
    try {
      const formData = new FormData();
      formData.append('resource', pdfFile);

      await api.post(`/courses/lessons/${lessonId}/resources`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      alert('PDF uploaded successfully!');
      setPdfFile(null);
      fetchCourseAndLessons();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to upload PDF');
    } finally {
      setUploadingPdf(false);
    }
  };

  const handleDeleteResource = async (lessonId: string, resourceId: string) => {
    if (!confirm('Delete this PDF resource?')) return;

    try {
      await api.delete(`/courses/lessons/${lessonId}/resources/${resourceId}`);
      alert('Resource deleted successfully!');
      fetchCourseAndLessons();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to delete resource');
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!confirm('Delete this lesson? This action cannot be undone.')) return;

    try {
      await api.delete(`/courses/lessons/${lessonId}`);
      alert('Lesson deleted successfully!');
      fetchCourseAndLessons();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to delete lesson');
    }
  };

  const handleTogglePublish = async (lessonId: string, currentStatus: boolean) => {
    try {
      await api.put(`/courses/lessons/${lessonId}`, {
        isPublished: !currentStatus,
      });
      fetchCourseAndLessons();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to update lesson');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => navigate('/admin/courses')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Courses
        </Button>
        <div className="flex-1">
          <h1 className="text-4xl font-bold">{course?.title}</h1>
          <p className="text-gray-600">{course?.description}</p>
        </div>
        <Button onClick={handleCreateLesson}>+ Add Lesson</Button>
      </div>

      <div className="space-y-4">
        {lessons.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              No lessons yet. Click "Add Lesson" to create your first lesson.
            </CardContent>
          </Card>
        ) : (
          lessons.map((lesson, index) => (
            <Card key={lesson._id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center font-bold text-primary">
                      {index + 1}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{lesson.title}</CardTitle>
                      <p className="text-sm text-gray-600">{lesson.description}</p>
                    </div>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteLesson(lesson._id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between gap-4 text-sm">
                  <div className="flex items-center gap-4 text-gray-600">
                    <div className="flex items-center gap-2">
                      <Play className="h-4 w-4" />
                      Video: {lesson.duration || 0} min
                    </div>
                    {lesson.isFree && (
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                        Free Preview
                      </span>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant={lesson.isPublished ? "default" : "outline"}
                    onClick={() => handleTogglePublish(lesson._id, lesson.isPublished)}
                  >
                    {lesson.isPublished ? '✓ Published' : 'Publish'}
                  </Button>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-2 text-sm">PDF Resources ({lesson.resources?.length || 0})</h4>
                  
                  {lesson.resources?.length > 0 && (
                    <div className="space-y-2 mb-3">
                      {lesson.resources.map((resource) => (
                        <div key={resource._id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-red-600" />
                            <span className="text-sm">{resource.name}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteResource(lesson._id, resource._id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Input
                      type="file"
                      accept="application/pdf"
                      onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                      className="flex-1"
                    />
                    <Button
                      onClick={() => handleUploadPdfResource(lesson._id)}
                      disabled={!pdfFile || uploadingPdf}
                      size="sm"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {uploadingPdf ? 'Uploading...' : 'Upload PDF'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Lesson Dialog */}
      <Dialog open={isLessonDialogOpen} onOpenChange={setIsLessonDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedLesson ? 'Edit Lesson' : 'Create New Lesson'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Lesson Title</label>
              <Input
                value={lessonFormData.title}
                onChange={(e) => setLessonFormData({ ...lessonFormData, title: e.target.value })}
                placeholder="e.g., Introduction to Forex Trading"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                className="w-full border rounded-lg p-2 text-sm"
                rows={3}
                value={lessonFormData.description}
                onChange={(e) => setLessonFormData({ ...lessonFormData, description: e.target.value })}
                placeholder="Brief description of the lesson"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Video File</label>
              <Input
                type="file"
                accept="video/*"
                onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
              />
              {videoFile && (
                <p className="text-xs text-gray-600 mt-1">{videoFile.name}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isFree"
                checked={lessonFormData.isFree}
                onChange={(e) => setLessonFormData({ ...lessonFormData, isFree: e.target.checked })}
              />
              <label htmlFor="isFree" className="text-sm">
                Make this lesson free (preview)
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLessonDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitLesson} disabled={uploadingVideo}>
              {uploadingVideo ? 'Uploading...' : selectedLesson ? 'Update Lesson' : 'Create Lesson'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
