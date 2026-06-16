import React from 'react';
import styles from './SegmentedControl.module.scss';
import { haptics } from '../../../utils/haptics';

/**
 * Native-style segmented control
 */
export default function SegmentedControl({ options, value, onChange }) {
  return (
    <div className={styles.segmentedControl}>
      {options.map((opt) => (
        <button
          key={opt.value}
          className={`${styles.segment} ${value === opt.value ? styles.active : ''}`}
          onClick={() => {
            if (value !== opt.value) {
              haptics.tap();
              onChange(opt.value);
            }
          }}
        >
          {opt.icon && <span className={styles.icon}>{opt.icon}</span>}
          {opt.label}
        </button>
      ))}
    </div>
  );
}
