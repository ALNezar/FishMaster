import React from 'react';
import Button from '../../../components/common/button/button.jsx';
import Card from '../../../components/common/card/card.jsx';
import styles from '../OnboardingFlow.module.scss';

/**
 * Step 10: Success - Tank is ready!
 */
function SuccessStep({ data, navigate }) {

  const handleGoToDashboard = () => {
    navigate('/dashboard');
  };

  return (
    <Card className={`${styles.stepCard} ${styles.successCard}`}>
      <div className={styles.successIcon}>🐠</div>
      <h1 className={styles.stepTitle}>Your Tank is Ready!</h1>
      <p className={styles.stepSubtitle}>
        FishMaster is now monitoring your <span className={styles.tankName}>{data.tankName}</span>.
        <br /><br />
        You'll receive alerts when water conditions need attention, and we'll help keep your fish happy and healthy!
      </p>

      <div style={{ 
        background: '#e8f4fc', 
        padding: 20, 
        borderRadius: 12,
        marginBottom: 24,
        textAlign: 'left'
      }}>
        <h4 style={{ margin: '0 0 12px 0', color: '#1277b0' }}>🎯 What's Next?</h4>
        <ul style={{ margin: 0, paddingLeft: 20, color: '#2c1810' }}>
          <li>Connect your FishMaster device to start real-time monitoring</li>
          <li>Set up feeding schedules for automated care</li>
          <li>Explore educational content to learn more about your fish</li>
        </ul>
      </div>

      <div className={styles.buttonGroup}>
        <Button onClick={handleGoToDashboard}>
          Go to Dashboard 🚀
        </Button>
      </div>
    </Card>
  );
}

export default SuccessStep;
