import React, { useEffect, useState } from 'react';
import { FaShareSquare, FaPlusSquare } from 'react-icons/fa';
import { IoClose } from 'react-icons/io5';
import styles from './PwaInstallPrompt.module.scss';
import { haptics } from '../../../utils/haptics';

/**
 * PwaInstallPrompt
 * 
 * A native-feeling bottom sheet prompting the user to install the PWA.
 * It listens to the `beforeinstallprompt` event.
 */
export default function PwaInstallPrompt({ deferredPrompt, setDeferredPrompt }) {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already installed / running in standalone
    const _isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    setIsStandalone(!!_isStandalone);

    // Check if iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const _isIos = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(_isIos);

    // If we have a prompt or it's iOS (where prompt is manual via Safari), show it if not standalone
    if ((deferredPrompt || _isIos) && !_isStandalone) {
      // Small delay to let the app load before popping up
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [deferredPrompt]);

  if (!showPrompt || isStandalone) return null;

  const handleInstall = async () => {
    haptics.tap();
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          console.log('User accepted the A2HS prompt');
        } else {
          console.log('User dismissed the A2HS prompt');
        }
        setDeferredPrompt(null);
        setShowPrompt(false);
      } catch (err) {
        console.warn('Install prompt failed', err);
      }
    } else if (isIos) {
      // Just shake the prompt to draw attention to instructions
      haptics.warning();
    }
  };

  const handleDismiss = () => {
    haptics.tap();
    setShowPrompt(false);
  };

  return (
    <div className={styles.promptOverlay}>
      <div className={styles.promptSheet}>
        <button className={styles.closeBtn} onClick={handleDismiss} aria-label="Dismiss">
          <IoClose />
        </button>
        
        <div className={styles.promptContent}>
          <div className={styles.iconContainer}>
            <div className={styles.appIconPlaceholder}>FM</div>
          </div>
          <div className={styles.textContent}>
            <h3>Install FishMaster</h3>
            <p>Add to your home screen for a full-screen native experience, fast access, and alerts.</p>
          </div>
        </div>

        {isIos && !deferredPrompt ? (
          <div className={styles.iosInstructions}>
            <p>
              Tap <FaShareSquare className={styles.inlineIcon} /> then <strong>Add to Home Screen</strong> <FaPlusSquare className={styles.inlineIcon} />
            </p>
          </div>
        ) : (
          <button className={styles.installBtn} onClick={handleInstall}>
            Add to Home Screen
          </button>
        )}
      </div>
    </div>
  );
}
