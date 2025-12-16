import React from 'react';
import WaveBackground from '../common/wave/WaveBackground';
import './StepItem.scss';

/**
 * Reusable step item component for "How It Works" sections.
 * Displays a numbered step with title, description, and wave background.
 */
const StepItem = ({ number, title, description }) => (
  <div className="step-item">
    <span className="step-number">{number}</span>
    <h3>{title}</h3>
    <p>{description}</p>
    <WaveBackground />
  </div>
);

export default StepItem;
