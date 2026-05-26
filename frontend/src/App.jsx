import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Navigate } from 'react-router-dom';
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
import HistoryPage from './pages/dashboard/HistoryPage.jsx';
import TrendsPage from './pages/dashboard/TrendsPage.jsx';
import DataPage from './pages/dashboard/DataPage.jsx';
import AlertConfigPage from './pages/alerts/AlertConfigPage.jsx';
import DeviceControlPage from './pages/device/DeviceControlPage.jsx';
import LearningHomePage from './pages/education/LearningHomePage.jsx';
import LearningPathPage from './pages/education/LearningPathPage.jsx';
import LessonPage from './pages/education/LessonPage.jsx';
import LearningProgressPage from './pages/education/LearningProgressPage.jsx';

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
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/data" element={<DataPage />} />
        <Route path="/trends" element={<TrendsPage />} />
        <Route path="/analytics" element={<DataPage />} />
        <Route path="/alerts" element={<AlertConfigPage />} />
        <Route path="/notifications" element={<PlaceholderPage title="Notifications" />} />
        <Route path="/education" element={<LearningHomePage />} />
        <Route path="/education/path/:pathId" element={<LearningPathPage />} />
        <Route path="/education/lesson/:lessonId" element={<LessonPage />} />
        <Route path="/education/progress" element={<LearningProgressPage />} />
        <Route path="/learning" element={<Navigate to="/education" replace />} />
        <Route path="/learning/:sectionId" element={<Navigate to="/education" replace />} />
        <Route path="/device" element={<DeviceControlPage />} />
      </Route>
    </Routes>
  );
}

export default App;
