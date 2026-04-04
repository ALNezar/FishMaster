import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login, getOnboardingStatus } from '../../services/api.js';
import Button from '../../components/common/button/button.jsx';
import Card from '../../components/common/card/card.jsx';
import Wave from 'react-wavify';
import styles from './LoginPage.module.scss';

/**
 * Login page for existing users.
 * After login, checks onboarding status to redirect appropriately.
 */
function LoginPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.email.trim() || !formData.password) {
      setError('Please enter your email and password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await login(formData.email, formData.password);
      
      // Check if onboarding is complete
      try {
        const status = await getOnboardingStatus();
        if (status.completed) {
          navigate('/dashboard');
        } else {
          navigate('/onboarding', { state: { email: formData.email } });
        }
      } catch {
        // If status check fails, default to dashboard
        navigate('/dashboard');
      }
    } catch (err) {
      if (err.message?.includes('not verified')) {
        setError('Please verify your email before logging in');
      } else {
        setError(err.message || 'Invalid email or password');
      }
    } finally {
      setLoading(false);
    }
  };

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
        <Card className={styles.card}>
          <div className={styles.header}>
            <h1 className={styles.title}>🐠 Welcome Back!</h1>
            <p className={styles.subtitle}>Log in to check on your aquarium</p>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.inputGroup}>
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Your password"
                autoComplete="current-password"
              />
            </div>

            {error && <div className={styles.error}>{error}</div>}

            <Button 
              type="submit" 
              className={styles.submitBtn}
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Log In'}
            </Button>
          </form>

          <p className={styles.signupPrompt}>
            Don't have an account?{' '}
            <Link to="/signup" className={styles.signupLink}>Sign up</Link>
          </p>
        </Card>
      </div>
    </>
  );
}

export default LoginPage;
