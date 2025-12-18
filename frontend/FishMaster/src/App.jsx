import React from 'react';
import { Routes, Route } from 'react-router-dom';
import './index.scss';

// Pages
import LandingPage from './pages/landing/LandingPage.jsx';
import SignupPage from './pages/auth/SignupPage.jsx';
import VerifyEmailPage from './pages/auth/VerifyEmailPage.jsx';
import LoginPage from './pages/auth/LoginPage.jsx';
import OnboardingFlow from './pages/onboarding/OnboardingFlow.jsx';
import Profile from './pages/profile/Profile.jsx';
import Dashboard from './pages/dashboard/Dashboard.jsx';
import PlaceholderPage from './pages/PlaceholderPage.jsx';

// Layouts
import MyTanksPage from './pages/tanks/MyTanksPage.jsx';
import TankDetailsPage from './pages/tanks/TankDetailsPage.jsx';

// Layouts
import DashboardLayout from './components/layout/DashboardLayout.jsx';

/**
 * Main App component with routing.
 */
function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/verify" element={<VerifyEmailPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/onboarding" element={<OnboardingFlow />} />

      {/* Authenticated Dashboard Routes */}
      <Route element={<DashboardLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/tanks" element={<MyTanksPage />} />
        <Route path="/tanks/:id" element={<TankDetailsPage />} />
        <Route path="/analytics" element={<PlaceholderPage title="Data & Trends" />} />
        <Route path="/alerts" element={<PlaceholderPage title="Alert Rules" />} />
        <Route path="/notifications" element={<PlaceholderPage title="Notifications" />} />
        <Route path="/education" element={<PlaceholderPage title="Learn & Care" />} />
        <Route path="/device" element={<PlaceholderPage title="Device Setup" />} />
      </Route>
    </Routes>
  );
}

export default App;
