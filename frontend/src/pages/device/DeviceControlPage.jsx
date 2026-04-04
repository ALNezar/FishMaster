import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  FaMicrochip,
  FaWifi,
  FaMemory,
  FaClock,
  FaSync,
  FaPowerOff,
  FaUtensils,
  FaHistory,
  FaPlus,
  FaTrash,
  FaEdit,
  FaSave,
  FaTimes,
  FaCheck,
  FaExclamationTriangle,
  FaThermometerHalf,
  FaTint,
  FaWater,
  FaFlask,
  FaSignal,
} from 'react-icons/fa';
import { MdNetworkWifi, MdSpeed } from 'react-icons/md';
import Card from '../../components/common/card/card';
import Button from '../../components/common/button/button';
import {
  getDeviceInfo,
  updateDeviceInfo,
  getFeedingSchedules,
  createFeedingSchedule,
  updateFeedingSchedule,
  deleteFeedingSchedule,
  triggerManualFeeding,
  getFeedingHistory,
  reconnectDevice,
} from '../../services/api';
import esp32Image from '../../assets/images/esp32-device.svg';
import styles from './DeviceControlPage.module.scss';

const TABS = [
  { id: 'device', label: 'Device Info', icon: FaMicrochip },
  { id: 'feeder', label: 'Feeder Control', icon: FaUtensils },
  { id: 'history', label: 'Feeding History', icon: FaHistory },
];

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const formatUptime = (seconds) => {
  const days = Math.floor(seconds / (24 * 60 * 60));
  const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
  const mins = Math.floor((seconds % (60 * 60)) / 60);
  if (days > 0) return `${days}d ${hours}h ${mins}m`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
};

const formatTimeAgo = (isoString) => {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (mins > 0) return `${mins} minute${mins > 1 ? 's' : ''} ago`;
  return 'Just now';
};

const getSignalStrengthLabel = (dBm) => {
  if (dBm >= -50) return { label: 'Excellent', color: '#16a34a' };
  if (dBm >= -60) return { label: 'Good', color: '#22c55e' };
  if (dBm >= -70) return { label: 'Fair', color: '#f59e0b' };
  return { label: 'Weak', color: '#dc2626' };
};

export default function DeviceControlPage() {
  const { user } = useOutletContext() || {};
  const [activeTab, setActiveTab] = useState('device');
  const [loading, setLoading] = useState(true);
  const [device, setDevice] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [history, setHistory] = useState([]);
  const [isFeeding, setIsFeeding] = useState(false);
  const [feedingPortion, setFeedingPortion] = useState('medium');
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [newDeviceName, setNewDeviceName] = useState('');
  const [showAddSchedule, setShowAddSchedule] = useState(false);
  const [newSchedule, setNewSchedule] = useState({
    time: '12:00',
    portionSize: 'medium',
    label: '',
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
  });
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [deviceData, schedulesData, historyData] = await Promise.all([
        getDeviceInfo(),
        getFeedingSchedules(),
        getFeedingHistory(10),
      ]);
      setDevice(deviceData);
      setSchedules(schedulesData);
      setHistory(historyData);
      setNewDeviceName(deviceData.name);
    } catch (err) {
      console.error('Failed to load device data:', err);
    } finally {
      setLoading(false);
    }
  };

  const showSuccess = (message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleReconnect = async () => {
    setIsReconnecting(true);
    try {
      await reconnectDevice();
      await loadData();
      showSuccess('Device reconnected successfully!');
    } catch (err) {
      console.error('Reconnect failed:', err);
    } finally {
      setIsReconnecting(false);
    }
  };

  const handleUpdateName = async () => {
    if (!newDeviceName.trim()) return;
    try {
      const updated = await updateDeviceInfo({ name: newDeviceName.trim() });
      setDevice(updated);
      setEditingName(false);
      showSuccess('Device name updated!');
    } catch (err) {
      console.error('Failed to update name:', err);
    }
  };

  const handleManualFeed = async () => {
    setIsFeeding(true);
    try {
      await triggerManualFeeding(feedingPortion);
      const historyData = await getFeedingHistory(10);
      setHistory(historyData);
      showSuccess(`Fed ${feedingPortion} portion successfully!`);
    } catch (err) {
      console.error('Manual feeding failed:', err);
    } finally {
      setIsFeeding(false);
    }
  };

  const handleToggleSchedule = async (scheduleId, enabled) => {
    try {
      await updateFeedingSchedule(scheduleId, { enabled });
      setSchedules(schedules.map(s => s.id === scheduleId ? { ...s, enabled } : s));
    } catch (err) {
      console.error('Failed to toggle schedule:', err);
    }
  };

  const handleDeleteSchedule = async (scheduleId) => {
    try {
      await deleteFeedingSchedule(scheduleId);
      setSchedules(schedules.filter(s => s.id !== scheduleId));
      showSuccess('Schedule deleted!');
    } catch (err) {
      console.error('Failed to delete schedule:', err);
    }
  };

  const handleAddSchedule = async () => {
    if (!newSchedule.label.trim()) {
      newSchedule.label = `Feed at ${newSchedule.time}`;
    }
    try {
      const created = await createFeedingSchedule(newSchedule);
      setSchedules([...schedules, created]);
      setShowAddSchedule(false);
      setNewSchedule({
        time: '12:00',
        portionSize: 'medium',
        label: '',
        daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
      });
      showSuccess('Schedule created!');
    } catch (err) {
      console.error('Failed to create schedule:', err);
    }
  };

  const toggleDayInSchedule = (dayIndex) => {
    const days = newSchedule.daysOfWeek.includes(dayIndex)
      ? newSchedule.daysOfWeek.filter(d => d !== dayIndex)
      : [...newSchedule.daysOfWeek, dayIndex].sort();
    setNewSchedule({ ...newSchedule, daysOfWeek: days });
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loader}>
          <FaMicrochip className={styles.spinIcon} />
        </div>
        <p>Connecting to device...</p>
      </div>
    );
  }

  const signalInfo = getSignalStrengthLabel(device?.signalStrength || -80);

  return (
    <div className={styles.pageContainer}>
      {/* Success Toast */}
      {successMessage && (
        <div className={styles.successToast}>
          <FaCheck /> {successMessage}
        </div>
      )}

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <FaMicrochip className={styles.headerIcon} />
          <div>
            <h1>Device Control</h1>
            <p className={styles.subtitle}>Manage your AquaSense device and automatic feeder</p>
          </div>
        </div>
        <div className={styles.headerRight}>
          <span className={`${styles.statusBadge} ${styles[device?.status || 'offline']}`}>
            <span className={styles.statusDot}></span>
            {device?.status === 'online' ? 'Online' : device?.status === 'error' ? 'Error' : 'Offline'}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabsContainer}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`${styles.tab} ${activeTab === tab.id ? styles.activeTab : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <tab.icon />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className={styles.tabContent}>
        {/* Device Info Tab */}
        {activeTab === 'device' && (
          <div className={styles.deviceTab}>
            <div className={styles.deviceGrid}>
              {/* Device Image Card */}
              <Card className={styles.deviceImageCard}>
                <div className={styles.deviceImageWrapper}>
                  <img src={esp32Image} alt="ESP32 Device" className={styles.deviceImage} />
                  <div className={`${styles.statusIndicator} ${styles[device?.status || 'offline']}`}>
                    {device?.status === 'online' ? <FaWifi /> : <FaPowerOff />}
                  </div>
                </div>
                <div className={styles.deviceNameSection}>
                  {editingName ? (
                    <div className={styles.editNameRow}>
                      <input
                        type="text"
                        value={newDeviceName}
                        onChange={(e) => setNewDeviceName(e.target.value)}
                        className={styles.nameInput}
                        autoFocus
                      />
                      <button onClick={handleUpdateName} className={styles.iconBtn}>
                        <FaSave />
                      </button>
                      <button onClick={() => setEditingName(false)} className={styles.iconBtn}>
                        <FaTimes />
                      </button>
                    </div>
                  ) : (
                    <div className={styles.deviceNameRow}>
                      <h2>{device?.name}</h2>
                      <button onClick={() => setEditingName(true)} className={styles.iconBtn}>
                        <FaEdit />
                      </button>
                    </div>
                  )}
                  <p className={styles.connectedTo}>
                    Connected to: <strong>{device?.connectedTankName}</strong>
                  </p>
                </div>
                <button
                  className={styles.reconnectBtn}
                  onClick={handleReconnect}
                  disabled={isReconnecting}
                >
                  <FaSync className={isReconnecting ? styles.spinning : ''} />
                  {isReconnecting ? 'Reconnecting...' : 'Reconnect Device'}
                </button>
              </Card>

              {/* Specs Card */}
              <Card className={styles.specsCard}>
                <h3><MdSpeed /> Device Specifications</h3>
                <div className={styles.specsList}>
                  <div className={styles.specItem}>
                    <span className={styles.specLabel}>Firmware Version</span>
                    <span className={styles.specValue}>{device?.firmwareVersion}</span>
                  </div>
                  <div className={styles.specItem}>
                    <span className={styles.specLabel}>CPU Speed</span>
                    <span className={styles.specValue}>{device?.cpuSpeed} MHz</span>
                  </div>
                  <div className={styles.specItem}>
                    <span className={styles.specLabel}>Memory</span>
                    <span className={styles.specValue}>{device?.freeMemory} KB / {device?.totalMemory} KB</span>
                  </div>
                  <div className={styles.specItem}>
                    <span className={styles.specLabel}>MAC Address</span>
                    <span className={styles.specValue}>{device?.macAddress}</span>
                  </div>
                </div>
              </Card>

              {/* Network Card */}
              <Card className={styles.networkCard}>
                <h3><MdNetworkWifi /> Network Status</h3>
                <div className={styles.specsList}>
                  <div className={styles.specItem}>
                    <span className={styles.specLabel}>WiFi Network</span>
                    <span className={styles.specValue}>{device?.wifiNetwork}</span>
                  </div>
                  <div className={styles.specItem}>
                    <span className={styles.specLabel}>IP Address</span>
                    <span className={styles.specValue}>{device?.ipAddress}</span>
                  </div>
                  <div className={styles.specItem}>
                    <span className={styles.specLabel}>Signal Strength</span>
                    <span className={styles.specValue} style={{ color: signalInfo.color }}>
                      <FaSignal /> {device?.signalStrength} dBm ({signalInfo.label})
                    </span>
                  </div>
                </div>
              </Card>

              {/* Status Card */}
              <Card className={styles.statusCard}>
                <h3><FaClock /> Status</h3>
                <div className={styles.specsList}>
                  <div className={styles.specItem}>
                    <span className={styles.specLabel}>Sensor Interval</span>
                    <span className={styles.specValue}>Every {device?.sensorInterval} seconds</span>
                  </div>
                  <div className={styles.specItem}>
                    <span className={styles.specLabel}>Last Sync</span>
                    <span className={styles.specValue}>{formatTimeAgo(device?.lastSync)}</span>
                  </div>
                  <div className={styles.specItem}>
                    <span className={styles.specLabel}>Uptime</span>
                    <span className={styles.specValue}>{formatUptime(device?.uptime)}</span>
                  </div>
                </div>
              </Card>

              {/* Features Card */}
              <Card className={styles.featuresCard}>
                <h3><FaCheck /> Enabled Features</h3>
                <div className={styles.featuresGrid}>
                  <div className={`${styles.featureItem} ${device?.features?.temperatureSensor ? styles.enabled : styles.disabled}`}>
                    <FaThermometerHalf />
                    <span>Temperature</span>
                  </div>
                  <div className={`${styles.featureItem} ${device?.features?.phSensor ? styles.enabled : styles.disabled}`}>
                    <FaTint />
                    <span>pH Sensor</span>
                  </div>
                  <div className={`${styles.featureItem} ${device?.features?.turbiditySensor ? styles.enabled : styles.disabled}`}>
                    <FaWater />
                    <span>Turbidity</span>
                  </div>
                  <div className={`${styles.featureItem} ${device?.features?.ammoniaSensor ? styles.enabled : styles.disabled}`}>
                    <FaFlask />
                    <span>Ammonia</span>
                  </div>
                  <div className={`${styles.featureItem} ${device?.features?.autoFeeder ? styles.enabled : styles.disabled}`}>
                    <FaUtensils />
                    <span>Auto Feeder</span>
                  </div>
                  <div className={`${styles.featureItem} ${device?.features?.waterLevelSensor ? styles.enabled : styles.disabled}`}>
                    <FaWater />
                    <span>Water Level</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* Feeder Control Tab */}
        {activeTab === 'feeder' && (
          <div className={styles.feederTab}>
            {/* Manual Feed Card */}
            <Card className={styles.manualFeedCard}>
              <h3><FaUtensils /> Manual Feeding</h3>
              <p className={styles.feedDescription}>
                Dispense food immediately. Choose portion size below.
              </p>
              <div className={styles.portionSelector}>
                {['small', 'medium', 'large'].map(size => (
                  <button
                    key={size}
                    className={`${styles.portionBtn} ${feedingPortion === size ? styles.selected : ''}`}
                    onClick={() => setFeedingPortion(size)}
                  >
                    <span className={styles.portionIcon}>
                      {size === 'small' ? '🐟' : size === 'medium' ? '🐟🐟' : '🐟🐟🐟'}
                    </span>
                    <span className={styles.portionLabel}>{size}</span>
                  </button>
                ))}
              </div>
              <button
                className={styles.feedNowBtn}
                onClick={handleManualFeed}
                disabled={isFeeding || device?.status !== 'online'}
              >
                {isFeeding ? (
                  <>
                    <FaSync className={styles.spinning} /> Dispensing...
                  </>
                ) : (
                  <>
                    <FaUtensils /> Feed Now
                  </>
                )}
              </button>
              {device?.status !== 'online' && (
                <p className={styles.offlineWarning}>
                  <FaExclamationTriangle /> Device is offline. Cannot dispense food.
                </p>
              )}
            </Card>

            {/* Schedules Card */}
            <Card className={styles.schedulesCard}>
              <div className={styles.schedulesHeader}>
                <h3><FaClock /> Feeding Schedules</h3>
                <button
                  className={styles.addScheduleBtn}
                  onClick={() => setShowAddSchedule(true)}
                >
                  <FaPlus /> Add Schedule
                </button>
              </div>

              {/* Add Schedule Form */}
              {showAddSchedule && (
                <div className={styles.addScheduleForm}>
                  <div className={styles.formRow}>
                    <label>Label</label>
                    <input
                      type="text"
                      placeholder="e.g. Morning Feed"
                      value={newSchedule.label}
                      onChange={(e) => setNewSchedule({ ...newSchedule, label: e.target.value })}
                    />
                  </div>
                  <div className={styles.formRow}>
                    <label>Time</label>
                    <input
                      type="time"
                      value={newSchedule.time}
                      onChange={(e) => setNewSchedule({ ...newSchedule, time: e.target.value })}
                    />
                  </div>
                  <div className={styles.formRow}>
                    <label>Portion</label>
                    <select
                      value={newSchedule.portionSize}
                      onChange={(e) => setNewSchedule({ ...newSchedule, portionSize: e.target.value })}
                    >
                      <option value="small">Small</option>
                      <option value="medium">Medium</option>
                      <option value="large">Large</option>
                    </select>
                  </div>
                  <div className={styles.formRow}>
                    <label>Days</label>
                    <div className={styles.daysSelector}>
                      {DAYS_OF_WEEK.map((day, idx) => (
                        <button
                          key={day}
                          className={`${styles.dayBtn} ${newSchedule.daysOfWeek.includes(idx) ? styles.selected : ''}`}
                          onClick={() => toggleDayInSchedule(idx)}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className={styles.formActions}>
                    <button className={styles.cancelBtn} onClick={() => setShowAddSchedule(false)}>
                      Cancel
                    </button>
                    <button className={styles.saveScheduleBtn} onClick={handleAddSchedule}>
                      <FaSave /> Save Schedule
                    </button>
                  </div>
                </div>
              )}

              {/* Schedules List */}
              <div className={styles.schedulesList}>
                {schedules.length === 0 ? (
                  <p className={styles.noSchedules}>No feeding schedules set up yet.</p>
                ) : (
                  schedules.map(schedule => (
                    <div key={schedule.id} className={`${styles.scheduleItem} ${!schedule.enabled ? styles.disabled : ''}`}>
                      <div className={styles.scheduleInfo}>
                        <div className={styles.scheduleTime}>{schedule.time}</div>
                        <div className={styles.scheduleLabel}>{schedule.label}</div>
                        <div className={styles.scheduleDays}>
                          {schedule.daysOfWeek.map(d => DAYS_OF_WEEK[d]).join(', ')}
                        </div>
                        <span className={`${styles.portionBadge} ${styles[schedule.portionSize]}`}>
                          {schedule.portionSize}
                        </span>
                      </div>
                      <div className={styles.scheduleActions}>
                        <label className={styles.switch}>
                          <input
                            type="checkbox"
                            checked={schedule.enabled}
                            onChange={(e) => handleToggleSchedule(schedule.id, e.target.checked)}
                          />
                          <span className={styles.slider}></span>
                        </label>
                        <button
                          className={styles.deleteBtn}
                          onClick={() => handleDeleteSchedule(schedule.id)}
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        )}

        {/* Feeding History Tab */}
        {activeTab === 'history' && (
          <div className={styles.historyTab}>
            <Card className={styles.historyCard}>
              <h3><FaHistory /> Recent Feeding History</h3>
              <div className={styles.historyList}>
                {history.length === 0 ? (
                  <p className={styles.noHistory}>No feeding history yet.</p>
                ) : (
                  history.map(entry => (
                    <div key={entry.id} className={styles.historyItem}>
                      <div className={styles.historyIcon}>
                        {entry.status === 'completed' ? (
                          <FaCheck className={styles.completedIcon} />
                        ) : (
                          <FaExclamationTriangle className={styles.skippedIcon} />
                        )}
                      </div>
                      <div className={styles.historyInfo}>
                        <div className={styles.historyTime}>
                          {new Date(entry.time).toLocaleString()}
                        </div>
                        <div className={styles.historyMeta}>
                          <span className={`${styles.typeBadge} ${styles[entry.type]}`}>
                            {entry.type === 'manual' ? 'Manual' : 'Scheduled'}
                          </span>
                          {entry.scheduleName && (
                            <span className={styles.scheduleName}>{entry.scheduleName}</span>
                          )}
                          <span className={`${styles.portionBadge} ${styles[entry.portionSize]}`}>
                            {entry.portionSize}
                          </span>
                        </div>
                      </div>
                      <div className={`${styles.historyStatus} ${styles[entry.status]}`}>
                        {entry.status}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
