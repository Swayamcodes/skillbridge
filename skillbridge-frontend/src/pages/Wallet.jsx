import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { TableRowSkeleton } from '../components/Skeletons';
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
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
            <Link to="/" className="text-xl font-light tracking-wide">Skill bridge</Link>
            <div className="flex items-center gap-4">
              <Link to="/gigs" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                Browse Gigs
              </Link>
              <Link to="/" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                Dashboard
              </Link>
            </div>
          </div>
        </nav>

        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="mb-8">
            <Link to="/" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors mb-4">
              â† Back to Dashboard
            </Link>
            <h1 className="text-4xl font-light mb-2">My Wallet</h1>
            <p className="text-gray-600">Track your earnings and credit balance</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-2xl p-8 text-white relative overflow-hidden">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0" style={{
                  backgroundImage: `linear-gradient(rgba(255,255,255,.05) 1px, transparent 1px),
                                linear-gradient(90deg, rgba(255,255,255,.05) 1px, transparent 1px)`,
                  backgroundSize: '50px 50px'
                }}></div>
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-2xl">ðŸ’°</span>
                  <h2 className="text-lg font-light">Wallet Balance</h2>
                </div>
                <p className="text-5xl font-light mb-3">â‚¹{profile?.wallet_balance || 0}</p>
                <p className="text-emerald-100 text-sm">Available for withdrawal</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-8 border-2 border-emerald-200 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full -mr-16 -mt-16"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-2xl">ðŸ”„</span>
                  <h2 className="text-lg font-medium text-gray-900">Credits Balance</h2>
                </div>
                <p className="text-5xl font-light text-emerald-700 mb-3">{profile?.credits || 0}</p>
                <p className="text-gray-600 text-sm">Use for barter gigs</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-light">Payment History</h2>
                <span className="text-sm text-gray-500">Loading...</span>
              </div>
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <TableRowSkeleton key={`payment-${index}`} className="bg-white" />
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-light">Credits History</h2>
                <span className="text-sm text-gray-500">Loading...</span>
              </div>
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <TableRowSkeleton key={`credits-${index}`} className="bg-white" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Header/Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link to="/" className="text-xl font-light tracking-wide">Skill bridge</Link>
          <div className="flex items-center gap-4">
            <Link to="/gigs" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
              Browse Gigs
            </Link>
            <Link to="/" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
              Dashboard
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link to="/" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors mb-4">
            ← Back to Dashboard
          </Link>
          <h1 className="text-4xl font-light mb-2">My Wallet</h1>
          <p className="text-gray-600">Track your earnings and credit balance</p>
        </div>

        {/* Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {/* Wallet Balance */}
          <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-2xl p-8 text-white relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0" style={{
                backgroundImage: `linear-gradient(rgba(255,255,255,.05) 1px, transparent 1px),
                                linear-gradient(90deg, rgba(255,255,255,.05) 1px, transparent 1px)`,
                backgroundSize: '50px 50px'
              }}></div>
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">💰</span>
                <h2 className="text-lg font-light">Wallet Balance</h2>
              </div>
              <p className="text-5xl font-light mb-3">₹{profile?.wallet_balance || 0}</p>
              <p className="text-emerald-100 text-sm">Available for withdrawal</p>
            </div>
          </div>

          {/* Credits Balance */}
          <div className="bg-white rounded-2xl p-8 border-2 border-emerald-200 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full -mr-16 -mt-16"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">🔄</span>
                <h2 className="text-lg font-medium text-gray-900">Credits Balance</h2>
              </div>
              <p className="text-5xl font-light text-emerald-700 mb-3">{profile?.credits || 0}</p>
              <p className="text-gray-600 text-sm">Use for barter gigs</p>
            </div>
          </div>
        </div>

        {/* Transaction History */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Payment History */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-light">Payment History</h2>
              <span className="text-sm text-gray-500">{transactions.length} transactions</span>
            </div>
            
            {transactions.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">💳</span>
                </div>
                <h3 className="text-lg font-light mb-1">No transactions yet</h3>
                <p className="text-sm text-gray-600">Your payment history will appear here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {transactions.map((tx) => (
                  <div key={tx.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:border-emerald-300 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 mb-1">{tx.gig?.title}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(tx.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                      <div className="text-right ml-4">
                        <p className={`text-xl font-medium ${
                          tx.status === 'completed' ? 'text-green-600' : 'text-gray-900'
                        }`}>
                          ₹{tx.amount}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                        tx.status === 'completed' 
                          ? 'bg-green-100 text-green-800 border border-green-200' 
                          : tx.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                          : 'bg-gray-100 text-gray-800 border border-gray-200'
                      }`}>
                        {tx.status === 'completed' ? '✓' : '⏳'} {tx.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Credits History */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-light">Credits History</h2>
              <span className="text-sm text-gray-500">{creditHistory.length} transactions</span>
            </div>
            
            {creditHistory.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">🔄</span>
                </div>
                <h3 className="text-lg font-light mb-1">No credit transactions yet</h3>
                <p className="text-sm text-gray-600">Your credit history will appear here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {creditHistory.map((credit) => (
                  <div key={credit.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:border-emerald-300 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 mb-1">
                          {credit.gig?.title || 'Credit transaction'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(credit.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                      <div className="text-right ml-4">
                        <p className={`text-xl font-medium ${
                          credit.type === 'earned' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {credit.type === 'earned' ? '+' : '-'}{credit.amount}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                        credit.type === 'earned'
                          ? 'bg-green-100 text-green-800 border border-green-200'
                          : 'bg-red-100 text-red-800 border border-red-200'
                      }`}>
                        {credit.type === 'earned' ? '↑' : '↓'} {credit.type}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Info Card */}
        <div className="mt-12 bg-emerald-50 rounded-xl border border-emerald-200 p-6">
          <h3 className="font-medium text-emerald-900 mb-3 flex items-center gap-2">
            <span>💡</span> How it works
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-emerald-800">
            <div className="flex items-start gap-2">
              <span className="text-emerald-600 mt-0.5">•</span>
              <span><strong>Wallet Balance:</strong> Money earned from paid gigs, available for withdrawal</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-emerald-600 mt-0.5">•</span>
              <span><strong>Credits:</strong> Virtual currency for bartering skills without cash</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-emerald-600 mt-0.5">•</span>
              <span><strong>Earn Credits:</strong> Complete barter gigs to receive credits</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-emerald-600 mt-0.5">•</span>
              <span><strong>Spend Credits:</strong> Use credits to hire others for barter gigs</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Wallet;
