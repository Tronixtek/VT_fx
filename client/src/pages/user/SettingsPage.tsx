import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/redux/store';
import { setCredentials } from '@/redux/slices/authSlice';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import api from '@/lib/api';

export default function SettingsPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  
  // Profile state
  const [name, setName] = useState(user?.name || '');
  const [profileLoading, setProfileLoading] = useState(false);
  
  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);

    try {
      const { data } = await api.patch('/auth/profile', { name });
      dispatch(setCredentials({ user: data.data, token: localStorage.getItem('token') || '' }));
      alert('Profile updated successfully!');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      alert('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      alert('Password must be at least 6 characters long');
      return;
    }

    setPasswordLoading(true);

    try {
      await api.patch('/auth/password', { currentPassword, newPassword });
      alert('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const getSubscriptionBadge = () => {
    if (!user?.subscription?.plan) {
      return <Badge variant="secondary">No Active Plan</Badge>;
    }

    const variants: { [key: string]: 'default' | 'success' | 'warning' } = {
      basic: 'secondary',
      pro: 'default',
      premium: 'success',
    };

    return <Badge variant={variants[user.subscription.plan] || 'default'}>
      {user.subscription.plan.toUpperCase()}
    </Badge>;
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-4xl font-bold mb-2">Account Settings</h1>
        <p className="text-gray-600">Manage your profile, subscription, and security settings</p>
      </div>

      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>Update your account details</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Name</label>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <Input type="email" value={user?.email || ''} disabled className="bg-gray-50" />
              <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Role</label>
              <Input type="text" value={user?.role || ''} disabled className="bg-gray-50" />
            </div>
            <Button type="submit" disabled={profileLoading}>
              {profileLoading ? 'Updating...' : 'Update Profile'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Subscription Information */}
      <Card>
        <CardHeader>
          <CardTitle>Subscription</CardTitle>
          <CardDescription>Your current plan and billing information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b">
            <span className="text-sm font-medium">Current Plan:</span>
            {getSubscriptionBadge()}
          </div>
          {user?.subscription?.endDate && (
            <div className="flex items-center justify-between py-3 border-b">
              <span className="text-sm font-medium">Expires On:</span>
              <span className="text-sm">{new Date(user.subscription.endDate).toLocaleDateString()}</span>
            </div>
          )}
          {user?.subscription?.startDate && (
            <div className="flex items-center justify-between py-3 border-b">
              <span className="text-sm font-medium">Started On:</span>
              <span className="text-sm">{new Date(user.subscription.startDate).toLocaleDateString()}</span>
            </div>
          )}
          <div className="flex items-center justify-between py-3">
            <span className="text-sm font-medium">Status:</span>
            <Badge variant={user?.subscription?.status === 'active' ? 'success' : 'secondary'}>
              {user?.subscription?.status ? user.subscription.status.toUpperCase() : 'INACTIVE'}
            </Badge>
          </div>
          <Button variant="outline" onClick={() => navigate('/payment')}>
            {user?.subscription?.status === 'active' ? 'Upgrade Plan' : 'Choose a Plan'}
          </Button>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>Update your password to keep your account secure</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Current Password</label>
              <Input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">New Password</label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                required
                minLength={6}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Confirm New Password</label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                required
                minLength={6}
              />
            </div>
            <Button type="submit" disabled={passwordLoading}>
              {passwordLoading ? 'Changing...' : 'Change Password'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Affiliate Information */}
      {user?.affiliateCode && (
        <Card>
          <CardHeader>
            <CardTitle>Affiliate Program</CardTitle>
            <CardDescription>Share your referral link and earn commissions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Your Affiliate Code</label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={user.affiliateCode}
                  readOnly
                  className="bg-gray-50"
                />
                <Button
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(user.affiliateCode || '');
                    alert('Code copied to clipboard!');
                  }}
                >
                  Copy
                </Button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Referral Link</label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={`${window.location.origin}/register?ref=${user.affiliateCode}`}
                  readOnly
                  className="bg-gray-50"
                />
                <Button
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `${window.location.origin}/register?ref=${user.affiliateCode}`
                    );
                    alert('Link copied to clipboard!');
                  }}
                >
                  Copy
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
