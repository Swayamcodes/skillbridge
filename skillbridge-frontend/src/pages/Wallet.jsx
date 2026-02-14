import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';

const Wallet = () => {
  const { profile } = useContext(AuthContext);
  const [transactions, setTransactions] = useState([]);
  const [creditHistory, setCreditHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [txRes, creditsRes] = await Promise.all([
        api.get('/api/wallet/transactions'),
        api.get('/api/wallet/credits-history')
      ]);
      setTransactions(txRes.data.transactions);
      setCreditHistory(creditsRes.data.history);
    } catch (error) {
      console.error('Error fetching wallet data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-6">My Wallet</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="border-4 border-black shadow-brutal p-8">
            <h2 className="text-2xl font-bold mb-2">Wallet Balance</h2>
            <p className="text-5xl font-bold">₹{profile?.wallet_balance || 0}</p>
            <p className="text-sm mt-2">Available for withdrawal</p>
          </div>

          <div className="border-4 border-black shadow-brutal p-8">
            <h2 className="text-2xl font-bold mb-2">Credits Balance</h2>
            <p className="text-5xl font-bold">{profile?.credits || 0}</p>
            <p className="text-sm mt-2">Use for barter gigs</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-2xl font-bold mb-4">Payment History</h2>
            {transactions.length === 0 ? (
              <div className="border-4 border-black p-6 text-center">
                <p>No transactions yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {transactions.map((tx) => (
                  <div key={tx.id} className="border-3 border-black p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-bold">{tx.gig?.title}</p>
                        <p className="text-sm">{new Date(tx.created_at).toLocaleDateString()}</p>
                      </div>
                      <div className={`font-bold ${tx.status === 'completed' ? 'text-green-600' : ''}`}>
                        ₹{tx.amount}
                      </div>
                    </div>
                    <span className={`text-xs border-2 border-black px-2 py-1 ${
                      tx.status === 'completed' ? 'bg-green-200' : 'bg-yellow-200'
                    }`}>
                      {tx.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-4">Credits History</h2>
            {creditHistory.length === 0 ? (
              <div className="border-4 border-black p-6 text-center">
                <p>No credit transactions yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {creditHistory.map((credit) => (
                  <div key={credit.id} className="border-3 border-black p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-bold">{credit.gig?.title || 'Credit transaction'}</p>
                        <p className="text-sm">{new Date(credit.created_at).toLocaleDateString()}</p>
                      </div>
                      <div className={`font-bold ${
                        credit.type === 'earned' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {credit.type === 'earned' ? '+' : '-'}{credit.amount}
                      </div>
                    </div>
                    <span className="text-xs border-2 border-black px-2 py-1">
                      {credit.type}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-6">
          <Link
            to="/"
            className="inline-block border-3 border-black px-6 py-3 font-bold hover:bg-black hover:text-white"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Wallet;