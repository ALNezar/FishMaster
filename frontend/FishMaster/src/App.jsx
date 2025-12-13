import React from 'react';
import './App.scss';

import ScrollProgress from './components/common/nav/ScrollProgress.jsx';
import Button from './components/common/button/button.jsx';
import Card from './components/common/card/card.jsx';

import FishLogo from './assets/images/Fishlogo.svg';
import BlackRedFish from './assets/images/blackandredfish.svg';

function App() {
  return (
    <>
      {/* Scroll indicator must be global */}
      <ScrollProgress />

      <div className="landing-container">
        
        {/* HERO */}
        <section id="home">
          <Card className="hero-card">
            <div className="logo-area">
              <img
                src={FishLogo}
                alt="Fish Master Logo"
                className="logo"
              />
            </div>

            <p className="slogan-secondary">
              Monitor your aquarium easily, anytime, anywhere.
            </p>

            <Button className="cta-button">Get Started!</Button>

            <p className="login-link-container">
              <a href="/login" className="login-link">
                Already have an account? Log in
              </a>
            </p>
          </Card>
        </section>

        {/* ABOUT */}
        <section id="about">
          <Card className="about-card">
            <Button className="about-button">About</Button>

            <h2 className="about-heading">
              what is <span className="fish-text">FishMaster </span> anyways?
            </h2>

            <p className="about-intro">TO BEGIN....</p>

            <p className="fish-intro">
              THIS IS OUR HUMBLE FRIEND THE{' '}
              <span className="fish-highlight">FISH</span>
            </p>

            <div className="fish-illustration">
              <img
                src={BlackRedFish}
                alt="Fish illustration"
                className="small-fish"
              />
            </div>
          </Card>
        </section>

      </div>
    </>
  );
}

export default App;
