import React from 'react';
import './index.scss';
import './App.scss';
import { CustomScroll } from "react-custom-scroll";
import ScrollProgress from './components/common/nav/ScrollProgress.jsx';
import Button from './components/common/button/button.jsx';
import Card from './components/common/card/card.jsx';

import FishLogo from './assets/images/Fishlogo.svg';
import BlackRedFish from './assets/images/blackandredfish.svg';
import Wave from 'react-wavify';

function App() {
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
              Monitor your aquarium easily, anytime, anywhere.
            </p>
            <Button className="cta-button">Get Started!
              (sign up)
            </Button>
            <p className="login-link-container">
              <a href="/login" className="login-link">Already have an account? Log in</a>
            </p>
          </Card>
        </section>

        {/* ABOUT */}
        <section id="about">
          <Card className="about-card">
           
              
            <div className="fish-illustration">
              <img src={BlackRedFish} alt="Fish illustration" className="small-fish" />
            </div>
          </Card>
        </section>

          
      </div>
    </>
  );
}

export default App;
