import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Banknote,
  CheckCircle2,
  CircleHelp,
  Clock3,
  Coins,
  CreditCard,
  History,
  IndianRupee,
  Landmark,
  ReceiptText,
  ShieldCheck,
  Wallet as WalletIcon,
  XCircle,
} from 'lucide-react';
import { AuthContext } from '../context/auth';
import Pagination from '../components/Pagination';
import { TableRowSkeleton } from '../components/Skeletons';
import Navbar from '../components/Navbar';
import api from '../services/api';

const Wallet = () => {
  const { profile, refreshProfile } = useContext(AuthContext);
  const [transactions, setTransactions] = useState([]);
  const [creditHistory, setCreditHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [transactionsPage, setTransactionsPage] = useState(1);
  const [transactionsTotalPages, setTransactionsTotalPages] = useState(1);
  const [creditsPage, setCreditsPage] = useState(1);
  const [creditsTotalPages, setCreditsTotalPages] = useState(1);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const refreshWallet = () => {
      fetchData(transactionsPage, creditsPage);
      refreshProfile?.();
    };

    window.addEventListener('focus', refreshWallet);
    window.addEventListener('skillbridge:stats-updated', refreshWallet);

    return () => {
      window.removeEventListener('focus', refreshWallet);
      window.removeEventListener('skillbridge:stats-updated', refreshWallet);
    };
  }, [transactionsPage, creditsPage, refreshProfile]);

  const fetchData = async (txPage = 1, creditPage = 1) => {
    try {
      const [txRes, creditsRes] = await Promise.all([
        api.get(`/api/wallet/transactions?page=${txPage}&limit=10`),
        api.get(`/api/wallet/credits-history?page=${creditPage}&limit=10`),
        refreshProfile?.()
      ]);
      setTransactions(txRes.data.transactions);
      setCreditHistory(creditsRes.data.history);
      setTransactionsTotalPages(txRes.data.pagination?.totalPages || 1);
      setCreditsTotalPages(creditsRes.data.pagination?.totalPages || 1);
    } catch (error) {
      console.error('Error fetching wallet data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTransactionsPageChange = (page) => {
    setTransactionsPage(page);
    fetchData(page, creditsPage);
  };

  const handleCreditsPageChange = (page) => {
    setCreditsPage(page);
    fetchData(transactionsPage, page);
  };

  const getPaymentStatusBadge = (status) => {
    const badges = {
      escrow: 'bg-amber-50 text-amber-800 border border-amber-300/70',
      completed: 'bg-emerald-50 text-emerald-800 border border-emerald-700/20',
      disputed: 'bg-red-50 text-red-700 border border-red-200'
    };

    return badges[status] || 'bg-gray-50 text-gray-700 border border-gray-200';
  };

  const getPaymentStatusIcon = (status) => {
    const icons = {
      escrow: Clock3,
      completed: CheckCircle2,
      disputed: XCircle
    };

    return icons[status] || CircleHelp;
  };

  const getPaymentStatusText = (tx) => {
    if (tx.status === 'escrow') {
      return 'Payment in escrow - pending completion';
    }

    if (tx.status === 'completed') {
      const completedDate = tx.completed_at || tx.updated_at || tx.created_at;
      return `Completed on ${new Date(completedDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })}`;
    }

    if (tx.status === 'disputed') {
      return 'Disputed - needs resolution';
    }

    return tx.status;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F8F4]">
        <Navbar />

        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
          <div className="mb-8">
            <Link to="/dashboard" className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-gray-600 transition-colors hover:text-emerald-800">
              <ArrowLeft size={16} aria-hidden="true" />
              Back to Dashboard
            </Link>
            <div className="mb-3 inline-flex items-center gap-2 rounded-lg border border-emerald-700/15 bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-emerald-800 shadow-[0_10px_24px_rgba(16,24,40,0.04)]">
              <WalletIcon size={14} aria-hidden="true" />
              Financial dashboard
            </div>
            <h1 className="mb-2 text-4xl font-semibold tracking-tight text-gray-950">My Wallet</h1>
            <p className="text-gray-600">Track your earnings and credit balance</p>
          </div>

          <div className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="relative overflow-hidden rounded-xl border border-emerald-900/10 bg-emerald-800 p-8 text-white shadow-[0_18px_45px_rgba(6,78,59,0.18)]">
              <div className="relative z-10">
                <div className="mb-5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-white/12 ring-1 ring-white/20">
                      <IndianRupee size={22} aria-hidden="true" />
                    </div>
                    <h2 className="text-lg font-semibold">Wallet Balance</h2>
                  </div>
                  <ShieldCheck size={20} className="text-emerald-100" aria-hidden="true" />
                </div>
                <p className="mb-3 text-5xl font-semibold tracking-tight">₹{profile?.wallet_balance || 0}</p>
                <p className="text-sm font-medium text-emerald-100">Available for withdrawal</p>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-xl border border-emerald-900/10 bg-white p-8 shadow-[0_16px_38px_rgba(16,24,40,0.06)]">
              <div className="relative z-10">
                <div className="mb-5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-50 text-emerald-800 ring-1 ring-emerald-700/15">
                      <Coins size={22} aria-hidden="true" />
                    </div>
                    <h2 className="text-lg font-semibold text-gray-950">Credits Balance</h2>
                  </div>
                  <Landmark size={20} className="text-emerald-700" aria-hidden="true" />
                </div>
                <p className="mb-3 text-5xl font-semibold tracking-tight text-emerald-800">{profile?.credits || 0}</p>
                <p className="text-sm font-medium text-gray-600">Use for barter gigs</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="inline-flex items-center gap-2 text-2xl font-semibold tracking-tight text-gray-950">
                  <ReceiptText size={22} aria-hidden="true" />
                  Payment History
                </h2>
                <span className="text-sm font-medium text-gray-500">Loading...</span>
              </div>
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <TableRowSkeleton key={`payment-${index}`} className="bg-white shadow-[0_12px_30px_rgba(16,24,40,0.05)]" />
                ))}
              </div>
            </div>

            <div>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="inline-flex items-center gap-2 text-2xl font-semibold tracking-tight text-gray-950">
                  <History size={22} aria-hidden="true" />
                  Credits History
                </h2>
                <span className="text-sm font-medium text-gray-500">Loading...</span>
              </div>
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <TableRowSkeleton key={`credits-${index}`} className="bg-white shadow-[0_12px_30px_rgba(16,24,40,0.05)]" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F8F4]">
      <Navbar />

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
        {/* Header */}
        <div className="mb-8">
          <Link to="/dashboard" className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-gray-600 transition-colors hover:text-emerald-800">
            <ArrowLeft size={16} aria-hidden="true" />
            Back to Dashboard
          </Link>
          <div className="mb-3 inline-flex items-center gap-2 rounded-lg border border-emerald-700/15 bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-emerald-800 shadow-[0_10px_24px_rgba(16,24,40,0.04)]">
            <WalletIcon size={14} aria-hidden="true" />
            Financial dashboard
          </div>
          <h1 className="mb-2 text-4xl font-semibold tracking-tight text-gray-950">My Wallet</h1>
          <p className="text-gray-600">Track your earnings and credit balance</p>
        </div>

        {/* Balance Cards */}
        <div className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Wallet Balance */}
          <div className="relative overflow-hidden rounded-xl border border-emerald-900/10 bg-emerald-800 p-8 text-white shadow-[0_18px_45px_rgba(6,78,59,0.18)] transition-all hover:-translate-y-1 hover:shadow-[0_24px_55px_rgba(6,78,59,0.22)]">
            <div className="relative z-10">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-white/12 ring-1 ring-white/20">
                    <IndianRupee size={22} aria-hidden="true" />
                  </div>
                  <h2 className="text-lg font-semibold">Wallet Balance</h2>
                </div>
                <ShieldCheck size={20} className="text-emerald-100" aria-hidden="true" />
              </div>
              <p className="mb-3 text-5xl font-semibold tracking-tight">₹{profile?.wallet_balance || 0}</p>
              <p className="text-sm font-medium text-emerald-100">Available for withdrawal</p>
            </div>
          </div>

          {/* Credits Balance */}
          <div className="relative overflow-hidden rounded-xl border border-emerald-900/10 bg-white p-8 shadow-[0_16px_38px_rgba(16,24,40,0.06)] transition-all hover:-translate-y-1 hover:border-emerald-700/30 hover:shadow-[0_18px_45px_rgba(16,24,40,0.09)]">
            <div className="relative z-10">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-50 text-emerald-800 ring-1 ring-emerald-700/15">
                    <Coins size={22} aria-hidden="true" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-950">Credits Balance</h2>
                </div>
                <Landmark size={20} className="text-emerald-700" aria-hidden="true" />
              </div>
              <p className="mb-3 text-5xl font-semibold tracking-tight text-emerald-800">{profile?.credits || 0}</p>
              <p className="text-sm font-medium text-gray-600">Use for barter gigs</p>
            </div>
          </div>
        </div>

        {/* Transaction History */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Payment History */}
          <div>
            <div className="mb-4 flex items-center justify-between gap-4">
              <h2 className="inline-flex items-center gap-2 text-2xl font-semibold tracking-tight text-gray-950">
                <ReceiptText size={22} aria-hidden="true" />
                Payment History
              </h2>
              <span className="whitespace-nowrap text-sm font-medium text-gray-500">{transactions.length} transactions</span>
            </div>
            
            {transactions.length === 0 ? (
              <div className="rounded-xl border border-dashed border-emerald-900/20 bg-white p-12 text-center shadow-[0_16px_38px_rgba(16,24,40,0.06)]">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800">
                  <CreditCard size={30} aria-hidden="true" />
                </div>
                <h3 className="mb-1 text-lg font-semibold text-gray-950">No transactions yet</h3>
                <p className="text-sm text-gray-600">Your payment history will appear here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {transactions.map((tx) => {
                  const StatusIcon = getPaymentStatusIcon(tx.status);

                  return (
                    <div key={tx.id} className="rounded-xl border border-emerald-900/10 bg-white p-5 shadow-[0_12px_30px_rgba(16,24,40,0.05)] transition-all hover:-translate-y-0.5 hover:border-emerald-700/30 hover:shadow-[0_18px_45px_rgba(16,24,40,0.09)]">
                      <div className="mb-4 flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <p className="mb-1 font-semibold text-gray-950">{tx.gig?.title}</p>
                          <p className="text-xs font-medium text-gray-500">
                            {new Date(tx.created_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                          <p className="mt-2 text-sm leading-6 text-gray-600">
                            {getPaymentStatusText(tx)}
                          </p>
                        </div>
                        <div className="ml-4 text-right">
                          <p className={`text-xl font-semibold tracking-tight ${
                            tx.status === 'completed' ? 'text-emerald-700' : 'text-gray-950'
                          }`}>
                            ₹{tx.amount}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <span className={`inline-flex w-fit items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-wide ${
                          getPaymentStatusBadge(tx.status)
                        }`}>
                          <StatusIcon size={13} aria-hidden="true" />
                          {tx.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
                <Pagination
                  currentPage={transactionsPage}
                  totalPages={transactionsTotalPages}
                  onPageChange={handleTransactionsPageChange}
                />
              </div>
            )}
          </div>

          {/* Credits History */}
          <div>
            <div className="mb-4 flex items-center justify-between gap-4">
              <h2 className="inline-flex items-center gap-2 text-2xl font-semibold tracking-tight text-gray-950">
                <History size={22} aria-hidden="true" />
                Credits History
              </h2>
              <span className="whitespace-nowrap text-sm font-medium text-gray-500">{creditHistory.length} transactions</span>
            </div>
            
            {creditHistory.length === 0 ? (
              <div className="rounded-xl border border-dashed border-emerald-900/20 bg-white p-12 text-center shadow-[0_16px_38px_rgba(16,24,40,0.06)]">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800">
                  <Coins size={30} aria-hidden="true" />
                </div>
                <h3 className="mb-1 text-lg font-semibold text-gray-950">No credit transactions yet</h3>
                <p className="text-sm text-gray-600">Your credit history will appear here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {creditHistory.map((credit) => (
                  <div key={credit.id} className="rounded-xl border border-emerald-900/10 bg-white p-5 shadow-[0_12px_30px_rgba(16,24,40,0.05)] transition-all hover:-translate-y-0.5 hover:border-emerald-700/30 hover:shadow-[0_18px_45px_rgba(16,24,40,0.09)]">
                    <div className="mb-4 flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <p className="mb-1 font-semibold text-gray-950">
                          {credit.gig?.title || 'Credit transaction'}
                        </p>
                        <p className="text-xs font-medium text-gray-500">
                          {new Date(credit.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                      <div className="ml-4 text-right">
                        <p className={`text-xl font-semibold tracking-tight ${
                          credit.type === 'earned' ? 'text-emerald-700' : 'text-red-600'
                        }`}>
                          {credit.type === 'earned' ? '+' : '-'}{credit.amount}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-wide ${
                        credit.type === 'earned'
                          ? 'border border-emerald-700/20 bg-emerald-50 text-emerald-800'
                          : 'border border-red-200 bg-red-50 text-red-700'
                      }`}>
                        {credit.type === 'earned' ? <ArrowUp size={13} aria-hidden="true" /> : <ArrowDown size={13} aria-hidden="true" />}
                        {credit.type}
                      </span>
                    </div>
                  </div>
                ))}
                <Pagination
                  currentPage={creditsPage}
                  totalPages={creditsTotalPages}
                  onPageChange={handleCreditsPageChange}
                />
              </div>
            )}
          </div>
        </div>

        {/* Info Card */}
        <div className="mt-12 rounded-xl border border-emerald-700/15 bg-emerald-50 p-6 shadow-[0_16px_38px_rgba(16,24,40,0.05)]">
          <h3 className="mb-4 flex items-center gap-2 font-semibold text-emerald-950">
            <Banknote size={18} aria-hidden="true" />
            How it works
          </h3>
          <div className="grid grid-cols-1 gap-4 text-sm leading-6 text-emerald-900 md:grid-cols-2">
            <div className="flex items-start gap-2">
              <span className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-emerald-700"></span>
              <span><strong>Wallet Balance:</strong> Money earned from paid gigs, available for withdrawal</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-emerald-700"></span>
              <span><strong>Credits:</strong> Virtual currency for bartering skills without cash</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-emerald-700"></span>
              <span><strong>Earn Credits:</strong> Complete barter gigs to receive credits</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-emerald-700"></span>
              <span><strong>Spend Credits:</strong> Use credits to hire others for barter gigs</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Wallet;
