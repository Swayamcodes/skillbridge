import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/auth';
import api from '../services/api';

const ProfileSetup = () => {
  const navigate = useNavigate();
  const { profile } = useContext(AuthContext);
  
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

      alert('Profile updated!');
      navigate('/profile');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-2xl mx-auto">
        <div className="border-4 border-black shadow-brutal p-8">
          <h1 className="text-4xl font-bold mb-2">Complete Your Profile</h1>
          <p className="mb-6">Add your skills and info</p>

          {error && (
            <div className="bg-red-100 border-3 border-red-600 p-3 mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block font-bold mb-2">Skills (comma separated)</label>
              <input
                type="text"
                name="skills"
                value={formData.skills}
                onChange={handleChange}
                placeholder="React, Python, Design, Writing"
                className="w-full border-3 border-black p-3"
                required
              />
              <p className="text-sm mt-1">Separate skills with commas</p>
            </div>

            <div>
              <label className="block font-bold mb-2">Year</label>
              <select
                name="year"
                value={formData.year}
                onChange={handleChange}
                className="w-full border-3 border-black p-3"
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
              <label className="block font-bold mb-2">Bio</label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                placeholder="Tell others about yourself..."
                className="w-full border-3 border-black p-3 h-32"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white border-3 border-black p-3 font-bold hover:bg-white hover:text-black transition-colors"
            >
              {loading ? 'Saving...' : 'Save Profile'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfileSetup;
