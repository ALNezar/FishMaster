import React, { useState } from 'react';
import Button from '../../../components/common/button/button.jsx';
import Card from '../../../components/common/card/card.jsx';
import styles from '../OnboardingFlow.module.scss';

/**
 * Step 8: Water parameters (optional - user can skip to use defaults)
 */
function WaterParamsStep({ data, updateData, onNext, onPrev }) {
  const [useDefaults, setUseDefaults] = useState(data.waterParameters === null);
  const [ph, setPh] = useState(data.waterParameters?.ph || '7.0');
  const [temp, setTemp] = useState(data.waterParameters?.temperature || '24.0');

  const handleOptionChange = (useDefault) => {
    setUseDefaults(useDefault);
    if (useDefault) {
      updateData({ waterParameters: null });
    } else {
      updateData({
        waterParameters: {
          ph: parseFloat(ph),
          temperature: parseFloat(temp)
        }
      });
    }
  };

  const handleParamChange = (field, value) => {
    if (field === 'ph') setPh(value);
    if (field === 'temperature') setTemp(value);
    
    if (!useDefaults) {
      updateData({
        waterParameters: {
          ph: parseFloat(field === 'ph' ? value : ph),
          temperature: parseFloat(field === 'temperature' ? value : temp)
        }
      });
    }
  };

  return (
    <Card className={styles.stepCard}>
      <div className={styles.stepIcon}>🌡️</div>
      <h1 className={styles.stepTitle}>Water Parameters</h1>
      <p className={styles.stepSubtitle}>
        Set your target water conditions, or let us calculate optimal values based on your fish.
      </p>

      <div className={styles.toggleGroup}>
        <div
          className={`${styles.toggleOption} ${useDefaults ? styles.selected : ''}`}
          onClick={() => handleOptionChange(true)}
        >
          <div className={styles.toggleIcon}>✨</div>
          <div className={styles.toggleLabel}>Use Smart Defaults</div>
        </div>
        <div
          className={`${styles.toggleOption} ${!useDefaults ? styles.selected : ''}`}
          onClick={() => handleOptionChange(false)}
        >
          <div className={styles.toggleIcon}>⚙️</div>
          <div className={styles.toggleLabel}>Set Manually</div>
        </div>
      </div>

      {useDefaults ? (
        <div style={{ 
          background: '#e8f4fc', 
          padding: 20, 
          borderRadius: 12,
          marginBottom: 16 
        }}>
          <p style={{ margin: 0, color: '#1277b0', fontSize: 15 }}>
            🧠 We'll calculate the optimal pH and temperature based on the overlapping 
            safe ranges for all your fish species. This ensures all your fish can thrive together!
          </p>
        </div>
      ) : (
        <div className={styles.paramInputs}>
          <div className={styles.inputGroup} style={{ marginBottom: 16 }}>
            <label>Target pH</label>
            <input
              type="number"
              step="0.1"
              min="5.0"
              max="9.0"
              value={ph}
              onChange={(e) => handleParamChange('ph', e.target.value)}
            />
            <p className={styles.hint}>Most freshwater fish: 6.5 - 7.5</p>
          </div>
          <div className={styles.inputGroup} style={{ marginBottom: 16 }}>
            <label>Target Temperature (°C)</label>
            <input
              type="number"
              step="0.5"
              min="15"
              max="32"
              value={temp}
              onChange={(e) => handleParamChange('temperature', e.target.value)}
            />
            <p className={styles.hint}>Tropical fish: 24 - 28°C</p>
          </div>
        </div>
      )}

      <div className={styles.buttonGroup}>
        <Button className={styles.backButton} onClick={onPrev}>Back</Button>
        <Button onClick={onNext}>Continue</Button>
      </div>
    </Card>
  );
}

export default WaterParamsStep;
