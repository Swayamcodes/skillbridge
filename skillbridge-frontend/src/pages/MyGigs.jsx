import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';

const MyGigs = () => {
  const { profile } = useContext(AuthContext);
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

  const GigCard = ({ gig, isPosted }) => (
    <div className="border-4 border-black shadow-brutal p-6">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <Link to={`/gigs/${gig.id}`} className="text-2xl font-bold hover:underline">
            {gig.title}
          </Link>
          <p className="mt-2 line-clamp-2">{gig.description}</p>
        </div>
        <div className="ml-4">
          {gig.type === 'paid' ? (
            <span className="bg-black text-white px-4 py-2 font-bold">
              ₹{gig.price}
            </span>
          ) : (
            <span className="border-3 border-black px-4 py-2 font-bold">
              {gig.credits} Credits
            </span>
          )}
        </div>
      </div>

      <div className="mb-3">
        <span className={`border-3 border-black px-3 py-1 font-bold uppercase text-sm ${
          gig.status === 'open' ? 'bg-green-200' :
          gig.status === 'assigned' ? 'bg-yellow-200' :
          gig.status === 'completed' ? 'bg-blue-200' :
          'bg-gray-200'
        }`}>
          {gig.status}
        </span>
      </div>

      {isPosted && gig.assigned_to && (
        <p className="text-sm mb-2">
          Assigned to: <span className="font-bold">{gig.assigned?.full_name}</span>
        </p>
      )}

      {!isPosted && gig.creator && (
        <p className="text-sm mb-2">
          Posted by: <span className="font-bold">{gig.creator?.full_name}</span>
        </p>
      )}

      <div className="flex flex-wrap gap-2 mb-3">
        {gig.skills_required?.slice(0, 3).map((skill, index) => (
          <span key={index} className="text-sm border-2 border-black px-2 py-1">
            {skill}
          </span>
        ))}
      </div>

      <div className="flex gap-2 mt-4">
        <Link
          to={`/gigs/${gig.id}`}
          className="border-3 border-black px-4 py-2 font-bold hover:bg-black hover:text-white text-sm"
        >
          View Details
        </Link>
        {isPosted && (
          <Link
            to={`/gigs/${gig.id}/applicants`}
            className="border-3 border-black px-4 py-2 font-bold hover:bg-black hover:text-white text-sm"
          >
            Applicants
          </Link>
        )}
      </div>
    </div>
  );

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-6">My Gigs</h1>

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('posted')}
            className={`border-3 border-black px-6 py-3 font-bold ${
              activeTab === 'posted' ? 'bg-black text-white' : 'hover:bg-black hover:text-white'
            }`}
          >
            Posted by Me ({postedGigs.length})
          </button>
          <button
            onClick={() => setActiveTab('assigned')}
            className={`border-3 border-black px-6 py-3 font-bold ${
              activeTab === 'assigned' ? 'bg-black text-white' : 'hover:bg-black hover:text-white'
            }`}
          >
            Assigned to Me ({assignedGigs.length})
          </button>
        </div>

        {activeTab === 'posted' && (
          <div>
            {postedGigs.length === 0 ? (
              <div className="border-4 border-black p-8 text-center">
                <p className="text-xl mb-4">You haven't posted any gigs yet</p>
                <Link
                  to="/gigs/post"
                  className="inline-block bg-black text-white border-3 border-black px-6 py-3 font-bold hover:bg-white hover:text-black"
                >
                  Post a Gig
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

        {activeTab === 'assigned' && (
          <div>
            {assignedGigs.length === 0 ? (
              <div className="border-4 border-black p-8 text-center">
                <p className="text-xl mb-4">No gigs assigned to you yet</p>
                <Link
                  to="/gigs"
                  className="inline-block bg-black text-white border-3 border-black px-6 py-3 font-bold hover:bg-white hover:text-black"
                >
                  Browse Gigs
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

export default MyGigs;