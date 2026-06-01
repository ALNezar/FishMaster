import React, { useEffect, useMemo, useState } from 'react';
import { FaCheckCircle, FaExclamationTriangle, FaFlask, FaPlus, FaSyncAlt } from 'react-icons/fa';
import Card from '../../components/common/card/card';
import Button from '../../components/common/button/button';
import { createFishType, listFishTypes } from '../../api';
import styles from './FishTypesPage.module.scss';

const DEFAULT_FORM = {
  name: '',
  careLevel: 'beginner',
  minPh: '',
  maxPh: '',
  minTemp: '',
  maxTemp: '',
  description: '',
};

const parseOptionalNumber = (value) => {
  if (value === '' || value === null || value === undefined) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
};

export default function FishTypesPage() {
  const [fishTypes, setFishTypes] = useState([]);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const sortedFishTypes = useMemo(
    () => [...fishTypes].sort((a, b) => a.name.localeCompare(b.name)),
    [fishTypes]
  );

  const fetchFishTypes = async ({ initial = false } = {}) => {
    if (initial) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    setError('');

    try {
      const types = await listFishTypes();
      setFishTypes(Array.isArray(types) ? types : []);
    } catch (err) {
      console.error('Failed to load fish types:', err);
      setError(err?.message || 'Failed to load fish species.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchFishTypes({ initial: true });
  }, []);

  const handleChange = (field) => (event) => {
    const { value } = event.target;
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.name.trim()) {
      setError('Species name is required.');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    const payload = {
      name: form.name.trim(),
      careLevel: form.careLevel || undefined,
      minPh: parseOptionalNumber(form.minPh),
      maxPh: parseOptionalNumber(form.maxPh),
      minTemp: parseOptionalNumber(form.minTemp),
      maxTemp: parseOptionalNumber(form.maxTemp),
      description: form.description.trim() || undefined,
    };

    try {
      await createFishType(payload);
      await fetchFishTypes();
      setForm(DEFAULT_FORM);
      setSuccess('Species created successfully.');
    } catch (err) {
      console.error('Failed to create fish type:', err);
      setError(err?.message || 'Failed to create species.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <span className={styles.kicker}>
            <FaFlask /> Species management
          </span>
          <h1>Create custom fish species</h1>
          <p>
            Add species once and they will appear in onboarding and any other fish-type
            picker that reads from the shared catalog.
          </p>
        </div>

        <Button onClick={() => fetchFishTypes()} disabled={refreshing || loading}>
          <FaSyncAlt className={refreshing ? styles.spinning : ''} />
          Refresh list
        </Button>
      </section>

      {error && (
        <div className={styles.messageError}>
          <FaExclamationTriangle />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className={styles.messageSuccess}>
          <FaCheckCircle />
          <span>{success}</span>
        </div>
      )}

      <div className={styles.grid}>
        <Card className={styles.formCard}>
          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.sectionHeading}>
              <FaPlus />
              <h2>New species</h2>
            </div>

            <label className={styles.field}>
              <span>Name</span>
              <input
                type="text"
                value={form.name}
                onChange={handleChange('name')}
                placeholder="Super Neon Tetra"
                maxLength={100}
                required
              />
            </label>

            <label className={styles.field}>
              <span>Care level</span>
              <select value={form.careLevel} onChange={handleChange('careLevel')}>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </label>

            <div className={styles.row}>
              <label className={styles.field}>
                <span>Min pH</span>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="14"
                  value={form.minPh}
                  onChange={handleChange('minPh')}
                  placeholder="6.5"
                />
              </label>

              <label className={styles.field}>
                <span>Max pH</span>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="14"
                  value={form.maxPh}
                  onChange={handleChange('maxPh')}
                  placeholder="7.5"
                />
              </label>
            </div>

            <div className={styles.row}>
              <label className={styles.field}>
                <span>Min temp</span>
                <input
                  type="number"
                  step="0.1"
                  value={form.minTemp}
                  onChange={handleChange('minTemp')}
                  placeholder="72"
                />
              </label>

              <label className={styles.field}>
                <span>Max temp</span>
                <input
                  type="number"
                  step="0.1"
                  value={form.maxTemp}
                  onChange={handleChange('maxTemp')}
                  placeholder="78"
                />
              </label>
            </div>

            <label className={styles.field}>
              <span>Description</span>
              <textarea
                rows="4"
                value={form.description}
                onChange={handleChange('description')}
                placeholder="Small schooling fish."
              />
            </label>

            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Create species'}
            </Button>
          </form>
        </Card>

        <Card className={styles.listCard}>
          <div className={styles.sectionHeading}>
            <h2>Saved species</h2>
            <span className={styles.count}>{sortedFishTypes.length}</span>
          </div>

          {loading ? (
            <div className={styles.loadingState}>Loading species...</div>
          ) : sortedFishTypes.length === 0 ? (
            <div className={styles.emptyState}>
              <FaFlask />
              <p>No custom species yet.</p>
            </div>
          ) : (
            <div className={styles.list}>
              {sortedFishTypes.map((fishType) => (
                <article key={fishType.id} className={styles.listItem}>
                  <div className={styles.listItemHeader}>
                    <h3>{fishType.name}</h3>
                    <span className={styles.badge}>{fishType.careLevel}</span>
                  </div>
                  <dl className={styles.specs}>
                    <div>
                      <dt>pH</dt>
                      <dd>
                        {fishType.phMin} - {fishType.phMax}
                      </dd>
                    </div>
                    <div>
                      <dt>Temp</dt>
                      <dd>
                        {fishType.temperatureMin} - {fishType.temperatureMax} °C
                      </dd>
                    </div>
                    <div>
                      <dt>Tank size</dt>
                      <dd>{fishType.minTankSize} L</dd>
                    </div>
                  </dl>
                  {fishType.description && <p>{fishType.description}</p>}
                </article>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}