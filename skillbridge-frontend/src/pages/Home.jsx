import { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Home = () => {
  const { profile, logout } = useContext(AuthContext);

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="border-4 border-black shadow-brutal p-8 mb-6">
          <h1 className="text-4xl font-bold mb-4">Welcome, {profile?.full_name}!</h1>
          <p className="mb-2">Email: {profile?.email}</p>
          <p className="mb-4">Credits: <span className="text-2xl font-bold">{profile?.credits}</span></p>
          
          <div className="flex flex-wrap gap-2 mt-6">
            <Link
              to="/gigs"
              className="bg-black text-white border-3 border-black px-6 py-3 font-bold hover:bg-white hover:text-black"
            >
              Browse Gigs
            </Link>
            <Link
              to="/gigs/post"
              className="border-3 border-black px-6 py-3 font-bold hover:bg-black hover:text-white"
            >
              Post a Gig
            </Link>
            <Link
              to="/profile"
              className="border-3 border-black px-6 py-3 font-bold hover:bg-black hover:text-white"
            >
              My Profile
            </Link>
            <Link
  to="/applications"
  className="border-3 border-black px-6 py-3 font-bold hover:bg-black hover:text-white"
>
  My Applications
</Link>
<Link
  to="/my-gigs"
  className="border-3 border-black px-6 py-3 font-bold hover:bg-black hover:text-white"
>
  My Gigs
</Link>
<Link
  to="/wallet"
  className="border-3 border-black px-6 py-3 font-bold hover:bg-black hover:text-white"
>
  My Wallet
</Link>
            <button
              onClick={logout}
              className="border-3 border-black px-6 py-3 font-bold hover:bg-black hover:text-white"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="border-4 border-black shadow-brutal p-8">
          <h2 className="text-2xl font-bold mb-4">Quick Stats</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="border-3 border-black p-4">
              <p className="text-sm">Gigs Posted</p>
              <p className="text-3xl font-bold">0</p>
            </div>
            <div className="border-3 border-black p-4">
              <p className="text-sm">Gigs Completed</p>
              <p className="text-3xl font-bold">0</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;