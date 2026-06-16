import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Analytics from './Analytics';
import HistoryPage from './HistoryPage';
import SegmentedControl from '../../components/common/nav/SegmentedControl';
import { MdSensors, MdHistory } from 'react-icons/md';

/**
 * Data Page - Wrapper for Analytics and History
 */
function DataPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const isHistory = location.pathname.includes('/history');
  
  const [activeTab, setActiveTab] = useState(isHistory ? 'history' : 'data');

  useEffect(() => {
    setActiveTab(location.pathname.includes('/history') ? 'history' : 'data');
  }, [location.pathname]);

  const handleTabChange = (value) => {
    setActiveTab(value);
    if (value === 'history') {
      navigate('/history', { replace: true });
    } else {
      navigate('/data', { replace: true });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '0 1rem 1rem 1rem' }}>
        <SegmentedControl
          options={[
            { label: 'Sensor Data', value: 'data', icon: <MdSensors /> },
            { label: 'History Logs', value: 'history', icon: <MdHistory /> },
          ]}
          value={activeTab}
          onChange={handleTabChange}
        />
      </div>
      <div style={{ flex: 1 }}>
        {activeTab === 'data' ? <Analytics /> : <HistoryPage isTab />}
      </div>
    </div>
  );
}

export default DataPage;
