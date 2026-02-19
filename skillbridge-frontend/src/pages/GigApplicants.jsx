import { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';

const GigApplicants = () => {
  const { id } = useParams();
  const { profile } = useContext(AuthContext);
  const [gig, setGig] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
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
  };

  const handleAccept = async (applicationId) => {
    if (!window.confirm('Accept this applicant? This action cannot be undone.')) return;

    try {
      // If paid gig, initiate payment
      if (gig.type === 'paid') {
        await handlePayment(applicationId);
      } else {
        // Barter gig - direct acceptance
        await api.put(`/api/applications/${applicationId}/accept`);
        fetchData();
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to accept');
    }
  };

  const handlePayment = async (applicationId) => {
    try {
      // Create Razorpay order
      const orderRes = await api.post('/api/payment/create-order', {
        gigId: id
      });

      const { order, key } = orderRes.data;

      // Load Razorpay script
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);

      script.onload = () => {
        const options = {
          key: key,
          amount: order.amount,
          currency: order.currency,
          name: 'SkillBridge',
          description: gig.title,
          order_id: order.id,
          handler: async (response) => {
            try {
              // Verify payment
              await api.post('/api/payment/verify', {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                gigId: id,
                applicationId: applicationId
              });
              fetchData();
            } catch (error) {
              alert('Payment verification failed');
            }
          },
          prefill: {
            name: profile?.full_name,
            email: profile?.email,
          },
          theme: {
            color: '#047857' // emerald-700
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      };
    } catch (error) {
      console.error('Payment error:', error);
      alert('Failed to initiate payment');
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
      {/* Header/Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link to="/" className="text-xl font-light tracking-wide">Skill bridge</Link>
          <div className="flex items-center gap-4">
            <Link to="/gigs" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
              Browse Gigs
            </Link>
            <Link to="/" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
              Dashboard
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-12">
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
                      <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 text-xl font-medium flex-shrink-0">
                        {app.applicant?.full_name?.charAt(0).toUpperCase()}
                      </div>
                      
                      <div className="flex-1">
                        <h3 className="text-xl font-medium mb-1">{app.applicant?.full_name}</h3>
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
                          className="bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-800 transition-colors"
                        >
                          ✓ Accept
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