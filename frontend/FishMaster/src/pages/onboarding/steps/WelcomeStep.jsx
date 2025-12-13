import React from 'react';
import Button from '../../../components/common/button/button.jsx';
import Card from '../../../components/common/card/card.jsx';
import styles from '../OnboardingFlow.module.scss';

/**
 * Step 1: Welcome screen
 */
function WelcomeStep({ onNext }) {
  return (
    <Card className={styles.stepCard}>
      <div className={styles.stepIcon}>🐠</div>
      <h1 className={styles.stepTitle}>Welcome to FishMaster!</h1>
      <p className={styles.stepSubtitle}>
        Let's set up your aquarium.<br />
        This will take about 2 minutes <span style={{ opacity: 0.7 }}>(give or take...)</span>
      </p>
      <div className={styles.buttonGroup}>
        <Button onClick={onNext}>Let's Go!</Button>
      </div>
    </Card>
  );
}

export default WelcomeStep;
