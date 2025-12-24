import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signup } from '../../services/api.js';
import Button from '../../components/common/button/button.jsx';
import Card from '../../components/common/card/card.jsx';
import Wave from 'react-wavify';
import styles from './SignupPage.module.scss';

/**
 * Signup page for new user registration.
 * After successful signup, redirects to email verification.
 */
function SignupPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const validateForm = () => {
    if (!formData.username.trim()) {
      setError('Please enter your name');
      return false;
    }
    if (!formData.email.trim()) {
      setError('Please enter your email');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    setError('');

    try {
      await signup(formData.username, formData.email, formData.password);
      // Navigate to verification page with email and password (for auto-login after verify)
      navigate('/verify', { state: { email: formData.email, password: formData.password } });
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
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
            <h1 className={styles.title}>🐠 Join FishMaster</h1>
            <p className={styles.subtitle}>Create your account to start monitoring your aquarium</p>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.inputGroup}>
              <label htmlFor="username">Your Name</label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Enter your name"
                autoComplete="name"
              />
            </div>

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
                placeholder="At least 6 characters"
                autoComplete="new-password"
              />
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Repeat your password"
                autoComplete="new-password"
              />
            </div>

            {error && <div className={styles.error}>{error}</div>}

            <Button 
              type="submit" 
              className={styles.submitBtn}
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>

          <p className={styles.loginPrompt}>
            Already have an account?{' '}
            <Link to="/login" className={styles.loginLink}>Log in</Link>
          </p>
        </Card>
      </div>
    </>
  );
}

export default SignupPage;
