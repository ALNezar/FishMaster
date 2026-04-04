import React, { useState } from 'react';
import Button from '../../../components/common/button/button.jsx';
import Card from '../../../components/common/card/card.jsx';
import styles from '../OnboardingFlow.module.scss';

/**
 * Step 2: User's name input
 */
function NameStep({ data, updateData, onNext, onPrev }) {
  const [error, setError] = useState('');

  const handleNext = () => {
    if (!data.userName.trim()) {
      setError('Please enter your name');
      return;
    }
    setError('');
    onNext();
  };

  return (
    <Card className={styles.stepCard}>
      <div className={styles.stepIcon}>👋</div>
      <h1 className={styles.stepTitle}>What's your name?</h1>
      <p className={styles.stepSubtitle}>
        We'd love to get to know you!
      </p>

      <div className={styles.inputGroup}>
        <label htmlFor="userName">Your Name</label>
        <input
          type="text"
          id="userName"
          value={data.userName}
          onChange={(e) => updateData({ userName: e.target.value })}
          placeholder="Enter your name"
          autoFocus
        />
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.buttonGroup}>
        <Button className={styles.backButton} onClick={onPrev}>Back</Button>
        <Button onClick={handleNext}>Continue</Button>
      </div>
    </Card>
  );
}

export default NameStep;
