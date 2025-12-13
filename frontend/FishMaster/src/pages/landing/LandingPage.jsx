import React from 'react';
import { useNavigate } from 'react-router-dom';
import Wave from 'react-wavify';
import Button from '../../components/common/button/button.jsx';
import Card from '../../components/common/card/card.jsx';
import FishLogo from '../../assets/images/Fishlogo.svg';
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
              Monitor your aquarium easily, anytime, anywhere.
            </p>
            <Button 
              className="cta-button"
              onClick={handleGetStarted}
            >
              Get Started!
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

        {/* ABOUT */}
        <section id="about">
          {/* Future: About section content */}
        </section>
      </div>
    </>
  );
}

export default LandingPage;
