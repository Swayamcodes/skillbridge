import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';

const PostGig = () => {
  const navigate = useNavigate();
  const { profile } = useContext(AuthContext);
  
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
      alert('Gig posted successfully!');
      navigate('/gigs');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to post gig');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-3xl mx-auto">
        <div className="border-4 border-black shadow-brutal p-8">
          <h1 className="text-4xl font-bold mb-2">Post a Gig</h1>
          <p className="mb-6">Create a new opportunity</p>

          {error && (
            <div className="bg-red-100 border-3 border-red-600 p-3 mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block font-bold mb-2">Title</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g., Need React Developer for Portfolio Site"
                className="w-full border-3 border-black p-3"
                required
              />
            </div>

            <div>
              <label className="block font-bold mb-2">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe what you need help with..."
                className="w-full border-3 border-black p-3 h-32"
                required
              />
            </div>

            <div>
              <label className="block font-bold mb-2">Type</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="type"
                    value="paid"
                    checked={formData.type === 'paid'}
                    onChange={handleChange}
                    className="w-5 h-5"
                  />
                  <span className="font-bold">Paid (₹)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="type"
                    value="barter"
                    checked={formData.type === 'barter'}
                    onChange={handleChange}
                    className="w-5 h-5"
                  />
                  <span className="font-bold">Barter (Credits)</span>
                </label>
              </div>
            </div>

            {formData.type === 'paid' ? (
              <div>
                <label className="block font-bold mb-2">Price (₹)</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="500"
                  className="w-full border-3 border-black p-3"
                  required
                  min="1"
                />
              </div>
            ) : (
              <div>
                <label className="block font-bold mb-2">Credits</label>
                <input
                  type="number"
                  name="credits"
                  value={formData.credits}
                  onChange={handleChange}
                  placeholder="50"
                  className="w-full border-3 border-black p-3"
                  required
                  min="1"
                />
              </div>
            )}

            <div>
              <label className="block font-bold mb-2">Skills Required (comma separated)</label>
              <input
                type="text"
                name="skillsRequired"
                value={formData.skillsRequired}
                onChange={handleChange}
                placeholder="React, JavaScript, CSS"
                className="w-full border-3 border-black p-3"
                required
              />
            </div>

            <div>
              <label className="block font-bold mb-2">Deadline (Optional)</label>
              <input
                type="date"
                name="deadline"
                value={formData.deadline}
                onChange={handleChange}
                className="w-full border-3 border-black p-3"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-black text-white border-3 border-black p-3 font-bold hover:bg-white hover:text-black transition-colors"
              >
                {loading ? 'Posting...' : 'Post Gig'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/')}
                className="border-3 border-black px-6 py-3 font-bold hover:bg-black hover:text-white"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PostGig;