import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import gsap from 'gsap';
import { FaInfoCircle, FaExclamationTriangle, FaCheckCircle, FaTimes } from 'react-icons/fa';
import styles from './ToastProvider.module.scss';

const ToastContext = createContext(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

let toastIdCounter = 0;

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, options = {}) => {
    const id = ++toastIdCounter;
    const toast = {
      id,
      message,
      type: options.type || 'info', // 'info', 'success', 'warning', 'error'
      duration: options.duration || 5000,
    };

    setToasts((prev) => [...prev, toast]);

    if (toast.duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, toast.duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const value = {
    showToast,
    success: (msg, opts) => showToast(msg, { ...opts, type: 'success' }),
    error: (msg, opts) => showToast(msg, { ...opts, type: 'error' }),
    warning: (msg, opts) => showToast(msg, { ...opts, type: 'warning' }),
    info: (msg, opts) => showToast(msg, { ...opts, type: 'info' }),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      {createPortal(
        <div className={styles.toastContainer}>
          {toasts.map((toast) => (
            <ToastItem key={toast.id} toast={toast} onRemove={() => removeToast(toast.id)} />
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
};

const ToastItem = ({ toast, onRemove }) => {
  const elRef = useRef(null);

  React.useLayoutEffect(() => {
    if (elRef.current) {
      gsap.fromTo(
        elRef.current,
        { y: 50, opacity: 0, scale: 0.9 },
        { y: 0, opacity: 1, scale: 1, duration: 0.4, ease: 'back.out(1.7)' }
      );
    }
  }, []);

  const handleClose = () => {
    if (elRef.current) {
      gsap.to(elRef.current, {
        opacity: 0,
        scale: 0.9,
        x: 100,
        duration: 0.3,
        ease: 'power2.in',
        onComplete: onRemove,
      });
    } else {
      onRemove();
    }
  };

  const icons = {
    info: <FaInfoCircle className={styles.iconInfo} />,
    success: <FaCheckCircle className={styles.iconSuccess} />,
    warning: <FaExclamationTriangle className={styles.iconWarning} />,
    error: <FaExclamationTriangle className={styles.iconError} />,
  };

  return (
    <div ref={elRef} className={`${styles.toast} ${styles[toast.type]}`}>
      <div className={styles.iconWrapper}>{icons[toast.type]}</div>
      <div className={styles.content}>{toast.message}</div>
      <button className={styles.closeBtn} onClick={handleClose} aria-label="Close">
        <FaTimes />
      </button>
    </div>
  );
};
