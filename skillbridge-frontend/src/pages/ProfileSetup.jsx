import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, GraduationCap, Sparkles } from 'lucide-react';
import { AuthContext } from '../context/auth';
import Navbar from '../components/Navbar';
import api from '../services/api';

const ProfileSetup = () => {
  const navigate = useNavigate();
  const { profile, refreshProfile } = useContext(AuthContext);
  
  const [formData, setFormData] = useState({
    skills: '',
    bio: '',
    year: ''
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
      const skillsArray = formData.skills.split(',').map(s => s.trim()).filter(s => s);
      
      await api.put(`/api/profiles/${profile.id}`, {
        skills: skillsArray,
        bio: formData.bio,
        year: parseInt(formData.year)
      });

      await refreshProfile?.();
      alert('Profile updated!');
      navigate('/profile');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F8F4]">
      <Navbar />

      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:py-10">
        <div className="mb-7">
          <div className="mb-5 inline-flex items-center gap-2 rounded-xl border border-emerald-900/10 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700 shadow-sm">
            <GraduationCap size={15} aria-hidden="true" />
            Profile onboarding
          </div>
          <h1 className="max-w-3xl text-4xl font-semibold leading-tight tracking-tight text-gray-950 sm:text-5xl">
            Complete your SkillBridge profile.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-gray-600">
            Add the skills, academic year, and introduction that help others understand how they can collaborate with you.
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-emerald-900/10 bg-white shadow-[0_20px_56px_rgba(16,24,40,0.08)]">
          <div className="border-b border-emerald-900/10 bg-gradient-to-r from-emerald-700 via-emerald-800 to-emerald-950 px-6 py-6 text-white sm:px-8">
            <div className="flex items-start gap-4">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 text-white ring-1 ring-white/20">
                <Sparkles size={21} aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-2xl font-semibold tracking-tight">Start with the essentials</h2>
                <p className="mt-1 text-sm leading-6 text-emerald-50/80">
                  These details shape how your profile appears across SkillBridge.
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            {error && (
              <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-800">Skills (comma separated)</label>
                <input
                  type="text"
                  name="skills"
                  value={formData.skills}
                  onChange={handleChange}
                  placeholder="React, Python, Design, Writing"
                  className="min-h-12 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 transition-all placeholder:text-gray-400 focus:border-emerald-600 focus:outline-none focus:ring-4 focus:ring-emerald-100"
                  required
                />
                <p className="mt-2 text-sm text-gray-500">Separate skills with commas</p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-800">Year</label>
                <select
                  name="year"
                  value={formData.year}
                  onChange={handleChange}
                  className="min-h-12 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 transition-all focus:border-emerald-600 focus:outline-none focus:ring-4 focus:ring-emerald-100"
                  required
                >
                  <option value="">Select Year</option>
                  <option value="1">1st Year</option>
                  <option value="2">2nd Year</option>
                  <option value="3">3rd Year</option>
                  <option value="4">4th Year</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-800">Bio</label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  placeholder="Tell others about yourself..."
                  className="min-h-36 w-full resize-none rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 transition-all placeholder:text-gray-400 focus:border-emerald-600 focus:outline-none focus:ring-4 focus:ring-emerald-100"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-6 py-3.5 font-semibold text-white shadow-[0_12px_30px_rgba(6,78,59,0.16)] transition-all hover:-translate-y-0.5 hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
              >
                <CheckCircle2 size={18} aria-hidden="true" />
                {loading ? 'Saving...' : 'Save Profile'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSetup;
