import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getLearningPaths, getLearningProgress, getSensorData, getTanks } from '../../api';
import styles from './LearningHomePage.module.scss';
import { FaArrowRight, FaChartLine, FaCheckCircle, FaClock, FaExclamationTriangle, FaFlask, FaRedo, FaThermometerHalf, FaTint, FaWater } from 'react-icons/fa';
import placeholderImage from '../../assets/images/learning/placeholder.svg';
import temperatureProbeImage from '../../assets/images/learning/temperature-probe.svg';
import phSensorImage from '../../assets/images/learning/ph-sensor.svg';
import turbiditySensorImage from '../../assets/images/learning/turbidity-sensor.svg';

const GUIDE_DETAILS = {
  temperature: {
    label: 'Temperature',
    icon: FaThermometerHalf,
    image: temperatureProbeImage,
    pathId: 'temperature',
    action: 'Open temperature guide',
  },
  ph: {
    label: 'pH',
    icon: FaFlask,
    image: phSensorImage,
    pathId: 'ph',
    action: 'Open pH guide',
  },
  turbidity: {
    label: 'Turbidity',
    icon: FaWater,
    image: turbiditySensorImage,
    pathId: 'turbidity',
    action: 'Open turbidity guide',
  },
};

const getStatusTone = (value, kind) => {
  if (kind === 'temperature') {
    if (value >= 24 && value <= 26) return 'safe';
    if ((value >= 22 && value < 24) || (value > 26 && value <= 28)) return 'caution';
    return 'danger';
  }

  if (kind === 'ph') {
    if (value >= 6.8 && value <= 7.4) return 'safe';
    if ((value >= 6.5 && value < 6.8) || (value > 7.4 && value <= 7.8)) return 'caution';
    return 'danger';
  }

  if (value < 3) return 'safe';
  if (value <= 5) return 'caution';
  return 'danger';
};

const toneLabel = {
  safe: 'Stable',
  caution: 'Watch',
  danger: 'Fix now',
};

function LearningHomePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [paths, setPaths] = useState([]);
  const [progress, setProgress] = useState(null);
  const [sensorReadings, setSensorReadings] = useState(null);
  const [activePathId, setActivePathId] = useState('');

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      try {
        const [pathsData, progressData, tanksData] = await Promise.all([
          getLearningPaths(),
          getLearningProgress(),
          getTanks(),
        ]);

        const firstTank = tanksData?.[0];
        const sensorData = firstTank ? await getSensorData(firstTank.id, '24h') : null;

        if (!mounted) return;

        setPaths(pathsData || []);
        setProgress(progressData || null);
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

  const liveGuidance = useMemo(() => {
    const temperature = Number(sensorReadings?.temperature?.value ?? 25);
    const ph = Number(sensorReadings?.ph?.value ?? 7);
    const turbidity = Number(sensorReadings?.turbidity?.value ?? 0);

    return [
      {
        kind: 'temperature',
        value: `${temperature.toFixed(1)}°C`,
        tone: getStatusTone(temperature, 'temperature'),
        title: 'Temperature',
        detail: temperature >= 24 && temperature <= 26
          ? 'Comfortable range for most tropical tanks.'
          : 'Adjust heating gradually and recheck the trend.',
        action: 'Open temperature guide',
      },
      {
        kind: 'ph',
        value: ph.toFixed(2),
        tone: getStatusTone(ph, 'ph'),
        title: 'pH',
        detail: ph >= 6.8 && ph <= 7.4
          ? 'Balanced and safe for most community fish.'
          : 'Stabilize chemistry and avoid sudden corrections.',
        action: 'Open pH guide',
      },
      {
        kind: 'turbidity',
        value: `${turbidity.toFixed(1)} NTU`,
        tone: getStatusTone(turbidity, 'turbidity'),
        title: 'Turbidity',
        detail: turbidity < 3
          ? 'Water is clear and the filter is keeping up.'
          : 'Inspect filtration and feeding before cloudiness grows.',
        action: 'Open turbidity guide',
      },
    ];
  }, [sensorReadings]);

  const currentPath = useMemo(
    () => paths.find((path) => path.id === activePathId) || paths[0] || null,
    [paths, activePathId]
  );

  const viewedSectionIds = progress?.viewedSectionIds || [];

  const quickActions = [
    {
      title: 'Recheck sensors',
      description: 'Refresh the latest tank readings and guidance cards.',
      icon: FaRedo,
      onClick: () => window.location.reload(),
    },
    {
      title: 'Review alerts',
      description: 'Jump to alert thresholds and open issues.',
      icon: FaExclamationTriangle,
      onClick: () => navigate('/alerts'),
    },
    {
      title: 'View progress',
      description: 'See what you have already completed.',
      icon: FaCheckCircle,
      onClick: () => navigate('/education/progress'),
    },
  ];

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loadingCard}>Loading learning hub...</div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.kicker}>Learn & Care</p>
          <h1>Understand your tank using live data and guided actions</h1>
          <p className={styles.subtext}>
            See the current readings, decide what needs attention now, and open a learning path only when you want deeper context.
          </p>
          <div className={styles.heroMeta}>
            <span>{progress?.completionRate || 0}% complete</span>
            <span>{progress?.streakDays || 0}-day streak</span>
          </div>
          <div className={styles.progressWrap} aria-label="Learning progress">
            <div className={styles.progressTrack}>
              <div className={styles.progressFill} style={{ width: `${progress?.completionRate || 0}%` }} />
            </div>
          </div>
        </div>

        <aside className={styles.heroPanel}>
          <div className={styles.heroPanelHeader}>
            <span>Live Guidance</span>
            <Link to="/education/progress">Progress</Link>
          </div>
          <div className={styles.heroPanelBody}>
            {liveGuidance.map((item) => {
              const Icon = GUIDE_DETAILS[item.kind].icon;
              return (
                <article key={item.kind} className={`${styles.guidanceMiniCard} ${styles[item.tone]}`}>
                  <div className={styles.guidanceMiniTop}>
                    <span className={styles.guidanceMiniLabel}><Icon /> {item.title}</span>
                    <strong>{item.value}</strong>
                  </div>
                  <p>{item.detail}</p>
                  <button type="button" onClick={() => navigate(`/education/path/${GUIDE_DETAILS[item.kind].pathId}`)}>
                    {item.action} <FaArrowRight />
                  </button>
                </article>
              );
            })}
          </div>
        </aside>
      </header>

      <section className={styles.quickActionsSection}>
        <div className={styles.sectionHeader}>
          <h2>Quick actions</h2>
          <p>Choose one fast action before opening a lesson.</p>
        </div>
        <div className={styles.quickActionGrid}>
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <button key={action.title} type="button" className={styles.quickActionCard} onClick={action.onClick}>
                <span className={styles.quickActionIcon}><Icon /></span>
                <strong>{action.title}</strong>
                <p>{action.description}</p>
              </button>
            );
          })}
        </div>
      </section>

      <section className={styles.guidanceSection}>
        <div className={styles.sectionHeader}>
          <h2>Live guidance</h2>
          <p>What to do now based on your latest readings.</p>
        </div>
        <div className={styles.guidanceGrid}>
          {liveGuidance.map((item) => {
            const meta = GUIDE_DETAILS[item.kind];
            const Icon = meta.icon;
            return (
              <article key={item.kind} className={`${styles.guidanceCard} ${styles[item.tone]}`}>
                <div className={styles.guidanceCardTop}>
                  <span className={styles.guidanceCardIcon}><Icon /></span>
                  <div>
                    <p>{item.title}</p>
                    <h3>{item.value}</h3>
                  </div>
                  <span className={styles.toneBadge}>{toneLabel[item.tone]}</span>
                </div>
                <p className={styles.guidanceDetail}>{item.detail}</p>
                <div className={styles.guidanceFooter}>
                  <button type="button" onClick={() => navigate(`/education/path/${meta.pathId}`)}>
                    {meta.action}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className={styles.pathsSection}>
        <div className={styles.sectionHeader}>
          <h2>Learning paths</h2>
          <p>Structured lessons for the topics that matter most.</p>
        </div>
        <div className={styles.pathsGrid}>
          {paths.map((path) => {
            const viewed = viewedSectionIds.includes(path.id) || (progress?.pathProgress || []).some((item) => item.pathId === path.id && item.percent > 0);
            const isActive = currentPath?.id === path.id;

            return (
              <article key={path.id} className={`${styles.pathCard} ${isActive ? styles.activePath : ''}`}>
                <div className={styles.pathCardMedia}>
                  <img
                    src={path.sensorImage}
                    alt={`${path.title} visual`}
                    loading="lazy"
                    onError={(event) => {
                      event.currentTarget.onerror = null;
                      event.currentTarget.src = placeholderImage;
                    }}
                  />
                </div>
                <div className={styles.pathCardBody}>
                  <div className={styles.pathCardMeta}>
                    <span>{path.level}</span>
                    <span>{path.lessonsCount} lessons</span>
                  </div>
                  <h3>{path.title}</h3>
                  <p>{path.description}</p>
                  <div className={styles.pathCardFooter}>
                    <span><FaClock /> {path.durationMin} min</span>
                    {viewed ? <strong>Viewed</strong> : <strong>New</strong>}
                  </div>
                  <button type="button" onClick={() => navigate(`/education/path/${path.id}`)}>
                    Open path <FaArrowRight />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className={styles.guidesSection}>
        <div className={styles.sectionHeader}>
          <h2>Quick guides</h2>
          <p>Open a focused guide when you want to go deeper.</p>
        </div>
        <div className={styles.guidesGrid}>
          {Object.values(GUIDE_DETAILS).map((guide) => {
            const Icon = guide.icon;
            return (
              <button key={guide.kind || guide.pathId} type="button" className={styles.guideCard} onClick={() => navigate(`/education/path/${guide.pathId}`)}>
                <img src={guide.image} alt={`${guide.label} guide`} onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = placeholderImage; }} />
                <div className={styles.guideCardBody}>
                  <span><Icon /> {guide.label}</span>
                  <strong>{guide.action}</strong>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <footer className={styles.footerCard}>
        <div>
          <h2>FishMaster Learn & Care</h2>
          <p>Check the live guidance first, then use the learning paths when you want a deeper explanation.</p>
        </div>
      </footer>
    </div>
  );
}

export default LearningHomePage;
