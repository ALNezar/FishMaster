import React, { useState, useEffect } from 'react';
import Button from '../../../components/common/button/button.jsx';
import Card from '../../../components/common/card/card.jsx';
import styles from '../OnboardingFlow.module.scss';

/**
 * Step 7: Fish details (name and type for each fish)
 */
function FishDetailsStep({ data, updateData, fishTypes, onNext, onPrev }) {
  const [error, setError] = useState('');

  // Ensure fish array is properly sized
  useEffect(() => {
    if (data.fish.length !== data.fishCount) {
      updateData({
        fish: Array(data.fishCount).fill(null).map((_, i) =>
          data.fish[i] || { name: '', fishTypeId: null }
        )
      });
    }
  }, [data.fishCount]);

  const handleFishChange = (index, field, value) => {
    const newFish = [...data.fish];
    newFish[index] = { ...newFish[index], [field]: value };
    updateData({ fish: newFish });
    setError('');
  };

  const handleNext = () => {
    // Validate all fish have name and type
    for (let i = 0; i < data.fish.length; i++) {
      const fish = data.fish[i];
      if (!fish.name?.trim()) {
        setError(`Please enter a name for Fish #${i + 1}`);
        return;
      }
      if (!fish.fishTypeId) {
        setError(`Please select a type for Fish #${i + 1}`);
        return;
      }
    }
    setError('');
    onNext();
  };

  return (
    <Card className={styles.stepCard}>
      <div className={styles.stepIcon}>🐟</div>
      <h1 className={styles.stepTitle}>Fish Details</h1>
      <p className={styles.stepSubtitle}>
        Tell us about your fish! This helps us calculate optimal water conditions.
      </p>

      <div style={{ maxHeight: '400px', overflowY: 'auto', marginBottom: 16 }}>
        {data.fish.map((fish, index) => (
          <div key={index} className={styles.fishCard}>
            <div className={styles.fishCardHeader}>
              <span className={styles.fishNumber}>{index + 1}</span>
              <h4>Fish #{index + 1}</h4>
            </div>
            <div className={styles.fishInputs}>
              <div className={styles.inputGroup} style={{ marginBottom: 0 }}>
                <label>Name</label>
                <input
                  type="text"
                  value={fish.name || ''}
                  onChange={(e) => handleFishChange(index, 'name', e.target.value)}
                  placeholder="e.g., Goldie"
                />
              </div>
              <div className={styles.inputGroup} style={{ marginBottom: 0 }}>
                <label>Species</label>
                <select
                  value={fish.fishTypeId || ''}
                  onChange={(e) => handleFishChange(index, 'fishTypeId', parseInt(e.target.value))}
                >
                  <option value="">Select type...</option>
                  {fishTypes.map(type => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        ))}
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.buttonGroup}>
        <Button className={styles.backButton} onClick={onPrev}>Back</Button>
        <Button onClick={handleNext}>Continue</Button>
      </div>
    </Card>
  );
}

export default FishDetailsStep;
