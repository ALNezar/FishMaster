import React from 'react';
import { Routes, Route } from 'react-router-dom';
import './index.scss';

// Pages
import LandingPage from './pages/landing/LandingPage.jsx';
import SignupPage from './pages/auth/SignupPage.jsx';
import VerifyEmailPage from './pages/auth/VerifyEmailPage.jsx';
import LoginPage from './pages/auth/LoginPage.jsx';
import OnboardingFlow from './pages/onboarding/OnboardingFlow.jsx';
import Dashboard from './pages/dashboard/Dashboard.jsx';

/**
 * Main App component with routing.
 * 
 * Routes:
 * - / : Landing page
 * - /signup : User registration
 * - /verify : Email verification
 * - /login : User login
 * - /onboarding : 10-step onboarding wizard
 * - /dashboard : Main app after onboarding
 */
function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/verify" element={<VerifyEmailPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/onboarding" element={<OnboardingFlow />} />
      <Route path="/dashboard" element={<Dashboard />} />
    </Routes>
  );
}

export default App;
