import React from 'react';
import Button from '../../../components/common/button/button.jsx';
import Card from '../../../components/common/card/card.jsx';
import styles from '../OnboardingFlow.module.scss';

/**
 * Step 3: Email confirmation (read-only)
 */
function EmailStep({ data, onNext, onPrev }) {
  return (
    <Card className={styles.stepCard}>
      <div className={styles.stepIcon}>📧</div>
      <h1 className={styles.stepTitle}>Your Email</h1>
      <p className={styles.stepSubtitle}>
        This is the email we'll use to keep you updated about your aquarium.
      </p>

      <div className={styles.inputGroup}>
        <label>Email Address</label>
        <input
          type="email"
          value={data.email}
          disabled
          style={{ opacity: 0.8, cursor: 'not-allowed' }}
        />
        <p className={styles.hint}>
          ✓ Email verified
        </p>
      </div>

      <div className={styles.buttonGroup}>
        <Button className={styles.backButton} onClick={onPrev}>Back</Button>
        <Button onClick={onNext}>Continue</Button>
      </div>
    </Card>
  );
}

export default EmailStep;
