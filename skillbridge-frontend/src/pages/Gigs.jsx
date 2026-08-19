import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Coins,
  IndianRupee,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Tags,
} from 'lucide-react';
import Avatar from '../components/Avatar';
import Pagination from '../components/Pagination';
import { GigCardSkeleton } from '../components/Skeletons';
import Navbar from '../components/Navbar';
import api from '../services/api';

const Gigs = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [gigs, setGigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [allSkills, setAllSkills] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [successMessage, setSuccessMessage] = useState(location.state?.message || '');

  useEffect(() => {
    fetchGigs();
  }, []);

  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.pathname, location.state, navigate]);

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

  const typeButtonClass = (type) =>
    `inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
      filter === type
        ? 'bg-emerald-700 text-white shadow-[0_10px_24px_rgba(6,78,59,0.16)]'
        : 'border border-emerald-900/10 bg-white text-gray-700 hover:-translate-y-0.5 hover:border-emerald-700/25 hover:bg-emerald-50 hover:text-emerald-800'
    }`;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F8F4]">
        <Navbar
          action={
            <Link
              to="/gigs/post"
              className="hidden items-center gap-2 rounded-lg bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(6,78,59,0.16)] transition-all hover:-translate-y-0.5 hover:bg-emerald-800 md:inline-flex"
            >
              <Plus size={16} aria-hidden="true" />
              Post Gig
            </Link>
          }
        />

        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-10">
          <div className="mb-8">
            <Link to="/dashboard" className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-gray-600 transition-colors hover:text-emerald-800">
              <ArrowLeft size={16} aria-hidden="true" />
              Back to Dashboard
            </Link>
            <h1 className="mb-2 text-4xl font-semibold tracking-tight text-gray-950">Browse Opportunities</h1>
            <p className="text-gray-600">Discover gigs and connect with peers across campus</p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <GigCardSkeleton key={index} className="bg-white shadow-[0_12px_30px_rgba(16,24,40,0.05)]" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F8F4]">
      <Navbar
        action={
          <Link
            to="/gigs/post"
            className="hidden items-center gap-2 rounded-lg bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(6,78,59,0.16)] transition-all hover:-translate-y-0.5 hover:bg-emerald-800 md:inline-flex"
          >
            <Plus size={16} aria-hidden="true" />
            Post Gig
          </Link>
        }
      />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-10">
        {/* Header */}
        <div className="mb-8">
          <Link to="/dashboard" className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-gray-600 transition-colors hover:text-emerald-800">
            <ArrowLeft size={16} aria-hidden="true" />
            Back to Dashboard
          </Link>
          <h1 className="mb-2 text-4xl font-semibold tracking-tight text-gray-950">Browse Opportunities</h1>
          <p className="text-gray-600">Discover gigs and connect with peers across campus</p>
        </div>

        {successMessage && (
          <div className="mb-6 rounded-xl border border-emerald-700/20 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900 shadow-[0_10px_24px_rgba(6,78,59,0.06)]">
            {successMessage}
          </div>
        )}

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-emerald-700" size={21} aria-hidden="true" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, description, or skills..."
              className="w-full rounded-xl border border-emerald-900/10 bg-white px-14 py-4 text-base text-gray-950 shadow-[0_12px_30px_rgba(16,24,40,0.05)] outline-none transition-all placeholder:text-gray-400 focus:border-emerald-700/40 focus:ring-4 focus:ring-emerald-700/10 sm:text-lg"
            />
          </div>
        </div>

        {/* Filters Section */}
        <div className="mb-8 rounded-xl border border-emerald-900/10 bg-white p-6 shadow-[0_16px_38px_rgba(16,24,40,0.06)]">
          {/* Type Filter */}
          <div className="mb-6">
            <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-800">
              <SlidersHorizontal size={16} className="text-emerald-700" aria-hidden="true" />
              Type
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilter('all')}
                className={typeButtonClass('all')}
              >
                All Gigs
              </button>
              <button
                onClick={() => setFilter('paid')}
                className={typeButtonClass('paid')}
              >
                <IndianRupee size={15} aria-hidden="true" />
                Paid
              </button>
              <button
                onClick={() => setFilter('barter')}
                className={typeButtonClass('barter')}
              >
                <RefreshCw size={15} aria-hidden="true" />
                Barter
              </button>
            </div>
          </div>

          {/* Sort */}
          <div className="mb-6">
            <p className="mb-3 text-sm font-semibold text-gray-800">Sort by</p>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded-lg border border-emerald-900/10 bg-white px-4 py-2.5 text-sm font-medium text-gray-800 outline-none transition-all focus:border-emerald-700/40 focus:ring-4 focus:ring-emerald-700/10"
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
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                  <Tags size={16} className="text-emerald-700" aria-hidden="true" />
                  Filter by Skills
                </p>
                {selectedSkills.length > 0 && (
                  <button
                    onClick={() => setSelectedSkills([])}
                    className="text-sm font-semibold text-emerald-700 transition-colors hover:text-emerald-900"
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
                    className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-all ${
                      selectedSkills.includes(skill)
                        ? 'bg-emerald-700 text-white shadow-[0_10px_24px_rgba(6,78,59,0.16)]'
                        : 'border border-emerald-700/15 bg-emerald-50 text-emerald-800 hover:-translate-y-0.5 hover:bg-emerald-100'
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
        <div className="mb-6 flex items-center justify-between">
          <p className="text-sm font-medium text-gray-600">
            <span className="font-semibold text-gray-950">{filteredAndSortedGigs.length}</span> of {gigs.length} gigs
          </p>
        </div>

        {/* Gigs Grid */}
        {filteredAndSortedGigs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-emerald-900/20 bg-white p-12 text-center shadow-[0_16px_38px_rgba(16,24,40,0.06)]">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800">
              <Search size={30} aria-hidden="true" />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-gray-950">No gigs found</h3>
            <p className="mb-6 text-gray-600">
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
                className="inline-flex items-center justify-center rounded-lg bg-emerald-700 px-6 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(6,78,59,0.16)] transition-all hover:-translate-y-0.5 hover:bg-emerald-800"
              >
                Clear All Filters
              </button>
            ) : (
              <Link
                to="/gigs/post"
                className="inline-flex items-center justify-center rounded-lg bg-emerald-700 px-6 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(6,78,59,0.16)] transition-all hover:-translate-y-0.5 hover:bg-emerald-800"
              >
                Post the First Gig
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredAndSortedGigs.map((gig) => (
              <div
                key={gig.id}
                className="group flex h-full flex-col rounded-xl border border-emerald-900/10 bg-white p-6 shadow-[0_12px_30px_rgba(16,24,40,0.05)] transition-all hover:-translate-y-1 hover:border-emerald-700/30 hover:shadow-[0_18px_45px_rgba(16,24,40,0.09)]"
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <Link
                    to={`/gigs/${gig.id}`}
                    className="line-clamp-2 flex-1 text-xl font-semibold leading-snug text-gray-950 transition-colors group-hover:text-emerald-800"
                  >
                    {gig.title}
                  </Link>
                  {gig.type === 'paid' ? (
                    <span className="ml-2 inline-flex flex-shrink-0 items-center gap-1 rounded-lg bg-emerald-700 px-3 py-1.5 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(6,78,59,0.14)]">
                      <IndianRupee size={14} aria-hidden="true" />
                      {gig.price}
                    </span>
                  ) : (
                    <span className="ml-2 inline-flex flex-shrink-0 items-center gap-1 rounded-lg border border-emerald-700/15 bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-800">
                      <Coins size={14} aria-hidden="true" />
                      {gig.credits} Credits
                    </span>
                  )}
                </div>

                <p className="mb-4 line-clamp-3 text-sm leading-6 text-gray-600">
                  {gig.description}
                </p>

                {gig.skills_required && gig.skills_required.length > 0 && (
                  <div className="mb-5 flex flex-wrap gap-2">
                    {gig.skills_required.slice(0, 3).map((skill, index) => (
                      <span
                        key={index}
                        className="rounded-md border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-semibold text-gray-700"
                      >
                        {skill}
                      </span>
                    ))}
                    {gig.skills_required.length > 3 && (
                      <span className="rounded-md border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-semibold text-gray-700">
                        +{gig.skills_required.length - 3} more
                      </span>
                    )}
                  </div>
                )}

                <div className="mt-auto flex items-center justify-between border-t border-emerald-900/10 pt-4">
                  <div className="flex min-w-0 items-center gap-2">
                    <Avatar profile={gig.creator} size="sm" className="h-8 w-8 text-sm" />
                    <Link
                      to={`/profile/${gig.creator?.id}`}
                      className="truncate text-sm font-medium text-gray-600 transition-colors hover:text-emerald-800 hover:underline"
                    >
                      {gig.creator?.full_name}
                    </Link>
                  </div>
                  <span className="ml-3 inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-800 transition-all group-hover:translate-x-1 group-hover:bg-emerald-100">
                    <ArrowRight size={17} aria-hidden="true" />
                  </span>
                </div>
              </div>
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
