import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getFishTypes, completeOnboarding, login, isAuthenticated } from '../../services/api.js';
import Wave from 'react-wavify';

// Import step components
import WelcomeStep from './steps/WelcomeStep.jsx';
import NameStep from './steps/NameStep.jsx';
import EmailStep from './steps/EmailStep.jsx';
import TankNameStep from './steps/TankNameStep.jsx';
import TankSizeStep from './steps/TankSizeStep.jsx';
import FishCountStep from './steps/FishCountStep.jsx';
import FishDetailsStep from './steps/FishDetailsStep.jsx';
import WaterParamsStep from './steps/WaterParamsStep.jsx';
import ReviewStep from './steps/ReviewStep.jsx';
import SuccessStep from './steps/SuccessStep.jsx';

import styles from './OnboardingFlow.module.scss';

/**
 * Main onboarding flow orchestrator.
 * Manages state across all 10 steps and handles final submission.
 */
function OnboardingFlow() {
  const navigate = useNavigate();
  const location = useLocation();
  const userEmail = location.state?.email || '';
  const userPassword = location.state?.password || '';

  const [currentStep, setCurrentStep] = useState(0);
  const [fishTypes, setFishTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Collected data from all steps
  const [data, setData] = useState({
    userName: '',
    email: userEmail,
    tankName: '',
    tankSize: null,
    fishCount: 1,
    fish: [],
    waterParameters: null, // null = use defaults
  });

  // Check/ensure authentication on mount
  useEffect(() => {
    const ensureAuth = async () => {
      // If already authenticated, we're good
      if (isAuthenticated()) {
        setIsLoggedIn(true);
        return;
      }
      
      // If not authenticated but we have credentials, try to login
      if (userEmail && userPassword) {
        try {
          await login(userEmail, userPassword);
          setIsLoggedIn(true);
        } catch (err) {
          console.error('Auto-login failed:', err);
          // Redirect to login page if we can't authenticate
          navigate('/login', { state: { message: 'Please login to continue onboarding' } });
        }
      } else {
        // No credentials, redirect to login
        navigate('/login', { state: { message: 'Please login to continue onboarding' } });
      }
    };
    ensureAuth();
  }, [userEmail, userPassword, navigate]);

  // Fetch fish types on mount
  useEffect(() => {
    const loadFishTypes = async () => {
      try {
        const types = await getFishTypes();
        setFishTypes(types);
      } catch (err) {
        console.error('Failed to load fish types:', err);
        // Use fallback data if API fails
        setFishTypes([
          { id: 1, name: 'Goldfish', careLevel: 'beginner' },
          { id: 2, name: 'Betta', careLevel: 'beginner' },
          { id: 3, name: 'Guppy', careLevel: 'beginner' },
          { id: 4, name: 'Neon Tetra', careLevel: 'beginner' },
        ]);
      }
    };
    loadFishTypes();
  }, []);

  // Update data helper
  const updateData = (updates) => {
    setData(prev => ({ ...prev, ...updates }));
  };

  // Navigation helpers
  const nextStep = () => setCurrentStep(prev => prev + 1);
  const prevStep = () => setCurrentStep(prev => Math.max(0, prev - 1));
  const goToStep = (step) => setCurrentStep(step);

  // Handle final submission
  const handleComplete = async () => {
    setLoading(true);
    setError('');

    try {
      // Format fish data for API
      const onboardingPayload = {
        userName: data.userName,
        tankName: data.tankName,
        tankSize: data.tankSize,
        fish: data.fish.map(f => ({
          name: f.name,
          fishTypeId: f.fishTypeId,
        })),
        waterParameters: data.waterParameters,
      };

      await completeOnboarding(onboardingPayload);
      nextStep(); // Go to success step
    } catch (err) {
      setError(err.message || 'Failed to complete setup. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Define steps configuration
  const steps = [
    {
      component: WelcomeStep,
      title: 'Welcome',
      showProgress: false
    },
    {
      component: NameStep,
      title: 'Your Name',
      showProgress: true
    },
    {
      component: EmailStep,
      title: 'Your Email',
      showProgress: true
    },
    {
      component: TankNameStep,
      title: 'Tank Name',
      showProgress: true
    },
    {
      component: TankSizeStep,
      title: 'Tank Size',
      showProgress: true
    },
    {
      component: FishCountStep,
      title: 'Fish Count',
      showProgress: true
    },
    {
      component: FishDetailsStep,
      title: 'Fish Details',
      showProgress: true
    },
    {
      component: WaterParamsStep,
      title: 'Water Parameters',
      showProgress: true
    },
    {
      component: ReviewStep,
      title: 'Review',
      showProgress: true
    },
    {
      component: SuccessStep,
      title: 'Success',
      showProgress: false
    },
  ];

  const currentStepConfig = steps[currentStep];
  const StepComponent = currentStepConfig.component;
  const progressSteps = steps.filter(s => s.showProgress).length;
  const currentProgressIndex = steps.slice(0, currentStep + 1).filter(s => s.showProgress).length;

  // Show loading while checking authentication
  if (!isLoggedIn) {
    return (
      <>
        <div className={styles.waveBackground}>
          <Wave
            fill="#1277b0"
            paused={false}
            options={{ height: -11, amplitude: 30, speed: 0.15, points: 5 }}
          />
        </div>
        <div className={styles.container}>
          <div style={{ textAlign: 'center', padding: '2rem', color: 'white' }}>
            <h2>🔐 Authenticating...</h2>
            <p>Please wait while we set things up.</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Wave Background */}
      <div className={styles.waveBackground}>
        <Wave
          fill="#1277b0"
          paused={false}
          options={{
            height: -11,
            amplitude: 30,
            speed: 0.15,
            points: 5
          }}
        />
      </div>

      <div className={styles.container}>
        {/* Progress bar */}
        {currentStepConfig.showProgress && (
          <div className={styles.progressContainer}>
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{ width: `${(currentProgressIndex / progressSteps) * 100}%` }}
              />
            </div>
            <span className={styles.progressText}>
              Step {currentProgressIndex} of {progressSteps}
            </span>
          </div>
        )}

        {/* Current step component */}
        <StepComponent
          data={data}
          updateData={updateData}
          fishTypes={fishTypes}
          onNext={nextStep}
          onPrev={prevStep}
          onComplete={handleComplete}
          goToStep={goToStep}
          loading={loading}
          error={error}
          navigate={navigate}
        />
      </div>
    </>
  );
}

export default OnboardingFlow;
