import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  FaArrowLeft,
  FaCompass,
  FaEdit,
  FaFish,
  FaPlus,
  FaThermometerHalf,
  FaTimes,
  FaTrash,
  FaChartLine,
} from 'react-icons/fa';
import fishMascot from '../../assets/images/blackandredfish.svg';
import api, {
  getFishTypes,
  addFishToTank,
  removeFishFromTank,
  getAdvisorSnapshot,
} from '../../api';
import Button from '../../components/common/button/button';
import { useToast } from '../../components/common/toast/ToastProvider';
import { haptics } from '../../utils/haptics';
import styles from './TankDetailsPage.module.scss';

function HealthRing({ percent, mood }) {
  const color = mood === 'happy' ? '#22c55e' : mood === 'okay' ? '#eab308' : '#ef4444';
  const radius = 70;
  const stroke = 10;
  const normalized = Math.min(100, Math.max(0, percent ?? 0));
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
        <span className={styles.ringPercent}>{normalized}%</span>
        <span className={styles.ringSub}>Tank health</span>
      </div>
    </div>
  );
}

export default function TankDetailsPage() {
  const { id } = useParams();
  const tankId = Number(id);
  const navigate = useNavigate();
  const toast = useToast();

  const [tank, setTank] = useState(null);
  const [snapshot, setSnapshot] = useState(null);
  const [fishTypes, setFishTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', sizeLiters: '' });
  const [manageFishOpen, setManageFishOpen] = useState(false);
  const [showAddFish, setShowAddFish] = useState(false);
  const [newFish, setNewFish] = useState({ name: '', fishTypeId: '' });
  const [saving, setSaving] = useState(false);

  const loadAll = useCallback(async () => {
    if (!tankId || Number.isNaN(tankId)) return;
    setLoading(true);
    setError('');
    try {
      const [tankResult, advisorResult, typesResult] = await Promise.allSettled([
        api.apiRequest(`/tanks/${tankId}`),
        getAdvisorSnapshot(tankId),
        getFishTypes(),
      ]);

      if (tankResult.status !== 'fulfilled') {
        throw tankResult.reason;
      }

      const tankData = tankResult.value;
      setTank(tankData);
      setEditForm({ name: tankData.name, sizeLiters: String(tankData.sizeLiters ?? '') });

      if (advisorResult.status === 'fulfilled') {
        setSnapshot(advisorResult.value);
      } else {
        console.error('Advisor snapshot failed:', advisorResult.reason);
        setSnapshot(null);
        setError(
          advisorResult.reason?.message ||
            'Care tips could not load — showing tank info only.'
        );
      }

      if (typesResult.status === 'fulfilled') {
        setFishTypes(typesResult.value || []);
      }
    } catch (err) {
      console.error(err);
      setError(err?.message || 'Could not load this tank.');
      setTank(null);
      setSnapshot(null);
    } finally {
      setLoading(false);
    }
  }, [tankId]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const stockingStatus = useMemo(() => {
    const pct = snapshot?.stockingPercent ?? 0;
    if (!tank?.fish?.length) return { status: 'empty', percentage: 0 };
    if (pct > 100) return { status: 'overstocked', percentage: pct };
    if (pct > 80) return { status: 'warning', percentage: pct };
    return { status: 'good', percentage: pct };
  }, [tank, snapshot]);

  const compatibilityClass =
    snapshot?.compatibilityLabel === 'Good'
      ? styles.compatGood
      : snapshot?.compatibilityLabel === 'Mixed'
        ? styles.compatMixed
        : styles.compatWatch;

  const moodClass =
    snapshot?.mood === 'happy'
      ? styles.moodHappy
      : snapshot?.mood === 'okay'
        ? styles.moodOkay
        : styles.moodStressed;

  const tempStatusClass =
    snapshot?.temperatureStatus?.includes('high') || snapshot?.temperatureStatus?.includes('warm')
      ? styles.tempHigh
      : snapshot?.temperatureStatus?.includes('low') || snapshot?.temperatureStatus?.includes('cold')
        ? styles.tempLow
        : styles.tempOk;

  const moodLabel = snapshot?.moodLabel ?? 'Checking…';
  const healthPercent = snapshot?.healthPercent ?? 0;
  const healthMood = snapshot?.mood ?? 'okay';

  const handleSaveTank = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await api.apiRequest(`/tanks/${tankId}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: editForm.name,
          sizeLiters: Number(editForm.sizeLiters),
        }),
      });
      setTank(updated);
      setEditOpen(false);
      toast.success('Tank updated!');
      haptics.tap();
      await loadAll();
    } catch {
      toast.error('Could not save tank');
    } finally {
      setSaving(false);
    }
  };

  const handleAddFish = async (e) => {
    e.preventDefault();
    if (!newFish.name.trim() || !newFish.fishTypeId) {
      toast.error('Pick a name and species');
      return;
    }
    setSaving(true);
    const fishName = newFish.name.trim();
    try {
      await addFishToTank(tankId, {
        name: fishName,
        fishTypeId: parseInt(newFish.fishTypeId, 10),
      });
      setNewFish({ name: '', fishTypeId: '' });
      setShowAddFish(false);
      toast.success(`Welcome, ${fishName}!`);
      haptics.notification();
      await loadAll();
    } catch (err) {
      toast.error(err?.message || 'Could not add fish');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveFish = async (fishId, fishName) => {
    if (!window.confirm(`Remove ${fishName} from this tank?`)) return;
    try {
      await removeFishFromTank(tankId, fishId);
      toast.success('Fish removed');
      await loadAll();
    } catch {
      toast.error('Could not remove fish');
    }
  };

  const selectedType = fishTypes.find((ft) => ft.id === parseInt(newFish.fishTypeId, 10));

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <p>Checking on your fish…</p>
        </div>
      </div>
    );
  }

  if (!tank) {
    return (
      <div className={styles.page}>
        <p className={styles.errorBanner}>{error || 'Tank not found.'}</p>
        <button type="button" className={styles.backBtn} onClick={() => navigate('/tanks')}>
          <FaArrowLeft /> My Tanks
        </button>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <button type="button" className={styles.backBtn} onClick={() => navigate('/tanks')}>
          <FaArrowLeft /> Tanks
        </button>
        <button type="button" className={styles.editBtn} onClick={() => setEditOpen(true)}>
          <FaEdit /> Edit
        </button>
      </div>

      <h1 className={styles.tankTitle}>{tank.name}</h1>
      <p className={styles.tankSubtitle}>Your aquarium at a glance</p>

      {error && <p className={styles.softWarning}>{error}</p>}

      <section className={styles.worldHeader} aria-label="Tank mood">
        <span className={styles.bubble} />
        <span className={styles.bubble} />
        <span className={styles.bubble} />
        <div className={styles.worldContent}>
          <img src={fishMascot} alt="" className={styles.mascot} />
          <span className={`${styles.moodBadge} ${moodClass}`}>{moodLabel}</span>
        </div>
      </section>

      {snapshot && (
        <section className={styles.healthSection}>
          <HealthRing percent={healthPercent} mood={healthMood} />
        </section>
      )}

      <div className={styles.statRow}>
        <div className={styles.statPill}>
          <span className={styles.statValue}>{snapshot?.fishCount ?? tank.fish?.length ?? 0}</span>
          <span className={styles.statLabel}>Fish</span>
        </div>
        <div className={styles.statPill}>
          <span className={styles.statValue}>{snapshot?.sizeLiters ?? tank.sizeLiters}L</span>
          <span className={styles.statLabel}>Tank</span>
        </div>
        <div className={`${styles.statPill} ${snapshot ? compatibilityClass : ''}`}>
          <span className={styles.statValue}>{snapshot?.compatibilityLabel || '—'}</span>
          <span className={styles.statLabel}>Compatibility</span>
        </div>
      </div>

      {stockingStatus.status !== 'empty' && stockingStatus.status !== 'good' && (
        <div className={`${styles.banner} ${styles[stockingStatus.status]}`}>
          {stockingStatus.status === 'overstocked'
            ? 'This tank may be crowded for your fish.'
            : 'Getting cozy — watch stocking levels.'}
          <span className={styles.bannerPct}>{stockingStatus.percentage}% space estimate</span>
        </div>
      )}

      {snapshot && (
        <div className={styles.metricCard}>
          <div className={styles.metricHeader}>
            <FaThermometerHalf />
            <span>Temperature</span>
          </div>
          <p className={styles.metricValue}>
            {snapshot.currentTemperature != null
              ? `${snapshot.currentTemperature.toFixed(1)}°C`
              : '—'}
          </p>
          {snapshot.idealTempMin != null && snapshot.idealTempMax != null && (
            <p className={styles.metricRange}>
              Ideal for your fish: {snapshot.idealTempMin}–{snapshot.idealTempMax}°C
            </p>
          )}
          <p className={`${styles.metricStatus} ${tempStatusClass}`}>
            {snapshot.temperatureStatus || 'Waiting for sensor'}
          </p>
        </div>
      )}

      {!snapshot && (
        <div className={styles.card}>
          <p className={styles.sectionTitle}>Care data</p>
          <p className={styles.emptyResidents}>
            Live care tips need the backend running. Open{' '}
            <Link to="/advisor">Tank Advisor</Link> or restart the API server.
          </p>
        </div>
      )}

      {snapshot?.alertCards?.length > 0 && (
        <>
          <p className={styles.sectionTitle}>Heads up</p>
          {snapshot.alertCards.slice(0, 3).map((card) => (
            <div
              key={card.id}
              className={`${styles.alertCard} ${
                card.tone === 'danger' ? styles.alertDanger : styles.alertWarning
              }`}
            >
              {card.message}
            </div>
          ))}
        </>
      )}

      {snapshot?.speciesWarnings?.length > 0 && (
        <>
          <p className={styles.sectionTitle}>Species check</p>
          {snapshot.speciesWarnings.map((w, i) => (
            <div key={i} className={styles.speciesCard}>
              <strong>{w.title}</strong>
              <p>{w.message}</p>
              <span className={styles.speciesNames}>{w.fishNames?.join(', ')}</span>
            </div>
          ))}
        </>
      )}

      {tank.fish?.map((fish) => {
        const ft = fish.fishType;
        const minTank = ft?.minTankSize;
        const tankSmall =
          minTank && tank.sizeLiters && minTank > tank.sizeLiters;
        if (!tankSmall) return null;
        return (
          <div key={`warn-${fish.id}`} className={styles.speciesCard}>
            <strong>{ft?.name || 'This species'}</strong>
            <p>
              May need more room as it grows — your tank is {tank.sizeLiters}L (often {minTank}L+
              recommended).
            </p>
            <span className={styles.speciesNames}>{fish.name}</span>
          </div>
        );
      })}

      {snapshot?.recommendedActions?.length > 0 && (
        <div className={styles.card}>
          <p className={styles.sectionTitle}>Care suggestions</p>
          <ul className={styles.careList}>
            {snapshot.recommendedActions.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        </div>
      )}

      <div className={styles.card}>
        <div className={styles.residentsHeader}>
          <p className={styles.sectionTitle}>
            <FaFish /> Residents
          </p>
          <button
            type="button"
            className={styles.manageBtn}
            onClick={() => setManageFishOpen(true)}
          >
            Manage
          </button>
        </div>
        {tank.fish?.length > 0 ? (
          <ul className={styles.residentList}>
            {tank.fish.map((fish) => (
              <li key={fish.id} className={styles.residentItem}>
                <span className={styles.residentEmoji}>🐟</span>
                <div>
                  <strong>{fish.name}</strong>
                  <small>{fish.fishType?.name || 'Unknown'}</small>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.emptyResidents}>No fish yet — add some friends!</p>
        )}
      </div>

      <div className={styles.linkRow}>
        <Link to={`/advisor`} className={styles.linkChip} onClick={() => haptics.tap()}>
          <FaCompass /> Daily quests
        </Link>
        <Link to="/data" className={styles.linkChip}>
          <FaChartLine /> Sensor charts
        </Link>
      </div>

      {editOpen && (
        <div className={styles.modalBackdrop} role="dialog" aria-modal="true">
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2>Edit tank</h2>
              <button type="button" className={styles.closeBtn} onClick={() => setEditOpen(false)}>
                <FaTimes />
              </button>
            </div>
            <form onSubmit={handleSaveTank}>
              <label className={styles.field}>
                <span>Name</span>
                <input
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  required
                />
              </label>
              <label className={styles.field}>
                <span>Volume (L)</span>
                <input
                  type="number"
                  min="1"
                  value={editForm.sizeLiters}
                  onChange={(e) => setEditForm({ ...editForm, sizeLiters: e.target.value })}
                  required
                />
              </label>
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving…' : 'Save'}
              </Button>
            </form>
          </div>
        </div>
      )}

      {manageFishOpen && (
        <div className={styles.modalBackdrop} role="dialog" aria-modal="true">
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2>Manage fish</h2>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={() => {
                  setManageFishOpen(false);
                  setShowAddFish(false);
                }}
              >
                <FaTimes />
              </button>
            </div>

            {!showAddFish ? (
              <Button className={styles.addFishTrigger} onClick={() => setShowAddFish(true)}>
                <FaPlus /> Add fish
              </Button>
            ) : (
              <form className={styles.addFishForm} onSubmit={handleAddFish}>
                <label className={styles.field}>
                  <span>Name</span>
                  <input
                    value={newFish.name}
                    onChange={(e) => setNewFish({ ...newFish, name: e.target.value })}
                    placeholder="Nemo"
                    required
                  />
                </label>
                <label className={styles.field}>
                  <span>Species</span>
                  <select
                    value={newFish.fishTypeId}
                    onChange={(e) => setNewFish({ ...newFish, fishTypeId: e.target.value })}
                    required
                  >
                    <option value="">Choose…</option>
                    {fishTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                </label>
                {selectedType && (
                  <p className={styles.speciesHint}>
                    Likes {selectedType.temperatureMin}–{selectedType.temperatureMax}°C · pH{' '}
                    {selectedType.phMin}–{selectedType.phMax}
                  </p>
                )}
                <div className={styles.formActions}>
                  <Button type="submit" disabled={saving}>
                    {saving ? 'Adding…' : 'Add to tank'}
                  </Button>
                  <button type="button" className={styles.textBtn} onClick={() => setShowAddFish(false)}>
                    Cancel
                  </button>
                </div>
              </form>
            )}

            <ul className={styles.manageList}>
              {tank.fish?.map((fish) => (
                <li key={fish.id}>
                  <span>
                    {fish.name} <small>({fish.fishType?.name})</small>
                  </span>
                  <button
                    type="button"
                    className={styles.removeBtn}
                    onClick={() => handleRemoveFish(fish.id, fish.name)}
                    aria-label={`Remove ${fish.name}`}
                  >
                    <FaTrash />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
