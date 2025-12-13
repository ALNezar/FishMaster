import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { verifyEmail, resendVerificationCode } from '../../services/api.js';
import Button from '../../components/common/button/button.jsx';
import Card from '../../components/common/card/card.jsx';
import Wave from 'react-wavify';
import styles from './VerifyEmailPage.module.scss';

/**
 * Email verification page.
 * User enters the 6-digit code sent to their email.
 */
function VerifyEmailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || '';
  
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  
  const inputRefs = useRef([]);

  // Redirect if no email
  useEffect(() => {
    if (!email) {
      navigate('/signup');
    }
  }, [email, navigate]);

  const handleChange = (index, value) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;
    
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    setError('');
    setResendSuccess(false);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    
    if (/^\d{6}$/.test(pastedData)) {
      const digits = pastedData.split('');
      setCode(digits);
      inputRefs.current[5]?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const fullCode = code.join('');
    if (fullCode.length !== 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await verifyEmail(email, fullCode);
      // Success! Navigate to onboarding
      navigate('/onboarding', { state: { email } });
    } catch (err) {
      setError(err.message || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError('');
    setResendSuccess(false);

    try {
      await resendVerificationCode(email);
      setResendSuccess(true);
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err) {
      setError(err.message || 'Failed to resend code');
    } finally {
      setResending(false);
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
            <div className={styles.emailIcon}>📧</div>
            <h1 className={styles.title}>Check Your Email</h1>
            <p className={styles.subtitle}>
              We sent a 6-digit verification code to<br />
              <strong>{email}</strong>
            </p>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.codeInputs} onPaste={handlePaste}>
              {code.map((digit, index) => (
                <input
                  key={index}
                  ref={el => inputRefs.current[index] = el}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleChange(index, e.target.value)}
                  onKeyDown={e => handleKeyDown(index, e)}
                  className={styles.codeInput}
                  autoFocus={index === 0}
                />
              ))}
            </div>

            {error && <div className={styles.error}>{error}</div>}
            {resendSuccess && (
              <div className={styles.success}>
                New verification code sent! Check your email.
              </div>
            )}

            <Button 
              type="submit" 
              className={styles.submitBtn}
              disabled={loading}
            >
              {loading ? 'Verifying...' : 'Verify Email'}
            </Button>
          </form>

          <div className={styles.resendSection}>
            <p>Didn't receive the code?</p>
            <button 
              onClick={handleResend}
              disabled={resending}
              className={styles.resendBtn}
            >
              {resending ? 'Sending...' : 'Resend Code'}
            </button>
          </div>

          <p className={styles.backPrompt}>
            <Link to="/signup" className={styles.backLink}>
              ← Back to Sign Up
            </Link>
          </p>
        </Card>
      </div>
    </>
  );
}

export default VerifyEmailPage;
