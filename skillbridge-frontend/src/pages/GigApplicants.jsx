import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';

const GigApplicants = () => {
  const { id } = useParams();
  const { profile } = useContext(AuthContext);
  const [gig, setGig] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [gigRes, applicantsRes] = await Promise.all([
        api.get(`/api/gigs/${id}`),
        api.get(`/api/gigs/${id}/applicants`)
      ]);
      setGig(gigRes.data.gig);
      setApplicants(applicantsRes.data.applicants);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (applicationId) => {
  if (!window.confirm('Accept this applicant?')) return;

  try {
    // If paid gig, initiate payment
    if (gig.type === 'paid') {
      await handlePayment(applicationId);
    } else {
      // Barter gig - direct acceptance
      await api.put(`/api/applications/${applicationId}/accept`);
      alert('Applicant accepted!');
      fetchData();
    }
  } catch (error) {
    alert(error.response?.data?.message || 'Failed to accept');
  }
};

const handlePayment = async (applicationId) => {
  try {
    // Create Razorpay order
    const orderRes = await api.post('/api/payment/create-order', {
      gigId: id
    });

    const { order, key } = orderRes.data;

    // Load Razorpay script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    script.onload = () => {
      const options = {
        key: key,
        amount: order.amount,
        currency: order.currency,
        name: 'SkillBridge',
        description: gig.title,
        order_id: order.id,
        handler: async (response) => {
          try {
            // Verify payment
            await api.post('/api/payment/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              gigId: id,
              applicationId: applicationId
            });
            alert('Payment successful! Applicant accepted.');
            fetchData();
          } catch (error) {
            alert('Payment verification failed');
          }
        },
        prefill: {
          name: profile?.full_name,
          email: profile?.email,
        },
        theme: {
          color: '#000000'
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    };
  } catch (error) {
    console.error('Payment error:', error);
    alert('Failed to initiate payment');
  }
};

  const handleReject = async (applicationId) => {
    if (!window.confirm('Reject this applicant?')) return;

    try {
      await api.put(`/api/applications/${applicationId}/reject`);
      alert('Applicant rejected');
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to reject');
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="border-4 border-black shadow-brutal p-8 mb-6">
          <h1 className="text-4xl font-bold mb-2">{gig?.title}</h1>
          <p className="mb-4">Status: <span className="font-bold uppercase">{gig?.status}</span></p>
          <Link to={`/gigs/${id}`} className="font-bold underline">← View Gig Details</Link>
        </div>

        <h2 className="text-2xl font-bold mb-4">Applicants ({applicants.length})</h2>

        {applicants.length === 0 ? (
          <div className="border-4 border-black p-8 text-center">
            <p className="text-xl">No applications yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {applicants.map((app) => (
              <div key={app.id} className="border-4 border-black shadow-brutal p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-2xl font-bold">{app.applicant?.full_name}</h3>
                    <p className="text-sm">{app.applicant?.email}</p>
                    <p className="text-sm">{app.applicant?.college} - Year {app.applicant?.year}</p>
                  </div>
                  <div>
                    <span className={`border-3 border-black px-4 py-2 font-bold uppercase ${
                      app.status === 'accepted' ? 'bg-green-200' :
                      app.status === 'rejected' ? 'bg-red-200' :
                      'bg-yellow-200'
                    }`}>
                      {app.status}
                    </span>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="font-bold mb-2">Skills:</p>
                  <div className="flex flex-wrap gap-2">
                    {app.applicant?.skills?.map((skill, index) => (
                      <span key={index} className="border-2 border-black px-3 py-1 text-sm">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mb-4">
                  <p className="font-bold mb-2">Message:</p>
                  <p className="whitespace-pre-wrap">{app.message}</p>
                </div>

                <div className="mb-4">
                  <p className="text-sm">Applied: {new Date(app.created_at).toLocaleDateString()}</p>
                </div>

                {app.status === 'pending' && gig?.status === 'open' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAccept(app.id)}
                      className="bg-black text-white border-3 border-black px-6 py-2 font-bold hover:bg-white hover:text-black"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleReject(app.id)}
                      className="border-3 border-black px-6 py-2 font-bold hover:bg-black hover:text-white"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default GigApplicants;