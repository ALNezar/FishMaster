import React, { useEffect, useState } from 'react';
import { FaCheckCircle, FaExclamationTriangle, FaInfoCircle, FaCheck } from 'react-icons/fa';
import { getAlertsByTank, acknowledgeAlert } from '../../api';
import Button from '../../components/common/button/button';
import styles from './AlertHistoryList.module.scss';
import { useToast } from '../../components/common/toast/ToastProvider';

export default function AlertHistoryList({ tankId }) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const toast = useToast();

  useEffect(() => {
    let isMounted = true;
    if (!tankId) {
      if (isMounted) {
        setAlerts([]);
        setLoading(false);
      }
      return;
    }

    const fetchAlerts = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getAlertsByTank(tankId);
        if (isMounted) setAlerts(data);
      } catch (err) {
        if (isMounted) setError('Failed to load alert history.');
        console.error(err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchAlerts();
    return () => { isMounted = false; };
  }, [tankId]);

  const handleAcknowledge = async (id) => {
    try {
      await acknowledgeAlert(id);
      toast.success('Alert acknowledged');
      // Update local state
      setAlerts(prev => prev.map(a => 
        a.id === id ? { ...a, acknowledgedAt: new Date().toISOString() } : a
      ));
    } catch (err) {
      toast.error('Failed to acknowledge alert');
      console.error(err);
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'CRITICAL': return <FaExclamationTriangle className={styles.iconCritical} />;
      case 'WARNING': return <FaExclamationTriangle className={styles.iconWarning} />;
      default: return <FaInfoCircle className={styles.iconInfo} />;
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading history...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  if (alerts.length === 0) {
    return (
      <div className={styles.empty}>
        <FaCheckCircle className={styles.emptyIcon} />
        <p>No alerts found for this tank. Everything is running smoothly!</p>
      </div>
    );
  }

  return (
    <div className={styles.historyList}>
      {alerts.map((alert) => {
        const isResolved = !!alert.resolvedAt;
        const isAcknowledged = !!alert.acknowledgedAt;
        const isActive = !isResolved;

        return (
          <div key={alert.id} className={`${styles.alertItem} ${isActive ? styles.active : ''}`}>
            <div className={styles.alertIcon}>
              {getSeverityIcon(alert.severity)}
            </div>
            <div className={styles.alertContent}>
              <div className={styles.alertHeader}>
                <span className={styles.metricName}>{alert.metric}</span>
                <span className={styles.alertTime}>
                  {new Date(alert.createdAt).toLocaleString()}
                </span>
              </div>
              <p className={styles.alertMessage}>{alert.message}</p>
              
              <div className={styles.alertStatus}>
                {isResolved ? (
                  <span className={styles.resolvedBadge}>Resolved</span>
                ) : (
                  <span className={styles.activeBadge}>Active</span>
                )}
                
                {isAcknowledged ? (
                  <span className={styles.ackText}>
                    <FaCheck /> Acknowledged
                  </span>
                ) : (
                  <Button 
                    className={styles.ackBtn} 
                    onClick={() => handleAcknowledge(alert.id)}
                    variant="outline"
                  >
                    Acknowledge
                  </Button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
