// Lightweight haptics helper — graceful no-op when unsupported
export const haptics = {
  tap: (pattern = 10) => {
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        // short vibration for taps
        // pattern in ms
        navigator.vibrate(pattern);
      }
    } catch (e) {
      // ignore
    }
  },
  notification: (pattern = [20, 30, 20]) => {
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(pattern);
      }
    } catch (e) {
      // ignore
    }
  },
};

export default haptics;
