import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api';
import styles from './LearningPage.module.scss';
import temperatureProbeIcon from '../../assets/images/learning/temperature-probe.svg';
import phSensorIcon from '../../assets/images/learning/ph-sensor.svg';
import turbiditySensorIcon from '../../assets/images/learning/turbidity-sensor.svg';
import ammoniaInfoIcon from '../../assets/images/learning/multimeter.svg';

const sectionVisuals = {
  temperature: { icon: temperatureProbeIcon },
  ph: { icon: phSensorIcon },
  turbidity: { icon: turbiditySensorIcon },
  ammonia: { icon: ammoniaInfoIcon },
};

const getSectionIcon = (sectionId) => {
  return sectionVisuals[sectionId]?.icon || '/Fishtyi.png';
};

export default function LearningPage() {
  const navigate = useNavigate();
  const { sectionId } = useParams();
  const [sections, setSections] = useState([]);
  const [detailedSection, setDetailedSection] = useState(null);
  const [selectedSubsection, setSelectedSubsection] = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadContent();
  }, []);

  useEffect(() => {
    if (sectionId && sections.length > 0) {
      handleViewSection(sectionId);
    }
  }, [sectionId, sections]);

  const loadContent = async () => {
    try {
      setLoading(true);
      setError(null);
      const sectionsData = await api.getLearningSections();
      const progressData = await api.getLearningProgress();
      setSections(sectionsData || []);
      setProgress(progressData || {});
    } catch (error) {
      console.error('Error loading learning content:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleViewSection = async (id) => {
    try {
      const fullSection = await api.getLearningSection(id);
      setDetailedSection(fullSection);
      setSelectedSubsection(fullSection?.subsections?.[0] || null);
      // Reload progress to update viewed status
      const updatedProgress = await api.getLearningProgress();
      setProgress(updatedProgress);
    } catch (error) {
      console.error('Error loading section:', error);
    }
  };

  const handleClose = () => {
    setDetailedSection(null);
    setSelectedSubsection(null);
    navigate('/learning');
  };

  const isViewed = (id) => progress?.viewedSectionIds?.includes(id) || false;

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading sensor guides...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.loading} style={{ color: '#d32f2f' }}>
          Error: {error}
        </div>
      </div>
    );
  }

  if (!sections || sections.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>No sensor guides available</div>
      </div>
    );
  }

  // Detailed view
  if (detailedSection) {
    return (
      <div className={styles.container}>
        <div className={styles.detailLayout}>
          {/* Sidebar */}
          <div className={styles.sidebar}>
            <button className={styles.backBtn} onClick={handleClose}>
              ← Back
            </button>
            <div className={styles.sectionHeader}>
              <div className={styles.icon}>
                <img
                  src={getSectionIcon(detailedSection.id)}
                  alt={`${detailedSection.title} icon`}
                  className={styles.sectionIconImage}
                />
              </div>
              <h2>{detailedSection.title}</h2>
            </div>
            <NavigationMenu
              subsections={detailedSection.subsections}
              selectedId={selectedSubsection?.id}
              onSelect={(sub) => setSelectedSubsection(sub)}
            />
          </div>

          {/* Main content */}
          <div className={styles.mainContent}>
            {selectedSubsection && (
              <SubsectionView
                subsection={selectedSubsection}
                sectionId={detailedSection.id}
              />
            )}
          </div>
        </div>
      </div>
    );
  }

  // Grid view
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Sensor Learning Hub</h1>
        <p>Master each sensor and learn how to keep your tank stable</p>
        {progress && (
          <ProgressBar progress={progress} />
        )}
      </div>

      {sections && sections.length > 0 ? (
        <div className={styles.sectionGrid}>
          {sections.map((section) => (
            <SectionCard
              key={section.id}
              section={section}
              isViewed={isViewed(section.id)}
              onClick={() => handleViewSection(section.id)}
            />
          ))}
        </div>
      ) : (
        <div style={{ padding: '2rem', textAlign: 'center', fontSize: '16px', color: '#999' }}>
          No sections to display
        </div>
      )}
    </div>
  );
}

function SectionCard({ section, isViewed, onClick }) {
  return (
    <button className={styles.sectionCard} onClick={onClick}>
      <div className={styles.cardIcon}>
        <img
          src={getSectionIcon(section.id)}
          alt={`${section.title} icon`}
          className={styles.cardIconImage}
        />
      </div>
      <h3>{section.title}</h3>
      <p>{section.summary}</p>
      <div className={styles.cardFooter}>
        <span className={styles.subsectionCount}>
          {section.subsectionCount} parts
        </span>
        {isViewed && <span className={styles.viewedBadge}>✓ Viewed</span>}
      </div>
    </button>
  );
}

function NavigationMenu({ subsections, selectedId, onSelect }) {
  return (
    <div className={styles.navMenu}>
      {subsections.map((sub) => (
        <button
          key={sub.id}
          className={`${styles.navItem} ${selectedId === sub.id ? styles.active : ''}`}
          onClick={() => onSelect(sub)}
        >
          {sub.title}
        </button>
      ))}
    </div>
  );
}

function SubsectionView({ subsection, sectionId }) {
  const fallbackImage = getSectionIcon(sectionId);

  return (
    <div className={styles.subsectionContent}>
      <div className={styles.subsectionHeader}>
        <img
          src={fallbackImage}
          alt="Section icon"
          className={styles.headerIconImage}
        />
        <h2>{subsection.title}</h2>
      </div>

      <div className={styles.description}>
        <p>{subsection.description}</p>
      </div>

      {subsection.images && subsection.images.length > 0 && (
        <div className={styles.imagesGrid}>
          {subsection.images.map((img, idx) => (
            <div key={idx} className={styles.imageCard}>
              <img
                src={img.src}
                alt={img.caption}
                className={styles.subsectionImage}
                loading="lazy"
                onError={(event) => {
                  event.currentTarget.onerror = null;
                  event.currentTarget.src = fallbackImage;
                }}
              />
              <p className={styles.caption}>{img.caption}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ProgressBar({ progress }) {
  const percentage = progress.completionRate || 0;
  return (
    <div className={styles.progressBar}>
      <div className={styles.progressText}>
        Progress: {progress.viewedCount} of {progress.totalSections} sections viewed
      </div>
      <div className={styles.progressTrack}>
        <div
          className={styles.progressFill}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className={styles.progressPercent}>{percentage}%</div>
    </div>
  );
}
