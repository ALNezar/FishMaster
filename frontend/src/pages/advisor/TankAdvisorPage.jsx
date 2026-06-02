import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FaFish,
  FaThermometerHalf,
  FaTint,
  FaWater,
  FaUtensils,
  FaFilter,
  FaEye,
  FaCheckCircle,
  FaCircle,
  FaCompass,
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
};

const ALERT_ICONS = {
  temperature: FaThermometerHalf,
  ph: FaTint,
  turbidity: FaWater,
  fish: FaFish,
};

function HealthRing({ percent, mood }) {
  const color = mood === 'happy' ? '#22c55e' : mood === 'okay' ? '#eab308' : '#ef4444';
  const radius = 70;
  const stroke = 10;
  const normalized = Math.min(100, Math.max(0, percent));
  const circumference = 2 * Math.PI * (radius - stroke);
  const offset = circumference - (normalized / 100) * circumference;

  return (
    <div className={styles.ringWrap}>
      <svg width="160" height="160" viewBox="0 0 160 160" aria-hidden>
        <circle cx="80" cy="80" r={radius - stroke} fill="rgba(255,255,255,0.9)" />
        <circle
          cx="80"
          cy="80"
          r={radius - stroke}
          fill="none"
          stroke="rgba(61,48,33,0.1)"
          strokeWidth={stroke}
        />
        <circle
          cx="80"
          cy="80"
          r={radius - stroke}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 80 80)"
        />
      </svg>
      <div className={styles.ringLabel}>
        <span className={styles.ringPercent}>{percent}%</span>
        <span className={styles.ringSub}>Tank health</span>
      </div>
    </div>
  );
}

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

  const moodClass =
    snapshot?.mood === 'happy'
      ? styles.moodHappy
      : snapshot?.mood === 'okay'
        ? styles.moodOkay
        : styles.moodStressed;

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
          <p>Add a tank first to get advice.</p>
          <Link to="/tanks">Go to My Tanks</Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
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
          <section className={styles.worldHeader} aria-label="Aquarium mood">
            <span className={styles.bubble} />
            <span className={styles.bubble} />
            <span className={styles.bubble} />
            <div className={styles.worldContent}>
              <img src={fishMascot} alt="" className={styles.mascot} />
              <span className={`${styles.moodBadge} ${moodClass}`}>
                {snapshot.moodLabel}
              </span>
            </div>
          </section>

          <section className={styles.healthSection}>
            <HealthRing percent={snapshot.healthPercent} mood={snapshot.mood} />
          </section>

          {snapshot.alertCards.length === 0 ? (
            <div className={styles.allClear}>All clear! Your fish look comfy.</div>
          ) : (
            <>
              <p className={styles.sectionTitle}>Heads up</p>
              {snapshot.alertCards.map((card) => {
                const Icon = ALERT_ICONS[card.iconKey] || FaFish;
                const toneClass =
                  card.tone === 'danger' ? styles.alertDanger : styles.alertWarning;
                return (
                  <div key={card.id} className={`${styles.alertCard} ${toneClass}`}>
                    <div className={styles.alertIcon}>
                      <Icon />
                    </div>
                    <p className={styles.alertText}>{card.message}</p>
                  </div>
                );
              })}
            </>
          )}

          <p className={styles.sectionTitle}>Today&apos;s quests</p>
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
                  <div className={styles.questIcon}>
                    <Icon />
                  </div>
                  <span className={styles.questTitle}>{quest.title}</span>
                  {done ? (
                    <FaCheckCircle className={styles.questCheck} aria-label="Done" />
                  ) : (
                    <FaCircle style={{ opacity: 0.2 }} aria-hidden />
                  )}
                </button>
              );
            })}
          </div>

          {snapshot.speciesWarnings.length > 0 && (
            <div className={styles.card}>
              <p className={styles.sectionTitle}>Fish friends</p>
              {snapshot.speciesWarnings.map((w, i) => (
                <div key={i} style={{ marginBottom: '0.75rem' }}>
                  <strong>{w.title}</strong>
                  <p style={{ margin: '0.25rem 0' }}>{w.message}</p>
                  <p style={{ fontSize: '0.85rem', color: '#7b6b5b', margin: 0 }}>
                    {w.fishNames.join(', ')}
                  </p>
                </div>
              ))}
            </div>
          )}

          {snapshot.weeklyReport.length > 0 && (
            <div className={styles.card}>
              <p className={styles.sectionTitle}>This week</p>
              <ul>
                {snapshot.weeklyReport.map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ul>
            </div>
          )}

          {snapshot.recommendedActions.length > 0 && (
            <div className={styles.card}>
              <p className={styles.sectionTitle}>Try this</p>
              <ol className={styles.actionsList}>
                {snapshot.recommendedActions.map((action, i) => (
                  <li key={i}>{action}</li>
                ))}
              </ol>
            </div>
          )}

          <div className={styles.linkRow}>
            <Link to="/data">See sensor details</Link>
          </div>
        </>
      ) : null}
    </div>
  );
}
