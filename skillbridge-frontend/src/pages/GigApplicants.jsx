import { useState, useEffect, useContext, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AuthContext } from '../context/auth';
import Avatar from '../components/Avatar';
import Navbar from '../components/Navbar';
import api from '../services/api';

const loadRazorpay = () => {
  if (window.Razorpay) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const existingScript = document.querySelector('script[data-skillbridge-razorpay]');

    if (existingScript) {
      existingScript.remove();
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.dataset.skillbridgeRazorpay = 'true';

    const timeoutId = window.setTimeout(() => {
      script.remove();
      reject(new Error('Payment checkout timed out. Check your connection and try again.'));
    }, 15000);

    script.onload = () => {
      window.clearTimeout(timeoutId);

      if (window.Razorpay) {
        resolve();
      } else {
        script.remove();
        reject(new Error('Payment checkout failed to initialize.'));
      }
    };
    script.onerror = () => {
      window.clearTimeout(timeoutId);
      script.remove();
      reject(new Error('Failed to load payment checkout.'));
    };
    document.body.appendChild(script);
  });
};

const GigApplicants = () => {
  const { id } = useParams();
  const { profile } = useContext(AuthContext);
  const [gig, setGig] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acceptingId, setAcceptingId] = useState(null);
  const [actionMessage, setActionMessage] = useState('');
  const [actionError, setActionError] = useState('');
  const acceptingRef = useRef(new Set());

  const fetchData = useCallback(async () => {
    try {
      const [gigRes, applicantsRes] = await Promise.all([
        api.get(`/api/gigs/${id}`),
        api.get(`/api/gigs/${id}/applicants`)
      ]);
      setGig(gigRes.data.gig);
      setApplicants(applicantsRes.data.applicants);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAccept = async (applicationId) => {
    if (acceptingRef.current.has(applicationId)) return;
    if (!window.confirm('Accept this applicant? This action cannot be undone.')) return;

    acceptingRef.current.add(applicationId);
    setAcceptingId(applicationId);
    setActionMessage('');
    setActionError('');

    try {
      // If paid gig, initiate payment
      if (gig.type === 'paid') {
        await handlePayment(applicationId);
      } else {
        // Barter gig - direct acceptance
        const response = await api.put(`/api/applications/${applicationId}/accept`);
        await fetchData();
        setActionMessage(response.data?.message || 'Application accepted successfully.');
      }
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to accept application';
      console.error('Application acceptance error:', error);
      setActionError(message);
      alert(message);

      if (error.response?.status === 409) {
        await fetchData();
      }
    } finally {
      acceptingRef.current.delete(applicationId);
      setAcceptingId(null);
    }
  };

  const handlePayment = async (applicationId) => {
    try {
      // Create Razorpay order
      const orderRes = await api.post('/api/payment/create-order', {
        gigId: id,
        applicationId
      });

      const { order, key } = orderRes.data;

      await loadRazorpay();

      if (!window.Razorpay) {
        throw new Error('Payment checkout is unavailable');
      }

      await new Promise((resolve, reject) => {
        let settled = false;

        const settleOnce = (callback, value) => {
          if (settled) return;
          settled = true;
          callback(value);
        };

        const options = {
          key,
          amount: order.amount,
          currency: order.currency,
          name: 'SkillBridge',
          description: gig.title,
          order_id: order.id,
          handler: async (response) => {
            try {
              await api.post('/api/payment/verify', {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                gigId: id,
                applicationId
              });
              await fetchData();
              setActionError('');
              setActionMessage('Payment successful. Application accepted.');
              settleOnce(resolve);
            } catch (error) {
              console.error('Payment verification error:', error);
              settleOnce(reject, error);
            }
          },
          modal: {
            ondismiss: () => {
              settleOnce(reject, new Error('Payment was cancelled.'));
            }
          },
          prefill: {
            name: profile?.full_name,
            email: profile?.email,
          },
          theme: {
            color: '#047857'
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', (response) => {
          settleOnce(reject, new Error(response.error?.description || 'Payment failed'));
        });

        setActionMessage('Payment checkout opened. Complete payment to accept the applicant.');
        rzp.open();
      });
    } catch (error) {
      console.error('Payment error:', error);
      throw error;
    }
  };

  const handleReject = async (applicationId) => {
    if (!window.confirm('Reject this applicant? This action cannot be undone.')) return;

    try {
      await api.put(`/api/applications/${applicationId}/reject`);
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to reject');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300', icon: '⏳' },
      accepted: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300', icon: '✓' },
      rejected: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300', icon: '✕' }
    };
    return badges[status] || badges.pending;
  };

  const getGigStatusBadge = (status) => {
    const badges = {
      open: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300', icon: '🟢' },
      assigned: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300', icon: '⏳' },
      completed: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300', icon: '✓' },
      closed: { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-300', icon: '🔒' }
    };
    return badges[status] || badges.open;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600">Loading applicants...</p>
        </div>
      </div>
    );
  }

  const gigStatusBadge = getGigStatusBadge(gig?.status);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <Navbar />

      <div className="max-w-5xl mx-auto px-6 py-12">
        {actionError && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {actionError}
          </div>
        )}
        {actionMessage && (
          <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {actionMessage}
          </div>
        )}

        {/* Back Button */}
        <Link
          to={`/gigs/${id}`}
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors mb-6"
        >
          ← Back to Gig Details
        </Link>

        {/* Gig Info Card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-8 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-light mb-2">{gig?.title}</h1>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${gigStatusBadge.bg} ${gigStatusBadge.text} ${gigStatusBadge.border} inline-flex items-center gap-1.5`}>
                  <span>{gigStatusBadge.icon}</span>
                  <span className="uppercase">{gig?.status}</span>
                </span>
                {gig?.type === 'paid' ? (
                  <span className="text-sm text-gray-600">💰 ₹{gig?.price}</span>
                ) : (
                  <span className="text-sm text-gray-600">🔄 {gig?.credits} Credits</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Applicants Section */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-light">
            Applicants <span className="text-gray-500">({applicants.length})</span>
          </h2>
          {applicants.filter(a => a.status === 'pending').length > 0 && (
            <span className="text-sm text-gray-600">
              {applicants.filter(a => a.status === 'pending').length} pending review
            </span>
          )}
        </div>

        {applicants.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">📭</span>
            </div>
            <h3 className="text-xl font-light mb-2">No applications yet</h3>
            <p className="text-gray-600">Applications will appear here when someone applies to your gig</p>
          </div>
        ) : (
          <div className="space-y-4">
            {applicants.map((app) => {
              const statusBadge = getStatusBadge(app.status);
              return (
                <div key={app.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:border-emerald-300 transition-all">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                    <div className="flex items-start gap-4 flex-1">
                      {/* Avatar */}
                      <Avatar profile={app.applicant} size="md" />
                      
                      <div className="flex-1">
                        <Link
                          to={`/profile/${app.applicant?.id}`}
                          className="text-xl font-medium mb-1 inline-block hover:text-emerald-700 hover:underline"
                        >
                          {app.applicant?.full_name}
                        </Link>
                        <p className="text-sm text-gray-600 mb-1">{app.applicant?.email}</p>
                        <p className="text-sm text-gray-500">
                          {app.applicant?.college} • Year {app.applicant?.year}
                        </p>
                      </div>
                    </div>
                    
                    <span className={`px-3 py-1.5 rounded-full text-xs font-medium border ${statusBadge.bg} ${statusBadge.text} ${statusBadge.border} inline-flex items-center gap-1.5 self-start`}>
                      <span>{statusBadge.icon}</span>
                      <span className="uppercase">{app.status}</span>
                    </span>
                  </div>

                  {/* Skills */}
                  {app.applicant?.skills && app.applicant.skills.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">Skills</p>
                      <div className="flex flex-wrap gap-2">
                        {app.applicant.skills.map((skill, index) => (
                          <span key={index} className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs border border-emerald-200">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Message */}
                  <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
                    <p className="text-sm font-medium text-gray-700 mb-2">Application Message</p>
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{app.message}</p>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <p className="text-sm text-gray-500">
                      Applied on {new Date(app.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>

                    {app.status === 'pending' && gig?.status === 'open' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAccept(app.id)}
                          disabled={acceptingId !== null}
                          className="bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          {acceptingId === app.id ? 'Processing...' : '✓ Accept'}
                        </button>
                        <button
                          onClick={() => handleReject(app.id)}
                          className="border border-gray-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                        >
                          ✕ Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Summary Stats */}
        {applicants.length > 0 && (
          <div className="mt-8 bg-gradient-to-r from-emerald-50 to-gray-50 rounded-xl border border-gray-200 p-6">
            <h3 className="font-medium text-gray-900 mb-4">Application Summary</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-light mb-1">{applicants.filter(a => a.status === 'pending').length}</p>
                <p className="text-sm text-gray-600">Pending</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-light mb-1">{applicants.filter(a => a.status === 'accepted').length}</p>
                <p className="text-sm text-gray-600">Accepted</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-light mb-1">{applicants.filter(a => a.status === 'rejected').length}</p>
                <p className="text-sm text-gray-600">Rejected</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GigApplicants;
