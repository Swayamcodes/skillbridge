import { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/auth';

const ProtectedRoute = ({ children }) => {
  const { user, profile, loading } = useContext(AuthContext);
  const location = useLocation();
  const isSetupRoute = location.pathname === '/profile/setup';
  const hasSkills = Array.isArray(profile?.skills) && profile.skills.length > 0;
  const isProfileIncomplete = profile && (!hasSkills || !profile.bio?.trim() || !profile.year);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (isProfileIncomplete && !isSetupRoute) {
    return <Navigate to="/profile/setup" replace state={{ from: location }} />;
  }

  if (!isProfileIncomplete && isSetupRoute) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
