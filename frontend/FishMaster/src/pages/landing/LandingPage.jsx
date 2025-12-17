import React, { lazy, Suspense, memo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaWater, FaFishFins, FaRegBell, FaChartLine, FaRocket } from "react-icons/fa6";
import { BiSolidWinkSmile } from "react-icons/bi";
import Button from '../../components/common/button/button.jsx';
import Card from '../../components/common/card/card.jsx';
import FeatureItem from '../../components/landing/FeatureItem.jsx';
import StepItem from '../../components/landing/StepItem.jsx';
import FishLogo from '../../assets/images/Fishlogo.svg';
import './LandingPage.scss';
import './contact.scss';

// Lazy load non-critical components
const WaveBackground = lazy(() => import('../../components/common/wave/WaveBackground.jsx'));
const ScrollProgress = lazy(() => import('../../components/common/nav/ScrollProgress.jsx'));

// Optimized lazy section with intersection observer
const LazySection = memo(({ children, id, minHeight = '400px' }) => {
  const [isVisible, setIsVisible] = React.useState(false);
  const ref = React.useRef();

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '100px', // Reduced from 200px
        threshold: 0.01
      }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section id={id} ref={ref}>
      {isVisible ? children : <div style={{ minHeight }} />}
    </section>
  );
});

LazySection.displayName = 'LazySection';

// Memoized icon style to prevent recreation
const iconStyle = { fontSize: '2.5rem', color: '#1277b0' };

function LandingPage() {
  const navigate = useNavigate();

  // Memoize navigation handlers
  const handleSignup = useCallback(() => navigate('/signup'), [navigate]);
  const handleLogin = useCallback(() => navigate('/login'), [navigate]);
  const handleSubmit = useCallback((e) => e.preventDefault(), []);

  return (
    <>
      {/* Defer scroll progress - not critical */}
      <Suspense fallback={null}>
        <ScrollProgress />
      </Suspense>

      {/* Wave Background - Lazy load with simpler fallback */}
      <Suspense fallback={<div className="wave-fallback" aria-hidden="true" />}>
        <div className="wave-background" aria-hidden="true">
          <WaveBackground />
        </div>
      </Suspense>

      <div className="landing-container">
        {/* HERO - Critical content, no lazy loading */}
        <section id="home">
          <Card className="hero-card">
            <div className="logo-area">
              <img
                src={FishLogo}
                alt="Fish Master Logo"
                className="logo"
                loading="eager"
                fetchpriority="high"
                width="200"
                height="200"
              />
            </div>
            <p className="slogan-secondary">
              Monitor your aquarium <i><mark>easily</mark></i>, <i><mark>anytime</mark></i>, <i><mark>anywhere</mark></i>.
            </p>
            <Button className="cta-button" onClick={handleSignup}>Get Started!</Button>
            <p className="login-link-container">
              <button onClick={handleLogin} className="login-link" type="button">
                Already have an account? <b className="login-link-login">Log in</b>
              </button>
            </p>
          </Card>
        </section>

        {/* WHAT IS FISHMASTER */}
        <LazySection id="about" minHeight="300px">
          <Card className="info-card">
            <h2 className="section-title">What is FishMaster?</h2>
            <p className="section-text">
              Taking care of fish can be tricky, especially if you're not an expert. Water conditions, temperature, and tank health need constant attention, and it's easy for problems to sneak up.
            </p>
            <p className="section-text">
              Fishmaster helps by monitoring your aquarium in real-time and sending alerts when something needs attention. It makes sure your fish stay healthy, and you don't have to worry about unexpected issues.
            </p>
            <p className="section-text">
              Track water parameters, monitor fish health, get feeding reminders, and receive personalized care recommendations.
            </p>
          </Card>
        </LazySection>

        {/* FEATURES */}
        <LazySection id="features" minHeight="400px">
          <Card className="info-card">
            <h2 className="section-title">✨ Key Features</h2>
            <div className="features-grid">
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
        </LazySection>

        {/* HOW IT WORKS */}
        <LazySection id="how-it-works" minHeight="450px">
          <Card className="info-card">
            <h2 className="section-title">
              <FaRocket style={{ color: '#ff6b6b', marginRight: '10px' }} aria-hidden="true" />
              How It Works
            </h2>
            <div className="steps-container">
              <StepItem number="1" title="Create Your Account" description="Sign up in seconds and verify your email to get started." />
              <StepItem number="2" title="Set Up Your Tanks" description="Add your aquariums with size, type, and equipment details." />
              <StepItem number="3" title="Add Your Fish" description="Create profiles for each fish with species and care requirements." />
              <StepItem number="4" title="Start Tracking!" description="Log water parameters, set reminders, and watch your fish thrive." />
            </div>
          </Card>
        </LazySection>

        {/* FINAL CTA */}
        <LazySection id="get-started" minHeight="250px">
          <Card className="info-card cta-card">
            <h2 className="section-title">Ready to Dive In? 🌊</h2>
            <p className="section-text">
              Join thousands of aquarium enthusiasts who trust FishMaster to keep their aquatic friends happy and healthy.
            </p>
            <Button className="cta-button" onClick={handleSignup}>
              Start Your Free Account
            </Button>
          </Card>
        </LazySection>
      </div>

      {/* CONTACT */}
      <LazySection id="contact" minHeight="550px">
        <Card className="info-card contact-section">
          <h2 className="section-title">
            Contact Me <BiSolidWinkSmile style={iconStyle} aria-hidden="true" />
          </h2>
          <p className="section-text">
            Have questions, suggestions, or just want to say hi?
          </p>
          <p className="section-text">
            I'm the one-person team behind Fishmaster. I'd love to hear from you :D !
          </p>

          <div className="contact-info">
            <p className="section-text">
              <strong>Email:</strong> <a href="mailto:al@fishmaster.app">al@fishmaster.app</a>
            </p>
            <p className="section-text">
              <strong>Phone:</strong> <a href="tel:+15551234567">+1 (555) 123-4567</a>
            </p>
            <p className="section-text">
              <strong>Follow me:</strong>{' '}
              <a href="https://www.linkedin.com/in/abdalla-nezar-elshiekh" target="_blank" rel="noopener noreferrer">LinkedIn</a>
              {' | '}
              <a href="https://twitter.com/fishmaster" target="_blank" rel="noopener noreferrer">Twitter</a>
              {' | '}
              <a href="https://instagram.com/AlNezaree" target="_blank" rel="noopener noreferrer">Instagram</a>
            </p>
          </div>

          <form className="contact-form" onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="Your Name"
              required
              className="form-input"
              name="name"
              autoComplete="name"
            />
            <input
              type="email"
              placeholder="Your Email"
              required
              className="form-input"
              name="email"
              autoComplete="email"
            />
            <textarea
              placeholder="Your Message"
              required
              className="form-textarea"
              name="message"
              rows="5"
            />
            <Button type="submit" className="submit-button">Send Message</Button>
          </form>
        </Card>
      </LazySection>
    </>
  );
}

export default memo(LandingPage);