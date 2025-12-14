import React from 'react';
import { useNavigate } from 'react-router-dom';
import Wave from 'react-wavify';
import Button from '../../components/common/button/button.jsx';
import Card from '../../components/common/card/card.jsx';
import FishLogo from '../../assets/images/Fishlogo.svg';
import ScrollProgress from '../../components/common/nav/ScrollProgress.jsx'
;
import './LandingPage.scss';

/**
 * Landing page - the first thing users see.
 * Features the FishMaster logo, slogan, and CTA buttons.
 */
function LandingPage() {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/signup');
  };

  const handleLogin = () => {
    navigate('/login');
  };

  return (
    <>
      <ScrollProgress />
      {/* Wave Background */}
      <div className="wave-background">
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

      <div className="landing-container">
        {/* HERO */}
        <section id="home">
          <Card className="hero-card">
            <div className="logo-area">
              <img src={FishLogo} alt="Fish Master Logo" className="logo" />
            </div>
            <p className="slogan-secondary">            
              Monitor your aquarium <i> <mark>easily</mark></i>, <i> <mark>anytime</mark></i>, <i> <mark>anywhere</mark></i>.
            </p>
            <Button 
              className="cta-button"
              onClick={handleGetStarted}
            >
              Get Started! (sign up!)
            </Button>
            <p className="login-link-container">
              <button 
                onClick={handleLogin}
                className="login-link"
              >
                Already have an account? Log in
              </button>
            </p>
          </Card>
        </section>

        {/* WHAT IS FISHMASTER */}
        <section id="about">
          <Card className="info-card">
            <h2 className="section-title"> What is FishMaster?</h2>
            <p className="section-text">
              FishMaster is your <mark>all-in-one aquarium management companion</mark>. 
              Whether you're a beginner with your first tank or an experienced aquarist 
              managing multiple setups, FishMaster helps you keep your fish healthy and thriving.
            </p>
            <p className="section-text">
              Track water parameters, monitor fish health, get feeding reminders, 
              and receive personalized care recommendations — all in one beautiful app.
            </p>
          </Card>
        </section>

        {/* FEATURES */}
        <section id="features">
          <Card className="info-card">
            <h2 className="section-title">✨ Key Features</h2>
            <div className="features-grid">
              <div className="feature-item">
                <span className="feature-icon">💧</span>
                <h3>Water Monitoring</h3>
                <p>Track pH, temperature, ammonia, nitrites, and more with smart alerts.</p>
              </div>
              <div className="feature-item">
                <span className="feature-icon">🐟</span>
                <h3>Fish Profiles</h3>
                <p>Keep detailed records of each fish with health history and care notes.</p>
              </div>
              <div className="feature-item">
                <span className="feature-icon">⏰</span>
                <h3>Smart Reminders</h3>
                <p>Never miss a feeding, water change, or maintenance task again.</p>
              </div>
              <div className="feature-item">
                <span className="feature-icon">📊</span>
                <h3>Analytics</h3>
                <p>Visualize trends and patterns to optimize your aquarium care routine.</p>
              </div>
            </div>
          </Card>
        </section>

        {/* HOW IT WORKS */}
        <section id="how-it-works">
          <Card className="info-card">
            <h2 className="section-title">🚀 How It Works</h2>
            <div className="steps-container">
              <div className="step-item">
                <span className="step-number">1</span>
                <h3>Create Your Account</h3>
                <p>Sign up in seconds and verify your email to get started.</p>
              </div>
              <div className="step-item">
                <span className="step-number">2</span>
                <h3>Set Up Your Tanks</h3>
                <p>Add your aquariums with size, type, and equipment details.</p>
              </div>
              <div className="step-item">
                <span className="step-number">3</span>
                <h3>Add Your Fish</h3>
                <p>Create profiles for each fish with species and care requirements.</p>
              </div>
              <div className="step-item">
                <span className="step-number">4</span>
                <h3>Start Tracking!</h3>
                <p>Log water parameters, set reminders, and watch your fish thrive.</p>
              </div>
            </div>
          </Card>
        </section>

        {/* FINAL CTA */}
        <section id="get-started">
          <Card className="info-card cta-card">
            <h2 className="section-title">Ready to Dive In? 🌊</h2>
            <p className="section-text">
              Join thousands of aquarium enthusiasts who trust FishMaster 
              to keep their aquatic friends happy and healthy.
            </p>
            <Button 
              className="cta-button"
              onClick={handleGetStarted}
            >
              Start Your Free Account
            </Button>
          </Card>
        </section>
      </div>
    </>
  );
}

export default LandingPage;
