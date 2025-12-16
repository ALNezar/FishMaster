import React from 'react';
import Wave from 'react-wavify';

/**
 * Reusable animated wave background component.
 * Uses react-wavify for a smooth ocean-like animation effect.
 */
const WaveBackground = ({ className }) => (
  <Wave
    className={className}
    fill="#1277b0"
    paused={false}
    options={{ height: -11, amplitude: 30, speed: 0.15, points: 5 }}
  />
);

export default WaveBackground;
