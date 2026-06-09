import React, { useEffect, useState } from 'react';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { adminAPI } from '../../api/AdminAPI';
import { useToast } from '../../contexts/ToastContext';

const AdminUpgradeRequests = () => {
  const { showSuccess, showError } = useToast();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const data = await adminAPI.getUpgradeRequests(token);
      setRequests(data || []);
    } catch (err) {
      showError('Failed to load upgrade requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleApprove = async (id) => {
    setProcessingId(id);
    try {
      const token = localStorage.getItem('token');
      await adminAPI.approveUpgradeRequest(id, token);
      showSuccess('Upgrade approved and plan activated');
      loadRequests();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to approve request');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id) => {
    setProcessingId(id);
    try {
      const token = localStorage.getItem('token');
      await adminAPI.rejectUpgradeRequest(id, token);
      showSuccess('Upgrade request rejected');
      loadRequests();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to reject request');
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-16"><Loader2 className="animate-spin text-blue-500" size={28} /></div>;
  }

  if (requests.length === 0) {
    return (
      <div className="bg-[#0d1433] border border-white/5 rounded-2xl p-12 text-center text-gray-400">
        No pending upgrade requests.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {requests.map((req) => (
        <div key={req._id} className="bg-[#0d1433] border border-white/5 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="text-white font-bold text-lg">{req.user?.fullName || 'Unknown user'}</p>
            <p className="text-sm text-gray-400">{req.user?.email} • {req.user?.companyName}</p>
            <p className="text-xs text-blue-400 mt-2 font-semibold uppercase tracking-wider">
              Requested plan: {req.planName}
            </p>
            {req.message && <p className="text-sm text-gray-500 mt-2">{req.message}</p>}
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => handleApprove(req._id)}
              disabled={processingId === req._id}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-sm font-bold flex items-center gap-2"
            >
              <CheckCircle size={16} /> Approve
            </button>
            <button
              onClick={() => handleReject(req._id)}
              disabled={processingId === req._id}
              className="px-5 py-2.5 bg-white/5 hover:bg-red-500/20 border border-white/10 rounded-xl text-sm font-bold flex items-center gap-2 text-red-300"
            >
              <XCircle size={16} /> Reject
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AdminUpgradeRequests;
