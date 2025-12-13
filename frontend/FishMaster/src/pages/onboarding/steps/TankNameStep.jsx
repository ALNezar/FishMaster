import React, { useState } from 'react';
import Button from '../../../components/common/button/button.jsx';
import Card from '../../../components/common/card/card.jsx';
import styles from '../OnboardingFlow.module.scss';

/**
 * Step 4: Tank name input
 */
function TankNameStep({ data, updateData, onNext, onPrev }) {
  const [error, setError] = useState('');

  const handleNext = () => {
    if (!data.tankName.trim()) {
      setError('Please give your tank a name');
      return;
    }
    setError('');
    onNext();
  };

  return (
    <Card className={styles.stepCard}>
      <div className={styles.stepIcon}>🏠</div>
      <h1 className={styles.stepTitle}>Name Your Tank</h1>
      <p className={styles.stepSubtitle}>
        What would you like to call your aquarium?
      </p>

      <div className={styles.inputGroup}>
        <label htmlFor="tankName">Tank Name</label>
        <input
          type="text"
          id="tankName"
          value={data.tankName}
          onChange={(e) => updateData({ tankName: e.target.value })}
          placeholder="e.g., My First Tank, Living Room Aquarium"
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

export default TankNameStep;
