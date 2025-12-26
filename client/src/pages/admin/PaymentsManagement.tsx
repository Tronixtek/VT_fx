import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import api from '@/lib/api';

interface Payment {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
  };
  amount: number;
  plan: string;
  status: string;
  paystackReference: string;
  createdAt: string;
}

export default function PaymentsManagement() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [stats, setStats] = useState({ total: 0, success: 0, pending: 0, failed: 0 });

  useEffect(() => {
    fetchPayments();
  }, []);

  useEffect(() => {
    let filtered = payments;

    if (searchTerm) {
      filtered = filtered.filter(
        (payment) =>
          payment.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          payment.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          payment.paystackReference.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((payment) => payment.status === statusFilter);
    }

    setFilteredPayments(filtered);
  }, [searchTerm, statusFilter, payments]);

  const fetchPayments = async () => {
    try {
      const { data } = await api.get('/admin/payments');
      setPayments(data.data);
      setFilteredPayments(data.data);
      
      // Calculate stats
      const total = data.data.reduce((sum: number, p: Payment) => sum + (p.status === 'success' ? p.amount : 0), 0);
      const success = data.data.filter((p: Payment) => p.status === 'success').length;
      const pending = data.data.filter((p: Payment) => p.status === 'pending').length;
      const failed = data.data.filter((p: Payment) => p.status === 'failed').length;
      setStats({ total, success, pending, failed });
    } catch (error) {
      console.error('Failed to fetch payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: { [key: string]: 'default' | 'success' | 'warning' | 'danger' } = {
      success: 'success',
      pending: 'warning',
      failed: 'danger',
    };
    return <Badge variant={variants[status] || 'default'}>{status.toUpperCase()}</Badge>;
  };

  const getPlanBadge = (plan: string) => {
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
      <div>
        <h1 className="text-4xl font-bold mb-2">Payments Management</h1>
        <p className="text-gray-600">View all payments, transactions, and revenue data</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600 mb-2">Total Revenue</p>
            <p className="text-3xl font-bold text-green-600">₦{stats.total.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600 mb-2">Successful</p>
            <p className="text-3xl font-bold text-green-600">{stats.success}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600 mb-2">Pending</p>
            <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600 mb-2">Failed</p>
            <p className="text-3xl font-bold text-red-600">{stats.failed}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Payments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Search</label>
              <Input
                type="text"
                placeholder="Search by name, email, or reference..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Status</label>
              <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">All Status</option>
                <option value="success">Success</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Payments ({filteredPayments.length})</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-medium">User</th>
                  <th className="text-left p-3 font-medium">Plan</th>
                  <th className="text-left p-3 font-medium">Amount</th>
                  <th className="text-left p-3 font-medium">Status</th>
                  <th className="text-left p-3 font-medium">Reference</th>
                  <th className="text-left p-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((payment) => (
                  <tr key={payment._id} className="border-b hover:bg-gray-50">
                    <td className="p-3">
                      <div>
                        <p className="font-medium">{payment.user.name}</p>
                        <p className="text-sm text-gray-600">{payment.user.email}</p>
                      </div>
                    </td>
                    <td className="p-3">{getPlanBadge(payment.plan)}</td>
                    <td className="p-3">
                      <span className="font-semibold text-green-600">₦{payment.amount.toLocaleString()}</span>
                    </td>
                    <td className="p-3">{getStatusBadge(payment.status)}</td>
                    <td className="p-3">
                      <span className="text-sm text-gray-600 font-mono">
                        {payment.paystackReference.substring(0, 20)}...
                      </span>
                    </td>
                    <td className="p-3 text-sm text-gray-600">
                      {new Date(payment.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {filteredPayments.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            No payments found matching your filters.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
