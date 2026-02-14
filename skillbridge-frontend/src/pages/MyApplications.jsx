import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';

const MyApplications = () => {
  const { profile } = useContext(AuthContext);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const response = await api.get(`/api/applications/my-applications`);
      setApplications(response.data.applications);
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredApplications = applications.filter(app => {
    if (filter === 'all') return true;
    return app.status === filter;
  });

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-6">My Applications</h1>

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setFilter('all')}
            className={`border-3 border-black px-4 py-2 font-bold ${
              filter === 'all' ? 'bg-black text-white' : 'hover:bg-black hover:text-white'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`border-3 border-black px-4 py-2 font-bold ${
              filter === 'pending' ? 'bg-black text-white' : 'hover:bg-black hover:text-white'
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setFilter('accepted')}
            className={`border-3 border-black px-4 py-2 font-bold ${
              filter === 'accepted' ? 'bg-black text-white' : 'hover:bg-black hover:text-white'
            }`}
          >
            Accepted
          </button>
          <button
            onClick={() => setFilter('rejected')}
            className={`border-3 border-black px-4 py-2 font-bold ${
              filter === 'rejected' ? 'bg-black text-white' : 'hover:bg-black hover:text-white'
            }`}
          >
            Rejected
          </button>
        </div>

        {filteredApplications.length === 0 ? (
          <div className="border-4 border-black p-8 text-center">
            <p className="text-xl mb-4">No applications found</p>
            <Link
              to="/gigs"
              className="inline-block bg-black text-white border-3 border-black px-6 py-3 font-bold hover:bg-white hover:text-black"
            >
              Browse Gigs
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredApplications.map((app) => (
              <div key={app.id} className="border-4 border-black shadow-brutal p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <Link to={`/gigs/${app.gig?.id}`} className="text-2xl font-bold hover:underline">
                      {app.gig?.title}
                    </Link>
                    <p className="mt-2">{app.message}</p>
                    <p className="mt-2 text-sm">
                      Applied: {new Date(app.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <span className={`border-3 border-black px-4 py-2 font-bold uppercase ${
                      app.status === 'accepted' ? 'bg-green-200' :
                      app.status === 'rejected' ? 'bg-red-200' :
                      'bg-yellow-200'
                    }`}>
                      {app.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6">
          <Link
            to="/"
            className="inline-block border-3 border-black px-6 py-3 font-bold hover:bg-black hover:text-white"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default MyApplications;