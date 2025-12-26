import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import api from '@/lib/api';
import { MessageCircle, ThumbsUp, Send, Trash2, Pin } from 'lucide-react';

interface Question {
  _id: string;
  user: {
    _id: string;
    name: string;
    avatar?: string;
  };
  question: string;
  timestamp: number;
  replies: Reply[];
  upvotes: string[];
  isAnswered: boolean;
  isPinned: boolean;
  createdAt: string;
}

interface Reply {
  _id: string;
  user: {
    _id: string;
    name: string;
    avatar?: string;
    role: string;
  };
  answer: string;
  isInstructor: boolean;
  createdAt: string;
}

interface QuestionPanelProps {
  courseId: string;
  lessonId: string;
  currentTime?: number;
  onSeekToTime?: (time: number) => void;
}

export default function QuestionPanel({ courseId, lessonId, currentTime = 0, onSeekToTime }: QuestionPanelProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [replyText, setReplyText] = useState<{ [key: string]: string }>({});
  const [sortBy, setSortBy] = useState('recent');
  const [loading, setLoading] = useState(false);
  const [activeReply, setActiveReply] = useState<string | null>(null);

  useEffect(() => {
    fetchQuestions();
  }, [lessonId, sortBy]);

  const fetchQuestions = async () => {
    try {
      const { data } = await api.get(`/lessons/${lessonId}/questions?sortBy=${sortBy}`);
      setQuestions(data.data);
    } catch (error) {
      console.error('Failed to fetch questions:', error);
    }
  };

  const handlePostQuestion = async () => {
    if (!newQuestion.trim()) return;

    setLoading(true);
    try {
      await api.post('/questions', {
        courseId,
        lessonId,
        question: newQuestion,
        timestamp: Math.floor(currentTime),
      });
      setNewQuestion('');
      fetchQuestions();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to post question');
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async (questionId: string) => {
    if (!replyText[questionId]?.trim()) return;

    try {
      await api.post(`/questions/${questionId}/reply`, {
        answer: replyText[questionId],
      });
      setReplyText({ ...replyText, [questionId]: '' });
      setActiveReply(null);
      fetchQuestions();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to post reply');
    }
  };

  const handleUpvote = async (questionId: string) => {
    try {
      await api.post(`/questions/${questionId}/upvote`);
      fetchQuestions();
    } catch (error: any) {
      console.error('Failed to upvote:', error);
    }
  };

  const handleDelete = async (questionId: string) => {
    if (!confirm('Are you sure you want to delete this question?')) return;

    try {
      await api.delete(`/questions/${questionId}`);
      fetchQuestions();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to delete question');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const currentUserId = localStorage.getItem('userId'); // Assuming userId is stored

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Questions & Answers
          </CardTitle>
          <select
            className="text-sm border rounded px-2 py-1"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="recent">Recent</option>
            <option value="upvotes">Most Upvoted</option>
            <option value="unanswered">Unanswered</option>
          </select>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Ask Question */}
        <div className="space-y-2">
          <textarea
            className="w-full border rounded-lg p-3 text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:outline-none"
            rows={3}
            placeholder="Ask a question about this lesson..."
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
          />
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500">
              At: {formatTime(Math.floor(currentTime))}
            </span>
            <Button onClick={handlePostQuestion} disabled={loading || !newQuestion.trim()} size="sm">
              <Send className="h-4 w-4 mr-2" />
              Post Question
            </Button>
          </div>
        </div>

        {/* Questions List */}
        <div className="space-y-4 max-h-[500px] overflow-y-auto">
          {questions.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No questions yet. Be the first to ask!</p>
          ) : (
            questions.map((q) => (
              <div key={q._id} className="border rounded-lg p-4 space-y-3">
                {/* Question Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-sm font-semibold">
                        {q.user.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{q.user.name}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span>{new Date(q.createdAt).toLocaleDateString()}</span>
                          {q.timestamp > 0 && (
                            <>
                              <span>•</span>
                              <button
                                onClick={() => onSeekToTime?.(q.timestamp)}
                                className="text-blue-600 hover:underline"
                              >
                                {formatTime(q.timestamp)}
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-800">{q.question}</p>
                  </div>
                  {q.user._id === currentUserId && (
                    <button
                      onClick={() => handleDelete(q._id)}
                      className="text-gray-400 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Question Footer */}
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => handleUpvote(q._id)}
                    className={`flex items-center gap-1 text-sm ${
                      q.upvotes.includes(currentUserId || '')
                        ? 'text-blue-600'
                        : 'text-gray-500 hover:text-blue-600'
                    }`}
                  >
                    <ThumbsUp className="h-4 w-4" />
                    {q.upvotes.length}
                  </button>
                  <button
                    onClick={() => setActiveReply(activeReply === q._id ? null : q._id)}
                    className="text-sm text-gray-600 hover:text-blue-600 flex items-center gap-1"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Reply ({q.replies.length})
                  </button>
                  {q.isAnswered && <Badge variant="success">Answered</Badge>}
                  {q.isPinned && <Pin className="h-4 w-4 text-yellow-500" />}
                </div>

                {/* Replies */}
                {q.replies.length > 0 && (
                  <div className="pl-6 space-y-3 border-l-2 border-gray-200">
                    {q.replies.map((reply) => (
                      <div key={reply._id} className="bg-gray-50 p-3 rounded">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-sm">{reply.user.name}</p>
                          {reply.isInstructor && (
                            <Badge variant="default" className="text-xs">
                              Instructor
                            </Badge>
                          )}
                          <span className="text-xs text-gray-500">
                            {new Date(reply.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">{reply.answer}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Reply Input */}
                {activeReply === q._id && (
                  <div className="pl-6 flex gap-2">
                    <Input
                      placeholder="Write your reply..."
                      value={replyText[q._id] || ''}
                      onChange={(e) => setReplyText({ ...replyText, [q._id]: e.target.value })}
                      onKeyPress={(e) => e.key === 'Enter' && handleReply(q._id)}
                    />
                    <Button size="sm" onClick={() => handleReply(q._id)}>
                      Send
                    </Button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
