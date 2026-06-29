import { useState, useEffect, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <Navbar />

      <div className="max-w-2xl mx-auto px-6 py-12">
        {/* Back Button */}
        <Link
          to="/profile"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors mb-6"
        >
          ← Back to Profile
        </Link>

        {/* Form Card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-light mb-2">Edit Profile</h1>
            <p className="text-gray-600">Update your information and showcase your skills</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {avatarMessage && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-6">
              <p className="text-emerald-700 text-sm">{avatarMessage}</p>
            </div>
          )}

          <div className="mb-8 flex flex-col items-center gap-3 border-b border-gray-200 pb-8">
            <div className="relative">
              <Avatar
                profile={{ ...profile, avatar_url: avatarPreview }}
                size="xl"
                className="border-4 border-white shadow-lg"
              />
              <label className="absolute bottom-2 right-2 cursor-pointer rounded-full bg-emerald-700 px-4 py-2 text-xs font-medium text-white shadow-md transition-colors hover:bg-emerald-800">
                {uploadingAvatar ? 'Uploading...' : 'Change Photo'}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  disabled={uploadingAvatar}
                  className="sr-only"
                />
              </label>
            </div>
            <p className="text-sm text-gray-600">Upload a clear profile photo.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Availability */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Availability
              </label>
              <select
                name="availability_status"
                value={formData.availability_status}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              >
                <option value="available">Available</option>
                <option value="busy">Busy</option>
                <option value="unavailable">Not Available</option>
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              >
                <option value="">Select Category</option>
                {categories.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            {/* Skills */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Skills
              </label>
              <input
                type="text"
                name="skills"
                value={formData.skills}
                onChange={handleChange}
                placeholder="React, Python, UI Design, Content Writing"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              />
              <p className="text-xs text-gray-500 mt-1">Separate skills with commas</p>
            </div>

            {/* Year */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Academic Year
              </label>
              <select
                name="year"
                value={formData.year}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              >
                <option value="">Select Year</option>
                <option value="1">1st Year</option>
                <option value="2">2nd Year</option>
                <option value="3">3rd Year</option>
                <option value="4">4th Year</option>
              </select>
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                type="text"
                name="phone_number"
                value={formData.phone_number}
                onChange={(event) => {
                  const value = event.target.value.replace(/\D/g, '').slice(0, 15);
                  setFormData({ ...formData, phone_number: value });
                }}
                placeholder="Optional"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              />
              <p className="text-xs text-gray-500 mt-1">Only visible to you and people you have active gigs with</p>
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bio
              </label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                placeholder="Tell others about yourself, your interests, and what you're working on..."
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all resize-none"
                rows="5"
              />
              <p className="text-xs text-gray-500 mt-1">
                A good bio helps others understand your background and expertise
              </p>
            </div>

            {/* Portfolio Links */}
            <div>
              <div className="flex items-center justify-between gap-4 mb-3">
                <label className="block text-sm font-medium text-gray-700">
                  Portfolio Links
                </label>
                <button
                  type="button"
                  onClick={addPortfolioLink}
                  className="text-sm text-emerald-700 hover:text-emerald-800 transition-colors"
                >
                  Add Link
                </button>
              </div>

              {formData.portfolio_links.length === 0 ? (
                <div className="border border-dashed border-gray-300 rounded-lg p-4 text-sm text-gray-500">
                  Add GitHub, Behance, portfolio, or project links.
                </div>
              ) : (
                <div className="space-y-3">
                  {formData.portfolio_links.map((link, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-[1fr_1.5fr_auto] gap-3">
                      <input
                        type="text"
                        value={link.title}
                        onChange={(event) => handlePortfolioChange(index, 'title', event.target.value)}
                        placeholder="Title"
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                      />
                      <input
                        type="url"
                        value={link.url}
                        onChange={(event) => handlePortfolioChange(index, 'url', event.target.value)}
                        placeholder="https://example.com"
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => removePortfolioLink(index)}
                        className="border border-gray-300 px-4 py-3 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        X
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Social Links */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Social Links
              </label>
              <div className="space-y-3">
                <input
                  type="url"
                  value={formData.social_links.linkedin}
                  onChange={(event) => handleSocialChange('linkedin', event.target.value)}
                  placeholder="LinkedIn URL"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
                <input
                  type="url"
                  value={formData.social_links.github}
                  onChange={(event) => handleSocialChange('github', event.target.value)}
                  placeholder="GitHub URL"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
                <input
                  type="url"
                  value={formData.social_links.instagram}
                  onChange={(event) => handleSocialChange('instagram', event.target.value)}
                  placeholder="Instagram URL"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-emerald-700 text-white rounded-lg py-3 font-medium hover:bg-emerald-800 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {saving ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving Changes...
                  </span>
                ) : (
                  'Save Changes'
                )}
              </button>
              <button
                type="button"
                onClick={() => navigate('/profile')}
                className="px-8 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>

        {/* Help Section */}
        <div className="mt-8 bg-emerald-50 rounded-xl border border-emerald-200 p-6">
          <h3 className="font-medium text-emerald-900 mb-2 flex items-center gap-2">
            <span>💡</span> Profile Tips
          </h3>
          <ul className="space-y-2 text-sm text-emerald-800">
            <li className="flex items-start gap-2">
              <span className="text-emerald-600 mt-0.5">•</span>
              <span>Add specific skills to help others find you for relevant gigs</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-600 mt-0.5">•</span>
              <span>Write a bio that highlights your strengths and interests</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-600 mt-0.5">•</span>
              <span>Keep your year updated to reflect your current academic standing</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-600 mt-0.5">•</span>
              <span>A complete profile builds trust and increases your chances of being hired</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ProfileEdit;
