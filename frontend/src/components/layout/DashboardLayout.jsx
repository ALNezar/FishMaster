import { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Wave from 'react-wavify';

import QuickAccessNav from '../common/nav/QuickAccessNav';
import ProfileAvatar from '../common/profile/ProfileAvatar';
import { isAuthenticated, getCurrentUser, logout } from '../../api';
import usePullToRefresh from '../../hooks/usePullToRefresh';
import { haptics } from '../../utils/haptics';

import styles from './DashboardLayout.module.scss';

export default function DashboardLayout() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const redirectToLogin = () => {
      logout();
      navigate('/login', { replace: true });
    };

    const initAuth = async () => {
      if (!isAuthenticated()) {
        redirectToLogin();
        return;
      }

      try {
        const userData = await getCurrentUser();
        if (isMounted) setUser(userData);
      } catch (err) {
        const status = err.response?.status;
        const isAuthError = status === 401 || status === 403;

        if (isAuthError) {
          redirectToLogin();
        } else {
          console.error('Unexpected auth error:', err);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initAuth();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  // Install prompt handling for PWA 'Add to Home Screen' quick CTA
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    const onBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const onAppInstalled = () => {
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onAppInstalled);
    };
  }, []);

  // Quick pull-to-refresh: reload page data when user pulls down from top
  usePullToRefresh({
    onRefresh: () => {
      haptics.notification();
      // soft refresh: navigate current route to force data reloads
      window.location.reload();
    },
  });

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loader}>🐠</div>
        <p>Loading your aquarium...</p>
      </div>
    );
  }

  return (
    <div className={styles.layout}>
      {/* Header */}
      <header className={styles.topHeader}>
        <h1 className={styles.logo}>FishMaster</h1>
        <div className={styles.headerRight}>
          {deferredPrompt && (
            <button
              className={styles.installButton}
              onClick={async () => {
                try {
                  haptics.tap();
                  // @ts-ignore deferredPrompt typing
                  await deferredPrompt.prompt();
                  // @ts-ignore
                  const choice = await deferredPrompt.userChoice;
                  setDeferredPrompt(null);
                  console.log('A2HS choice', choice);
                } catch (err) {
                  console.warn('Install prompt failed', err);
                }
              }}
            >
              Install
            </button>
          )}
          <ProfileAvatar user={user} />
        </div>
      </header>

      {/* Quick Access Navigation */}
      <nav className={styles.navContainer}>
        <QuickAccessNav />
      </nav>

      {/* Decorative Wave Background */}
      <div className={styles.waveBackground} aria-hidden>
        <Wave fill="#1277b0dd" options={{ height: 20, amplitude: 30, speed: 0.15, points: 5 }} />
        <Wave fill="#0e5a85bb" options={{ height: 10, amplitude: 40, speed: 0.2, points: 4 }} />
        <Wave fill="#04315888" options={{ height: 5, amplitude: 25, speed: 0.25, points: 6 }} />
      </div>

      {/* Page Content */}
      <main className={styles.content}>
        <Outlet context={{ user }} />
      </main>
    </div>
  );
}
