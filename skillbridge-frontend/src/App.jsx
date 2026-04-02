import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './utils/ProtectedRoute';
import Landing from './pages/Landing';
import Signup from './pages/Signup';
import Login from './pages/Login';
import Home from './pages/Home';
import Profile from './pages/Profile';
import ProfileSetup from './pages/ProfileSetup';
import ProfileEdit from './pages/ProfileEdit';
import Gigs from './pages/Gigs';
import PostGig from './pages/PostGig';
import GigDetail from './pages/GigDetail';
import MyApplications from './pages/MyApplications';
import GigApplicants from './pages/GigApplicants';
import MyGigs from './pages/MyGigs';
import Wallet from './pages/Wallet';
import PublicProfile from './pages/PublicProfile';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          
          {/* Protected Routes */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/profile/:id" 
            element={
              <ProtectedRoute>
                <PublicProfile />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/profile/setup" 
            element={
              <ProtectedRoute>
                <ProfileSetup />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/profile/edit" 
            element={
              <ProtectedRoute>
                <ProfileEdit />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/gigs" 
            element={
              <ProtectedRoute>
                <Gigs />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/gigs/post" 
            element={
              <ProtectedRoute>
                <PostGig />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/gigs/:id" 
            element={
              <ProtectedRoute>
                <GigDetail />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/gigs/:id/applicants" 
            element={
              <ProtectedRoute>
                <GigApplicants />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/applications" 
            element={
              <ProtectedRoute>
                <MyApplications />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/my-gigs" 
            element={
              <ProtectedRoute>
                <MyGigs />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/wallet" 
            element={
              <ProtectedRoute>
                <Wallet />
              </ProtectedRoute>
            } 
          />
          
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;