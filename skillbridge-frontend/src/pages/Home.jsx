import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const Home = () => {
  const { profile, logout } = useContext(AuthContext);

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="border-4 border-black shadow-brutal p-8">
          <h1 className="text-4xl font-bold mb-4">Welcome, {profile?.full_name}!</h1>
          <p className="mb-4">Email: {profile?.email}</p>
          <p className="mb-4">College: {profile?.college}</p>
          <p className="mb-6">Credits: {profile?.credits}</p>
          
          <button
            onClick={logout}
            className="bg-black text-white border-3 border-black px-6 py-3 font-bold hover:bg-white hover:text-black transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;