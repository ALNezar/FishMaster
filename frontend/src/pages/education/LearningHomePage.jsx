import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  getSensorData,
  getTanks,
  getLearningPaths,
  getLearningProgress,
} from '../../api';
import styles from './LearningHomePage.module.scss';
import { FaThermometerHalf, FaTint, FaFlask } from 'react-icons/fa';
import esp32Image from '../../assets/images/learning/esp32.svg';
import phSensorImage from '../../assets/images/learning/ph-sensor.svg';
import turbiditySensorImage from '../../assets/images/learning/turbidity-sensor.svg';
import temperatureProbeImage from '../../assets/images/learning/temperature-probe.svg';
import tftDisplayImage from '../../assets/images/learning/tft-display.svg';
import servoImage from '../../assets/images/learning/servo.svg';
import breadboardImage from '../../assets/images/learning/breadboard.svg';
import wiresImage from '../../assets/images/learning/wires.svg';
import resistorImage from '../../assets/images/learning/resistor.svg';
import multimeterImage from '../../assets/images/learning/multimeter.svg';
import usbImage from '../../assets/images/learning/usb-cable.svg';

const hardwareList = [
  {
    id: 'esp32',
    label: 'ESP32',
    model: 'ESP32-DevKitC-32E (38-pin, CP2102)',
    quantity: '1',
    purpose: 'Main microcontroller',
    image: esp32Image,
  },
  {
    id: 'ph',
    label: 'pH Sensor',
    model: 'PH 0-14 Liquid Monitoring Sensor (Arduino-compatible)',
    quantity: '1',
    purpose: 'Water pH detection',
    image: phSensorImage,
  },
  {
    id: 'turbidity',
    label: 'Turbidity Sensor',
    model: 'FARDUINO Water Turbidity Module (Full Set)',
    quantity: '1',
    purpose: 'Water clarity detection',
    image: turbiditySensorImage,
  },
  {
    id: 'temperature',
    label: 'Temperature Sensor',
    model: 'DS18B20 Waterproof Probe',
    quantity: '1',
    purpose: 'Water temperature',
    image: temperatureProbeImage,
  },
  {
    id: 'tft',
    label: 'TFT LCD Display',
    model: '2.8 inch ILI9341 SPI Touch Panel 240x320',
    quantity: '1',
    purpose: 'Local display',
    image: tftDisplayImage,
  },
  {
    id: 'servo',
    label: 'Servo Motor',
    model: 'SG90 180 degree',
    quantity: '1',
    purpose: 'Auto feeder mechanism',
    image: servoImage,
  },
  {
    id: 'breadboard',
    label: 'Breadboard',
    model: 'MB-102 830-point Solderless',
    quantity: '1',
    purpose: 'Prototyping',
    image: breadboardImage,
  },
  {
    id: 'wires',
    label: 'Dupont Wires',
    model: 'M-F 10cm, M-M 10cm, F-F 30cm (40pcs each)',
    quantity: '3 sets',
    purpose: 'Connections',
    image: wiresImage,
  },
  {
    id: 'resistors',
    label: 'Resistors',
    model: '4.7k 0.25W 5%',
    quantity: '50pcs',
    purpose: 'Pull-up for DS18B20',
    image: resistorImage,
  },
  {
    id: 'multimeter',
    label: 'Multimeter',
    model: 'HABOTEST HT109L',
    quantity: '1',
    purpose: 'Testing and debugging',
    image: multimeterImage,
  },
  {
    id: 'usb',
    label: 'USB Cable',
    model: 'Micro USB 30cm',
    quantity: '1',
    purpose: 'ESP32 power/programming',
    image: usbImage,
  },
];

function LearningHomePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [paths, setPaths] = useState([]);
  const [progress, setProgress] = useState(null);
  const [activePathId, setActivePathId] = useState('');
  const [sensorReadings, setSensorReadings] = useState(null);

  const getTemperatureState = (value) => {
    if (value >= 24 && value <= 26) {
      return {
        status: 'safe',
        explanation: 'Water temperature is within the safe comfort zone for most freshwater fish.',
        tips: ['✅ Keep heater settings steady.', '✅ Continue monitoring at normal intervals.'],
        why: 'Stable temperature supports fish metabolism and lowers stress-driven behavior changes.',
      };
    }
    if ((value >= 22 && value < 24) || (value > 26 && value <= 28)) {
      return {
        status: 'caution',
        explanation: 'Temperature is drifting and should be corrected gradually.',
        tips: ['⚠ Move tank away from direct sunlight.', '⚠ Adjust heater by small increments only.'],
        why: 'Quick temperature swings can shock fish, so controlled correction is safer than sudden changes.',
      };
    }
    return {
      status: 'danger',
      explanation: 'Temperature is outside the safe range and needs urgent attention.',
      tips: ['🚨 Stabilize heater and room conditions now.', '🚨 Verify thermometer/sensor readings immediately.'],
      why: 'Extreme temperatures can reduce oxygen availability and stress fish quickly.',
    };
  };

  const getTurbidityState = (value) => {
    if (value < 3) {
      return {
        status: 'safe',
        explanation: 'Water clarity looks healthy and stable.',
        tips: ['✅ Keep your current filtration routine.', '✅ Continue weekly maintenance checks.'],
        why: 'Low turbidity usually means lower suspended waste and better gill comfort for fish.',
      };
    }
    if (value >= 3 && value <= 5) {
      return {
        status: 'caution',
        explanation: 'Water is getting cloudy and needs early intervention.',
        tips: ['⚠ Check filter media and flow rate.', '⚠ Reduce feeding amount for the next cycle.'],
        why: 'Catching turbidity early prevents organic load from becoming an ammonia issue.',
      };
    }
    return {
      status: 'danger',
      explanation: 'Cloudiness is high and indicates immediate cleanup is needed.',
      tips: ['🚨 Perform a partial water change.', '🚨 Inspect filter and remove uneaten food/debris.'],
      why: 'High turbidity can signal rapid waste buildup and unstable water quality.',
    };
  };

  const getPhState = (value) => {
    if (value >= 6.8 && value <= 7.4) {
      return {
        status: 'safe',
        explanation: 'pH is in a healthy range for common community species.',
        tips: ['✅ Keep current buffering routine.', '✅ Recheck after water changes only.'],
        why: 'Stable pH protects fish from osmotic stress and keeps biofilter activity consistent.',
      };
    }
    if ((value >= 6.5 && value < 6.8) || (value > 7.4 && value <= 7.8)) {
      return {
        status: 'caution',
        explanation: 'pH is slightly off and should be adjusted slowly.',
        tips: ['⚠ Adjust pH in small steps over 24-48h.', '⚠ Re-test before applying a second correction.'],
        why: 'Gradual corrections are safer than quick swings that can shock fish and bacteria.',
      };
    }
    return {
      status: 'danger',
      explanation: 'pH is outside the safe operating range.',
      tips: ['🚨 Start staged correction now.', '🚨 Double-check sensor and test kit for confirmation.'],
      why: 'Significant pH imbalance can affect breathing, appetite, and long-term fish health.',
    };
  };

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      try {
        const [pathsData, progressData, tanksData] = await Promise.all([
          getLearningPaths(),
          getLearningProgress(),
        ]);

        const firstTank = tanksData?.[0];
        const sensorData = firstTank ? await getSensorData(firstTank.id, '24h') : null;

        if (!mounted) return;
        setPaths(pathsData || []);
        setProgress(progressData);
        setSensorReadings(sensorData?.currentReadings || null);
        setActivePathId(pathsData?.[0]?.id || '');
      } catch (err) {
        console.error('Failed to load learning hub:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const activePath = useMemo(() => {
    return paths.find((item) => item.id === activePathId) || null;
  }, [paths, activePathId]);

  const sensorCards = useMemo(() => {
    if (!sensorReadings) return [];

    const tempValue = sensorReadings.temperature?.value ?? 0;
    const turbidityValue = sensorReadings.turbidity?.value ?? 0;
    const phValue = sensorReadings.ph?.value ?? 0;

    const tempState = getTemperatureState(tempValue);
    const turbidityState = getTurbidityState(turbidityValue);
    const phState = getPhState(phValue);

    return [
      {
        id: 'temperature',
        label: 'Temperature',
        icon: FaThermometerHalf,
        value: `${tempValue.toFixed(1)}°C`,
        image: temperatureProbeImage,
        ...tempState,
      },
      {
        id: 'turbidity',
        label: 'Turbidity',
        icon: FaTint,
        value: `${turbidityValue.toFixed(1)} NTU`,
        image: turbiditySensorImage,
        ...turbidityState,
      },
      {
        id: 'ph',
        label: 'pH',
        icon: FaFlask,
        value: `${phValue.toFixed(2)}`,
        image: phSensorImage,
        ...phState,
      },
    ];
  }, [sensorReadings]);

  if (loading) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.loading}>Loading learning hub...</div>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <header className={styles.hero}>
        <p className={styles.kicker}>Learn & Care</p>
        <h1>Training for Better Tank Decisions</h1>
        <p className={styles.subtext}>
          Friendly practical guidance based on your live readings, with simple actions first.
        </p>
        <div className={styles.progressRow}>
          <div className={styles.progressMeta}>
            <span>{progress?.completionRate || 0}% completed</span>
            <span>{progress?.streakDays || 1}-day streak</span>
          </div>
          <div className={styles.progressTrack} aria-label="Learning progress">
            <div className={styles.progressFill} style={{ width: `${progress?.completionRate || 0}%` }} />
          </div>
        </div>
      </header>

      <section className={styles.sensorSection}>
        <div className={styles.cardHeader}>
          <h2>Current Readings</h2>
          <Link to="/education/progress">Progress</Link>
        </div>
        <div className={styles.sensorGrid}>
          {sensorCards.map((sensor) => (
            <article key={sensor.id} className={`${styles.sensorCard} ${styles[sensor.status]}`}>
              <img src={sensor.image} alt={`${sensor.label} sensor`} loading="lazy" />
              <div className={styles.sensorBody}>
                <div className={styles.sensorHeader}>
                  <span className={styles.sensorLabel}><sensor.icon /> {sensor.label}</span>
                  <span className={styles.statusPill}>{sensor.status}</span>
                </div>
                <p className={styles.sensorValue}>{sensor.value}</p>
                <p className={styles.sensorExplanation}>{sensor.explanation}</p>
                <div className={styles.tipList}>
                  {sensor.tips.map((tip) => (
                    <p key={tip}>{tip}</p>
                  ))}
                </div>
                <details className={styles.whyDetails}>
                  <summary>Why it matters</summary>
                  <p>{sensor.why}</p>
                </details>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.pathSection}>
        <div className={styles.cardHeader}>
          <h2>Learning Paths</h2>
        </div>
        <div className={styles.pathTabs}>
          {paths.map((path) => (
            <button
              key={path.id}
              className={`${styles.pathTab} ${activePathId === path.id ? styles.pathTabActive : ''}`}
              onClick={() => setActivePathId(path.id)}
            >
              <span>{path.level}</span>
              <strong>{path.title}</strong>
            </button>
          ))}
        </div>

        {activePath && (
          <article className={styles.activePathCard}>
            <h3>{activePath.title}</h3>
            <p>{activePath.description}</p>
            <p className={styles.estimate}>{activePath.lessonsCount} lessons, about {activePath.durationMin} minutes</p>
            <div className={styles.pathActions}>
              <button onClick={() => navigate(`/education/path/${activePath.id}`)}>Open Path</button>
              <button className={styles.secondary} onClick={() => navigate('/education/progress')}>View Progress</button>
            </div>
          </article>
        )}
      </section>

      <section className={styles.hardwareSection}>
        <div className={styles.cardHeader}>
          <h2>FishMaster Hardware Overview</h2>
        </div>
        <p className={styles.hardwareIntro}>
          Quick visual catalog of the current stack used by the system.
        </p>
        <div className={styles.hardwareGrid}>
          {hardwareList.map((item) => (
            <article key={item.id} className={styles.hardwareCard}>
              <img src={item.image} alt={`${item.label} illustration`} loading="lazy" />
              <div className={styles.hardwareBody}>
                <h3>{item.label}</h3>
                <p>{item.model}</p>
                <div className={styles.hardwareMeta}>
                  <span>Qty: {item.quantity}</span>
                  <span>{item.purpose}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.footerCard}>
        <p>
          Flow: check the sensor colors and numbers first, take one action from the tip list, then open a learning path only if you want deeper context.
        </p>
      </section>
    </div>
  );
}

export default LearningHomePage;
