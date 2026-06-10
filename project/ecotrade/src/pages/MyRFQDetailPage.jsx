import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { rfqAPI } from '../api/rfqAPI';
import { chatAPI } from '../api/chatAPI';
import { ratingAPI } from '../api/ratingAPI';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import CADFileViewer from '../components/CADFileViewer';
import { ArrowLeft, FileText, Users, MessageSquare, Package, CheckCircle, X, Star, Send } from 'lucide-react';

const MyRFQDetailPage = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const [rfq, setRfq] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview');
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [rating, setRating] = useState({ rating: 5, comment: '' });

  useEffect(() => {
    fetchRFQ();
    if (activeTab === 'chat' || activeTab === 'production') {
      fetchChatMessages();
    }
  }, [id, activeTab]);

  const fetchRFQ = async () => {
    setLoading(true);
    try {
      const response = await rfqAPI.getById(id);
      setRfq(response.data);
    } catch (error) {
      showError('Failed to load RFQ: ' + (error.response?.data?.message || error.message));
      navigate('/my-rfqs');
    } finally {
      setLoading(false);
    }
  };

  const fetchChatMessages = async () => {
    try {
      const response = await chatAPI.getMessages(id);
      setChatMessages(response.data || []);
    } catch (error) {
      console.error('Failed to load chat messages:', error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      await chatAPI.sendMessage(id, newMessage);
      setNewMessage('');
      fetchChatMessages();
    } catch (error) {
      showError('Failed to send message');
    }
  };

  const handleAcceptManufacturer = async (manufacturerRequestId) => {
    try {
      const response = await rfqAPI.acceptManufacturer(id, manufacturerRequestId);
      if (response.success) {
        showSuccess('Manufacturer accepted!');
        fetchRFQ();
      }
    } catch (error) {
      showError('Failed to accept manufacturer: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleRejectManufacturer = async (manufacturerRequestId) => {
    const reason = window.prompt('Please provide a reason for rejection (optional):');
    try {
      await rfqAPI.rejectManufacturer(id, manufacturerRequestId, reason);
      showSuccess('Manufacturer request rejected');
      fetchRFQ();
    } catch (error) {
      showError('Failed to reject manufacturer');
    }
  };

  const handleSubmitRating = async (e) => {
    e.preventDefault();
    try {
      await ratingAPI.create({
        rfqId: id,
        rating: rating.rating,
        comment: rating.comment
      });
      showSuccess('Rating submitted!');
      setShowRatingModal(false);
      fetchRFQ();
    } catch (error) {
      showError('Failed to submit rating');
    }
  };

  const handleStatusUpdate = async (status) => {
    try {
      await rfqAPI.updateStatus(id, { status });
      showSuccess('Status updated');
      fetchRFQ();
    } catch (error) {
      showError('Failed to update status');
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!rfq) return null;

  const tabs = [
    { id: 'overview', label: 'Overview', show: true },
    { id: 'workpieces', label: 'Workpieces', show: true },
    { id: 'requests', label: 'Manufacturer Requests', show: rfq.status !== 'SUPPLIER_SELECTED' },
    { id: 'production', label: 'Production & Chat', show: rfq.selectedManufacturerId },
    { id: 'logistics', label: 'Logistics & Closure', show: rfq.status === 'SHIPPED' || rfq.status === 'DELIVERED' }
  ].filter(tab => tab.show);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <button
          onClick={() => navigate('/my-rfqs')}
          className="flex items-center text-gray-600 hover:text-[#4881F8] mb-4"
        >
          <ArrowLeft size={20} className="mr-2" />
          Back to My RFQs
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">{rfq.title}</h1>
            <p className="text-gray-600">RFQ #{rfq._id.toString().slice(-6)}</p>
          </div>
          <div className="flex items-center gap-3">
            {rfq.status === 'DELIVERED' && !rfq.rating && (
              <button
                onClick={() => setShowRatingModal(true)}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Star size={18} className="mr-2" />
                Rate Manufacturer
              </button>
            )}
            {rfq.status === 'SHIPPED' && (
              <button
                onClick={() => handleStatusUpdate('DELIVERED')}
                className="px-4 py-2 bg-[#4881F8] text-white rounded-lg hover:bg-[#3b6fe0]"
              >
                Confirm Delivery
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Status Stepper */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between">
          {['DRAFT', 'OPEN_FOR_REQUESTS', 'REQUESTS_PENDING', 'SUPPLIER_SELECTED', 'IN_PRODUCTION', 'SHIPPED', 'DELIVERED', 'CLOSED'].map((status, index) => {
            const isActive = rfq.status === status;
            const isPast = ['DRAFT', 'OPEN_FOR_REQUESTS', 'REQUESTS_PENDING', 'SUPPLIER_SELECTED', 'IN_PRODUCTION', 'SHIPPED', 'DELIVERED', 'CLOSED'].indexOf(rfq.status) >= index;
            return (
              <React.Fragment key={status}>
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    isPast ? 'bg-[#4881F8] text-white' : 'bg-gray-200 text-gray-600'
                  }`}>
                    {index + 1}
                  </div>
                  <span className={`text-xs mt-2 ${isActive ? 'font-semibold text-[#4881F8]' : 'text-gray-600'}`}>
                    {status.replace('_', ' ')}
                  </span>
                </div>
                {index < 7 && (
                  <div className={`flex-1 h-1 mx-2 ${isPast ? 'bg-[#4881F8]' : 'bg-gray-200'}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-[#4881F8] text-[#4881F8]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-gray-500">RFQ Deadline</label>
                <p className="text-gray-900">{new Date(rfq.rfqDeadline).toLocaleString()}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Status</label>
                <p className="text-gray-900">{rfq.status.replace('_', ' ')}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Preferred Currency</label>
                <p className="text-gray-900">{rfq.preferredCurrency}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Shipping Terms</label>
                <p className="text-gray-900">{rfq.shippingTerms}</p>
              </div>
            </div>
            {rfq.requestJustification && (
              <div>
                <h4 className="font-semibold mb-2">Request Justification</h4>
                <p className="text-gray-700">{rfq.requestJustification}</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'workpieces' && (
          <div className="space-y-6">
            {rfq.workpieces?.map((workpiece, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Workpiece {index + 1}</h3>
                <div className="mb-4 border border-gray-200 rounded-lg overflow-hidden">
                  <CADFileViewer workpiece={workpiece} height="400px" backgroundColor="#f9fafb" />
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Technology</label>
                    <p className="text-gray-900">{workpiece.technology?.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Material</label>
                    <p className="text-gray-900">{workpiece.material}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Quantity</label>
                    <p className="text-gray-900">{workpiece.quantity}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Dimensions</label>
                    <p className="text-gray-900">
                      {workpiece.dimensions.length} × {workpiece.dimensions.width} × {workpiece.dimensions.height} mm
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'requests' && (
          <div className="space-y-4">
            {rfq.manufacturerRequests && rfq.manufacturerRequests.length > 0 ? (
              rfq.manufacturerRequests.map((request) => (
                <div key={request._id} className="border border-gray-200 rounded-lg p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-2">
                        {request.manufacturerId?.companyName || 'Manufacturer'}
                      </h3>
                      <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Location:</span> {request.manufacturerId?.country || 'N/A'}
                        </div>
                        <div>
                          <span className="font-medium">Proposed Lead Time:</span> {request.proposedLeadTime} days
                        </div>
                        {request.matchScore && (
                          <div>
                            <span className="font-medium">Match Score:</span> {request.matchScore}%
                          </div>
                        )}
                      </div>
                      {request.message && (
                        <div className="mt-3 p-3 bg-gray-50 rounded">
                          <p className="text-sm text-gray-700">{request.message}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
                    <Link
                      to={`/manufacturer/${request.manufacturerId?._id}`}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                    >
                      View Profile
                    </Link>
                    <button
                      onClick={() => handleAcceptManufacturer(request._id)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                    >
                      Accept as Supplier
                    </button>
                    <button
                      onClick={() => handleRejectManufacturer(request._id)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Users size={48} className="mx-auto mb-4 text-gray-400" />
                <p>No manufacturer requests yet</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'production' && (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Chat */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Chat</h3>
              <div className="border border-gray-200 rounded-lg h-96 flex flex-col">
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {chatMessages.length === 0 ? (
                    <p className="text-center text-gray-500 mt-8">No messages yet</p>
                  ) : (
                    chatMessages.map((msg) => (
                      <div
                        key={msg._id}
                        className={`flex ${msg.senderId._id === user._id ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-xs p-3 rounded-lg ${
                          msg.senderId._id === user._id
                            ? 'bg-[#4881F8] text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}>
                          <p className="text-sm">{msg.message}</p>
                          <p className={`text-xs mt-1 ${
                            msg.senderId._id === user._id ? 'text-blue-100' : 'text-gray-500'
                          }`}>
                            {new Date(msg.createdAt).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <form onSubmit={handleSendMessage} className="border-t border-gray-200 p-4 flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4881F8] focus:border-transparent"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#4881F8] text-white rounded-lg hover:bg-[#3b6fe0]"
                  >
                    <Send size={18} />
                  </button>
                </form>
              </div>
            </div>

            {/* Production Timeline */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Production Timeline</h3>
              <div className="border border-gray-200 rounded-lg p-4 space-y-4">
                <div className="text-sm text-gray-600">
                  <div className="font-medium text-gray-900">Status: {rfq.productionStatus || 'Not Started'}</div>
                  <div className="mt-2">Last updated: {new Date(rfq.updatedAt).toLocaleString()}</div>
                </div>
                {/* Timeline entries would go here */}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'logistics' && (
          <div className="space-y-6">
            {rfq.trackingInfo && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Tracking Information</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Tracking ID</label>
                    <p className="text-gray-900">{rfq.trackingInfo.trackingId}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Carrier</label>
                    <p className="text-gray-900">{rfq.trackingInfo.carrier}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Shipping Date</label>
                    <p className="text-gray-900">
                      {rfq.trackingInfo.shippingDate ? new Date(rfq.trackingInfo.shippingDate).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {rfq.shippingDocs && rfq.shippingDocs.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Shipping Documents</h3>
                <div className="space-y-2">
                  {rfq.shippingDocs.map((doc, i) => (
                    <a
                      key={i}
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-[#4881F8] hover:underline"
                    >
                      <FileText size={16} className="mr-2" />
                      {doc.type} - {doc.url.split('/').pop()}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Rating Modal */}
      {showRatingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold mb-4">Rate Manufacturer</h3>
            <form onSubmit={handleSubmitRating} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(prev => ({ ...prev, rating: star }))}
                      className="text-3xl"
                    >
                      <Star
                        size={32}
                        className={star <= rating.rating ? 'text-yellow-500 fill-current' : 'text-gray-300'}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Comment</label>
                <textarea
                  value={rating.comment}
                  onChange={(e) => setRating(prev => ({ ...prev, comment: e.target.value }))}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4881F8] focus:border-transparent"
                  placeholder="Share your experience..."
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowRatingModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-[#4881F8] text-white rounded-lg hover:bg-[#3b6fe0]"
                >
                  Submit Rating
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyRFQDetailPage;

