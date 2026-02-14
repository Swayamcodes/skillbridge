import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const Gigs = () => {
  const [gigs, setGigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [allSkills, setAllSkills] = useState([]);

  useEffect(() => {
    fetchGigs();
  }, []);

  const fetchGigs = async () => {
    try {
      const response = await api.get('/api/gigs');
      setGigs(response.data.gigs);
      
      // Extract unique skills
      const skills = new Set();
      response.data.gigs.forEach(gig => {
        gig.skills_required?.forEach(skill => skills.add(skill));
      });
      setAllSkills(Array.from(skills));
    } catch (error) {
      console.error('Error fetching gigs:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSkill = (skill) => {
    setSelectedSkills(prev => 
      prev.includes(skill) 
        ? prev.filter(s => s !== skill)
        : [...prev, skill]
    );
  };

  const filteredAndSortedGigs = gigs
    .filter(gig => {
      // Type filter
      if (filter !== 'all' && gig.type !== filter) return false;
      
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = gig.title.toLowerCase().includes(query);
        const matchesDescription = gig.description.toLowerCase().includes(query);
        const matchesSkills = gig.skills_required?.some(skill => 
          skill.toLowerCase().includes(query)
        );
        if (!matchesTitle && !matchesDescription && !matchesSkills) return false;
      }
      
      // Skills filter
      if (selectedSkills.length > 0) {
        const hasSkill = selectedSkills.some(skill => 
          gig.skills_required?.includes(skill)
        );
        if (!hasSkill) return false;
      }
      
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at) - new Date(a.created_at);
        case 'oldest':
          return new Date(a.created_at) - new Date(b.created_at);
        case 'price-high':
          if (a.type === 'paid' && b.type === 'paid') {
            return b.price - a.price;
          }
          if (a.type === 'barter' && b.type === 'barter') {
            return b.credits - a.credits;
          }
          return 0;
        case 'price-low':
          if (a.type === 'paid' && b.type === 'paid') {
            return a.price - b.price;
          }
          if (a.type === 'barter' && b.type === 'barter') {
            return a.credits - b.credits;
          }
          return 0;
        default:
          return 0;
      }
    });

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-4xl font-bold">Browse Gigs</h1>
          <Link
            to="/gigs/post"
            className="bg-black text-white border-3 border-black px-6 py-3 font-bold hover:bg-white hover:text-black"
          >
            + Post Gig
          </Link>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, description, or skills..."
            className="w-full border-3 border-black p-3 text-lg"
          />
        </div>

        {/* Type Filter */}
        <div className="flex gap-2 mb-4">
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

        {/* Sort */}
        <div className="flex gap-2 mb-4 items-center">
          <span className="font-bold">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="border-3 border-black px-4 py-2 font-bold"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="price-high">Price: High to Low</option>
            <option value="price-low">Price: Low to High</option>
          </select>
        </div>

        {/* Skills Filter */}
        {allSkills.length > 0 && (
          <div className="mb-6">
            <p className="font-bold mb-2">Filter by Skills:</p>
            <div className="flex flex-wrap gap-2">
              {allSkills.map((skill) => (
                <button
                  key={skill}
                  onClick={() => toggleSkill(skill)}
                  className={`border-2 border-black px-3 py-1 text-sm font-bold ${
                    selectedSkills.includes(skill)
                      ? 'bg-black text-white'
                      : 'hover:bg-gray-200'
                  }`}
                >
                  {skill}
                </button>
              ))}
            </div>
            {selectedSkills.length > 0 && (
              <button
                onClick={() => setSelectedSkills([])}
                className="mt-2 text-sm underline font-bold"
              >
                Clear skill filters
              </button>
            )}
          </div>
        )}

        {/* Results Count */}
        <p className="mb-4 font-bold">
          Showing {filteredAndSortedGigs.length} of {gigs.length} gigs
        </p>

        {/* Gigs Grid */}
        {filteredAndSortedGigs.length === 0 ? (
          <div className="border-4 border-black p-8 text-center">
            <p className="text-xl mb-4">No gigs found</p>
            {searchQuery || selectedSkills.length > 0 ? (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedSkills([]);
                  setFilter('all');
                }}
                className="inline-block bg-black text-white border-3 border-black px-6 py-3 font-bold hover:bg-white hover:text-black"
              >
                Clear All Filters
              </button>
            ) : (
              <Link
                to="/gigs/post"
                className="inline-block bg-black text-white border-3 border-black px-6 py-3 font-bold hover:bg-white hover:text-black"
              >
                Post the first gig
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedGigs.map((gig) => (
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