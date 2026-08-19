import { useState, useEffect, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  BriefcaseBusiness,
  Camera,
  CheckCircle2,
  Clock,
  GraduationCap,
  Lightbulb,
  Link as LinkIcon,
  Phone,
  Plus,
  Save,
  Share2,
  Sparkles,
  Trash2,
  UserRound,
  X,
} from 'lucide-react';
import { AuthContext } from '../context/auth';
import Avatar from '../components/Avatar';
import Navbar from '../components/Navbar';
import api from '../services/api';

const categories = [
  'Web Development',
  'Design',
  'Tutoring',
  'Content Writing',
  'Mobile Development',
  'Data Science',
  'Other'
];

const ProfileEdit = () => {
  const navigate = useNavigate();
  const { profile: authProfile, refreshProfile } = useContext(AuthContext);
  
  const [formData, setFormData] = useState({
    skills: '',
    bio: '',
    year: '',
    availability_status: 'available',
    category: '',
    portfolio_links: [],
    social_links: {
      linkedin: '',
      github: '',
      instagram: ''
    },
    phone_number: ''
  });
  const [profile, setProfile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarMessage, setAvatarMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get(`/api/profiles/${authProfile.id}`);
      const profile = response.data.profile;
      setProfile(profile);
      setAvatarPreview(profile.avatar_url || '');
      setFormData({
        skills: profile.skills ? profile.skills.join(', ') : '',
        bio: profile.bio || '',
        year: profile.year || '',
        availability_status: profile.availability_status || 'available',
        category: profile.category || '',
        portfolio_links: Array.isArray(profile.portfolio_links) ? profile.portfolio_links : [],
        social_links: {
          linkedin: profile.social_links?.linkedin || '',
          github: profile.social_links?.github || '',
          instagram: profile.social_links?.instagram || ''
        },
        phone_number: profile.phone_number || ''
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePortfolioChange = (index, field, value) => {
    setFormData((currentData) => ({
      ...currentData,
      portfolio_links: currentData.portfolio_links.map((link, linkIndex) => (
        linkIndex === index ? { ...link, [field]: value } : link
      ))
    }));
  };

  const addPortfolioLink = () => {
    setFormData((currentData) => ({
      ...currentData,
      portfolio_links: [...currentData.portfolio_links, { title: '', url: '' }]
    }));
  };

  const removePortfolioLink = (index) => {
    setFormData((currentData) => ({
      ...currentData,
      portfolio_links: currentData.portfolio_links.filter((_, linkIndex) => linkIndex !== index)
    }));
  };

  const handleSocialChange = (field, value) => {
    setFormData((currentData) => ({
      ...currentData,
      social_links: {
        ...currentData.social_links,
        [field]: value
      }
    }));
  };

  const handleAvatarChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    setAvatarMessage('');
    setError('');

    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);

    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await api.post('/api/profiles/upload-avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      const avatarUrl = response.data.avatar_url;
      setAvatarPreview(avatarUrl);
      setProfile((currentProfile) => ({ ...currentProfile, avatar_url: avatarUrl }));
      setAvatarMessage('Profile photo updated successfully.');
      refreshProfile?.();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload profile photo');
      setAvatarPreview(profile?.avatar_url || '');
    } finally {
      URL.revokeObjectURL(previewUrl);
      setUploadingAvatar(false);
      event.target.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const skillsArray = formData.skills.split(',').map(s => s.trim()).filter(s => s);
      const cleanedPortfolioLinks = formData.portfolio_links
        .map((link) => ({
          title: link.title.trim(),
          url: link.url.trim()
        }))
        .filter((link) => link.title && link.url);

      if (formData.phone_number && !/^[0-9]{7,15}$/.test(formData.phone_number)) {
        setError('Phone number must contain 7 to 15 digits only');
        setSaving(false);
        return;
      }
      
      await api.put(`/api/profiles/${authProfile.id}`, {
        skills: skillsArray,
        bio: formData.bio,
        year: formData.year ? parseInt(formData.year) : null,
        availability_status: formData.availability_status,
        category: formData.category,
        portfolio_links: cleanedPortfolioLinks,
        social_links: {
          linkedin: formData.social_links.linkedin.trim(),
          github: formData.social_links.github.trim(),
          instagram: formData.social_links.instagram.trim()
        },
        phone_number: formData.phone_number.trim()
      });

      navigate('/profile', { state: { message: 'Profile updated successfully!' } });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F7F8F4]">
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-emerald-900/10 bg-white px-10 py-9 text-center shadow-[0_20px_56px_rgba(16,24,40,0.08)]">
          <div className="h-12 w-12 rounded-full border-4 border-emerald-700 border-t-transparent animate-spin"></div>
          <p className="font-medium text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F8F4]">
      <Navbar />

      <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 sm:py-7 lg:py-8">
        <Link
          to="/profile"
          className="mb-4 inline-flex items-center gap-2 px-1 py-2 text-sm font-medium text-emerald-700 transition-all hover:translate-x-1 hover:text-emerald-900"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Back to Profile
        </Link>

        <div className="mb-6 overflow-hidden rounded-2xl border border-emerald-900/10 bg-white shadow-[0_20px_56px_rgba(16,24,40,0.08)]">
          <div className="relative overflow-hidden bg-gradient-to-r from-emerald-700 via-emerald-800 to-emerald-950 px-6 py-8 text-white sm:px-8">
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.16]"
              style={{
                backgroundImage: `linear-gradient(rgba(255,255,255,0.35) 1px, transparent 1px),
                                  linear-gradient(90deg, rgba(255,255,255,0.35) 1px, transparent 1px)`,
                backgroundSize: '64px 64px',
              }}
            />
            <div className="relative max-w-3xl">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-100/80">
                Profile management
              </p>
              <h1 className="text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">Edit your creator profile</h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-emerald-50/80">
                Keep your details polished, current, and ready for every SkillBridge collaboration.
              </p>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            {error && (
              <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {error}
              </div>
            )}

            {avatarMessage && (
              <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                {avatarMessage}
              </div>
            )}

            <div className="mb-8 rounded-2xl border border-emerald-900/10 bg-[#F7F8F4] p-5">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                <div className="relative w-fit">
                  <Avatar
                    profile={{ ...profile, avatar_url: avatarPreview }}
                    size="xl"
                    className="border-4 border-white shadow-[0_18px_45px_rgba(16,24,40,0.18)] ring-4 ring-white/70"
                  />
                  <label className="absolute bottom-2 right-2 inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl bg-emerald-700 text-white shadow-[0_12px_30px_rgba(6,78,59,0.2)] transition-all hover:-translate-y-0.5 hover:bg-emerald-800">
                    {uploadingAvatar ? (
                      <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    ) : (
                      <Camera size={17} aria-hidden="true" />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      disabled={uploadingAvatar}
                      className="sr-only"
                    />
                  </label>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Profile photo</p>
                  <h2 className="mt-1 text-2xl font-semibold tracking-tight text-gray-950">Make a strong first impression</h2>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-gray-600">
                    Upload a clear profile photo that helps collaborators recognize you.
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <section className="rounded-2xl border border-emerald-900/10 bg-white p-5 shadow-[0_12px_30px_rgba(16,24,40,0.05)] sm:p-6">
                <div className="mb-5 flex items-center gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
                    <UserRound size={19} aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Personal Information</p>
                    <h2 className="text-xl font-semibold tracking-tight text-gray-950">Core profile details</h2>
                  </div>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-800">Academic Year</label>
                    <select
                      name="year"
                      value={formData.year}
                      onChange={handleChange}
                      className="min-h-12 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 transition-all focus:border-emerald-600 focus:outline-none focus:ring-4 focus:ring-emerald-100"
                    >
                      <option value="">Select Year</option>
                      <option value="1">1st Year</option>
                      <option value="2">2nd Year</option>
                      <option value="3">3rd Year</option>
                      <option value="4">4th Year</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-800">Phone Number</label>
                    <div className="relative">
                      <Phone size={17} aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        name="phone_number"
                        value={formData.phone_number}
                        onChange={(event) => {
                          const value = event.target.value.replace(/\D/g, '').slice(0, 15);
                          setFormData({ ...formData, phone_number: value });
                        }}
                        placeholder="Optional"
                        className="min-h-12 w-full rounded-xl border border-gray-300 bg-white py-3 pl-11 pr-4 text-gray-900 transition-all placeholder:text-gray-400 focus:border-emerald-600 focus:outline-none focus:ring-4 focus:ring-emerald-100"
                      />
                    </div>
                    <p className="mt-2 text-xs text-gray-500">Only visible to you and people you have active gigs with</p>
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-emerald-900/10 bg-white p-5 shadow-[0_12px_30px_rgba(16,24,40,0.05)] sm:p-6">
                <div className="mb-5 flex items-center gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
                    <BriefcaseBusiness size={19} aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Professional Information</p>
                    <h2 className="text-xl font-semibold tracking-tight text-gray-950">How you want to be discovered</h2>
                  </div>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-800">Category</label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      className="min-h-12 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 transition-all focus:border-emerald-600 focus:outline-none focus:ring-4 focus:ring-emerald-100"
                    >
                      <option value="">Select Category</option>
                      {categories.map((category) => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-800">Availability</label>
                    <select
                      name="availability_status"
                      value={formData.availability_status}
                      onChange={handleChange}
                      className="min-h-12 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 transition-all focus:border-emerald-600 focus:outline-none focus:ring-4 focus:ring-emerald-100"
                    >
                      <option value="available">Available</option>
                      <option value="busy">Busy</option>
                      <option value="unavailable">Not Available</option>
                    </select>
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-emerald-900/10 bg-white p-5 shadow-[0_12px_30px_rgba(16,24,40,0.05)] sm:p-6">
                <div className="mb-5 flex items-center gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
                    <Sparkles size={19} aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Skills</p>
                    <h2 className="text-xl font-semibold tracking-tight text-gray-950">What you can help with</h2>
                  </div>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-800">Skills</label>
                    <input
                      type="text"
                      name="skills"
                      value={formData.skills}
                      onChange={handleChange}
                      placeholder="React, Python, UI Design, Content Writing"
                      className="min-h-12 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 transition-all placeholder:text-gray-400 focus:border-emerald-600 focus:outline-none focus:ring-4 focus:ring-emerald-100"
                    />
                    <p className="mt-2 text-xs text-gray-500">Separate skills with commas</p>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-800">Bio</label>
                    <textarea
                      name="bio"
                      value={formData.bio}
                      onChange={handleChange}
                      placeholder="Tell others about yourself, your interests, and what you're working on..."
                      className="min-h-36 w-full resize-none rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 transition-all placeholder:text-gray-400 focus:border-emerald-600 focus:outline-none focus:ring-4 focus:ring-emerald-100"
                      rows="5"
                    />
                    <p className="mt-2 text-xs text-gray-500">
                      A good bio helps others understand your background and expertise
                    </p>
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-emerald-900/10 bg-white p-5 shadow-[0_12px_30px_rgba(16,24,40,0.05)] sm:p-6">
                <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
                      <LinkIcon size={19} aria-hidden="true" />
                    </span>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Portfolio</p>
                      <h2 className="text-xl font-semibold tracking-tight text-gray-950">Show your work</h2>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={addPortfolioLink}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-700/20 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800 transition-all hover:-translate-y-0.5 hover:bg-emerald-100"
                  >
                    <Plus size={16} aria-hidden="true" />
                    Add Link
                  </button>
                </div>

                {formData.portfolio_links.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-emerald-900/20 bg-emerald-50/50 p-5 text-sm text-gray-600">
                    Add GitHub, Behance, portfolio, or project links.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {formData.portfolio_links.map((link, index) => (
                      <div key={index} className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_1.5fr_auto]">
                        <input
                          type="text"
                          value={link.title}
                          onChange={(event) => handlePortfolioChange(index, 'title', event.target.value)}
                          placeholder="Title"
                          className="min-h-12 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 transition-all placeholder:text-gray-400 focus:border-emerald-600 focus:outline-none focus:ring-4 focus:ring-emerald-100"
                        />
                        <input
                          type="url"
                          value={link.url}
                          onChange={(event) => handlePortfolioChange(index, 'url', event.target.value)}
                          placeholder="https://example.com"
                          className="min-h-12 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 transition-all placeholder:text-gray-400 focus:border-emerald-600 focus:outline-none focus:ring-4 focus:ring-emerald-100"
                        />
                        <button
                          type="button"
                          onClick={() => removePortfolioLink(index)}
                          className="inline-flex min-h-12 items-center justify-center rounded-xl border border-gray-300 px-4 py-3 font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                        >
                          <Trash2 size={17} aria-hidden="true" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="rounded-2xl border border-emerald-900/10 bg-white p-5 shadow-[0_12px_30px_rgba(16,24,40,0.05)] sm:p-6">
                <div className="mb-5 flex items-center gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
                    <Share2 size={19} aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Social Links</p>
                    <h2 className="text-xl font-semibold tracking-tight text-gray-950">Connect your public profiles</h2>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  <input
                    type="url"
                    value={formData.social_links.linkedin}
                    onChange={(event) => handleSocialChange('linkedin', event.target.value)}
                    placeholder="LinkedIn URL"
                    className="min-h-12 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 transition-all placeholder:text-gray-400 focus:border-emerald-600 focus:outline-none focus:ring-4 focus:ring-emerald-100"
                  />
                  <input
                    type="url"
                    value={formData.social_links.github}
                    onChange={(event) => handleSocialChange('github', event.target.value)}
                    placeholder="GitHub URL"
                    className="min-h-12 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 transition-all placeholder:text-gray-400 focus:border-emerald-600 focus:outline-none focus:ring-4 focus:ring-emerald-100"
                  />
                  <input
                    type="url"
                    value={formData.social_links.instagram}
                    onChange={(event) => handleSocialChange('instagram', event.target.value)}
                    placeholder="Instagram URL"
                    className="min-h-12 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 transition-all placeholder:text-gray-400 focus:border-emerald-600 focus:outline-none focus:ring-4 focus:ring-emerald-100"
                  />
                </div>
              </section>

              <div className="flex flex-col justify-between gap-3 pt-2 sm:flex-row">
                <button
                  type="button"
                  onClick={() => navigate('/profile')}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-8 py-3.5 font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                >
                  <X size={18} aria-hidden="true" />
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-8 py-3.5 font-semibold text-white shadow-[0_12px_30px_rgba(6,78,59,0.16)] transition-all hover:-translate-y-0.5 hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                >
                  {saving ? (
                    <>
                      <span className="h-5 w-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      Saving Changes...
                    </>
                  ) : (
                    <>
                      <Save size={18} aria-hidden="true" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-emerald-900/10 bg-emerald-50/70 p-6 shadow-[0_12px_30px_rgba(16,24,40,0.04)]">
          <h3 className="mb-3 flex items-center gap-2 font-semibold text-emerald-950">
            <Lightbulb size={18} aria-hidden="true" />
            Profile Tips
          </h3>
          <ul className="grid gap-3 text-sm text-emerald-900 sm:grid-cols-2">
            <li className="flex items-start gap-2">
              <CheckCircle2 size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-emerald-700" />
              <span>Add specific skills to help others find you for relevant gigs</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-emerald-700" />
              <span>Write a bio that highlights your strengths and interests</span>
            </li>
            <li className="flex items-start gap-2">
              <GraduationCap size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-emerald-700" />
              <span>Keep your year updated to reflect your current academic standing</span>
            </li>
            <li className="flex items-start gap-2">
              <Clock size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-emerald-700" />
              <span>A complete profile builds trust and increases your chances of being hired</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ProfileEdit;
