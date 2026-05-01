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
              Aquarium monitoring and control system using ESP32, Spring Boot, and React.
            </p>
            <Button className="cta-button" onClick={handleSignup}>Create Account</Button>
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
            <h2 className="section-title">About the Project</h2>
            <p className="section-text">
              FishMaster is a Final Year Project at UTHM built to monitor aquarium water conditions and control feeding.
            </p>
            <p className="section-text">
              The embedded layer runs on ESP32 and continues working without internet. The web layer provides remote monitoring, history, and control when connectivity is available.
            </p>
            <p className="section-text">
              The goal is to reduce manual checking and keep routine aquarium care consistent.
            </p>
            <h2 className="section-title">Problem Motivation</h2>
            <p className="section-text">
              Water conditions can drift gradually and become unsafe before visible symptoms appear. FishMaster was built to measure key parameters continuously and report unsafe conditions early.
            </p>
          </Card>
        </LazySection>

        {/* FEATURES */}
        <LazySection id="features" minHeight="400px">
          <Card className="info-card">
            <h2 className="section-title">Features</h2>
            <div className="features-grid">
              <FeatureItem
                icon={<FaWater style={iconStyle} />}
                title="Water Monitoring"
                description="Tracks temperature, pH, and turbidity. Values are shown locally and on the dashboard."
              />
              <FeatureItem
                icon={<FaFishFins style={iconStyle} />}
                title="Automatic Feeding"
                description="An SG90 servo dispenses feed on schedule. Feeding can be paused when conditions are unsafe."
              />
              <FeatureItem
                icon={<FaRegBell style={iconStyle} />}
                title="Alerts"
                description="Flags unsafe water conditions so action can be taken before fish health is affected."
              />
              <FeatureItem
                icon={<FaChartLine style={iconStyle} />}
                title="Dashboard"
                description="Provides live readings, historical charts, feeding logs, tank configuration, and multi-tank support."
              />
            </div>
            <p className="section-text">
              Offline mode is supported: sensing, feeding, and local LCD display continue without cloud connectivity.
            </p>
          </Card>
        </LazySection>

        {/* HOW IT WORKS */}
        <LazySection id="how-it-works" minHeight="450px">
          <Card className="info-card">
            <h2 className="section-title">
              <FaRocket style={{ color: '#ff6b6b', marginRight: '10px' }} aria-hidden="true" />
              System Overview
            </h2>
            <div className="steps-container">
              <StepItem number="1" title="Offline Layer (ESP32)" description="Reads sensors, controls the feeder, and updates the local LCD independently of internet access." />
              <StepItem number="2" title="Telemetry Uplink" description="When Wi-Fi is available, ESP32 publishes readings through MQTT for backend processing and storage." />
              <StepItem number="3" title="Cloud Processing" description="Spring Boot handles device data, persists records in PostgreSQL, and broadcasts updates via WebSocket." />
              <StepItem number="4" title="Remote Control" description="User commands from the React dashboard are sent back through MQTT and executed on ESP32." />
            </div>
          </Card>
        </LazySection>

        {/* TECH STACK */}
        <LazySection id="get-started" minHeight="250px">
          <Card className="info-card">
            <h2 className="section-title">Tech Stack</h2>
            <p className="section-text"><strong>Hardware:</strong> ESP32 DevKit, pH sensor, DS18B20, turbidity sensor, 2.8" touch LCD, SG90 servo motor.</p>
            <p className="section-text"><strong>Backend:</strong> Java, Spring Boot, REST API, MQTT, WebSocket.</p>
            <p className="section-text"><strong>Frontend:</strong> React, JavaScript.</p>
            <p className="section-text"><strong>Database:</strong> PostgreSQL.</p>
            <p className="section-text"><strong>Cloud:</strong> HiveMQ, Railway.</p>

            <h2 className="section-title">Cloud Architecture</h2>
            <p className="section-text">Data flow: ESP32 publishes sensor data via MQTT, HiveMQ routes messages, Spring Boot processes and stores records, and the React dashboard renders real-time updates.</p>
            <p className="section-text">Control flow: users send commands from the dashboard, backend publishes commands through MQTT, and ESP32 executes them.</p>

            <h2 className="section-title">Progress</h2>
            <p className="section-text">Sensor integration, backend API, React dashboard, MQTT communication, servo feeding, offline/online switching, and multi-tank support are implemented.</p>

            <h2 className="section-title">Demo</h2>
            <p className="section-text">
              Development version (some features are limited):{' '}
              <a href="https://fishmaster.up.railway.app/" target="_blank" rel="noopener noreferrer">https://fishmaster.up.railway.app/</a>
            </p>
            <Button className="cta-button" onClick={handleSignup}>
              Open Dashboard Access
            </Button>
          </Card>
        </LazySection>
      </div>

      {/* CONTACT */}
      <LazySection id="contact" minHeight="550px">
        <Card className="info-card contact-section">
          <h2 className="section-title">
            Contact <BiSolidWinkSmile style={iconStyle} aria-hidden="true" />
          </h2>
          <p className="section-text">
            Built by Abdalla Elshiekh.
          </p>

          <div className="contact-info">
            <p className="section-text">
              <strong>Email:</strong> <a href="mailto:abdallanezaree@gmail.com">abdallanezaree@gmail.com</a>
            </p>
            <p className="section-text">
              <strong>GitHub:</strong>{' '}
              <a href="https://github.com/ALNezar" target="_blank" rel="noopener noreferrer">github.com/ALNezar</a>
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