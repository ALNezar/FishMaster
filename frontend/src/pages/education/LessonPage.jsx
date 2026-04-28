import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { completeLesson, getLearningProgress, getLesson } from '../../api';
import { FaLightbulb, FaClipboardList, FaPaw, FaCheckCircle, FaArrowRight } from 'react-icons/fa';
import styles from './LessonPage.module.scss';

function LessonPage() {
  const navigate = useNavigate();
  const { lessonId } = useParams();

  const [lesson, setLesson] = useState(null);
  const [completed, setCompleted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expandedCheck, setExpandedCheck] = useState(null);
  const [expandedAction, setExpandedAction] = useState(null);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      const [lessonData, progressData] = await Promise.all([getLesson(lessonId), getLearningProgress()]);
      if (!mounted) return;
      setLesson(lessonData);
      setCompleted(progressData.completedLessonIds.includes(lessonId));
    };

    load().catch((err) => console.error('Failed to load lesson:', err));
    return () => {
      mounted = false;
    };
  }, [lessonId]);

  const handleComplete = async () => {
    setSaving(true);
    try {
      await completeLesson(lessonId);
      setCompleted(true);
    } catch (err) {
      console.error('Failed to complete lesson:', err);
    } finally {
      setSaving(false);
    }
  };

  if (!lesson) {
    return <div className={styles.fallback}>Loading lesson...</div>;
  }

  return (
    <div className={styles.wrapper}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.badge}>{lesson.difficulty}</div>
          <h1>{lesson.title}</h1>
          <p className={styles.heroSummary}>{lesson.summary}</p>
          <div className={styles.meta}>
            <span>⏱️ {lesson.durationMin} min</span>
          </div>
        </div>
      </section>

      {/* Why It Matters Card */}
      <section className={styles.cardSection}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <FaLightbulb className={styles.cardIcon} />
            <h2>Why It Matters</h2>
          </div>
          <p className={styles.cardContent}>{lesson.why}</p>
        </div>
      </section>

      {/* What to Check - Interactive Cards */}
      <section className={styles.cardSection}>
        <div className={styles.sectionTitle}>
          <FaClipboardList />
          <h2>What to Check</h2>
        </div>
        <p className={styles.sectionHint}>Tap each item to expand</p>
        <div className={styles.expandableCards}>
          {lesson.checks.map((check, index) => (
            <button
              key={check}
              className={`${styles.expandableCard} ${expandedCheck === index ? styles.expanded : ''}`}
              onClick={() => setExpandedCheck(expandedCheck === index ? null : index)}
            >
              <div className={styles.cardNumber}>{index + 1}</div>
              <div className={styles.cardText}>{check}</div>
              <div className={styles.expandIcon}>{expandedCheck === index ? '−' : '+'}</div>
            </button>
          ))}
        </div>
      </section>

      {/* Action Steps - Interactive Cards */}
      <section className={styles.cardSection}>
        <div className={styles.sectionTitle}>
          <FaPaw />
          <h2>Action Steps</h2>
        </div>
        <p className={styles.sectionHint}>Tap to see details</p>
        <div className={styles.actionCards}>
          {lesson.actions.map((action, index) => (
            <button
              key={action}
              className={`${styles.actionCard} ${expandedAction === index ? styles.expanded : ''}`}
              onClick={() => setExpandedAction(expandedAction === index ? null : index)}
            >
              <div className={styles.actionNumber}>{index + 1}</div>
              <div className={styles.actionContent}>
                <p className={styles.actionText}>{action}</p>
              </div>
              <div className={styles.actionArrow}>{expandedAction === index ? '▼' : '▶'}</div>
            </button>
          ))}
        </div>
      </section>

      {/* Call to Action */}
      <section className={styles.ctaSection}>
        <button
          className={styles.ctaButton}
          onClick={() => navigate(lesson.cta?.route || '/dashboard')}
        >
          <span>{lesson.cta?.label || 'Try It Now'}</span>
          <FaArrowRight />
        </button>
      </section>

      {/* Complete Lesson Button */}
      <footer className={styles.footer}>
        {completed ? (
          <div className={styles.completedMessage}>
            <FaCheckCircle /> Lesson Completed!
          </div>
        ) : (
          <button
            className={styles.completeButton}
            disabled={saving}
            onClick={handleComplete}
          >
            {saving ? 'Saving...' : '✨ Mark as Completed'}
          </button>
        )}
      </footer>
    </div>
  );
}

export default LessonPage;
