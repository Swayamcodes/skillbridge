import { useState, useEffect, useContext, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Coins,
  FileText,
  IndianRupee,
  Mail,
  Tags,
  UserRound,
  Users,
  XCircle,
} from 'lucide-react';
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
      pending: { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-300/70', icon: Clock3 },
      accepted: { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-700/20', icon: CheckCircle2 },
      rejected: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', icon: XCircle }
    };
    return badges[status] || badges.pending;
  };

  const getGigStatusBadge = (status) => {
    const badges = {
      open: { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-700/20', icon: CheckCircle2 },
      assigned: { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-300/70', icon: Users },
      completed: { bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-300/70', icon: CheckCircle2 },
      closed: { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-300', icon: AlertCircle }
    };
    return badges[status] || badges.open;
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F7F8F4]">
        <div className="flex flex-col items-center gap-4 rounded-xl border border-emerald-900/10 bg-white px-10 py-8 shadow-[0_16px_38px_rgba(16,24,40,0.06)]">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-emerald-700 border-t-transparent"></div>
          <p className="text-sm font-medium text-gray-600">Loading applicants...</p>
        </div>
      </div>
    );
  }

  const gigStatusBadge = getGigStatusBadge(gig?.status);
  const GigStatusIcon = gigStatusBadge.icon;

  return (
    <div className="min-h-screen bg-[#F7F8F4]">
      <Navbar />

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:py-10">
        {actionError && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 shadow-[0_10px_24px_rgba(185,28,28,0.06)]">
            {actionError}
          </div>
        )}
        {actionMessage && (
          <div className="mb-6 rounded-xl border border-emerald-700/20 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 shadow-[0_10px_24px_rgba(6,78,59,0.06)]">
            {actionMessage}
          </div>
        )}

        {/* Back Button */}
        <Link
          to={`/gigs/${id}`}
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-gray-600 transition-colors hover:text-emerald-800"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Back to Gig Details
        </Link>

        {/* Gig Info Card */}
        <div className="mb-8 rounded-xl border border-emerald-900/10 bg-white p-6 shadow-[0_20px_56px_rgba(16,24,40,0.08)] sm:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-lg border border-emerald-700/15 bg-emerald-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-emerald-800">
                <Users size={13} aria-hidden="true" />
                Applicant Management
              </div>
              <h1 className="mb-3 text-3xl font-semibold tracking-tight text-gray-950 sm:text-4xl">{gig?.title}</h1>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold uppercase tracking-wide ${gigStatusBadge.bg} ${gigStatusBadge.text} ${gigStatusBadge.border}`}>
                  <GigStatusIcon size={13} aria-hidden="true" />
                  {gig?.status}
                </span>
                {gig?.type === 'paid' ? (
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm font-semibold text-gray-700">
                    <IndianRupee size={14} aria-hidden="true" />
                    {gig?.price}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-700/15 bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-800">
                    <Coins size={14} aria-hidden="true" />
                    {gig?.credits} Credits
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Applicants Section */}
        <div className="mb-6 flex items-center justify-between gap-4">
          <h2 className="text-2xl font-semibold tracking-tight text-gray-950">
            Applicants <span className="text-gray-500">({applicants.length})</span>
          </h2>
          {applicants.filter(a => a.status === 'pending').length > 0 && (
            <span className="rounded-lg border border-amber-300/70 bg-amber-50 px-3 py-1.5 text-sm font-semibold text-amber-800">
              {applicants.filter(a => a.status === 'pending').length} pending review
            </span>
          )}
        </div>

        {applicants.length === 0 ? (
          <div className="rounded-xl border border-dashed border-emerald-900/20 bg-white p-12 text-center shadow-[0_16px_38px_rgba(16,24,40,0.06)]">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800">
              <Mail size={30} aria-hidden="true" />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-gray-950">No applications yet</h3>
            <p className="text-gray-600">Applications will appear here when someone applies to your gig</p>
          </div>
        ) : (
          <div className="space-y-4">
            {applicants.map((app) => {
              const statusBadge = getStatusBadge(app.status);
              const StatusIcon = statusBadge.icon;
              return (
                <div key={app.id} className="rounded-xl border border-emerald-900/10 bg-white p-6 shadow-[0_12px_30px_rgba(16,24,40,0.05)] transition-all hover:-translate-y-1 hover:border-emerald-700/30 hover:shadow-[0_18px_45px_rgba(16,24,40,0.09)]">
                  <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="flex flex-1 items-start gap-4">
                      {/* Avatar */}
                      <div className="rounded-xl bg-emerald-50 p-1 ring-1 ring-emerald-700/10">
                        <Avatar profile={app.applicant} size="md" />
                      </div>
                      
                      <div className="min-w-0 flex-1">
                        <Link
                          to={`/profile/${app.applicant?.id}`}
                          className="mb-1 inline-block text-xl font-semibold text-gray-950 transition-colors hover:text-emerald-800 hover:underline"
                        >
                          {app.applicant?.full_name}
                        </Link>
                        <p className="mb-1 flex items-center gap-2 text-sm text-gray-600">
                          <Mail size={14} aria-hidden="true" />
                          {app.applicant?.email}
                        </p>
                        <p className="flex items-center gap-2 text-sm text-gray-500">
                          <UserRound size={14} aria-hidden="true" />
                          {app.applicant?.college} • Year {app.applicant?.year}
                        </p>
                      </div>
                    </div>
                    
                    <span className={`inline-flex self-start items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold uppercase tracking-wide ${statusBadge.bg} ${statusBadge.text} ${statusBadge.border}`}>
                      <StatusIcon size={13} aria-hidden="true" />
                      {app.status}
                    </span>
                  </div>

                  {/* Skills */}
                  {app.applicant?.skills && app.applicant.skills.length > 0 && (
                    <div className="mb-4">
                      <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
                        <Tags size={15} className="text-emerald-700" aria-hidden="true" />
                        Skills
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {app.applicant.skills.map((skill, index) => (
                          <span key={index} className="rounded-lg border border-emerald-700/15 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Message */}
                  <div className="mb-4 rounded-xl border border-emerald-900/10 bg-gray-50/80 p-4">
                    <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <FileText size={15} className="text-emerald-700" aria-hidden="true" />
                      Application Message
                    </p>
                    <p className="whitespace-pre-wrap text-sm leading-7 text-gray-700">{app.message}</p>
                  </div>

                  {/* Footer */}
                  <div className="flex flex-col gap-4 border-t border-emerald-900/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm font-medium text-gray-500">
                      Applied on {new Date(app.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>

                    {app.status === 'pending' && gig?.status === 'open' && (
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <button
                          onClick={() => handleAccept(app.id)}
                          disabled={acceptingId !== null}
                          className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(6,78,59,0.14)] transition-all hover:-translate-y-0.5 hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                        >
                          <CheckCircle2 size={15} aria-hidden="true" />
                          {acceptingId === app.id ? 'Processing...' : 'Accept'}
                        </button>
                        <button
                          onClick={() => handleReject(app.id)}
                          className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition-all hover:-translate-y-0.5 hover:bg-gray-50"
                        >
                          <XCircle size={15} aria-hidden="true" />
                          Reject
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
          <div className="mt-8 rounded-xl border border-emerald-900/10 bg-white p-6 shadow-[0_16px_38px_rgba(16,24,40,0.06)]">
            <h3 className="mb-4 font-semibold text-gray-950">Application Summary</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-lg border border-amber-300/70 bg-amber-50 p-4 text-center">
                <p className="mb-1 text-2xl font-semibold tracking-tight text-amber-800">{applicants.filter(a => a.status === 'pending').length}</p>
                <p className="text-sm font-medium text-amber-800">Pending</p>
              </div>
              <div className="rounded-lg border border-emerald-700/20 bg-emerald-50 p-4 text-center">
                <p className="mb-1 text-2xl font-semibold tracking-tight text-emerald-800">{applicants.filter(a => a.status === 'accepted').length}</p>
                <p className="text-sm font-medium text-emerald-800">Accepted</p>
              </div>
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center">
                <p className="mb-1 text-2xl font-semibold tracking-tight text-red-700">{applicants.filter(a => a.status === 'rejected').length}</p>
                <p className="text-sm font-medium text-red-700">Rejected</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GigApplicants;
