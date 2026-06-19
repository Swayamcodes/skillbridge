import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Pagination from '../components/Pagination';
import { GigCardSkeleton } from '../components/Skeletons';
import api from '../services/api';

const Gigs = () => {
  const [gigs, setGigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [allSkills, setAllSkills] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchGigs();
  }, []);

  const fetchGigs = async (page = 1) => {
    try {
      const response = await api.get(`/api/gigs?page=${page}&limit=12`);
      setGigs(response.data.gigs);
      setTotalPages(response.data.pagination?.totalPages || 1);
      
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

  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchGigs(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
            <Link to="/dashboard" className="text-xl font-light tracking-wide">Skill bridge</Link>
            <div className="flex items-center gap-4">
              <Link to="/dashboard" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                Dashboard
              </Link>
              <Link
                to="/gigs/post"
                className="bg-emerald-700 text-white px-6 py-2 rounded-full text-sm hover:bg-emerald-800 transition-all hover:scale-105"
              >
                + Post Gig
              </Link>
            </div>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="mb-8">
            <Link to="/dashboard" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors mb-4">
              â† Back to Dashboard
            </Link>
            <h1 className="text-4xl font-light mb-2">Browse Opportunities</h1>
            <p className="text-gray-600">Discover gigs and connect with peers across campus</p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <GigCardSkeleton key={index} className="bg-white" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Header/Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link to="/dashboard" className="text-xl font-light tracking-wide">Skill bridge</Link>
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
              Dashboard
            </Link>
            <Link
              to="/gigs/post"
              className="bg-emerald-700 text-white px-6 py-2 rounded-full text-sm hover:bg-emerald-800 transition-all hover:scale-105"
            >
              + Post Gig
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link to="/dashboard" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors mb-4">
            ← Back to Dashboard
          </Link>
          <h1 className="text-4xl font-light mb-2">Browse Opportunities</h1>
          <p className="text-gray-600">Discover gigs and connect with peers across campus</p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, description, or skills..."
              className="w-full border border-gray-300 rounded-lg px-5 py-4 pr-12 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-lg"
            />
            <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl">🔍</span>
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
          {/* Type Filter */}
          <div className="mb-6">
            <p className="text-sm font-medium text-gray-700 mb-3">Type</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  filter === 'all' 
                    ? 'bg-emerald-700 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All Gigs
              </button>
              <button
                onClick={() => setFilter('paid')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  filter === 'paid' 
                    ? 'bg-emerald-700 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                💰 Paid
              </button>
              <button
                onClick={() => setFilter('barter')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  filter === 'barter' 
                    ? 'bg-emerald-700 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                🔄 Barter
              </button>
            </div>
          </div>

          {/* Sort */}
          <div className="mb-6">
            <p className="text-sm font-medium text-gray-700 mb-3">Sort by</p>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="price-high">Price: High to Low</option>
              <option value="price-low">Price: Low to High</option>
            </select>
          </div>

          {/* Skills Filter */}
          {allSkills.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-gray-700">Filter by Skills</p>
                {selectedSkills.length > 0 && (
                  <button
                    onClick={() => setSelectedSkills([])}
                    className="text-sm text-emerald-700 hover:text-emerald-800 font-medium"
                  >
                    Clear ({selectedSkills.length})
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {allSkills.map((skill) => (
                  <button
                    key={skill}
                    onClick={() => toggleSkill(skill)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                      selectedSkills.includes(skill)
                        ? 'bg-emerald-700 text-white'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                    }`}
                  >
                    {skill}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-gray-600">
            <span className="font-medium text-gray-900">{filteredAndSortedGigs.length}</span> of {gigs.length} gigs
          </p>
        </div>

        {/* Gigs Grid */}
        {filteredAndSortedGigs.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🔍</span>
            </div>
            <h3 className="text-xl font-light mb-2">No gigs found</h3>
            <p className="text-gray-600 mb-6">
              {searchQuery || selectedSkills.length > 0 
                ? 'Try adjusting your filters'
                : 'Be the first to post a gig!'
              }
            </p>
            {searchQuery || selectedSkills.length > 0 ? (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedSkills([]);
                  setFilter('all');
                }}
                className="bg-emerald-700 text-white px-6 py-3 rounded-full hover:bg-emerald-800 transition-all hover:scale-105"
              >
                Clear All Filters
              </button>
            ) : (
              <Link
                to="/gigs/post"
                className="inline-block bg-emerald-700 text-white px-6 py-3 rounded-full hover:bg-emerald-800 transition-all hover:scale-105"
              >
                Post the First Gig
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedGigs.map((gig) => (
              <Link
                key={gig.id}
                to={`/gigs/${gig.id}`}
                className="bg-white rounded-xl border border-gray-200 p-6 hover:border-emerald-500 hover:shadow-lg transition-all group"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-xl font-medium group-hover:text-emerald-700 transition-colors line-clamp-2 flex-1">
                    {gig.title}
                  </h3>
                  {gig.type === 'paid' ? (
                    <span className="bg-emerald-700 text-white px-3 py-1 rounded-full text-sm font-medium flex-shrink-0 ml-2">
                      ₹{gig.price}
                    </span>
                  ) : (
                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full text-sm font-medium flex-shrink-0 ml-2">
                      {gig.credits} Credits
                    </span>
                  )}
                </div>

                <p className="text-gray-600 text-sm mb-4 line-clamp-3 leading-relaxed">
                  {gig.description}
                </p>

                {gig.skills_required && gig.skills_required.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {gig.skills_required.slice(0, 3).map((skill, index) => (
                      <span
                        key={index}
                        className="bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full text-xs"
                      >
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

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 text-sm font-medium">
                      {gig.creator?.full_name?.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm text-gray-600">{gig.creator?.full_name}</span>
                  </div>
                  <span className="text-emerald-700 group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </Link>
            ))}
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

export default Gigs;
