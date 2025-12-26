import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select } from '@/components/ui/select';
import api from '@/lib/api';

interface Course {
  _id: string;
  title: string;
  description: string;
  instructor: {
    _id: string;
    name: string;
  };
  level: string;
  category: string;
  thumbnail?: string;
  lessons: any[];
  requiredPlan: string;
  createdAt: string;
}

export default function CoursesManagement() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    level: 'beginner',
    category: 'general',
    requiredPlan: 'basic',
  });
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const { data } = await api.get('/courses');
      setCourses(data.data);
    } catch (error) {
      console.error('Failed to fetch courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCourse = () => {
    setSelectedCourse(null);
    setFormData({
      title: '',
      description: '',
      level: 'beginner',
      category: 'general',
      requiredPlan: 'basic',
    });
    setThumbnailFile(null);
    setIsDialogOpen(true);
  };

  const handleEditCourse = (course: Course) => {
    setSelectedCourse(course);
    setFormData({
      title: course.title,
      description: course.description,
      level: course.level,
      category: course.category,
      requiredPlan: course.requiredPlan,
    });
    setThumbnailFile(null);
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const data = new FormData();
      data.append('title', formData.title);
      data.append('description', formData.description);
      data.append('level', formData.level);
      data.append('category', formData.category);
      data.append('requiredPlan', formData.requiredPlan);
      if (thumbnailFile) {
        data.append('thumbnail', thumbnailFile);
      }

      if (selectedCourse) {
        await api.put(`/courses/${selectedCourse._id}`, data, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        alert('Course updated successfully!');
      } else {
        await api.post('/courses', data, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        alert('Course created successfully!');
      }
      setIsDialogOpen(false);
      setThumbnailFile(null);
      fetchCourses();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to save course');
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm('Are you sure you want to delete this course? This action cannot be undone.')) return;

    try {
      await api.delete(`/courses/${courseId}`);
      alert('Course deleted successfully!');
      fetchCourses();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to delete course');
    }
  };

  const getLevelBadge = (level: string) => {
    const variants: { [key: string]: 'default' | 'success' | 'warning' } = {
      beginner: 'success',
      intermediate: 'warning',
      advanced: 'danger',
    };
    return <Badge variant={variants[level] || 'default'}>{level.toUpperCase()}</Badge>;
  };

  const getSubscriptionBadge = (plan: string) => {
    if (!plan) return null;
    const variants: { [key: string]: 'default' | 'success' | 'warning' } = {
      basic: 'secondary',
      pro: 'default',
      premium: 'success',
    };
    return <Badge variant={variants[plan] || 'default'}>{plan.toUpperCase()}</Badge>;
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2">Courses Management</h1>
          <p className="text-gray-600">Manage courses, lessons, and educational content</p>
        </div>
        <Button onClick={handleCreateCourse}>+ Create Course</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <Card key={course._id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg mb-2">{course.title}</CardTitle>
                  <CardDescription className="line-clamp-2">{course.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {getLevelBadge(course.level)}
                {getSubscriptionBadge(course.requiredPlan)}
              </div>
              <div className="text-sm text-gray-600 space-y-1">
                <p>
                  <span className="font-medium">Instructor:</span> {course.instructor.name}
                </p>
                <p>
                  <span className="font-medium">Category:</span> {course.category}
                </p>
                <p>
                  <span className="font-medium">Lessons:</span> {course.lessons?.length || 0}
                </p>
                <p>
                  <span className="font-medium">Created:</span>{' '}
                  {new Date(course.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  onClick={() => window.location.href = `/admin/courses/${course._id}/lessons`}
                  className="flex-1"
                >
                  Manage Lessons
                </Button>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => handleEditCourse(course)} className="flex-1">
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDeleteCourse(course._id)}
                  className="flex-1"
                >
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {courses.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            No courses found. Create your first course to get started!
          </CardContent>
        </Card>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedCourse ? 'Edit Course' : 'Create New Course'}</DialogTitle>
            <p className="text-sm text-gray-600">
              After creating the course, you can add lessons with videos and PDF resources.
            </p>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Title</label>
              <Input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Course title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                className="w-full border border-gray-300 rounded-md p-2 text-sm"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Course description"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Level</label>
              <Select
                value={formData.level}
                onChange={(e) => setFormData({ ...formData, level: e.target.value })}
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Category</label>
              <Select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                <option value="general">General</option>
                <option value="forex">Forex</option>
                <option value="crypto">Crypto</option>
                <option value="stocks">Stocks</option>
                <option value="indices">Indices</option>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Thumbnail (optional)</label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
              />
              {thumbnailFile && (
                <p className="text-xs text-gray-600 mt-1">{thumbnailFile.name}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Required Subscription</label>
              <Select
                value={formData.requiredPlan}
                onChange={(e) => setFormData({ ...formData, requiredPlan: e.target.value })}
              >
                <option value="basic">Basic</option>
                <option value="pro">Pro</option>
                <option value="premium">Premium</option>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {selectedCourse ? 'Update Course' : 'Create Course'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
