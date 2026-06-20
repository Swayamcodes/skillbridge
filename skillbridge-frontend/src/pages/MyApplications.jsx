import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300', icon: '⏳' },
      accepted: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300', icon: '✓' },
      rejected: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300', icon: '✕' }
    };
    return badges[status] || badges.pending;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
        <Navbar />

        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="mb-8">
            <Link to="/dashboard" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors mb-4">
              â† Back to Dashboard
            </Link>
            <h1 className="text-4xl font-light mb-2">My Applications</h1>
            <p className="text-gray-600">Track your submitted proposals and their status</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
            <p className="text-sm font-medium text-gray-700 mb-3">Filter by Status</p>
            <div className="flex flex-wrap gap-2">
              <button className="px-4 py-2 rounded-full text-sm font-medium transition-all bg-emerald-700 text-white">
                All Applications
              </button>
              <button className="px-4 py-2 rounded-full text-sm font-medium transition-all bg-gray-100 text-gray-700 hover:bg-gray-200">
                â³ Pending
              </button>
              <button className="px-4 py-2 rounded-full text-sm font-medium transition-all bg-gray-100 text-gray-700 hover:bg-gray-200">
                âœ“ Accepted
              </button>
              <button className="px-4 py-2 rounded-full text-sm font-medium transition-all bg-gray-100 text-gray-700 hover:bg-gray-200">
                âœ• Rejected
              </button>
            </div>
            <div className="mt-4 text-sm text-gray-600">Loading applications...</div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Array.from({ length: 4 }).map((_, index) => (
              <GigCardSkeleton key={index} className="bg-white" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <Navbar />

      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link to="/dashboard" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors mb-4">
            ← Back to Dashboard
          </Link>
          <h1 className="text-4xl font-light mb-2">My Applications</h1>
          <p className="text-gray-600">Track your submitted proposals and their status</p>
        </div>

        {/* Filter Buttons */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
          <p className="text-sm font-medium text-gray-700 mb-3">Filter by Status</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleFilterChange('all')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                filter === 'all' 
                  ? 'bg-emerald-700 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Applications
            </button>
            <button
              onClick={() => handleFilterChange('pending')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                filter === 'pending' 
                  ? 'bg-emerald-700 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              ⏳ Pending
            </button>
            <button
              onClick={() => handleFilterChange('accepted')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                filter === 'accepted' 
                  ? 'bg-emerald-700 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              ✓ Accepted
            </button>
            <button
              onClick={() => handleFilterChange('rejected')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                filter === 'rejected' 
                  ? 'bg-emerald-700 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              ✕ Rejected
            </button>
          </div>
          <div className="mt-4 text-sm text-gray-600">
            Showing <span className="font-medium text-gray-900">{filteredApplications.length}</span> of {applications.length} applications
          </div>
        </div>

        {/* Applications List */}
        {filteredApplications.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">📋</span>
            </div>
            <h3 className="text-xl font-light mb-2">No applications found</h3>
            <p className="text-gray-600 mb-6">
              {filter === 'all' 
                ? "You haven't applied to any gigs yet"
                : `No ${filter} applications`
              }
            </p>
            <Link
              to="/gigs"
              className="inline-block bg-emerald-700 text-white px-6 py-3 rounded-full hover:bg-emerald-800 transition-all hover:scale-105"
            >
              Browse Gigs
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredApplications.map((app) => {
              const statusBadge = getStatusBadge(app.status);
              return (
                <div key={app.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:border-emerald-300 transition-all">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <Link 
                          to={`/gigs/${app.gig?.id}`} 
                          className="text-xl font-medium hover:text-emerald-700 transition-colors"
                        >
                          {app.gig?.title}
                        </Link>
                        <span className={`ml-4 px-3 py-1 rounded-full text-xs font-medium border ${statusBadge.bg} ${statusBadge.text} ${statusBadge.border} flex items-center gap-1.5`}>
                          <span>{statusBadge.icon}</span>
                          <span className="uppercase">{app.status}</span>
                        </span>
                      </div>

                      <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
                        <p className="text-sm font-medium text-gray-700 mb-1">Your Message:</p>
                        <p className="text-gray-700 leading-relaxed">{app.message}</p>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1.5">
                          <span>📅</span>
                          <span>Applied on {new Date(app.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}</span>
                        </div>
                        {app.gig?.type === 'paid' ? (
                          <div className="flex items-center gap-1.5">
                            <span>💰</span>
                            <span>₹{app.gig?.price}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <span>🔄</span>
                            <span>{app.gig?.credits} Credits</span>
                          </div>
                        )}
                      </div>

                      {app.gig?.skills_required && app.gig.skills_required.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-4">
                          {app.gig.skills_required.slice(0, 5).map((skill, index) => (
                            <span
                              key={index}
                              className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs border border-emerald-200"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                    <Link
                      to={`/gigs/${app.gig?.id}`}
                      className="text-sm text-emerald-700 hover:text-emerald-800 font-medium transition-colors flex items-center gap-1"
                    >
                      View Gig Details
                      <span>→</span>
                    </Link>
                    {app.status === 'accepted' && (
                      <span className="text-sm text-gray-600 bg-green-50 px-3 py-1 rounded-full border border-green-200">
                        🎉 Congratulations!
                      </span>
                    )}
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
