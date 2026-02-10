import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './utils/ProtectedRoute';
import Signup from './pages/Signup';
import Login from './pages/Login';
import Home from './pages/Home';
import Profile from './pages/Profile';
import ProfileSetup from './pages/ProfileSetup';
import ProfileEdit from './pages/ProfileEdit';
import Gigs from './pages/Gigs';
import PostGig from './pages/PostGig';
import GigDetail from './pages/GigDetail';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route 
            path="/" 
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
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;