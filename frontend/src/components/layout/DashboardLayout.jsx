import { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';

import QuickAccessNav from '../common/nav/QuickAccessNav';
import PwaInstallPrompt from '../common/nav/PwaInstallPrompt';
import { ToastProvider } from '../common/toast/ToastProvider';
import { AlertProvider } from '../common/AlertProvider';
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
        const status = err?.status ?? err?.response?.status;
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
      {/* Page Content */}
      <main className={styles.content}>
        <ToastProvider>
          <AlertProvider>
            <Outlet context={{ user }} />
          </AlertProvider>
        </ToastProvider>
      </main>

      {/* Premium floating bottom navigation */}
      <QuickAccessNav />

      <PwaInstallPrompt deferredPrompt={deferredPrompt} setDeferredPrompt={setDeferredPrompt} />
    </div>
  );
}
