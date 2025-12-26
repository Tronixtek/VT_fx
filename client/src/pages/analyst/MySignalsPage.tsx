import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import api from '@/lib/api';

export default function MySignalsPage() {
  const navigate = useNavigate();
  const [signals, setSignals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSignal, setSelectedSignal] = useState<any>(null);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [updateStatus, setUpdateStatus] = useState('');

  useEffect(() => {
    fetchMySignals();
  }, []);

  const fetchMySignals = async () => {
    try {
      const { data } = await api.get('/signals/my-signals');
      setSignals(data.data);
    } catch (error) {
      console.error('Failed to fetch signals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedSignal || !updateStatus) return;

    try {
      await api.patch(`/signals/${selectedSignal._id}`, { status: updateStatus });
      setShowUpdateDialog(false);
      setSelectedSignal(null);
      setUpdateStatus('');
      fetchMySignals();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to update signal');
    }
  };

  const handleDeleteSignal = async (signalId: string) => {
    if (!confirm('Are you sure you want to delete this signal?')) return;

    try {
      await api.delete(`/signals/${signalId}`);
      fetchMySignals();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to delete signal');
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2">My Signals</h1>
          <p className="text-gray-600">Manage all your published trading signals</p>
        </div>
        <Button onClick={() => navigate('/analyst/signals/create')}>
          Create New Signal
        </Button>
      </div>

      {signals.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <h3 className="text-xl font-semibold mb-2">No signals yet</h3>
            <p className="text-gray-600 mb-4">Create your first trading signal to share with your followers</p>
            <Button onClick={() => navigate('/analyst/signals/create')}>
              Create Signal
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {signals.map((signal) => (
            <Card key={signal._id} className="hover:shadow-lg transition">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold mb-1">{signal.symbol}</h3>
                    <Badge variant={signal.type === 'BUY' ? 'success' : 'danger'}>
                      {signal.type}
                    </Badge>
                  </div>
                  <Badge variant={
                    signal.status === 'active' ? 'default' :
                    signal.status === 'hit_tp' ? 'success' :
                    signal.status === 'hit_sl' ? 'danger' : 'secondary'
                  }>
                    {signal.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Entry:</span>
                    <span className="font-semibold">{signal.entryPrice}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Stop Loss:</span>
                    <span className="font-semibold text-red-600">{signal.stopLoss}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Take Profit:</span>
                    <span className="font-semibold text-green-600">{signal.takeProfit}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Timeframe:</span>
                    <span className="font-semibold">{signal.timeframe}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Views:</span>
                    <span className="font-semibold">{signal.views}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Required Plan:</span>
                    <Badge variant="secondary">{signal.requiredPlan?.toUpperCase() || 'FREE'}</Badge>
                  </div>
                </div>

                {signal.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{signal.description}</p>
                )}

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setSelectedSignal(signal);
                      setUpdateStatus(signal.status);
                      setShowUpdateDialog(true);
                    }}
                  >
                    Update Status
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleDeleteSignal(signal._id)}
                  >
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Update Status Dialog */}
      <Dialog open={showUpdateDialog} onOpenChange={setShowUpdateDialog}>
        {selectedSignal && (
          <div className="bg-white rounded-lg shadow-lg max-w-lg w-full mx-4 p-6">
            <h2 className="text-2xl font-bold mb-4">Update Signal Status</h2>
            <p className="text-gray-600 mb-4">Update the status for {selectedSignal.symbol}</p>

            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Status</label>
              <select
                value={updateStatus}
                onChange={(e) => setUpdateStatus(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
              >
                <option value="active">Active</option>
                <option value="hit_tp">Hit Take Profit</option>
                <option value="hit_sl">Hit Stop Loss</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div className="flex gap-3">
              <Button onClick={handleUpdateStatus} className="flex-1">
                Update
              </Button>
              <Button variant="outline" onClick={() => setShowUpdateDialog(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
