import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaWater, FaFishFins, FaRegBell, FaChartLine, FaRocket } from "react-icons/fa6";
import { BiSolidWinkSmile } from "react-icons/bi";
import Button from '../../components/common/button/button.jsx';
import Card from '../../components/common/card/card.jsx';
import WaveBackground from '../../components/common/wave/WaveBackground.jsx';
import FeatureItem from '../../components/landing/FeatureItem.jsx';
import StepItem from '../../components/landing/StepItem.jsx';
import FishLogo from '../../assets/images/Fishlogo.svg';
import ScrollProgress from '../../components/common/nav/ScrollProgress.jsx';
import './LandingPage.scss';
import './contact.scss';



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
          <Card className="hero-card" data-aos="zoom-in">
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
                Already have an account? <b className="login-link-login">Log in</b>
              </button>
            </p>
          </Card>
        </section>

        {/* WHAT IS FISHMASTER */}
        <section id="about">
          <Card className="info-card">
            <h2 className="section-title">What is FishMaster?</h2>
            <p className="section-text">
              Taking care of fish can be tricky, especially if you’re not an expert. Water conditions, temperature, and tank health need constant attention, and it’s easy for problems to sneak up.

              Fishmaster helps by monitoring your aquarium in real-time and sending alerts when something needs attention. It makes sure your fish stay healthy, and you don’t have to worry about unexpected issues.

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
            <Button className="cta-button" onClick={() => navigate('/signup')} >
              Start Your Free Account
            </Button>
          </Card>
        </section>
      </div>

      {/* contact  */}
      <section id="contact" className="contact-section" >
        <Card className="info-card" >
          <h2 className="section-title"
          >
            Contact Me {<BiSolidWinkSmile style={iconStyle} />}
          </h2>
          <p className="section-text">
            Have questions, suggestions, or just want to say hi?
            <p>I'm the one-person team behind Fishmaster. </p>
            <p> I’d love to hear from you :D !</p>
          </p>


          <div className="contact-info">
            <p className="section-text">
              <strong>Email:</strong> <a href="mailto:al@fishmaster.app">al@fishmaster.app</a>
            </p>
            <p className="section-text">
              <strong>Phone:</strong> <a href="tel:+15551234567">+1 (555) 123-4567</a>
            </p>
            <p className="section-text">
              <strong>Follow me:</strong>
              <a href="https://twitter.com/fishmaster" target="_blank" rel="noopener noreferrer">Twitter</a> |
              <a href="https://instagram.com/AlNezaree" target="_blank" rel="noopener noreferrer">Instagram</a>
            </p>
          </div>

          <form className="contact-form" onSubmit={(e) => e.preventDefault()}>
            <input type="text" placeholder="Your Name" required className="form-input" />
            <input type="email" placeholder="Your Email" required className="form-input" />
            <textarea placeholder="Your Message" required className="form-textarea"></textarea>
            <Button type="submit" className="submit-button">Send Message</Button>
          </form>
        </Card>
      </section>
    </>
  );

}

export default LandingPage;