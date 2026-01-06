import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { FaThermometerHalf, FaTint, FaWater, FaFlask, FaBell, FaBellSlash, FaEnvelope, FaMobileAlt, FaUndo, FaSave, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import { MdNotificationsActive } from 'react-icons/md';
import Card from '../../components/common/card/card';
import Button from '../../components/common/button/button';
import { getTanks, getAlertThresholds, updateAlertThresholds } from '../../services/api';
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
  ammonia: {
    enabled: true,
    max: 0.25,
  },
};

// Parameter configuration for rendering cards
const PARAMETERS = [
  {
    key: 'temperature',
    label: 'Temperature',
    icon: FaThermometerHalf,
    color: '#ef4444',
    unit: '°C',
    hasMin: true,
    hasMax: true,
    step: 0.5,
    hint: 'Most freshwater fish thrive between 22–28°C',
    minBound: 10,
    maxBound: 40,
  },
  {
    key: 'ph',
    label: 'pH Level',
    icon: FaTint,
    color: '#3b82f6',
    unit: '',
    hasMin: true,
    hasMax: true,
    step: 0.1,
    hint: 'Ideal range for most species: 6.5–7.5',
    minBound: 0,
    maxBound: 14,
  },
  {
    key: 'turbidity',
    label: 'Turbidity',
    icon: FaWater,
    color: '#14b8a6',
    unit: 'NTU',
    hasMin: false,
    hasMax: true,
    step: 0.5,
    hint: 'Clear water should be below 5 NTU',
    minBound: 0,
    maxBound: 100,
  },
  {
    key: 'ammonia',
    label: 'Ammonia',
    icon: FaFlask,
    color: '#f97316',
    unit: 'ppm',
    hasMin: false,
    hasMax: true,
    step: 0.01,
    hint: 'Any detectable ammonia (>0.25 ppm) is harmful',
    minBound: 0,
    maxBound: 5,
  },
];

export default function AlertConfigPage() {
  const { user } = useOutletContext() || {};
  const [tanks, setTanks] = useState([]);
  const [selectedTankId, setSelectedTankId] = useState(null);
  const [thresholds, setThresholds] = useState({ ...DEFAULT_THRESHOLDS });
  const [originalThresholds, setOriginalThresholds] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [validationErrors, setValidationErrors] = useState({});

  // Fetch tanks on mount
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
      setSuccess('');
      try {
        const data = await getAlertThresholds(selectedTankId);
        const merged = { ...DEFAULT_THRESHOLDS, ...data };
        setThresholds(merged);
        setOriginalThresholds(merged);
      } catch (err) {
        console.error('Failed to fetch thresholds:', err);
        // Use defaults for new tanks
        setThresholds({ ...DEFAULT_THRESHOLDS });
        setOriginalThresholds({ ...DEFAULT_THRESHOLDS });
      } finally {
        setLoading(false);
      }
    };
    fetchThresholds();
  }, [selectedTankId]);

  // Validate thresholds
  const validate = () => {
    const errors = {};

    PARAMETERS.forEach((param) => {
      const { key, hasMin, hasMax, minBound, maxBound } = param;
      const paramData = thresholds[key];

      if (!paramData.enabled) return;

      if (hasMin && hasMax) {
        if (paramData.min === '' || paramData.max === '') {
          errors[key] = 'Both min and max values are required';
        } else if (isNaN(paramData.min) || isNaN(paramData.max)) {
          errors[key] = 'Values must be numeric';
        } else if (Number(paramData.min) >= Number(paramData.max)) {
          errors[key] = 'Min must be less than max';
        } else if (Number(paramData.min) < minBound || Number(paramData.max) > maxBound) {
          errors[key] = `Values must be between ${minBound} and ${maxBound}`;
        }
      } else if (hasMax) {
        if (paramData.max === '') {
          errors[key] = 'Max value is required';
        } else if (isNaN(paramData.max)) {
          errors[key] = 'Value must be numeric';
        } else if (Number(paramData.max) < minBound || Number(paramData.max) > maxBound) {
          errors[key] = `Value must be between ${minBound} and ${maxBound}`;
        }
      }
    });

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle input changes for parameter thresholds
  const handleParamChange = (paramKey, field, value) => {
    setError('');
    setSuccess('');
    setValidationErrors((prev) => ({ ...prev, [paramKey]: null }));

    setThresholds((prev) => ({
      ...prev,
      [paramKey]: {
        ...prev[paramKey],
        [field]: value,
      },
    }));
  };

  // Handle toggle changes
  const handleToggle = (field) => {
    setThresholds((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  // Handle parameter enable/disable toggle
  const handleParamToggle = (paramKey) => {
    setThresholds((prev) => ({
      ...prev,
      [paramKey]: {
        ...prev[paramKey],
        enabled: !prev[paramKey].enabled,
      },
    }));
    setValidationErrors((prev) => ({ ...prev, [paramKey]: null }));
  };

  // Reset to defaults
  const handleReset = () => {
    setThresholds({ ...DEFAULT_THRESHOLDS });
    setValidationErrors({});
    setError('');
    setSuccess('Thresholds reset to defaults. Click Save to apply.');
  };

  // Save thresholds
  const handleSave = async () => {
    if (!validate()) {
      setError('Please fix the validation errors before saving.');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await updateAlertThresholds(selectedTankId, thresholds);
      setOriginalThresholds({ ...thresholds });
      setSuccess('Alert thresholds updated successfully!');
    } catch (err) {
      console.error('Failed to save thresholds:', err);
      setError('Failed to save thresholds. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Check if there are unsaved changes
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
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <MdNotificationsActive className={styles.headerIcon} />
          <div>
            <h1>Alert Configuration</h1>
            <p className={styles.subtitle}>
              Configure safe threshold values for water parameters to receive alerts when readings become unsafe.
            </p>
          </div>
        </div>
      </div>

      {/* Tank Selector */}
      <Card className={styles.tankSelectorCard}>
        <div className={styles.tankSelector}>
          <label htmlFor="tank-select">
            <FaWater /> Select Tank:
          </label>
          <select
            id="tank-select"
            value={selectedTankId || ''}
            onChange={(e) => setSelectedTankId(Number(e.target.value))}
            disabled={loading}
          >
            {tanks.map((tank) => (
              <option key={tank.id} value={tank.id}>
                {tank.name} ({tank.sizeLiters}L)
              </option>
            ))}
          </select>
        </div>
      </Card>

      {/* Messages */}
      {error && (
        <div className={styles.errorMessage}>
          <FaExclamationTriangle /> {error}
        </div>
      )}
      {success && (
        <div className={styles.successMessage}>
          <FaCheckCircle /> {success}
        </div>
      )}

      {/* Global Controls */}
      <Card className={styles.globalControlsCard}>
        <h3>
          <FaBell /> Alert Settings
        </h3>
        <div className={styles.toggleGroup}>
          <div className={styles.toggleRow}>
            <div className={styles.toggleInfo}>
              <span className={styles.toggleLabel}>Master Alert Toggle</span>
              <span className={styles.toggleHint}>Enable or disable all alerts for this tank</span>
            </div>
            <label className={styles.switch}>
              <input
                type="checkbox"
                checked={thresholds.globalAlertsEnabled}
                onChange={() => handleToggle('globalAlertsEnabled')}
              />
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
              <input
                type="checkbox"
                checked={thresholds.emailAlertsEnabled}
                onChange={() => handleToggle('emailAlertsEnabled')}
                disabled={!thresholds.globalAlertsEnabled}
              />
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
              <input
                type="checkbox"
                checked={thresholds.inAppAlertsEnabled}
                onChange={() => handleToggle('inAppAlertsEnabled')}
                disabled={!thresholds.globalAlertsEnabled}
              />
              <span className={styles.slider}></span>
            </label>
          </div>
        </div>
      </Card>

      {/* Parameter Threshold Cards */}
      <div className={styles.parametersGrid}>
        {PARAMETERS.map((param) => {
          const Icon = param.icon;
          const paramData = thresholds[param.key];
          const isDisabled = !thresholds.globalAlertsEnabled || !paramData.enabled;
          const hasError = validationErrors[param.key];

          return (
            <Card
              key={param.key}
              className={`${styles.paramCard} ${isDisabled ? styles.paramCardDisabled : ''} ${hasError ? styles.paramCardError : ''}`}
              style={{ '--param-color': param.color }}
            >
              <div className={styles.paramHeader}>
                <div className={styles.paramTitle}>
                  <Icon className={styles.paramIcon} style={{ color: param.color }} />
                  <h4>{param.label}</h4>
                </div>
                <label className={styles.switch}>
                  <input
                    type="checkbox"
                    checked={paramData.enabled}
                    onChange={() => handleParamToggle(param.key)}
                    disabled={!thresholds.globalAlertsEnabled}
                  />
                  <span className={styles.slider}></span>
                </label>
              </div>

              <p className={styles.paramHint}>{param.hint}</p>

              <div className={styles.paramInputs}>
                {param.hasMin && (
                  <div className={styles.inputGroup}>
                    <label>Min {param.unit && `(${param.unit})`}</label>
                    <input
                      type="number"
                      step={param.step}
                      min={param.minBound}
                      max={param.maxBound}
                      value={paramData.min}
                      onChange={(e) => handleParamChange(param.key, 'min', e.target.value)}
                      disabled={isDisabled}
                      className={hasError ? styles.inputError : ''}
                    />
                  </div>
                )}
                {param.hasMax && (
                  <div className={styles.inputGroup}>
                    <label>{param.hasMin ? 'Max' : 'Threshold'} {param.unit && `(${param.unit})`}</label>
                    <input
                      type="number"
                      step={param.step}
                      min={param.minBound}
                      max={param.maxBound}
                      value={paramData.max}
                      onChange={(e) => handleParamChange(param.key, 'max', e.target.value)}
                      disabled={isDisabled}
                      className={hasError ? styles.inputError : ''}
                    />
                  </div>
                )}
              </div>

              {hasError && <p className={styles.errorText}>{validationErrors[param.key]}</p>}
            </Card>
          );
        })}
      </div>

      {/* Action Buttons */}
      <div className={styles.actions}>
        <Button
          onClick={handleReset}
          className={styles.resetBtn}
          disabled={saving}
        >
          <FaUndo /> Reset to Defaults
        </Button>
        <Button
          onClick={handleSave}
          className={styles.saveBtn}
          disabled={saving || !hasChanges}
        >
          {saving ? (
            <>Saving...</>
          ) : (
            <>
              <FaSave /> Save Thresholds
            </>
          )}
        </Button>
      </div>

      {hasChanges && !success && (
        <p className={styles.unsavedHint}>
          <FaExclamationTriangle /> You have unsaved changes
        </p>
      )}
    </div>
  );
}
