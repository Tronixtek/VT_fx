import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Calendar, Clock, User } from 'lucide-react';
import api from '@/lib/api';

interface AnalystStats {
  totalSignals: number;
  activeSignals: number;
  successRate: number;
  totalViews: number;
  profitableSignals: number;
  lossSignals: number;
  recentSignals: any[];
}

interface Booking {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
  };
  mentorship: {
    _id: string;
    title: string;
    duration: number;
    price: number;
  };
  scheduledDate: string;
  status: 'pending' | 'approved' | 'declined' | 'completed' | 'cancelled';
  notes?: string;
  meetingLink?: string;
  createdAt: string;
}

export default function AnalystDashboard() {
  const { user } = useSelector((state: RootState) => state.auth);
  const [stats, setStats] = useState<AnalystStats>({
    totalSignals: 0,
    activeSignals: 0,
    successRate: 0,
    totalViews: 0,
    profitableSignals: 0,
    lossSignals: 0,
    recentSignals: [],
  });
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeclineDialogOpen, setIsDeclineDialogOpen] = useState(false);
  const [meetingLink, setMeetingLink] = useState('');
  const [declineReason, setDeclineReason] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showAllBookings, setShowAllBookings] = useState(false);

  useEffect(() => {
    fetchStats();
    fetchBookings();
  }, []);

  const fetchStats = async () => {
    try {
      const { data } = await api.get('/signals/my-stats');
      setStats(data.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBookings = async (status?: string) => {
    try {
      const url = status && status !== 'all' 
        ? `/mentorship/bookings/analyst?status=${status}` 
        : '/mentorship/bookings/analyst';
      const { data } = await api.get(url);
      setBookings(data.data);
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
    }
  };

  const handleUpdateBookingStatus = async (bookingId: string, status: 'approved' | 'declined', link?: string, reason?: string) => {
    try {
      await api.put(`/mentorship/bookings/${bookingId}/status`, {
        status,
        meetingLink: link,
        declineReason: reason,
      });
      alert(`Booking ${status} successfully`);
      fetchBookings();
      setIsDialogOpen(false);
      setIsDeclineDialogOpen(false);
      setMeetingLink('');
      setDeclineReason('');
      setSelectedBooking(null);
    } catch (error: any) {
      alert(error.response?.data?.message || `Failed to ${status} booking`);
    }
  };

  const handleFilterChange = (filter: string) => {
    setStatusFilter(filter);
    setShowAllBookings(false);
    if (filter === 'all') {
      fetchBookings();
    } else {
      fetchBookings(filter);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: { [key: string]: 'default' | 'success' | 'warning' | 'danger' } = {
      pending: 'warning',
      approved: 'success',
      declined: 'danger',
      completed: 'default',
      cancelled: 'danger',
    };
    return <Badge variant={variants[status] || 'default'}>{status.toUpperCase()}</Badge>;
  };

  const displayedBookings = showAllBookings ? bookings : bookings.slice(0, 5);
  const hasMoreBookings = bookings.length > 5;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold mb-2">Analyst Dashboard</h1>
        <p className="text-gray-600">Welcome back, {user?.name}! Here's your signal performance overview.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Total Signals</p>
                <p className="text-3xl font-bold text-primary">{stats.totalSignals}</p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Active Signals</p>
                <p className="text-3xl font-bold text-green-600">{stats.activeSignals}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Success Rate</p>
                <p className="text-3xl font-bold text-primary">{stats.successRate.toFixed(1)}%</p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Total Views</p>
                <p className="text-3xl font-bold text-primary">{stats.totalViews}</p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Performance Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <span className="font-medium text-green-800">Profitable Signals</span>
                <span className="text-2xl font-bold text-green-600">{stats.profitableSignals}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <span className="font-medium text-red-800">Loss Signals</span>
                <span className="text-2xl font-bold text-red-600">{stats.lossSignals}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <span className="font-medium text-blue-800">Win/Loss Ratio</span>
                <span className="text-2xl font-bold text-blue-600">
                  {stats.lossSignals > 0 ? (stats.profitableSignals / stats.lossSignals).toFixed(2) : stats.profitableSignals}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Signals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.recentSignals.length > 0 ? (
                stats.recentSignals.slice(0, 5).map((signal: any) => (
                  <div key={signal._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{signal.symbol}</p>
                      <p className="text-sm text-gray-600">{signal.type}</p>
                    </div>
                    <Badge variant={signal.status === 'active' ? 'default' : signal.status === 'hit_tp' ? 'success' : 'danger'}>
                      {signal.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-8">No signals yet. Create your first signal to get started!</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Booking Requests Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <span>Mentorship Booking Requests</span>
            <Badge variant="warning">{bookings.filter(b => b.status === 'pending').length} Pending</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filter Tabs */}
          <div className="flex flex-wrap gap-2 mb-6 pb-4 border-b">
            <Button
              variant={statusFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleFilterChange('all')}
            >
              All ({bookings.length})
            </Button>
            <Button
              variant={statusFilter === 'pending' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleFilterChange('pending')}
            >
              Pending
            </Button>
            <Button
              variant={statusFilter === 'approved' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleFilterChange('approved')}
            >
              Approved
            </Button>
            <Button
              variant={statusFilter === 'declined' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleFilterChange('declined')}
            >
              Declined
            </Button>
            <Button
              variant={statusFilter === 'completed' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleFilterChange('completed')}
            >
              Completed
            </Button>
          </div>

          {bookings.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              {statusFilter === 'all' ? 'No booking requests yet.' : `No ${statusFilter} bookings.`}
            </p>
          ) : (
            <>
              <div className="space-y-4">
                {displayedBookings.map((booking) => (
                <div key={booking._id} className="border rounded-lg p-4 sm:p-6 bg-gray-50">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-base sm:text-lg">{booking.mentorship.title}</h3>
                        {getStatusBadge(booking.status)}
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <User size={16} />
                        <span>{booking.user.name} ({booking.user.email})</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar size={16} />
                        <span>{new Date(booking.scheduledDate).toLocaleDateString()}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock size={16} />
                        <span>{new Date(booking.scheduledDate).toLocaleTimeString()} ({booking.mentorship.duration} min)</span>
                      </div>

                      {booking.notes && (
                        <div className="mt-2 p-2 bg-white rounded border text-sm">
                          <p className="font-medium text-gray-700">Notes:</p>
                          <p className="text-gray-600">{booking.notes}</p>
                        </div>
                      )}

                      {booking.meetingLink && (
                        <div className="mt-2">
                          <a 
                            href={booking.meetingLink} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline"
                          >
                            Meeting Link →
                          </a>
                        </div>
                      )}

                      <p className="text-xs text-gray-500">
                        Requested {new Date(booking.createdAt).toLocaleString()}
                      </p>
                    </div>

                    {booking.status === 'pending' && (
                      <div className="flex sm:flex-col gap-2">
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedBooking(booking);
                            setIsDialogOpen(true);
                          }}
                          className="flex-1 sm:flex-none"
                        >
                          Approve
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            setSelectedBooking(booking);
                            setIsDeclineDialogOpen(true);
                          }}
                          className="flex-1 sm:flex-none"
                        >
                          Decline
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            {hasMoreBookings && (
              <div className="mt-6 text-center">
                <Button
                  variant="outline"
                  onClick={() => setShowAllBookings(!showAllBookings)}
                >
                  {showAllBookings ? 'Show Less' : `Show ${bookings.length - 5} More`}
                </Button>
              </div>
            )}
          </>
          )}
        </CardContent>
      </Card>

      {/* Approve Booking Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Booking</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Provide a meeting link for the session with {selectedBooking?.user.name}
            </p>
            <div>
              <label className="block text-sm font-medium mb-2">Meeting Link (Optional)</label>
              <Input
                type="url"
                placeholder="https://meet.google.com/... or https://zoom.us/..."
                value={meetingLink}
                onChange={(e) => setMeetingLink(e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">
                You can add the meeting link now or later
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsDialogOpen(false);
              setMeetingLink('');
              setSelectedBooking(null);
            }}>
              Cancel
            </Button>
            <Button onClick={() => selectedBooking && handleUpdateBookingStatus(selectedBooking._id, 'approved', meetingLink || undefined)}>
              Approve Booking
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Decline Booking Dialog */}
      <Dialog open={isDeclineDialogOpen} onOpenChange={setIsDeclineDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Decline Booking</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Please provide a reason for declining this booking request from {selectedBooking?.user.name}.
              This will help them understand what to do when booking next time.
            </p>
            <div>
              <label className="block text-sm font-medium mb-2">Reason for Declining (Optional but recommended)</label>
              <textarea
                className="w-full border border-gray-300 rounded-md p-2 text-sm min-h-[100px]"
                placeholder="e.g., The requested time slot is not available. Please choose another time..."
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsDeclineDialogOpen(false);
              setDeclineReason('');
              setSelectedBooking(null);
            }}>
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={() => selectedBooking && handleUpdateBookingStatus(selectedBooking._id, 'declined', undefined, declineReason || undefined)}
            >
              Decline Booking
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
