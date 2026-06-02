import React, { useState, useEffect } from 'react';
import { useOutletContext, useSearchParams } from 'react-router-dom';
import { FaThermometerHalf, FaTint, FaWater, FaBell, FaBellSlash, FaEnvelope, FaMobileAlt, FaUndo, FaSave, FaExclamationTriangle, FaHistory, FaCog, FaPaperPlane } from 'react-icons/fa';
import { MdNotificationsActive } from 'react-icons/md';
import Card from '../../components/common/card/card';
import Button from '../../components/common/button/button';
import { getTanks, getAlertThresholds, updateAlertThresholds, subscribeToPush, getVapidPublicKey } from '../../api';
import { urlB64ToUint8Array } from '../../utils/push';
import { useToast } from '../../components/common/toast/ToastProvider';
import AlertHistoryList from './AlertHistoryList';
import styles from './AlertConfigPage.module.scss';

// Default threshold values for freshwater tanks
const DEFAULT_THRESHOLDS = {
  globalAlertsEnabled: true,
  emailAlertsEnabled: true,
  inAppAlertsEnabled: true,
  temperature: {
    enabled: true,
    min: 22,
    max: 28,
  },
  ph: {
    enabled: true,
    min: 6.5,
    max: 7.5,
  },
  turbidity: {
    enabled: true,
    max: 5,
  },
};

const PARAMETERS = [
  { key: 'temperature', label: 'Temperature', icon: FaThermometerHalf, color: '#ef4444', unit: '°C', hasMin: true, hasMax: true, step: 0.5, hint: 'Most freshwater fish thrive between 22–28°C', minBound: 10, maxBound: 40 },
  { key: 'ph', label: 'pH Level', icon: FaTint, color: '#3b82f6', unit: '', hasMin: true, hasMax: true, step: 0.1, hint: 'Ideal range for most species: 6.5–7.5', minBound: 0, maxBound: 14 },
  { key: 'turbidity', label: 'Turbidity', icon: FaWater, color: '#14b8a6', unit: 'NTU', hasMin: false, hasMax: true, step: 0.5, hint: 'Clear water should be below 5 NTU', minBound: 0, maxBound: 100 },
];

export default function AlertConfigPage() {
  const { user } = useOutletContext() || {};
  const [searchParams] = useSearchParams();
  const [tanks, setTanks] = useState([]);
  const [selectedTankId, setSelectedTankId] = useState(null);
  const [thresholds, setThresholds] = useState({ ...DEFAULT_THRESHOLDS });
  const [originalThresholds, setOriginalThresholds] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [thresholdsReadOnly, setThresholdsReadOnly] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [activeTab, setActiveTab] = useState(() => (
    searchParams.get('tab') === 'history' ? 'history' : 'config'
  ));
  
  const toast = useToast();

  // Fetch tanks on mount
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'history' || tab === 'config') {
      setActiveTab(tab);
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchTanks = async () => {
      try {
        const data = await getTanks();
        setTanks(data || []);
        if (data && data.length > 0) {
          setSelectedTankId(data[0].id);
        }
      } catch (err) {
        console.error('Failed to fetch tanks:', err);
        setError('Failed to load your tanks. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchTanks();
  }, []);

  // Fetch thresholds when selected tank changes
  useEffect(() => {
    if (!selectedTankId) return;

    const fetchThresholds = async () => {
      setLoading(true);
      setError('');
      setThresholdsReadOnly(false);
      try {
        const data = await getAlertThresholds(selectedTankId);
        setThresholds(data);
        setOriginalThresholds(data);
      } catch (err) {
        console.error('Failed to fetch thresholds:', err);
        if (err && err.status === 403) {
          setError('You do not have permission to view thresholds for this tank. Using defaults in read-only mode.');
          setThresholdsReadOnly(true);
        } else {
          toast.error('Failed to fetch thresholds. Using defaults.');
        }
        setThresholds({ ...DEFAULT_THRESHOLDS });
        setOriginalThresholds({ ...DEFAULT_THRESHOLDS });
      } finally {
        setLoading(false);
      }
    };
    fetchThresholds();
  }, [selectedTankId, toast]);

  const validate = () => {
    const errors = {};
    PARAMETERS.forEach((param) => {
      const { key, hasMin, hasMax, minBound, maxBound } = param;
      const paramData = thresholds[key];
      if (!paramData.enabled) return;

      if (hasMin && hasMax) {
        if (paramData.min === '' || paramData.max === '') errors[key] = 'Both min and max values are required';
        else if (isNaN(paramData.min) || isNaN(paramData.max)) errors[key] = 'Values must be numeric';
        else if (Number(paramData.min) >= Number(paramData.max)) errors[key] = 'Min must be less than max';
        else if (Number(paramData.min) < minBound || Number(paramData.max) > maxBound) errors[key] = `Values must be between ${minBound} and ${maxBound}`;
      } else if (hasMax) {
        if (paramData.max === '') errors[key] = 'Max value is required';
        else if (isNaN(paramData.max)) errors[key] = 'Value must be numeric';
        else if (Number(paramData.max) < minBound || Number(paramData.max) > maxBound) errors[key] = `Value must be between ${minBound} and ${maxBound}`;
      }
    });
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleParamChange = (paramKey, field, value) => {
    setError('');
    setValidationErrors((prev) => ({ ...prev, [paramKey]: null }));
    setThresholds((prev) => ({ ...prev, [paramKey]: { ...prev[paramKey], [field]: value } }));
  };

  const handleToggle = (field) => {
    setThresholds((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleParamToggle = (paramKey) => {
    setThresholds((prev) => ({ ...prev, [paramKey]: { ...prev[paramKey], enabled: !prev[paramKey].enabled } }));
    setValidationErrors((prev) => ({ ...prev, [paramKey]: null }));
  };

  const handleReset = () => {
    setThresholds({ ...DEFAULT_THRESHOLDS });
    setValidationErrors({});
    setError('');
    toast.info('Thresholds reset to defaults. Click Save to apply.');
  };

  const handleSave = async () => {
    if (!validate()) {
      toast.error('Please fix the validation errors before saving.');
      return;
    }
    setSaving(true);
    setError('');

    try {
      const saved = await updateAlertThresholds(selectedTankId, thresholds);
      setThresholds(saved);
      setOriginalThresholds(saved);
      toast.success('Alert thresholds updated successfully!');
    } catch (err) {
      console.error('Failed to save thresholds:', err);
      toast.error('Failed to save thresholds. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleEnablePush = async () => {
    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        toast.error('Push notifications are not supported in this browser.');
        return;
      }
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        toast.warning('Permission for notifications was denied.');
        return;
      }
      
      toast.info('Registering push service...');
      const registration = await navigator.serviceWorker.ready;

      const vapidConfig = await getVapidPublicKey();
      const vapidPublicKey =
        (vapidConfig?.configured && vapidConfig.publicKey)
          ? vapidConfig.publicKey
          : import.meta.env.VITE_VAPID_PUBLIC_KEY;

      if (!vapidPublicKey) {
        toast.error('Push notifications are not configured on the server. Set VAPID keys in Railway.');
        return;
      }

      const convertedVapidKey = urlB64ToUint8Array(vapidPublicKey);

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey
      });

      const subData = JSON.parse(JSON.stringify(subscription));
      
      await subscribeToPush({
        endpoint: subData.endpoint,
        p256dh: subData.keys.p256dh,
        auth: subData.keys.auth
      });

      toast.success('Web Push notifications enabled successfully!');
    } catch (error) {
      console.error('Error enabling push notifications:', error);
      toast.error('Failed to enable push notifications: ' + error.message);
    }
  };

  const hasChanges = JSON.stringify(thresholds) !== JSON.stringify(originalThresholds);

  if (loading && tanks.length === 0) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loader}>🔔</div>
        <p>Loading alert configuration...</p>
      </div>
    );
  }

  if (tanks.length === 0) {
    return (
      <div className={styles.emptyState}>
        <FaBellSlash className={styles.emptyIcon} />
        <h2>No Tanks Found</h2>
        <p>Create a tank first to configure alert thresholds.</p>
        <Button onClick={() => window.location.href = '/tanks'}>Go to My Tanks</Button>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <MdNotificationsActive className={styles.headerIcon} />
          <div>
            <h1>Alert Center</h1>
            <p className={styles.subtitle}>Manage your alerts and thresholds for {tanks.find(t => t.id === selectedTankId)?.name}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button 
          className={`${styles.tab} ${activeTab === 'config' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('config')}
        >
          <FaCog /> Configuration
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'history' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <FaHistory /> Alert History
        </button>
      </div>

      {/* Tank Selector (Visible on both tabs) */}
      <Card className={styles.tankSelectorCard}>
        <div className={styles.tankSelector}>
          <label htmlFor="tank-select"><FaWater /> Select Tank:</label>
          <select
            id="tank-select"
            value={selectedTankId || ''}
            onChange={(e) => setSelectedTankId(Number(e.target.value))}
            disabled={loading}
          >
            {tanks.map((tank) => (
              <option key={tank.id} value={tank.id}>{tank.name} ({tank.sizeLiters}L)</option>
            ))}
          </select>
        </div>
      </Card>

      {error && <div className={styles.errorMessage}><FaExclamationTriangle /> {error}</div>}

      {/* CONFIGURATION TAB */}
      {activeTab === 'config' && (
        <>
          <Card className={styles.globalControlsCard}>
            <h3><FaBell /> Alert Settings</h3>
            <div className={styles.toggleGroup}>
              <div className={styles.toggleRow}>
                <div className={styles.toggleInfo}>
                  <span className={styles.toggleLabel}>Master Alert Toggle</span>
                  <span className={styles.toggleHint}>Enable or disable all alerts for this tank</span>
                </div>
                <label className={styles.switch}>
                  <input type="checkbox" checked={thresholds.globalAlertsEnabled} onChange={() => handleToggle('globalAlertsEnabled')} />
                  <span className={styles.slider}></span>
                </label>
              </div>

              <div className={`${styles.toggleRow} ${!thresholds.globalAlertsEnabled ? styles.disabled : ''}`}>
                <div className={styles.toggleInfo}>
                  <FaEnvelope className={styles.toggleIcon} />
                  <div>
                    <span className={styles.toggleLabel}>Email Notifications</span>
                    <span className={styles.toggleHint}>Receive alerts via email</span>
                  </div>
                </div>
                <label className={styles.switch}>
                  <input type="checkbox" checked={thresholds.emailAlertsEnabled} onChange={() => handleToggle('emailAlertsEnabled')} disabled={!thresholds.globalAlertsEnabled} />
                  <span className={styles.slider}></span>
                </label>
              </div>

              <div className={`${styles.toggleRow} ${!thresholds.globalAlertsEnabled ? styles.disabled : ''}`}>
                <div className={styles.toggleInfo}>
                  <FaMobileAlt className={styles.toggleIcon} />
                  <div>
                    <span className={styles.toggleLabel}>In-App Notifications</span>
                    <span className={styles.toggleHint}>Show alerts in the dashboard</span>
                  </div>
                </div>
                <label className={styles.switch}>
                  <input type="checkbox" checked={thresholds.inAppAlertsEnabled} onChange={() => handleToggle('inAppAlertsEnabled')} disabled={!thresholds.globalAlertsEnabled} />
                  <span className={styles.slider}></span>
                </label>
              </div>

              <div className={styles.pushActions}>
                <Button onClick={handleEnablePush} variant="outline" className={styles.pushBtn}>
                  <FaPaperPlane /> Enable Web Push Notifications
                </Button>
                <p className={styles.pushHint}>Allows FishMaster to send notifications to your device even when the app is closed (Mobile/Desktop PWA).</p>
              </div>
            </div>
          </Card>

          <div className={styles.parametersGrid}>
            {PARAMETERS.map((param) => {
              const Icon = param.icon;
              const paramData = thresholds[param.key];
              const isDisabled = !thresholds.globalAlertsEnabled || !paramData.enabled;
              const hasError = validationErrors[param.key];

              return (
                <Card key={param.key} className={`${styles.paramCard} ${isDisabled ? styles.paramCardDisabled : ''} ${hasError ? styles.paramCardError : ''}`} style={{ '--param-color': param.color }}>
                  <div className={styles.paramHeader}>
                    <div className={styles.paramTitle}>
                      <Icon className={styles.paramIcon} style={{ color: param.color }} />
                      <h4>{param.label}</h4>
                    </div>
                    <label className={styles.switch}>
                      <input type="checkbox" checked={paramData.enabled} onChange={() => handleParamToggle(param.key)} disabled={!thresholds.globalAlertsEnabled} />
                      <span className={styles.slider}></span>
                    </label>
                  </div>
                  <p className={styles.paramHint}>{param.hint}</p>
                  <div className={styles.paramInputs}>
                    {param.hasMin && (
                      <div className={styles.inputGroup}>
                        <label>Min {param.unit && `(${param.unit})`}</label>
                        <input type="number" step={param.step} min={param.minBound} max={param.maxBound} value={paramData.min} onChange={(e) => handleParamChange(param.key, 'min', e.target.value)} disabled={isDisabled || thresholdsReadOnly} className={hasError ? styles.inputError : ''} />
                      </div>
                    )}
                    {param.hasMax && (
                      <div className={styles.inputGroup}>
                        <label>{param.hasMin ? 'Max' : 'Threshold'} {param.unit && `(${param.unit})`}</label>
                        <input type="number" step={param.step} min={param.minBound} max={param.maxBound} value={paramData.max} onChange={(e) => handleParamChange(param.key, 'max', e.target.value)} disabled={isDisabled || thresholdsReadOnly} className={hasError ? styles.inputError : ''} />
                      </div>
                    )}
                  </div>
                  {hasError && <p className={styles.errorText}>{validationErrors[param.key]}</p>}
                </Card>
              );
            })}
          </div>

          <div className={styles.actions}>
            <Button onClick={handleReset} className={styles.resetBtn} disabled={saving}>
              <FaUndo /> Reset to Defaults
            </Button>
            <Button onClick={handleSave} className={styles.saveBtn} disabled={saving || !hasChanges || thresholdsReadOnly}>
              {saving ? <>Saving...</> : <><FaSave /> Save Thresholds</>}
            </Button>
          </div>
          {hasChanges && (
            <p className={styles.unsavedHint}>
              <FaExclamationTriangle /> You have unsaved changes
            </p>
          )}
        </>
      )}

      {/* HISTORY TAB */}
      {activeTab === 'history' && (
        <AlertHistoryList tankId={selectedTankId} />
      )}
    </div>
  );
}