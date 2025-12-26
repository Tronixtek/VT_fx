import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/redux/store';
import { setCredentials } from '@/redux/slices/authSlice';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';

export default function PaymentVerificationPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const reference = searchParams.get('reference');
  
  const [status, setStatus] = useState<'verifying' | 'success' | 'failed'>('verifying');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (reference) {
      verifyPayment(reference);
    } else {
      setStatus('failed');
      setMessage('No payment reference found');
    }
  }, [reference]);

  const verifyPayment = async (ref: string) => {
    try {
      console.log('[Payment Verification] Starting verification for reference:', ref);
      
      const { data } = await api.get(`/payments/verify?reference=${ref}`);
      
      console.log('[Payment Verification] Response:', data);
      
      if (data.success) {
        setStatus('success');
        setMessage('Payment successful! Your subscription has been activated.');
        
        // Update user data in Redux - use data from verification response
        if (data.data.user) {
          console.log('[Payment Verification] Updating Redux with user data:', data.data.user);
          dispatch(setCredentials({
            user: data.data.user,
            token: localStorage.getItem('token') || '',
          }));
        } else {
          // Fallback: fetch user data if not included in response
          console.log('[Payment Verification] Fetching user data from /auth/me');
          const userResponse = await api.get('/auth/me');
          dispatch(setCredentials({
            user: userResponse.data.data,
            token: localStorage.getItem('token') || '',
          }));
        }
        
        console.log('[Payment Verification] User data updated, redirecting in 3 seconds');
        
        // Redirect to dashboard after 3 seconds
        setTimeout(() => {
          navigate('/dashboard');
        }, 3000);
      } else {
        setStatus('failed');
        setMessage('Payment verification failed. Please contact support.');
      }
    } catch (error: any) {
      console.error('[Payment Verification] Error:', error.response?.data || error.message);
      setStatus('failed');
      setMessage(error.response?.data?.message || 'Payment verification failed');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="text-center">
            {status === 'verifying' && 'Verifying Payment...'}
            {status === 'success' && '✓ Payment Successful'}
            {status === 'failed' && '✗ Payment Failed'}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          {status === 'verifying' && (
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mb-4"></div>
              <p className="text-gray-600">Please wait while we verify your payment...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <p className="text-gray-700">{message}</p>
              <p className="text-sm text-gray-500">Redirecting to dashboard...</p>
            </div>
          )}

          {status === 'failed' && (
            <div className="space-y-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <svg
                  className="w-8 h-8 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <p className="text-gray-700">{message}</p>
              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={() => navigate('/pricing')}>
                  Try Again
                </Button>
                <Button onClick={() => navigate('/dashboard')}>
                  Go to Dashboard
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
