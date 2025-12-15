import React from 'react';
import { useNavigate } from 'react-router-dom';
import Wave from 'react-wavify';
// 1. Import the specific icons you want to use
import { FaWater, FaFishFins, FaRegBell, FaChartLine, FaRocket } from "react-icons/fa6"; 

import Button from '../../components/common/button/button.jsx';
import Card from '../../components/common/card/card.jsx';
import FishLogo from '../../assets/images/Fishlogo.svg';
import ScrollProgress from '../../components/common/nav/ScrollProgress.jsx';
import './LandingPage.scss';

/** Reusable Wave component with default options */
const WaveBackground = ({ className }) => (
  <Wave
    className={className}
    fill="#1277b0"
    paused={false}
    options={{ height: -11, amplitude: 30, speed: 0.15, points: 5 }}
  />
);

/** Reusable feature item */
const FeatureItem = ({ icon, title, description }) => (
  <div className="feature-item">
    {/* 2. Added a wrapper class for consistent icon sizing/color */}
    <span className="feature-icon icon-glow">{icon}</span>
    <h3>{title}</h3>
    <p>{description}</p>
  </div>
);

/** Reusable step item */
const StepItem = ({ number, title, description }) => (
  <div className="step-item">
    <span className="step-number">{number}</span>
    <h3>{title}</h3>
    <p>{description}</p>
    <WaveBackground />
  </div>
);

function LandingPage() {
  const navigate = useNavigate();

  // Helper to standardise icon style
  const iconStyle = { fontSize: '2.5rem', color: '#1277b0' };

  return (
    <>
      <ScrollProgress />

      {/* Wave Background */}
      <div className="wave-background">
        <WaveBackground />
      </div>

      <div className="landing-container">
        {/* HERO */}
        <section id="home">
          <Card className="hero-card">
            <div className="logo-area">
              <img src={FishLogo} alt="Fish Master Logo" className="logo" />
            </div>
            <p className="slogan-secondary">
              Monitor your aquarium <i><mark>easily</mark></i>, <i><mark>anytime</mark></i>, <i><mark>anywhere</mark></i>.
            </p>
            <Button className="cta-button" onClick={() => navigate('/signup')}>
              Get Started! (sign up!)
            </Button>
            <p className="login-link-container">
              <button onClick={() => navigate('/login')} className="login-link">
                Already have an account? Log in
              </button>
            </p>
          </Card>
        </section>

        {/* WHAT IS FISHMASTER */}
        <section id="about">
          <Card className="info-card">
            <h2 className="section-title">What is FishMaster?</h2>
            <p className="section-text">
              FishMaster is your <mark>all-in-one aquarium management companion</mark>.
              Whether you're a beginner or an experienced aquarist, FishMaster helps keep your fish healthy.
            </p>
            <p className="section-text">
              Track water parameters, monitor fish health, get feeding reminders, and receive personalized care recommendations.
            </p>
          </Card>
        </section>

        {/* FEATURES */}
        <section id="features">
          <Card className="info-card">
            <h2 className="section-title">✨ Key Features</h2>
            <div className="features-grid">
              {/* 3. Replaced Emojis with React Components */}
              <FeatureItem 
                icon={<FaWater style={iconStyle} />} 
                title="Water Monitoring" 
                description="Track pH, temperature, ammonia, nitrites, and more with smart alerts." 
              />
              <FeatureItem 
                icon={<FaFishFins style={iconStyle} />} 
                title="Fish Profiles" 
                description="Keep detailed records of each fish with health history and care notes." 
              />
              <FeatureItem 
                icon={<FaRegBell style={iconStyle} />} 
                title="Smart Reminders" 
                description="Never miss a feeding, water change, or maintenance task again." 
              />
              <FeatureItem 
                icon={<FaChartLine style={iconStyle} />} 
                title="Analytics" 
                description="Visualize trends and patterns to optimize your aquarium care routine." 
              />
            </div>
          </Card>
        </section>

        {/* HOW IT WORKS */}
        <section id="how-it-works">
          <Card className="info-card">
            <h2 className="section-title">
                {/* Optional: Add a rocket icon here for extra flair */}
                <FaRocket style={{ color: '#ff6b6b', marginRight: '10px' }} /> 
                How It Works
            </h2>
            <div className="steps-container">
              <StepItem number="1" title="Create Your Account" description="Sign up in seconds and verify your email to get started." />
              <StepItem number="2" title="Set Up Your Tanks" description="Add your aquariums with size, type, and equipment details." />
              <StepItem number="3" title="Add Your Fish" description="Create profiles for each fish with species and care requirements." />
              <StepItem number="4" title="Start Tracking!" description="Log water parameters, set reminders, and watch your fish thrive." />
            </div>
          </Card>
        </section>

        {/* FINAL CTA */}
        <section id="get-started">
          <Card className="info-card cta-card">
            <h2 className="section-title">Ready to Dive In? 🌊</h2>
            <p className="section-text">
              Join thousands of aquarium enthusiasts who trust FishMaster to keep their aquatic friends happy and healthy.
            </p>
            <Button className="cta-button" onClick={() => navigate('/signup')}>
              Start Your Free Account
            </Button>
          </Card>
        </section>
      </div>
    </>
  );
}

export default LandingPage;