import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';

const GigDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useContext(AuthContext);
  
  const [gig, setGig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [applicationMessage, setApplicationMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchGig();
  }, [id]);

  const fetchGig = async () => {
    try {
      const response = await api.get(`/api/gigs/${id}`);
      setGig(response.data.gig);
    } catch (error) {
      console.error('Error fetching gig:', error);
      setError('Gig not found');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (e) => {
    e.preventDefault();
    setApplying(true);
    setError('');

    try {
      await api.post(`/api/gigs/${id}/apply`, {
        message: applicationMessage
      });
      alert('Application submitted successfully!');
      navigate('/gigs');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to apply');
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (error && !gig) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="border-4 border-black p-8">
          <p className="text-xl mb-4">{error}</p>
          <Link to="/gigs" className="font-bold underline">← Back to Gigs</Link>
        </div>
      </div>
    );
  }

  const isCreator = gig?.creator?.id === profile?.id;

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="border-4 border-black shadow-brutal p-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-4xl font-bold mb-2">{gig.title}</h1>
              <p className="text-lg">
                Posted by{' '}
                <span className="font-bold">{gig.creator?.full_name}</span> from {gig.creator?.college}
              </p>
            </div>
            <div>
              {gig.type === 'paid' ? (
                <div className="bg-black text-white px-6 py-3 font-bold text-2xl">
                  ₹{gig.price}
                </div>
              ) : (
                <div className="border-4 border-black px-6 py-3 font-bold text-2xl">
                  {gig.credits} Credits
                </div>
              )}
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-bold mb-2">Description</h2>
            <p className="whitespace-pre-wrap">{gig.description}</p>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-bold mb-2">Skills Required</h2>
            <div className="flex flex-wrap gap-2">
              {gig.skills_required?.map((skill, index) => (
                <span
                  key={index}
                  className="border-3 border-black px-4 py-2 font-bold"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {gig.deadline && (
            <div className="mb-6">
              <h2 className="text-xl font-bold mb-2">Deadline</h2>
              <p>{new Date(gig.deadline).toLocaleDateString()}</p>
            </div>
          )}

          <div className="mb-6">
            <h2 className="text-xl font-bold mb-2">Status</h2>
            <span className="border-3 border-black px-4 py-2 font-bold uppercase">
              {gig.status}
            </span>
          </div>

          {!isCreator && gig.status === 'open' && (
            <div className="border-t-4 border-black pt-6">
              <h2 className="text-xl font-bold mb-4">Apply for this Gig</h2>
              
              {error && (
                <div className="bg-red-100 border-3 border-red-600 p-3 mb-4">
                  {error}
                </div>
              )}

              <form onSubmit={handleApply}>
                <div className="mb-4">
                  <label className="block font-bold mb-2">Your Message</label>
                  <textarea
                    value={applicationMessage}
                    onChange={(e) => setApplicationMessage(e.target.value)}
                    placeholder="Explain why you're a good fit..."
                    className="w-full border-3 border-black p-3 h-32"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={applying}
                  className="bg-black text-white border-3 border-black px-8 py-3 font-bold hover:bg-white hover:text-black transition-colors"
                >
                  {applying ? 'Applying...' : 'Submit Application'}
                </button>
              </form>
            </div>
          )}

          {isCreator && (
            <div className="bg-yellow-100 border-3 border-black p-4">
              <p className="font-bold">This is your gig</p>
              <p className="text-sm">You'll receive applications from interested students</p>
            </div>
          )}
        </div>

        <div className="mt-6">
          <Link
            to="/gigs"
            className="inline-block border-3 border-black px-6 py-3 font-bold hover:bg-black hover:text-white"
          >
            ← Back to Gigs
          </Link>
        </div>
      </div>
    </div>
  );
};

export default GigDetail;