import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  CalendarDays,
  Coins,
  FileText,
  IndianRupee,
  Lightbulb,
  PenLine,
  RefreshCw,
  Send,
  Tags,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import api from '../services/api';

const PostGig = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'paid',
    price: '',
    credits: '',
    skillsRequired: '',
    deadline: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const skillsArray = formData.skillsRequired
        .split(',')
        .map(s => s.trim())
        .filter(s => s);

      const gigData = {
        title: formData.title,
        description: formData.description,
        type: formData.type,
        skillsRequired: skillsArray,
        deadline: formData.deadline || null
      };

      if (formData.type === 'paid') {
        gigData.price = parseFloat(formData.price);
      } else {
        gigData.credits = parseInt(formData.credits);
      }

      await api.post('/api/gigs', gigData);
      navigate('/gigs', { state: { message: 'Gig posted successfully!' } });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to post gig');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F8F4]">
      <Navbar />

      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:py-10">
        {/* Back Button */}
        <Link
          to="/gigs"
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-gray-600 transition-colors hover:text-emerald-800"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Back to Gigs
        </Link>

        {/* Form Card */}
        <div className="overflow-hidden rounded-xl border border-emerald-900/10 bg-white shadow-[0_20px_56px_rgba(16,24,40,0.08)]">
          <div className="border-b border-emerald-900/10 bg-white p-6 sm:p-8">
            <div className="mb-3 inline-flex items-center gap-2 rounded-lg border border-emerald-700/15 bg-emerald-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-emerald-800">
              <PenLine size={13} aria-hidden="true" />
              Create Opportunity
            </div>
            <h1 className="mb-2 text-3xl font-semibold tracking-tight text-gray-950 sm:text-4xl">Post a Gig</h1>
            <p className="text-gray-600">Create a new opportunity for your campus community</p>
          </div>

          {error && (
            <div className="mx-6 mt-6 rounded-xl border border-red-200 bg-red-50 p-4 sm:mx-8">
              <p className="text-sm font-medium text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-0">
            {/* Title */}
            <section className="border-b border-emerald-900/10 p-6 sm:p-8">
              <div className="mb-5">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-950">
                  <FileText size={19} className="text-emerald-700" aria-hidden="true" />
                  Gig Details
                </h2>
                <p className="mt-1 text-sm text-gray-600">Describe the work clearly so the right students can respond.</p>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Title
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="e.g., Need React Developer for Portfolio Site"
                    className="w-full rounded-xl border border-emerald-900/10 bg-white px-4 py-3 text-gray-950 outline-none transition-all placeholder:text-gray-400 focus:border-emerald-700/40 focus:ring-4 focus:ring-emerald-700/10"
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Describe what you need help with in detail..."
                    className="w-full resize-none rounded-xl border border-emerald-900/10 bg-white px-4 py-3 text-gray-950 outline-none transition-all placeholder:text-gray-400 focus:border-emerald-700/40 focus:ring-4 focus:ring-emerald-700/10"
                    rows="5"
                    required
                  />
                </div>
              </div>
            </section>

            <section className="border-b border-emerald-900/10 p-6 sm:p-8">
              <div className="mb-5">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-950">
                  <Coins size={19} className="text-emerald-700" aria-hidden="true" />
                  Compensation
                </h2>
                <p className="mt-1 text-sm text-gray-600">Choose how this gig will reward the person who completes it.</p>
              </div>

              <div className="space-y-5">
                {/* Type Selection */}
                <div>
                  <label className="mb-3 block text-sm font-semibold text-gray-700">
                    Compensation Type
                  </label>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <label className={`flex cursor-pointer items-center justify-center gap-3 rounded-xl border p-4 transition-all ${
                      formData.type === 'paid' 
                        ? 'border-emerald-700/35 bg-emerald-50 shadow-[0_10px_24px_rgba(6,78,59,0.08)]' 
                        : 'border-emerald-900/10 bg-white hover:-translate-y-0.5 hover:border-emerald-700/25 hover:bg-emerald-50'
                    }`}>
                      <input
                        type="radio"
                        name="type"
                        value="paid"
                        checked={formData.type === 'paid'}
                        onChange={handleChange}
                        className="h-4 w-4 text-emerald-600 focus:ring-emerald-700"
                      />
                      <div className="flex items-center gap-2 font-semibold text-gray-800">
                        <IndianRupee size={18} className="text-emerald-700" aria-hidden="true" />
                        <span>Paid (₹)</span>
                      </div>
                    </label>
                    <label className={`flex cursor-pointer items-center justify-center gap-3 rounded-xl border p-4 transition-all ${
                      formData.type === 'barter' 
                        ? 'border-emerald-700/35 bg-emerald-50 shadow-[0_10px_24px_rgba(6,78,59,0.08)]' 
                        : 'border-emerald-900/10 bg-white hover:-translate-y-0.5 hover:border-emerald-700/25 hover:bg-emerald-50'
                    }`}>
                      <input
                        type="radio"
                        name="type"
                        value="barter"
                        checked={formData.type === 'barter'}
                        onChange={handleChange}
                        className="h-4 w-4 text-emerald-600 focus:ring-emerald-700"
                      />
                      <div className="flex items-center gap-2 font-semibold text-gray-800">
                        <RefreshCw size={18} className="text-emerald-700" aria-hidden="true" />
                        <span>Barter (Credits)</span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Price/Credits Input */}
                {formData.type === 'paid' ? (
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                      Price (₹)
                    </label>
                    <div className="relative">
                      <IndianRupee className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={17} aria-hidden="true" />
                      <input
                        type="number"
                        name="price"
                        value={formData.price}
                        onChange={handleChange}
                        placeholder="500"
                        className="w-full rounded-xl border border-emerald-900/10 bg-white py-3 pl-10 pr-4 text-gray-950 outline-none transition-all placeholder:text-gray-400 focus:border-emerald-700/40 focus:ring-4 focus:ring-emerald-700/10"
                        required
                        min="1"
                      />
                    </div>
                    <p className="mt-1.5 text-xs font-medium text-gray-500">Enter the amount you're willing to pay</p>
                  </div>
                ) : (
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                      Credits
                    </label>
                    <input
                      type="number"
                      name="credits"
                      value={formData.credits}
                      onChange={handleChange}
                      placeholder="50"
                      className="w-full rounded-xl border border-emerald-900/10 bg-white px-4 py-3 text-gray-950 outline-none transition-all placeholder:text-gray-400 focus:border-emerald-700/40 focus:ring-4 focus:ring-emerald-700/10"
                      required
                      min="1"
                    />
                    <p className="mt-1.5 text-xs font-medium text-gray-500">Enter the credits you're offering for this gig</p>
                  </div>
                )}
              </div>
            </section>

            <section className="border-b border-emerald-900/10 p-6 sm:p-8">
              <div className="mb-5">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-950">
                  <Tags size={19} className="text-emerald-700" aria-hidden="true" />
                  Requirements
                </h2>
                <p className="mt-1 text-sm text-gray-600">Add the skills and timing needed to complete the gig.</p>
              </div>

              <div className="space-y-5">
                {/* Skills Required */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Skills Required
                  </label>
                  <input
                    type="text"
                    name="skillsRequired"
                    value={formData.skillsRequired}
                    onChange={handleChange}
                    placeholder="React, JavaScript, CSS, UI Design"
                    className="w-full rounded-xl border border-emerald-900/10 bg-white px-4 py-3 text-gray-950 outline-none transition-all placeholder:text-gray-400 focus:border-emerald-700/40 focus:ring-4 focus:ring-emerald-700/10"
                    required
                  />
                  <p className="mt-1.5 text-xs font-medium text-gray-500">Separate skills with commas</p>
                </div>

                {/* Deadline */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Deadline <span className="font-normal text-gray-400">(Optional)</span>
                  </label>
                  <div className="relative">
                    <CalendarDays className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={17} aria-hidden="true" />
                    <input
                      type="date"
                      name="deadline"
                      value={formData.deadline}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-emerald-900/10 bg-white py-3 pl-10 pr-4 text-gray-950 outline-none transition-all focus:border-emerald-700/40 focus:ring-4 focus:ring-emerald-700/10"
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Submit Buttons */}
            <div className="flex flex-col gap-3 bg-gray-50 p-6 sm:flex-row sm:p-8">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex flex-1 items-center justify-center rounded-lg bg-emerald-700 py-3 font-semibold text-white shadow-[0_12px_30px_rgba(6,78,59,0.16)] transition-all hover:-translate-y-0.5 hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="-ml-1 mr-3 h-5 w-5 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Posting...
                  </span>
                ) : (
                  <span className="inline-flex items-center justify-center gap-2">
                    <Send size={17} aria-hidden="true" />
                    Post Gig
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => navigate('/gigs')}
                className="rounded-lg border border-gray-300 bg-white px-8 py-3 font-semibold text-gray-700 transition-all hover:-translate-y-0.5 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>

        {/* Help Section */}
        <div className="mt-8 rounded-xl border border-emerald-700/20 bg-emerald-50 p-6 shadow-[0_12px_30px_rgba(6,78,59,0.06)]">
          <h3 className="mb-3 flex items-center gap-2 font-semibold text-emerald-950">
            <Lightbulb size={18} className="text-emerald-700" aria-hidden="true" />
            Tips for posting a great gig
          </h3>
          <ul className="space-y-2 text-sm text-emerald-900">
            <li className="flex items-start gap-2">
              <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-700"></span>
              <span>Write a clear, specific title that describes what you need</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-700"></span>
              <span>Include all relevant details in the description</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-700"></span>
              <span>List all required skills to attract the right candidates</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-700"></span>
              <span>Set a realistic deadline and fair compensation</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PostGig;
