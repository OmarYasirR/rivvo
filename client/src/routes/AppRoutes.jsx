import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import ForgotPassword from '../pages/auth/ForgotPassword';
import ResetPassword from '../pages/auth/ResetPassword';
import Home from '../pages/Home';
import Explore from '../pages/Explore';
import Notifications from '../pages/Notifications';
import Messages from '../pages/Messages';
import Profile from '../pages/Profile';
import PostPage from '../pages/PostPage';
import Saved from '../pages/Saved';
import Settings from '../pages/Settings';
import NotFound from '../pages/NotFound';
import { useAuth } from '../context/AuthContext';

const Private = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? children : <Navigate to="/login" replace />;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />
    <Route path="/forgot-password" element={<ForgotPassword />} />
    <Route path="/reset-password/:token" element={<ResetPassword />} />

    <Route element={<Private><AppLayout /></Private>}>
      <Route path="/" element={<Home />} />
      <Route path="/explore" element={<Explore />} />
      <Route path="/notifications" element={<Notifications />} />
      <Route path="/messages" element={<Messages />} />
      <Route path="/profile/:username" element={<Profile />} />
      <Route path="/post/:id" element={<PostPage />} />
      <Route path="/saved" element={<Saved />} />
      <Route path="/settings" element={<Settings />} />
    </Route>

    <Route path="*" element={<NotFound />} />
  </Routes>
);

export default AppRoutes;
