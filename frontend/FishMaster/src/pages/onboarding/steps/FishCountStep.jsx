import React from 'react';
import Button from '../../../components/common/button/button.jsx';
import Card from '../../../components/common/card/card.jsx';
import styles from '../OnboardingFlow.module.scss';

/**
 * Step 6: Fish count selection
 */
function FishCountStep({ data, updateData, onNext, onPrev }) {

  const handleSliderChange = (e) => {
    const count = parseInt(e.target.value, 10);
    updateData({ 
      fishCount: count,
      // Initialize fish array with empty entries
      fish: Array(count).fill(null).map((_, i) => 
        data.fish[i] || { name: '', fishTypeId: null }
      )
    });
  };

  return (
    <Card className={styles.stepCard}>
      <div className={styles.stepIcon}>🐠</div>
      <h1 className={styles.stepTitle}>How Many Fish?</h1>
      <p className={styles.stepSubtitle}>
        How many fish do you have (or plan to have)?
      </p>

      <div className={styles.countDisplay}>{data.fishCount}</div>

      <input
        type="range"
        className={styles.countSlider}
        min="1"
        max="20"
        value={data.fishCount}
        onChange={handleSliderChange}
      />

      <div className={styles.countLabels}>
        <span>1</span>
        <span>20</span>
      </div>

      <p style={{ marginTop: 24, fontSize: 14, color: '#888' }}>
        💡 Tip: A good rule is about 1 inch of fish per gallon (roughly 1cm per liter)
      </p>

      <div className={styles.buttonGroup}>
        <Button className={styles.backButton} onClick={onPrev}>Back</Button>
        <Button onClick={onNext}>Continue</Button>
      </div>
    </Card>
  );
}

export default FishCountStep;
