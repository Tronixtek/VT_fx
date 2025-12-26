import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Calendar, Clock, User } from 'lucide-react';
import api from '@/lib/api';

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
  declineReason?: string;
  createdAt: string;
}

export default function BookingsPage() {
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
    fetchBookings();
  }, []);

  const fetchBookings = async (status?: string) => {
    try {
      const url = status && status !== 'all' 
        ? `/mentorship/bookings/analyst?status=${status}` 
        : '/mentorship/bookings/analyst';
      const { data } = await api.get(url);
      setBookings(data.data);
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
    } finally {
      setLoading(false);
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

  const handleUpdateBookingStatus = async (bookingId: string, status: 'approved' | 'declined', link?: string, reason?: string) => {
    try {
      await api.put(`/mentorship/bookings/${bookingId}/status`, {
        status,
        meetingLink: link,
        declineReason: reason,
      });
      alert(`Booking ${status} successfully`);
      fetchBookings(statusFilter === 'all' ? undefined : statusFilter);
      setIsDialogOpen(false);
      setIsDeclineDialogOpen(false);
      setMeetingLink('');
      setDeclineReason('');
      setSelectedBooking(null);
    } catch (error: any) {
      alert(error.response?.data?.message || `Failed to ${status} booking`);
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

  const displayedBookings = showAllBookings ? bookings : bookings.slice(0, 10);
  const hasMoreBookings = bookings.length > 10;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">Mentorship Bookings</h1>
          <p className="text-gray-600">Manage your mentorship session requests</p>
        </div>
        <Badge variant="warning" className="text-base px-4 py-2 w-fit">
          {bookings.filter(b => b.status === 'pending').length} Pending
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter Bookings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
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
        </CardContent>
      </Card>

      {bookings.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            {statusFilter === 'all' ? 'No booking requests yet.' : `No ${statusFilter} bookings.`}
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-4">
            {displayedBookings.map((booking) => (
              <Card key={booking._id}>
                <CardContent className="p-4 sm:p-6">
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

                      {booking.declineReason && (
                        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm">
                          <p className="font-medium text-red-700">Decline Reason:</p>
                          <p className="text-red-600">{booking.declineReason}</p>
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
                </CardContent>
              </Card>
            ))}
          </div>
          
          {hasMoreBookings && (
            <div className="text-center">
              <Button
                variant="outline"
                onClick={() => setShowAllBookings(!showAllBookings)}
              >
                {showAllBookings ? 'Show Less' : `Show ${bookings.length - 10} More`}
              </Button>
            </div>
          )}
        </>
      )}

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
