import React from 'react';
import './FeatureItem.scss';

/**
 * Reusable feature card component for landing page features grid.
 * Displays an icon, title, and description in a consistent layout.
 */
const FeatureItem = ({ icon, title, description }) => (
  <div className="feature-item">
    <span className="feature-icon icon-glow">{icon}</span>
    <h3>{title}</h3>
    <p>{description}</p>
  </div>
);

export default FeatureItem;
