import React from 'react';
import Analytics from './Analytics';

/**
 * Data Page - Wrapper for Analytics
 */
function DataPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flex: 1 }}>
        <Analytics />
      </div>
    </div>
  );
}

export default DataPage;
