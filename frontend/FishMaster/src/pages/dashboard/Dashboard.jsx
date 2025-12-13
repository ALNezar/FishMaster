import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, logout, isAuthenticated } from '../../services/api.js';
import Button from '../../components/common/button/button.jsx';
import Card from '../../components/common/card/card.jsx';
import Wave from 'react-wavify';
import styles from './Dashboard.module.scss';

/**
 * Dashboard - Main app view after onboarding
 * Shows tank status and monitoring overview
 */
function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      if (!isAuthenticated()) {
        navigate('/login');
        return;
      }

      try {
        const userData = await getCurrentUser();
        setUser(userData);
      } catch (err) {
        console.error('Failed to load user:', err);
        // Token might be invalid
        logout();
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [navigate]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading...</div>
      </div>
    );
  }

  return (
    <>
      {/* Wave Background */}
      <div className={styles.waveBackground}>
        <Wave
          fill="#1277b0"
          paused={false}
          options={{
            height: -11,
            amplitude: 30,
            speed: 0.15,
            points: 5
          }}
        />
      </div>

      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.logo}>🐠 FishMaster</h1>
          <div className={styles.userInfo}>
            <span>Welcome, {user?.name || 'User'}!</span>
            <button onClick={handleLogout} className={styles.logoutBtn}>
              Logout
            </button>
          </div>
        </header>

        <main className={styles.main}>
          <Card className={styles.welcomeCard}>
            <div className={styles.welcomeIcon}>🎉</div>
            <h2>Welcome to Your Dashboard!</h2>
            <p>
              Your FishMaster setup is complete. This is where you'll monitor your tanks,
              view water parameters, and manage feeding schedules.
            </p>
            <div className={styles.features}>
              <div className={styles.featureCard}>
                <span className={styles.featureIcon}>🌡️</span>
                <h4>Real-time Monitoring</h4>
                <p>Track pH, temperature, and water quality</p>
              </div>
              <div className={styles.featureCard}>
                <span className={styles.featureIcon}>🔔</span>
                <h4>Smart Alerts</h4>
                <p>Get notified when conditions need attention</p>
              </div>
              <div className={styles.featureCard}>
                <span className={styles.featureIcon}>🍽️</span>
                <h4>Conditional Feeding</h4>
                <p>Automated feeding based on water quality</p>
              </div>
            </div>
          </Card>

          <div className={styles.comingSoon}>
            <p>🚧 Full dashboard features coming soon!</p>
            <p>Connect your ESP32 device to start real-time monitoring.</p>
          </div>
        </main>
      </div>
    </>
  );
}

export default Dashboard;
