import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Navbar from '../components/Navbar';

const MyGigs = () => {
  const [activeTab, setActiveTab] = useState('posted');
  const [postedGigs, setPostedGigs] = useState([]);
  const [assignedGigs, setAssignedGigs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGigs();
  }, []);

  const fetchGigs = async () => {
    try {
      const [postedRes, assignedRes] = await Promise.all([
        api.get('/api/gigs/my-posted'),
        api.get('/api/gigs/my-assigned')
      ]);
      setPostedGigs(postedRes.data.gigs);
      setAssignedGigs(assignedRes.data.gigs);
    } catch (error) {
      console.error('Error fetching gigs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      open: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300', icon: '🟢' },
      assigned: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300', icon: '⏳' },
      completed: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300', icon: '✓' },
      closed: { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-300', icon: '🔒' }
    };
    return badges[status] || badges.open;
  };

  const GigCard = ({ gig, isPosted }) => {
    const statusBadge = getStatusBadge(gig.status);
    
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 hover:border-emerald-300 hover:shadow-lg transition-all">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1">
            <Link 
              to={`/gigs/${gig.id}`} 
              className="text-xl font-medium hover:text-emerald-700 transition-colors line-clamp-2 block mb-2"
            >
              {gig.title}
            </Link>
            <p className="text-gray-600 text-sm line-clamp-2 leading-relaxed">{gig.description}</p>
          </div>
          <div className="flex-shrink-0">
            {gig.type === 'paid' ? (
              <span className="bg-emerald-700 text-white px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap">
                ₹{gig.price}
              </span>
            ) : (
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap">
                {gig.credits} Credits
              </span>
            )}
          </div>
        </div>

        <div className="mb-4">
          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusBadge.bg} ${statusBadge.text} ${statusBadge.border} inline-flex items-center gap-1.5`}>
            <span>{statusBadge.icon}</span>
            <span className="uppercase">{gig.status}</span>
          </span>
        </div>

        {isPosted && gig.assigned_to && (
          <div className="mb-3 flex items-center gap-2 text-sm text-gray-600">
            <span>👤</span>
            <span>Assigned to: <span className="font-medium text-gray-900">{gig.assigned?.full_name}</span></span>
          </div>
        )}

        {!isPosted && gig.creator && (
          <div className="mb-3 flex items-center gap-2 text-sm text-gray-600">
            <span>👤</span>
            <span>Posted by: <span className="font-medium text-gray-900">{gig.creator?.full_name}</span></span>
          </div>
        )}

        {gig.skills_required && gig.skills_required.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {gig.skills_required.slice(0, 3).map((skill, index) => (
              <span key={index} className="bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full text-xs">
                {skill}
              </span>
            ))}
            {gig.skills_required.length > 3 && (
              <span className="bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full text-xs">
                +{gig.skills_required.length - 3} more
              </span>
            )}
          </div>
        )}

        <div className="flex gap-2 pt-4 border-t border-gray-100">
          <Link
            to={`/gigs/${gig.id}`}
            className="flex-1 text-center bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-800 transition-colors"
          >
            View Details
          </Link>
          {isPosted && (
            <Link
              to={`/gigs/${gig.id}/applicants`}
              className="flex-1 text-center border border-emerald-700 text-emerald-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-50 transition-colors"
            >
              Applicants
            </Link>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600">Loading your gigs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <Navbar
        links={[
          { to: '/gigs', label: 'Browse Gigs' },
          { to: '/dashboard', label: 'Dashboard' },
        ]}
      />

      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link to="/dashboard" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors mb-4">
            ← Back to Dashboard
          </Link>
          <h1 className="text-4xl font-light mb-2">My Gigs</h1>
          <p className="text-gray-600">Manage gigs you've posted and gigs assigned to you</p>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl border border-gray-200 p-2 mb-8 inline-flex gap-2">
          <button
            onClick={() => setActiveTab('posted')}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'posted' 
                ? 'bg-emerald-700 text-white shadow-sm' 
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            📝 Posted by Me ({postedGigs.length})
          </button>
          <button
            onClick={() => setActiveTab('assigned')}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'assigned' 
                ? 'bg-emerald-700 text-white shadow-sm' 
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            ✓ Assigned to Me ({assignedGigs.length})
          </button>
        </div>

        {/* Posted Gigs Tab */}
        {activeTab === 'posted' && (
          <div>
            {postedGigs.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">📝</span>
                </div>
                <h3 className="text-xl font-light mb-2">No gigs posted yet</h3>
                <p className="text-gray-600 mb-6">Create your first gig and start collaborating with peers</p>
                <Link
                  to="/gigs/post"
                  className="inline-block bg-emerald-700 text-white px-6 py-3 rounded-full hover:bg-emerald-800 transition-all hover:scale-105"
                >
                  Post Your First Gig
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {postedGigs.map((gig) => (
                  <GigCard key={gig.id} gig={gig} isPosted={true} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Assigned Gigs Tab */}
        {activeTab === 'assigned' && (
          <div>
            {assignedGigs.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">🎯</span>
                </div>
                <h3 className="text-xl font-light mb-2">No gigs assigned yet</h3>
                <p className="text-gray-600 mb-6">Apply to gigs and get accepted to see them here</p>
                <Link
                  to="/gigs"
                  className="inline-block bg-emerald-700 text-white px-6 py-3 rounded-full hover:bg-emerald-800 transition-all hover:scale-105"
                >
                  Browse Available Gigs
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {assignedGigs.map((gig) => (
                  <GigCard key={gig.id} gig={gig} isPosted={false} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Stats Summary */}
        <div className="mt-12 bg-gradient-to-r from-emerald-50 to-gray-50 rounded-xl border border-gray-200 p-6">
          <h3 className="font-medium text-gray-900 mb-4">Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-light mb-1">{postedGigs.length}</p>
              <p className="text-sm text-gray-600">Posted</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-light mb-1">{assignedGigs.length}</p>
              <p className="text-sm text-gray-600">Assigned</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-light mb-1">
                {postedGigs.filter(g => g.status === 'open').length}
              </p>
              <p className="text-sm text-gray-600">Open</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-light mb-1">
                {[...postedGigs, ...assignedGigs].filter(g => g.status === 'completed').length}
              </p>
              <p className="text-sm text-gray-600">Completed</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyGigs;

