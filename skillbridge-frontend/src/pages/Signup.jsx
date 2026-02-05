import { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Signup = () => {
  const navigate = useNavigate();
  const { signup } = useContext(AuthContext);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    college: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signup(formData);
      alert('Account created! Please login.');
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-4">
      <div className="w-full max-w-md border-4 border-black shadow-brutal p-8">
        <h1 className="text-4xl font-bold mb-2">Sign Up</h1>
        <p className="mb-6">Create your SkillBridge account</p>

        {error && (
          <div className="bg-red-100 border-3 border-red-600 p-3 mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-bold mb-2">Full Name</label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              className="w-full border-3 border-black p-3"
              required
            />
          </div>

          <div>
            <label className="block font-bold mb-2">College Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@university.edu"
              className="w-full border-3 border-black p-3"
              required
            />
          </div>

          <div>
            <label className="block font-bold mb-2">College Name</label>
            <input
              type="text"
              name="college"
              value={formData.college}
              onChange={handleChange}
              className="w-full border-3 border-black p-3"
              required
            />
          </div>

          <div>
            <label className="block font-bold mb-2">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full border-3 border-black p-3"
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white border-3 border-black p-3 font-bold hover:bg-white hover:text-black transition-colors disabled:opacity-50"
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <p className="mt-6 text-center">
          Already have an account?{' '}
          <Link to="/login" className="font-bold underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;