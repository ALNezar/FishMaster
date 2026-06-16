import React, { useEffect, useMemo, useState } from 'react';
import { 
  FaCheckCircle, FaExclamationTriangle, FaFlask, FaPlus, 
  FaSyncAlt, FaSearch, FaTimes, FaShieldAlt, FaHeartbeat, FaInfoCircle
} from 'react-icons/fa';
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
  if (value === '' || value === null || value === undefined) return undefined;
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

  // UI State
  const [showAddForm, setShowAddForm] = useState(false);
  const [compatMode, setCompatMode] = useState(false);
  const [selectedFishIds, setSelectedFishIds] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [careFilter, setCareFilter] = useState('all'); // all, beginner, intermediate, advanced
  const [expandedCard, setExpandedCard] = useState(null);

  const fetchFishTypes = async ({ initial = false } = {}) => {
    if (initial) setLoading(true);
    else setRefreshing(true);
    setError('');

    try {
      const types = await listFishTypes();
      setFishTypes(Array.isArray(types) ? types : []);
    } catch (err) {
      console.error('Failed to load fish types:', err);
      setError(err?.message || 'Failed to load species catalog.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchFishTypes({ initial: true });
  }, []);

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
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
      setSuccess(`${payload.name} added to catalog.`);
      setShowAddForm(false);
    } catch (err) {
      setError(err?.message || 'Failed to create species.');
    } finally {
      setSaving(false);
    }
  };

  // Filter & Sort
  const filteredFish = useMemo(() => {
    return fishTypes
      .filter((fish) => {
        if (careFilter !== 'all' && fish.careLevel.toLowerCase() !== careFilter) return false;
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          return fish.name.toLowerCase().includes(q) || (fish.description || '').toLowerCase().includes(q);
        }
        return true;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [fishTypes, searchQuery, careFilter]);

  // Compatibility Logic
  const toggleCompatSelection = (id) => {
    const newSet = new Set(selectedFishIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedFishIds(newSet);
  };

  const compatAnalysis = useMemo(() => {
    if (selectedFishIds.size < 2) return null;
    const selected = fishTypes.filter(f => selectedFishIds.has(f.id));
    
    // Calculate overlaps
    const minPh = Math.max(...selected.map(f => f.phMin || 0));
    const maxPh = Math.min(...selected.map(f => f.phMax || 14));
    
    const minTemp = Math.max(...selected.map(f => f.temperatureMin || 0));
    const maxTemp = Math.min(...selected.map(f => f.temperatureMax || 100));

    const largestTankRequired = Math.max(...selected.map(f => f.minTankSize || 0));
    
    const isPhCompatible = minPh <= maxPh;
    const isTempCompatible = minTemp <= maxTemp;
    
    let status = 'success';
    let message = 'These species are compatible!';
    let detail = `They share a safe zone of pH ${minPh.toFixed(1)}-${maxPh.toFixed(1)} and ${minTemp.toFixed(1)}-${maxTemp.toFixed(1)}°C.`;

    if (!isPhCompatible && !isTempCompatible) {
      status = 'danger';
      message = 'Critical Incompatibility';
      detail = 'No overlapping safe ranges for pH or temperature.';
    } else if (!isPhCompatible) {
      status = 'danger';
      message = 'pH Conflict';
      detail = `pH ranges do not overlap. (Highest minimum is ${minPh}, lowest maximum is ${maxPh})`;
    } else if (!isTempCompatible) {
      status = 'danger';
      message = 'Temperature Conflict';
      detail = `Temperature ranges do not overlap. (Highest minimum is ${minTemp}°C, lowest maximum is ${maxTemp}°C)`;
    } else if (selected.some(f => f.careLevel.toLowerCase() === 'advanced')) {
      status = 'warning';
      message = 'Compatible, but requires advanced care';
      detail = `Water parameters overlap, but you have selected advanced species that require strict stability.`;
    }

    return { status, message, detail, minPh, maxPh, minTemp, maxTemp, largestTankRequired };
  }, [selectedFishIds, fishTypes]);

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <div className={styles.heroHeader}>
          <div className={styles.heroTitleGroup}>
            <FaFlask className={styles.titleIcon} />
            <h1>Species Lab</h1>
            <span className={styles.countBadge}>{fishTypes.length} Cataloged</span>
          </div>
        </div>
        <p className={styles.heroSubtitle}>
          Your custom species catalog is the intelligence engine of FishMaster. This data automatically powers tank compatibility checks, health scoring algorithms, and the Tank Advisor's setup guidance.
        </p>

        <div className={styles.valueCards}>
          <div className={styles.valueCard}>
            <FaShieldAlt className={styles.valueIcon} style={{color: 'var(--success)'}}/>
            <div>
              <h3>Compatibility Engine</h3>
              <p>Species parameters are cross-checked against tankmates to instantly flag conflicts.</p>
            </div>
          </div>
          <div className={styles.valueCard}>
            <FaHeartbeat className={styles.valueIcon} style={{color: 'var(--danger)'}}/>
            <div>
              <h3>Health Scoring</h3>
              <p>pH and temperature ranges set the baseline for your dynamic tank health index.</p>
            </div>
          </div>
          <div className={styles.valueCard}>
            <FaInfoCircle className={styles.valueIcon} style={{color: 'var(--primary)'}}/>
            <div>
              <h3>Setup Guidance</h3>
              <p>The Tank Advisor aggregates your species needs to recommend optimal water targets.</p>
            </div>
          </div>
        </div>
      </header>

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

      <div className={styles.toolbar}>
        <div className={styles.actionRow}>
          <button 
            className={`${styles.actionBtn} ${styles.primary}`}
            onClick={() => { setShowAddForm(!showAddForm); setCompatMode(false); }}
          >
            {showAddForm ? <FaTimes /> : <FaPlus />} 
            {showAddForm ? 'Close Form' : 'Add Species'}
          </button>
          
          <button 
            className={`${styles.actionBtn} ${styles.secondary} ${compatMode ? styles.active : ''}`}
            onClick={() => {
              setCompatMode(!compatMode);
              if (!compatMode) { setShowAddForm(false); setSelectedFishIds(new Set()); }
            }}
          >
            <FaFlask /> 
            {compatMode ? 'Exit Compatibility Mode' : 'Check Compatibility'}
          </button>

          <button className={`${styles.actionBtn} ${styles.secondary}`} onClick={() => fetchFishTypes()} disabled={refreshing || loading}>
            <FaSyncAlt className={refreshing ? styles.spinning : ''} />
            Refresh
          </button>
        </div>

        <div className={styles.actionRow}>
          <div className={styles.searchBar}>
            <FaSearch />
            <input 
              type="text" 
              placeholder="Search species by name or description..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className={styles.filterChips}>
            {['all', 'beginner', 'intermediate', 'advanced'].map(level => (
              <button 
                key={level}
                className={`${styles.chip} ${careFilter === level ? styles.active : ''}`}
                onClick={() => setCareFilter(level)}
              >
                {level.charAt(0).toUpperCase() + level.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {showAddForm && (
        <div className={styles.addFormWrapper}>
          <div className={styles.formHeader}>
            <h2>Add New Species to Catalog</h2>
            <button className={styles.closeBtn} onClick={() => setShowAddForm(false)}>
              <FaTimes />
            </button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className={styles.formRow}>
              <label className={styles.field}>
                <span>Species Name *</span>
                <input type="text" value={form.name} onChange={handleChange('name')} placeholder="e.g., Neon Tetra" maxLength={100} required />
              </label>
              <label className={styles.field}>
                <span>Care Level</span>
                <select value={form.careLevel} onChange={handleChange('careLevel')}>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </label>
            </div>

            <div className={styles.formRow}>
              <label className={styles.field}>
                <span>Minimum pH</span>
                <input type="number" step="0.1" min="0" max="14" value={form.minPh} onChange={handleChange('minPh')} placeholder="6.0" />
              </label>
              <label className={styles.field}>
                <span>Maximum pH</span>
                <input type="number" step="0.1" min="0" max="14" value={form.maxPh} onChange={handleChange('maxPh')} placeholder="7.5" />
              </label>
            </div>

            <div className={styles.formRow}>
              <label className={styles.field}>
                <span>Minimum Temp (°C)</span>
                <input type="number" step="0.1" value={form.minTemp} onChange={handleChange('minTemp')} placeholder="22.0" />
              </label>
              <label className={styles.field}>
                <span>Maximum Temp (°C)</span>
                <input type="number" step="0.1" value={form.maxTemp} onChange={handleChange('maxTemp')} placeholder="26.0" />
              </label>
            </div>

            <label className={styles.field}>
              <span>Description & Notes</span>
              <textarea value={form.description} onChange={handleChange('description')} placeholder="Schooling fish. Requires groups of 6+." />
            </label>

            <div className={styles.formActions}>
              <button type="button" className={`${styles.actionBtn} ${styles.secondary}`} onClick={() => setShowAddForm(false)}>Cancel</button>
              <button type="submit" className={`${styles.actionBtn} ${styles.primary}`} disabled={saving}>
                {saving ? 'Saving...' : 'Save to Catalog'}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className={styles.loadingState}>
          <FaSyncAlt className={styles.spinning} />
          <p>Loading species catalog...</p>
        </div>
      ) : filteredFish.length === 0 ? (
        <div className={styles.emptyState}>
          <FaFlask />
          <p>{searchQuery || careFilter !== 'all' ? 'No species match your filters.' : 'Your catalog is empty. Add a species to get started.'}</p>
        </div>
      ) : (
        <div className={styles.speciesGrid} style={{ paddingBottom: compatMode ? '220px' : '20px' }}>
          {filteredFish.map(fish => {
            const isSelected = selectedFishIds.has(fish.id);
            const isExpanded = expandedCard === fish.id;

            return (
              <article 
                key={fish.id} 
                className={`${styles.speciesCard} ${styles[`care${fish.careLevel.charAt(0).toUpperCase() + fish.careLevel.slice(1)}`]}`}
                onClick={() => compatMode && toggleCompatSelection(fish.id)}
                style={{ cursor: compatMode ? 'pointer' : 'default', borderColor: isSelected ? 'var(--primary)' : '' }}
              >
                {compatMode && (
                  <div className={styles.cardSelectOverlay}>
                    <div className={`${styles.checkbox} ${isSelected ? styles.checked : ''}`}>
                      {isSelected && <FaCheckCircle style={{fontSize: '14px'}} />}
                    </div>
                  </div>
                )}
                
                <div className={styles.cardHeader}>
                  <h3>{fish.name}</h3>
                  <span className={`${styles.careBadge} ${styles[fish.careLevel.toLowerCase()]}`}>{fish.careLevel}</span>
                </div>

                <div className={styles.metricsGrid}>
                  <div className={styles.rangeBarBlock}>
                    <div className={styles.rangeHeader}>
                      <span>pH Range</span>
                      <span className={styles.rangeVals}>{fish.phMin} - {fish.phMax}</span>
                    </div>
                    <div className={styles.barTrack}>
                      <div className={styles.barFill} style={{
                        left: `${(fish.phMin / 14) * 100}%`,
                        width: `${((fish.phMax - fish.phMin) / 14) * 100}%`
                      }}/>
                    </div>
                  </div>
                  
                  <div className={styles.rangeBarBlock}>
                    <div className={styles.rangeHeader}>
                      <span>Temperature</span>
                      <span className={styles.rangeVals}>{fish.temperatureMin} - {fish.temperatureMax}°C</span>
                    </div>
                    {/* Assuming max realistic aquarium temp is 40C for scale */}
                    <div className={styles.barTrack}>
                      <div className={styles.barFill} style={{
                        left: `${(Math.max(0, fish.temperatureMin) / 40) * 100}%`,
                        width: `${((fish.temperatureMax - fish.temperatureMin) / 40) * 100}%`,
                        background: 'var(--warning)'
                      }}/>
                    </div>
                  </div>
                </div>

                {fish.description && (
                  <>
                    {!isExpanded && (
                      <button className={styles.descriptionToggle} onClick={(e) => { e.stopPropagation(); setExpandedCard(fish.id); }}>
                        View Notes
                      </button>
                    )}
                    {isExpanded && (
                      <div className={styles.descriptionPanel}>
                        {fish.description}
                        <div style={{marginTop: '0.5rem'}}>
                          <button className={styles.descriptionToggle} onClick={(e) => { e.stopPropagation(); setExpandedCard(null); }}>
                            Hide Notes
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </article>
            );
          })}
        </div>
      )}

      {/* Compatibility Floating Panel */}
      <div className={`${styles.compatPanel} ${compatMode ? styles.visible : ''}`}>
        <div className={styles.compatContainer}>
          <div className={styles.compatHeader}>
            <h3><FaFlask /> Compatibility Analysis</h3>
            <button className={styles.closeBtn} onClick={() => setCompatMode(false)}><FaTimes /></button>
          </div>
          
          {selectedFishIds.size === 0 ? (
            <div className={`${styles.compatAlert} ${styles.info}`}>
              <FaInfoCircle />
              <div className={styles.alertBody}>
                <span className={styles.title}>Select species to check compatibility</span>
                <span className={styles.desc}>Tap on 2 or more species cards above to analyze their water parameter overlaps.</span>
              </div>
            </div>
          ) : selectedFishIds.size === 1 ? (
            <div className={`${styles.compatAlert} ${styles.info}`}>
              <FaInfoCircle />
              <div className={styles.alertBody}>
                <span className={styles.title}>Select one more species</span>
                <span className={styles.desc}>Tap another species card to compare.</span>
              </div>
            </div>
          ) : compatAnalysis && (
            <>
              <div className={`${styles.compatAlert} ${styles[compatAnalysis.status]}`}>
                {compatAnalysis.status === 'success' ? <FaCheckCircle /> : <FaExclamationTriangle />}
                <div className={styles.alertBody}>
                  <span className={styles.title}>{compatAnalysis.message}</span>
                  <span className={styles.desc}>{compatAnalysis.detail}</span>
                </div>
              </div>
              
              <div className={styles.compatStats}>
                <div className={`${styles.stat} ${compatAnalysis.minPh > compatAnalysis.maxPh ? styles.conflict : ''}`}>
                  <span>Target pH</span>
                  <strong>
                    {compatAnalysis.minPh > compatAnalysis.maxPh 
                      ? 'No Overlap' 
                      : `${compatAnalysis.minPh.toFixed(1)} - ${compatAnalysis.maxPh.toFixed(1)}`}
                  </strong>
                </div>
                <div className={`${styles.stat} ${compatAnalysis.minTemp > compatAnalysis.maxTemp ? styles.conflict : ''}`}>
                  <span>Target Temp</span>
                  <strong>
                    {compatAnalysis.minTemp > compatAnalysis.maxTemp 
                      ? 'No Overlap' 
                      : `${compatAnalysis.minTemp.toFixed(1)} - ${compatAnalysis.maxTemp.toFixed(1)}°C`}
                  </strong>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

    </div>
  );
}