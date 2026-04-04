import React, { useState } from 'react';
import Button from '../../../components/common/button/button.jsx';
import Card from '../../../components/common/card/card.jsx';
import styles from '../OnboardingFlow.module.scss';

/**
 * Step 5: Tank size selection
 * Based on literature, small tanks (20-70L) are the target for FishMaster
 */
function TankSizeStep({ data, updateData, onNext, onPrev }) {
  const [error, setError] = useState('');
  const [customSize, setCustomSize] = useState('');

  const sizePresets = [
    { label: 'Small', range: '20L', value: 20, icon: '🐟' },
    { label: 'Medium', range: '50L', value: 50, icon: '🐠' },
    { label: 'Large', range: '100L', value: 100, icon: '🐡' },
  ];

  const handlePresetClick = (value) => {
    updateData({ tankSize: value });
    setCustomSize('');
    setError('');
  };

  const handleCustomChange = (e) => {
    const value = e.target.value;
    setCustomSize(value);
    if (value) {
      const numValue = parseInt(value, 10);
      if (!isNaN(numValue) && numValue > 0) {
        updateData({ tankSize: numValue });
        setError('');
      }
    }
  };

  const handleNext = () => {
    if (!data.tankSize || data.tankSize <= 0) {
      setError('Please select or enter a tank size');
      return;
    }
    setError('');
    onNext();
  };

  return (
    <Card className={styles.stepCard}>
      <div className={styles.stepIcon}>📏</div>
      <h1 className={styles.stepTitle}>Tank Size</h1>
      <p className={styles.stepSubtitle}>
        How big is your aquarium? This helps us calculate safe fish capacity.
      </p>

      <div className={styles.sizeCards}>
        {sizePresets.map((preset) => (
          <div
            key={preset.value}
            className={`${styles.sizeCard} ${data.tankSize === preset.value && !customSize ? styles.selected : ''}`}
            onClick={() => handlePresetClick(preset.value)}
          >
            <div className={styles.sizeIcon}>{preset.icon}</div>
            <div className={styles.sizeLabel}>{preset.label}</div>
            <div className={styles.sizeRange}>{preset.range}</div>
          </div>
        ))}
      </div>

      <div className={styles.inputGroup}>
        <label htmlFor="customSize">Or enter exact size (liters)</label>
        <input
          type="number"
          id="customSize"
          value={customSize}
          onChange={handleCustomChange}
          placeholder="e.g., 35"
          min="1"
          max="500"
        />
        <p className={styles.hint}>
          💡 Small tanks (20-70L) require more careful monitoring due to limited water volume
        </p>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.buttonGroup}>
        <Button className={styles.backButton} onClick={onPrev}>Back</Button>
        <Button onClick={handleNext}>Continue</Button>
      </div>
    </Card>
  );
}

export default TankSizeStep;
