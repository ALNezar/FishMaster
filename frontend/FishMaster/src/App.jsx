import React from 'react';
import './App.scss';
import Button from './components/common/button/button.jsx';
import Nav from './components/common/nav/NavBar.jsx';
import Card from './components/common/card/card.jsx';
import FishLogo from './assets/images/Fishlogo.svg';
import BlackRedFish from './assets/images/blackandredfish.svg';

function App() {
  return (
    
    <div className="landing-container">
      <Card className="hero-card">
       
           <Nav />

        <div className="logo-area">
          <img src={FishLogo} alt="Fish Master Logo" className="logo" />
        </div>

        <p className="slogan-secondary">Monitor your aquarium easily, anytime, anywhere.</p>

        <Button className="cta-button">Get Started !</Button>

        <p className="login-link-container">
          <a href="/login" className="login-link">Already have an account? Log in</a>
        </p>
      </Card>

      <Card className="about-card">
        <Button className="about-button">About</Button>

        <h2 className="about-heading">what is <span className="fish-text">Fish</span>Master anyways?</h2>

        <p className="about-intro">TO BEGIN....</p>

        <p className="fish-intro">THIS IS OUR HUMBLE FRIEND THE <span className="fish-highlight">FISH</span></p>

        <div className="fish-illustration">
          <img src={BlackRedFish} alt="Fish illustration" className="small-fish" />
        </div>
      </Card>
    </div>
  );
}

export default App;
