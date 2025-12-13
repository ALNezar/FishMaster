import React from 'react';
import Button from '../../../components/common/button/button.jsx';
import Card from '../../../components/common/card/card.jsx';
import styles from '../OnboardingFlow.module.scss';

/**
 * Step 9: Review all entered data before submission
 */
function ReviewStep({ data, fishTypes, goToStep, onComplete, onPrev, loading, error }) {

  const getFishTypeName = (fishTypeId) => {
    const type = fishTypes.find(t => t.id === fishTypeId);
    return type?.name || 'Unknown';
  };

  return (
    <Card className={styles.stepCard}>
      <div className={styles.stepIcon}>📋</div>
      <h1 className={styles.stepTitle}>Review Your Setup</h1>
      <p className={styles.stepSubtitle}>
        Make sure everything looks good before we set up your tank!
      </p>

      {/* User Info */}
      <div className={styles.reviewSection}>
        <h4>
          👤 Your Info
          <button className={styles.editButton} onClick={() => goToStep(1)}>Edit</button>
        </h4>
        <p><strong>Name:</strong> {data.userName}</p>
        <p><strong>Email:</strong> {data.email}</p>
      </div>

      {/* Tank Info */}
      <div className={styles.reviewSection}>
        <h4>
          🏠 Tank Details
          <button className={styles.editButton} onClick={() => goToStep(3)}>Edit</button>
        </h4>
        <p><strong>Name:</strong> {data.tankName}</p>
        <p><strong>Size:</strong> {data.tankSize}L</p>
      </div>

      {/* Fish */}
      <div className={styles.reviewSection}>
        <h4>
          🐠 Your Fish ({data.fish.length})
          <button className={styles.editButton} onClick={() => goToStep(6)}>Edit</button>
        </h4>
        <ul>
          {data.fish.map((fish, index) => (
            <li key={index}>
              <strong>{fish.name}</strong> - {getFishTypeName(fish.fishTypeId)}
            </li>
          ))}
        </ul>
      </div>

      {/* Water Parameters */}
      <div className={styles.reviewSection}>
        <h4>
          🌡️ Water Parameters
          <button className={styles.editButton} onClick={() => goToStep(7)}>Edit</button>
        </h4>
        {data.waterParameters ? (
          <>
            <p><strong>pH:</strong> {data.waterParameters.ph}</p>
            <p><strong>Temperature:</strong> {data.waterParameters.temperature}°C</p>
          </>
        ) : (
          <p>✨ <em>Using smart defaults based on your fish species</em></p>
        )}
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.buttonGroup}>
        <Button className={styles.backButton} onClick={onPrev}>Back</Button>
        <Button onClick={onComplete} disabled={loading}>
          {loading ? 'Setting Up...' : 'Looks Good! 🎉'}
        </Button>
      </div>
    </Card>
  );
}

export default ReviewStep;
