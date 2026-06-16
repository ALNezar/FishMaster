import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FaFish,
  FaThermometerHalf,
  FaTint,
  FaWater,
  FaUtensils,
  FaFilter,
  FaCheckCircle,
  FaCircle,
  FaCompass,
  FaExclamationTriangle,
  FaExclamationCircle,
  FaLightbulb,
  FaCalendarAlt,
  FaHeartbeat,
  FaFire,
  FaCog,
  FaShieldAlt,
} from 'react-icons/fa';
import fishMascot from '../../assets/images/blackandredfish.svg';
import { getTanks, getAdvisorSnapshot, completeAdvisorQuest } from '../../api';
import { useToast } from '../../components/common/toast/ToastProvider';
import { haptics } from '../../utils/haptics';
import styles from './TankAdvisorPage.module.scss';

const QUEST_ICONS = {
  temperature: FaThermometerHalf,
  ph: FaTint,
  turbidity: FaWater,
  feed: FaUtensils,
  filter: FaFilter,
  fish: FaFish,
  heater: FaFire,
  equipment: FaCog,
};

const ALERT_ICONS = {
  temperature: FaThermometerHalf,
  ph: FaTint,
  turbidity: FaWater,
  fish: FaFish,
  filter: FaFilter,
  heater: FaFire,
};

/* ── Health status helpers ─────────────────────────────────── */

function getHealthTier(percent) {
  if (percent >= 75) return 'healthy';
  if (percent >= 50) return 'okay';
  if (percent >= 25) return 'warning';
  return 'critical';
}

function getHealthLabel(tier) {
  switch (tier) {
    case 'healthy':
      return { headline: 'Looking great!', sub: 'Your tank is in excellent shape' };
    case 'okay':
      return { headline: 'Needs attention', sub: 'A few things to keep an eye on' };
    case 'warning':
      return { headline: 'Take action soon', sub: 'Several issues need your attention' };
    case 'critical':
      return { headline: 'Critical condition', sub: 'Immediate action needed' };
    default:
      return { headline: '', sub: '' };
  }
}

function getHealthIcon(tier) {
  switch (tier) {
    case 'healthy':
      return FaCheckCircle;
    case 'okay':
      return FaHeartbeat;
    case 'warning':
      return FaExclamationTriangle;
    case 'critical':
      return FaExclamationCircle;
    default:
      return FaHeartbeat;
  }
}

/* ── Hero Health Card ──────────────────────────────────────── */

function HeroHealthCard({ percent, mood }) {
  const tier = getHealthTier(percent);
  const { headline, sub } = getHealthLabel(tier);
  const StatusIcon = getHealthIcon(tier);
  const tierClass = styles[`hero_${tier}`];

  const radius = 54;
  const stroke = 8;
  const normalized = Math.min(100, Math.max(0, percent));
  const circumference = 2 * Math.PI * (radius - stroke);
  const offset = circumference - (normalized / 100) * circumference;

  return (
    <section className={`${styles.heroCard} ${tierClass}`} aria-label="Tank health score">
      <div className={styles.heroTop}>
        <div className={styles.heroRing}>
          <svg width="108" height="108" viewBox="0 0 108 108" aria-hidden>
            <circle
              cx="54" cy="54" r={radius - stroke}
              fill="rgba(255,255,255,0.15)"
            />
            <circle
              cx="54" cy="54" r={radius - stroke}
              fill="none"
              stroke="rgba(255,255,255,0.25)"
              strokeWidth={stroke}
            />
            <circle
              cx="54" cy="54" r={radius - stroke}
              fill="none"
              stroke="#fff"
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              transform="rotate(-90 54 54)"
              className={styles.heroRingProgress}
            />
          </svg>
          <span className={styles.heroPercent}>{percent}%</span>
        </div>

        <div className={styles.heroInfo}>
          <div className={styles.heroStatus}>
            <StatusIcon className={styles.heroStatusIcon} />
            <span>Tank Health</span>
          </div>
          <h2 className={styles.heroHeadline}>{headline}</h2>
          <p className={styles.heroSub}>{sub}</p>
        </div>
      </div>
    </section>
  );
}

/* ── Grouped Alerts Section ────────────────────────────────── */

function GroupedAlerts({ alertCards }) {
  if (!alertCards || alertCards.length === 0) return null;

  const dangerAlerts = alertCards.filter((c) => c.tone === 'danger');
  const warningAlerts = alertCards.filter((c) => c.tone !== 'danger');

  return (
    <>
      {dangerAlerts.length > 0 && (
        <div className={`${styles.alertGroup} ${styles.alertGroupDanger}`}>
          <div className={styles.alertGroupHeader}>
            <FaExclamationCircle className={styles.alertGroupIcon} />
            <span className={styles.alertGroupTitle}>
              Critical {dangerAlerts.length > 1 ? `(${dangerAlerts.length})` : ''}
            </span>
          </div>
          <ul className={styles.alertGroupList}>
            {dangerAlerts.map((card) => {
              const Icon = ALERT_ICONS[card.iconKey] || FaFish;
              return (
                <li key={card.id} className={styles.alertGroupItem}>
                  <Icon className={styles.alertItemIcon} />
                  <span>{card.message}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {warningAlerts.length > 0 && (
        <div className={`${styles.alertGroup} ${styles.alertGroupWarning}`}>
          <div className={styles.alertGroupHeader}>
            <FaExclamationTriangle className={styles.alertGroupIcon} />
            <span className={styles.alertGroupTitle}>
              Heads Up {warningAlerts.length > 1 ? `(${warningAlerts.length})` : ''}
            </span>
          </div>
          <ul className={styles.alertGroupList}>
            {warningAlerts.map((card) => {
              const Icon = ALERT_ICONS[card.iconKey] || FaFish;
              return (
                <li key={card.id} className={styles.alertGroupItem}>
                  <Icon className={styles.alertItemIcon} />
                  <span>{card.message}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </>
  );
}

/* ── Main Page Component ───────────────────────────────────── */

export default function TankAdvisorPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [tanks, setTanks] = useState([]);
  const [selectedTankId, setSelectedTankId] = useState(null);
  const [snapshot, setSnapshot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [questLoading, setQuestLoading] = useState(null);

  useEffect(() => {
    getTanks()
      .then((data) => {
        const list = data || [];
        setTanks(list);
        if (list.length > 0) setSelectedTankId(list[0].id);
      })
      .catch(() => toast.error('Could not load tanks'))
      .finally(() => setLoading(false));
  }, [toast]);

  const loadSnapshot = useCallback(async (tankId) => {
    if (!tankId) return;
    setLoading(true);
    try {
      const data = await getAdvisorSnapshot(tankId);
      setSnapshot(data);
    } catch (err) {
      console.error(err);
      toast.error('Could not load Tank Advisor');
      setSnapshot(null);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (selectedTankId) loadSnapshot(selectedTankId);
  }, [selectedTankId, loadSnapshot]);

  const handleQuest = async (quest) => {
    if (quest.status === 'done') return;

    if (quest.key === 'feed_fish') {
      navigate('/device');
      return;
    }

    if (!quest.manual) return;

    setQuestLoading(quest.key);
    try {
      const updated = await completeAdvisorQuest(selectedTankId, quest.key);
      setSnapshot(updated);
      if (haptics.notification) haptics.notification();
      toast.success('Nice! Quest complete.');
    } catch (err) {
      console.error(err);
      toast.error('Could not save quest');
    } finally {
      setQuestLoading(null);
    }
  };

  if (loading && !snapshot && tanks.length === 0) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <p>Loading Tank Advisor…</p>
        </div>
      </div>
    );
  }

  if (tanks.length === 0) {
    return (
      <div className={styles.page}>
        <div className={styles.empty}>
          <FaFish className={styles.emptyIcon} />
          <p>Add a tank first to get advice.</p>
          <Link to="/tanks" className={styles.emptyLink}>Go to My Tanks</Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* ── Header ──────────────────────────────────────────── */}
      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.title}>
            <FaCompass /> Tank Advisor
          </h1>
          <p className={styles.subtitle}>What should you do today?</p>
        </div>
      </div>

      <select
        className={styles.tankSelect}
        value={selectedTankId ?? ''}
        onChange={(e) => setSelectedTankId(Number(e.target.value))}
      >
        {tanks.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>

      {loading && !snapshot ? (
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <p>Checking your tank…</p>
        </div>
      ) : snapshot ? (
        <>
          {/* ── Mood Banner ──────────────────────────────────── */}
          <section className={styles.worldHeader} aria-label="Aquarium mood">
            <span className={styles.bubble} />
            <span className={styles.bubble} />
            <span className={styles.bubble} />
            <div className={styles.worldContent}>
              <img src={fishMascot} alt="" className={styles.mascot} />
              <span
                className={`${styles.moodBadge} ${
                  snapshot.mood === 'happy'
                    ? styles.moodHappy
                    : snapshot.mood === 'okay'
                      ? styles.moodOkay
                      : styles.moodStressed
                }`}
              >
                {snapshot.mood === 'happy' && '😊 '}
                {snapshot.mood === 'okay' && '😐 '}
                {snapshot.mood === 'stressed' && '😟 '}
                {snapshot.moodLabel}
              </span>
            </div>
          </section>

          {/* ── Hero Health Card ──────────────────────────────── */}
          <HeroHealthCard percent={snapshot.healthPercent} mood={snapshot.mood} />

          {/* ── Alerts (grouped) ──────────────────────────────── */}
          {snapshot.alertCards.length === 0 ? (
            <div className={styles.allClear}>
              <FaCheckCircle className={styles.allClearIcon} />
              <span>All clear! Your fish look comfy.</span>
            </div>
          ) : (
            <GroupedAlerts alertCards={snapshot.alertCards} />
          )}

          {/* ── Today's Quests ────────────────────────────────── */}
          <div className={styles.sectionHeader}>
            <FaCog className={styles.sectionHeaderIcon} />
            <p className={styles.sectionTitle}>Today&apos;s quests</p>
          </div>
          <div className={styles.questList}>
            {snapshot.quests.map((quest) => {
              const Icon = QUEST_ICONS[quest.iconKey] || FaFish;
              const done = quest.status === 'done';
              return (
                <button
                  key={quest.key}
                  type="button"
                  className={`${styles.questRow} ${done ? styles.questDone : ''}`}
                  onClick={() => handleQuest(quest)}
                  disabled={questLoading === quest.key || (done && quest.key !== 'feed_fish')}
                >
                  <div className={`${styles.questIcon} ${done ? styles.questIconDone : ''}`}>
                    <Icon />
                  </div>
                  <span className={styles.questTitle}>{quest.title}</span>
                  {done ? (
                    <FaCheckCircle className={styles.questCheck} aria-label="Done" />
                  ) : (
                    <FaCircle style={{ opacity: 0.15, fontSize: '0.75rem' }} aria-hidden />
                  )}
                </button>
              );
            })}
          </div>

          {/* ── Species Compatibility ─────────────────────────── */}
          {snapshot.speciesWarnings.length > 0 && (
            <div className={`${styles.card} ${styles.cardSpecies}`}>
              <div className={styles.sectionHeader}>
                <FaShieldAlt className={`${styles.sectionHeaderIcon} ${styles.iconAmber}`} />
                <p className={styles.sectionTitle}>Species check</p>
              </div>
              {snapshot.speciesWarnings.map((w, i) => (
                <div key={i} className={styles.speciesItem}>
                  <div className={styles.speciesItemHeader}>
                    <FaExclamationTriangle className={styles.speciesWarnIcon} />
                    <strong>{w.title}</strong>
                  </div>
                  <p className={styles.speciesMsg}>{w.message}</p>
                  <p className={styles.speciesFish}>
                    <FaFish className={styles.speciesFishIcon} />
                    {w.fishNames.join(', ')}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* ── Weekly Report ─────────────────────────────────── */}
          {snapshot.weeklyReport.length > 0 && (
            <div className={`${styles.card} ${styles.cardInfo}`}>
              <div className={styles.sectionHeader}>
                <FaCalendarAlt className={`${styles.sectionHeaderIcon} ${styles.iconBlue}`} />
                <p className={styles.sectionTitle}>This week</p>
              </div>
              <ul className={styles.weeklyList}>
                {snapshot.weeklyReport.map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ul>
            </div>
          )}

          {/* ── Recommendations ───────────────────────────────── */}
          {snapshot.recommendedActions.length > 0 && (
            <div className={`${styles.card} ${styles.cardRecommend}`}>
              <div className={styles.sectionHeader}>
                <FaLightbulb className={`${styles.sectionHeaderIcon} ${styles.iconGold}`} />
                <p className={styles.sectionTitle}>Care suggestions</p>
              </div>
              <ol className={styles.actionsList}>
                {snapshot.recommendedActions.map((action, i) => (
                  <li key={i}>{action}</li>
                ))}
              </ol>
            </div>
          )}

          <div className={styles.linkRow}>
            <Link to="/data">📊 See sensor details</Link>
          </div>
        </>
      ) : null}
    </div>
  );
}
