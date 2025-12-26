import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import api from '@/lib/api';

interface MentorshipService {
  _id: string;
  analyst: {
    name: string;
    email: string;
  };
  title: string;
  description: string;
  duration: number;
  price: number;
}

interface Booking {
  _id: string;
  mentorship: {
    _id: string;
    title: string;
    duration: number;
    price: number;
  };
  analyst: {
    _id: string;
    name: string;
    email: string;
  };
  scheduledDate: string;
  status: string;
  notes?: string;
  meetingLink?: string;
  declineReason?: string;
}

export default function MentorshipPage() {
  const [services, setServices] = useState<MentorshipService[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState<MentorshipService | null>(null);
  const [bookingDate, setBookingDate] = useState('');
  const [bookingNotes, setBookingNotes] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showAllBookings, setShowAllBookings] = useState(false);

  useEffect(() => {
    fetchServices();
    fetchBookings();
  }, []);

  const fetchServices = async () => {
    try {
      const { data } = await api.get('/mentorship/services');
      setServices(data.data);
    } catch (error) {
      console.error('Failed to fetch services:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBookings = async () => {
    try {
      const { data } = await api.get('/mentorship/bookings/my-bookings');
      setBookings(data.data);
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
    }
  };

  const handleBooking = async () => {
    if (!selectedService || !bookingDate) return;

    try {
      // Convert datetime-local format to ISO8601
      const isoDate = new Date(bookingDate).toISOString();
      
      await api.post('/mentorship/bookings', {
        mentorship: selectedService._id,
        scheduledDate: isoDate,
        notes: bookingNotes,
      });
      alert('Booking request submitted successfully!');
      setIsDialogOpen(false);
      setBookingDate('');
      setBookingNotes('');
      fetchBookings();
    } catch (error: any) {
      console.error('Booking error:', error.response?.data);
      alert(error.response?.data?.message || 'Failed to create booking');
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;

    try {
      await api.put(`/mentorship/bookings/${bookingId}/cancel`);
      alert('Booking cancelled successfully');
      fetchBookings();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to cancel booking');
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: { [key: string]: 'default' | 'success' | 'warning' | 'danger' } = {
      pending: 'warning',
      approved: 'success',
      confirmed: 'success',
      completed: 'default',
      declined: 'danger',
      cancelled: 'danger',
    };
    return <Badge variant={variants[status] || 'default'}>{status.toUpperCase()}</Badge>;
  };

  const filteredBookings = statusFilter === 'all' 
    ? bookings 
    : bookings.filter(b => b.status === statusFilter);
  
  const displayedBookings = showAllBookings ? filteredBookings : filteredBookings.slice(0, 5);
  const hasMoreBookings = filteredBookings.length > 5;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-2">Mentorship Services</h1>
        <p className="text-gray-600">Book 1-on-1 sessions with expert analysts to improve your trading skills</p>
      </div>

      {/* Available Services */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Available Services</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => (
            <Card key={service._id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle>{service.title}</CardTitle>
                <CardDescription>with {service.analyst.name}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">{service.description}</p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Duration: {service.duration} min</span>
                  <span className="font-bold text-lg text-primary">₦{service.price.toLocaleString()}</span>
                </div>
                <Button
                  className="w-full"
                  onClick={() => {
                    setSelectedService(service);
                    setIsDialogOpen(true);
                  }}
                >
                  Book Session
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* My Bookings */}
      <div>
        <h2 className="text-2xl font-bold mb-4">My Bookings</h2>
        
        {bookings.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            <Button
              variant={statusFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => { setStatusFilter('all'); setShowAllBookings(false); }}
            >
              All ({bookings.length})
            </Button>
            <Button
              variant={statusFilter === 'pending' ? 'default' : 'outline'}
              size="sm"
              onClick={() => { setStatusFilter('pending'); setShowAllBookings(false); }}
            >
              Pending
            </Button>
            <Button
              variant={statusFilter === 'approved' ? 'default' : 'outline'}
              size="sm"
              onClick={() => { setStatusFilter('approved'); setShowAllBookings(false); }}
            >
              Approved
            </Button>
            <Button
              variant={statusFilter === 'declined' ? 'default' : 'outline'}
              size="sm"
              onClick={() => { setStatusFilter('declined'); setShowAllBookings(false); }}
            >
              Declined
            </Button>
            <Button
              variant={statusFilter === 'completed' ? 'default' : 'outline'}
              size="sm"
              onClick={() => { setStatusFilter('completed'); setShowAllBookings(false); }}
            >
              Completed
            </Button>
          </div>
        )}

        {filteredBookings.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              {bookings.length === 0 
                ? 'No bookings yet. Book your first session above!' 
                : `No ${statusFilter} bookings.`}
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="space-y-4">
              {displayedBookings.map((booking) => (
              <Card key={booking._id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{booking.mentorship.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        with {booking.analyst.name}
                      </p>
                      <p className="text-sm text-gray-600 mt-2">
                        <span className="font-medium">Scheduled:</span>{' '}
                        {new Date(booking.scheduledDate).toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Duration:</span> {booking.mentorship.duration} minutes
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Price:</span> ₦{booking.mentorship.price.toLocaleString()}
                      </p>
                      {booking.meetingLink && (
                        <a 
                          href={booking.meetingLink} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline mt-2 block"
                        >
                          Join Meeting →
                        </a>
                      )}
                      {booking.status === 'declined' && (booking as any).declineReason && (
                        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-sm font-medium text-red-800 mb-1">Decline Reason:</p>
                          <p className="text-sm text-red-700">{(booking as any).declineReason}</p>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-3">
                      {getStatusBadge(booking.status)}
                      {booking.status === 'pending' && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleCancelBooking(booking._id)}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            </div>
            
            {hasMoreBookings && (
              <div className="mt-6 text-center">
                <Button
                  variant="outline"
                  onClick={() => setShowAllBookings(!showAllBookings)}
                >
                  {showAllBookings ? 'Show Less' : `Show ${filteredBookings.length - 5} More`}
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Booking Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Book {selectedService?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-4">{selectedService?.description}</p>
              <div className="flex items-center justify-between py-2 border-t border-b">
                <span className="text-sm font-medium">Duration:</span>
                <span className="text-sm">{selectedService?.duration} minutes</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-sm font-medium">Price:</span>
                <span className="text-lg font-bold text-primary">₦{selectedService?.price.toLocaleString()}</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Select Date & Time</label>
              <Input
                type="datetime-local"
                value={bookingDate}
                onChange={(e) => setBookingDate(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Notes (Optional)</label>
              <textarea
                className="w-full border border-gray-300 rounded-md p-2 text-sm"
                rows={3}
                value={bookingNotes}
                onChange={(e) => setBookingNotes(e.target.value)}
                placeholder="Any specific topics or questions you'd like to discuss..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleBooking} disabled={!bookingDate}>
              Confirm Booking
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
