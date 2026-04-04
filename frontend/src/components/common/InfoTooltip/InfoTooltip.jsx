import { useState } from 'react';
import { FaInfoCircle } from 'react-icons/fa';
import styles from './InfoTooltip.module.scss';

/**
 * InfoTooltip - Hoverable info icon with beginner-friendly explanations
 * 
 * TO EDIT CONTENT: Update the text props where this component is used
 * TO ADD LINKS: Use the learnMoreUrl prop (optional)
 */
const InfoTooltip = ({ 
  title, 
  whatIsIt,      // Simple 1-sentence explanation
  whyItMatters,  // Why should I care?
  ideal,         // What's the good number?
  danger,        // When should I worry?
  learnMoreUrl,  // Optional link to article/source
  learnMoreText = 'Learn more' // Optional custom link text
}) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div 
      className={styles.container}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onClick={(e) => {
        e.stopPropagation();
        setIsVisible(!isVisible);
      }}
    >
      <FaInfoCircle className={styles.icon} />
      
      {isVisible && (
        <div className={styles.tooltip}>
          <div className={styles.tooltipArrow} />
          
          <h4>{title}</h4>
          
          <div className={styles.section}>
            <span className={styles.question}>What is it?</span>
            <p>{whatIsIt}</p>
          </div>
          
          <div className={styles.section}>
            <span className={styles.question}>Why does it matter?</span>
            <p>{whyItMatters}</p>
          </div>
          
          <div className={styles.ranges}>
            <div className={styles.good}>
              <span>👍 Good:</span> {ideal}
            </div>
            <div className={styles.bad}>
              <span>⚠️ Problem:</span> {danger}
            </div>
          </div>
          
          {learnMoreUrl && (
            <a 
              href={learnMoreUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className={styles.learnMore}
              onClick={(e) => e.stopPropagation()}
            >
              {learnMoreText} →
            </a>
          )}
        </div>
      )}
    </div>
  );
};

export default InfoTooltip;
