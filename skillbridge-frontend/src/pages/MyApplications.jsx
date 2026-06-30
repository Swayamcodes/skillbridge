import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Coins,
  IndianRupee,
  Send,
  UserRound,
  XCircle,
} from 'lucide-react';
import Pagination from '../components/Pagination';
import { GigCardSkeleton } from '../components/Skeletons';
import Navbar from '../components/Navbar';
import api from '../services/api';

const MyApplications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async (page = 1) => {
    try {
      const response = await api.get(`/api/applications/my-applications?page=${page}&limit=12`);
      setApplications(response.data.applications);
      setTotalPages(response.data.pagination?.totalPages || 1);
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchApplications(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFilterChange = (status) => {
    setFilter(status);
  };

  const filteredApplications = applications.filter(app => {
    if (filter === 'all') return true;
    return app.status === filter;
  });

  const getStatusBadge = (status) => {
    const badges = {
      pending: { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-300/70', icon: Clock3 },
      accepted: { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-700/20', icon: CheckCircle2 },
      rejected: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', icon: XCircle }
    };
    return badges[status] || badges.pending;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F8F4]">
        <Navbar />

        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
          <div className="mb-8">
            <Link to="/dashboard" className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-gray-600 transition-colors hover:text-emerald-800">
              <ArrowLeft size={16} aria-hidden="true" />
              Back to Dashboard
            </Link>
            <div className="mb-3 inline-flex items-center gap-2 rounded-lg border border-emerald-700/15 bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-emerald-800 shadow-[0_10px_24px_rgba(16,24,40,0.04)]">
              <ClipboardList size={14} aria-hidden="true" />
              Application tracker
            </div>
            <h1 className="mb-2 text-4xl font-semibold tracking-tight text-gray-950">My Applications</h1>
            <p className="text-gray-600">Track your submitted proposals and their status</p>
          </div>

          <div className="mb-8 rounded-xl border border-emerald-900/10 bg-white p-6 shadow-[0_16px_38px_rgba(16,24,40,0.06)]">
            <p className="mb-3 text-sm font-semibold text-gray-800">Filter by Status</p>
            <div className="flex flex-wrap gap-2">
              <button className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(6,78,59,0.14)] transition-all">
                <ClipboardList size={15} aria-hidden="true" />
                All Applications
              </button>
              <button className="inline-flex items-center gap-2 rounded-lg bg-gray-50 px-4 py-2 text-sm font-semibold text-gray-700 transition-all hover:bg-emerald-50 hover:text-emerald-800">
                <Clock3 size={15} aria-hidden="true" />
                Pending
              </button>
              <button className="inline-flex items-center gap-2 rounded-lg bg-gray-50 px-4 py-2 text-sm font-semibold text-gray-700 transition-all hover:bg-emerald-50 hover:text-emerald-800">
                <CheckCircle2 size={15} aria-hidden="true" />
                Accepted
              </button>
              <button className="inline-flex items-center gap-2 rounded-lg bg-gray-50 px-4 py-2 text-sm font-semibold text-gray-700 transition-all hover:bg-emerald-50 hover:text-emerald-800">
                <XCircle size={15} aria-hidden="true" />
                Rejected
              </button>
            </div>
            <div className="mt-4 text-sm font-medium text-gray-600">Loading applications...</div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <GigCardSkeleton key={index} className="bg-white shadow-[0_12px_30px_rgba(16,24,40,0.05)]" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F8F4]">
      <Navbar />

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
        {/* Header */}
        <div className="mb-8">
          <Link to="/dashboard" className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-gray-600 transition-colors hover:text-emerald-800">
            <ArrowLeft size={16} aria-hidden="true" />
            Back to Dashboard
          </Link>
          <div className="mb-3 inline-flex items-center gap-2 rounded-lg border border-emerald-700/15 bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-emerald-800 shadow-[0_10px_24px_rgba(16,24,40,0.04)]">
            <ClipboardList size={14} aria-hidden="true" />
            Application tracker
          </div>
          <h1 className="mb-2 text-4xl font-semibold tracking-tight text-gray-950">My Applications</h1>
          <p className="text-gray-600">Track your submitted proposals and their status</p>
        </div>

        {/* Filter Buttons */}
        <div className="mb-8 rounded-xl border border-emerald-900/10 bg-white p-6 shadow-[0_16px_38px_rgba(16,24,40,0.06)]">
          <p className="mb-3 text-sm font-semibold text-gray-800">Filter by Status</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleFilterChange('all')}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                filter === 'all' 
                  ? 'bg-emerald-700 text-white shadow-[0_10px_24px_rgba(6,78,59,0.14)]' 
                  : 'bg-gray-50 text-gray-700 hover:bg-emerald-50 hover:text-emerald-800'
              }`}
            >
              <ClipboardList size={15} aria-hidden="true" />
              All Applications
            </button>
            <button
              onClick={() => handleFilterChange('pending')}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                filter === 'pending' 
                  ? 'bg-emerald-700 text-white shadow-[0_10px_24px_rgba(6,78,59,0.14)]' 
                  : 'bg-gray-50 text-gray-700 hover:bg-emerald-50 hover:text-emerald-800'
              }`}
            >
              <Clock3 size={15} aria-hidden="true" />
              Pending
            </button>
            <button
              onClick={() => handleFilterChange('accepted')}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                filter === 'accepted' 
                  ? 'bg-emerald-700 text-white shadow-[0_10px_24px_rgba(6,78,59,0.14)]' 
                  : 'bg-gray-50 text-gray-700 hover:bg-emerald-50 hover:text-emerald-800'
              }`}
            >
              <CheckCircle2 size={15} aria-hidden="true" />
              Accepted
            </button>
            <button
              onClick={() => handleFilterChange('rejected')}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                filter === 'rejected' 
                  ? 'bg-emerald-700 text-white shadow-[0_10px_24px_rgba(6,78,59,0.14)]' 
                  : 'bg-gray-50 text-gray-700 hover:bg-emerald-50 hover:text-emerald-800'
              }`}
            >
              <XCircle size={15} aria-hidden="true" />
              Rejected
            </button>
          </div>
          <div className="mt-4 text-sm font-medium text-gray-600">
            Showing <span className="font-semibold text-gray-950">{filteredApplications.length}</span> of {applications.length} applications
          </div>
        </div>

        {/* Applications List */}
        {filteredApplications.length === 0 ? (
          <div className="rounded-xl border border-dashed border-emerald-900/20 bg-white p-12 text-center shadow-[0_16px_38px_rgba(16,24,40,0.06)]">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800">
              <ClipboardList size={30} aria-hidden="true" />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-gray-950">No applications found</h3>
            <p className="mb-6 text-gray-600">
              {filter === 'all' 
                ? "You haven't applied to any gigs yet"
                : `No ${filter} applications`
              }
            </p>
            <Link
              to="/gigs"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-700 px-6 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(6,78,59,0.16)] transition-all hover:-translate-y-0.5 hover:bg-emerald-800"
            >
              <BriefcaseBusiness size={17} aria-hidden="true" />
              Browse Gigs
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            {filteredApplications.map((app) => {
              const statusBadge = getStatusBadge(app.status);
              const StatusIcon = statusBadge.icon;
              return (
                <div key={app.id} className="rounded-xl border border-emerald-900/10 bg-white p-6 shadow-[0_12px_30px_rgba(16,24,40,0.05)] transition-all hover:-translate-y-1 hover:border-emerald-700/30 hover:shadow-[0_18px_45px_rgba(16,24,40,0.09)]">
                  <div className="flex flex-col gap-5">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="min-w-0 flex-1">
                        <Link 
                          to={`/gigs/${app.gig?.id}`} 
                          className="mb-2 block text-xl font-semibold leading-snug text-gray-950 transition-colors hover:text-emerald-800"
                        >
                          {app.gig?.title}
                        </Link>
                        <div className="flex flex-wrap items-center gap-3 text-sm font-medium text-gray-600">
                          <span className="inline-flex items-center gap-1.5">
                            <CalendarDays size={15} aria-hidden="true" />
                            Applied on {new Date(app.created_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </span>
                          {app.gig?.creator?.full_name && (
                            <span className="inline-flex items-center gap-1.5">
                              <UserRound size={15} aria-hidden="true" />
                              {app.gig.creator.full_name}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className={`inline-flex self-start items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold uppercase tracking-wide ${statusBadge.bg} ${statusBadge.text} ${statusBadge.border}`}>
                        <StatusIcon size={13} aria-hidden="true" />
                        {app.status}
                      </span>
                    </div>

                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                      <p className="mb-2 inline-flex items-center gap-2 text-sm font-semibold text-gray-800">
                        <Send size={15} aria-hidden="true" />
                        Your Message:
                      </p>
                      <p className="leading-relaxed text-gray-700">{app.message}</p>
                    </div>

                    <div className="flex flex-col gap-4 rounded-lg border border-emerald-900/10 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex flex-wrap items-center gap-3 text-sm font-medium text-gray-600">
                        {app.gig?.type === 'paid' ? (
                          <div className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-700/15 bg-emerald-50 px-3 py-1.5 text-emerald-800">
                            <IndianRupee size={15} aria-hidden="true" />
                            <span>{app.gig?.price}</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-700/15 bg-emerald-50 px-3 py-1.5 text-emerald-800">
                            <Coins size={15} aria-hidden="true" />
                            <span>{app.gig?.credits} Credits</span>
                          </div>
                        )}
                        <div className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-gray-700">
                          <BriefcaseBusiness size={15} aria-hidden="true" />
                          <span>{app.gig?.type === 'paid' ? 'Paid gig' : 'Credit gig'}</span>
                        </div>
                      </div>

                      {app.status === 'accepted' && (
                        <span className="inline-flex items-center gap-1.5 self-start rounded-lg border border-emerald-700/20 bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-800 sm:self-auto">
                          <CheckCircle2 size={15} aria-hidden="true" />
                          Congratulations!
                        </span>
                      )}
                    </div>

                    {app.gig?.skills_required && app.gig.skills_required.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {app.gig.skills_required.slice(0, 5).map((skill, index) => (
                          <span
                            key={index}
                            className="rounded-md border border-emerald-700/15 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="border-t border-emerald-900/10 pt-4">
                      <Link
                        to={`/gigs/${app.gig?.id}`}
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-800 transition-colors hover:text-emerald-950"
                      >
                        View Gig Details
                        <ArrowRight size={15} aria-hidden="true" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-10">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      </div>
    </div>
  );
};

export default MyApplications;
