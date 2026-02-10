import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const Gigs = () => {
  const [gigs, setGigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchGigs();
  }, []);

  const fetchGigs = async () => {
    try {
      const response = await api.get('/api/gigs');
      setGigs(response.data.gigs);
    } catch (error) {
      console.error('Error fetching gigs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredGigs = gigs.filter(gig => {
    if (filter === 'all') return true;
    return gig.type === filter;
  });

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Browse Gigs</h1>
          <Link
            to="/gigs/post"
            className="bg-black text-white border-3 border-black px-6 py-3 font-bold hover:bg-white hover:text-black"
          >
            + Post Gig
          </Link>
        </div>

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
            onClick={() => setFilter('paid')}
            className={`border-3 border-black px-4 py-2 font-bold ${
              filter === 'paid' ? 'bg-black text-white' : 'hover:bg-black hover:text-white'
            }`}
          >
            Paid
          </button>
          <button
            onClick={() => setFilter('barter')}
            className={`border-3 border-black px-4 py-2 font-bold ${
              filter === 'barter' ? 'bg-black text-white' : 'hover:bg-black hover:text-white'
            }`}
          >
            Barter
          </button>
        </div>

        {filteredGigs.length === 0 ? (
          <div className="border-4 border-black p-8 text-center">
            <p className="text-xl mb-4">No gigs found</p>
            <Link
              to="/gigs/post"
              className="inline-block bg-black text-white border-3 border-black px-6 py-3 font-bold hover:bg-white hover:text-black"
            >
              Post the first gig
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGigs.map((gig) => (
              <Link
                key={gig.id}
                to={`/gigs/${gig.id}`}
                className="border-4 border-black shadow-brutal p-6 hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
              >
                <h3 className="text-xl font-bold mb-2">{gig.title}</h3>
                <p className="mb-4 line-clamp-3">{gig.description}</p>
                
                <div className="mb-3">
                  {gig.type === 'paid' ? (
                    <span className="bg-black text-white px-3 py-1 font-bold">
                      ₹{gig.price}
                    </span>
                  ) : (
                    <span className="border-3 border-black px-3 py-1 font-bold">
                      {gig.credits} Credits
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 mb-3">
                  {gig.skills_required?.slice(0, 3).map((skill, index) => (
                    <span
                      key={index}
                      className="text-sm border-2 border-black px-2 py-1"
                    >
                      {skill}
                    </span>
                  ))}
                </div>

                <p className="text-sm">by {gig.creator?.full_name}</p>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-8">
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

export default Gigs;