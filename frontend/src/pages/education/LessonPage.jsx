import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { completeLesson, getLearningProgress, getLesson } from '../../api';
import { FaLightbulb, FaClipboardList, FaPaw, FaCheckCircle, FaArrowRight, FaClock, FaShieldAlt } from 'react-icons/fa';
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
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.badge}>{lesson.difficulty}</div>
          <h1>{lesson.title}</h1>
          <p className={styles.heroSummary}>{lesson.summary}</p>
          <div className={styles.meta}>
            <span><FaClock /> {lesson.durationMin} min</span>
            <span><FaShieldAlt /> Practical guide</span>
          </div>
        </div>
        <div className={styles.heroMedia}>
          {lesson.images?.[0] && <img src={lesson.images[0].src} alt={lesson.images[0].caption} />}
        </div>
      </section>

      <section className={styles.summaryGrid}>
        <article className={styles.summaryCard}>
          <div className={styles.cardHeader}>
            <FaLightbulb className={styles.cardIcon} />
            <h2>Why It Matters</h2>
          </div>
          <p className={styles.cardContent}>{lesson.why}</p>
        </article>

        <article className={styles.summaryCard}>
          <div className={styles.cardHeader}>
            <FaClipboardList className={styles.cardIcon} />
            <h2>At a Glance</h2>
          </div>
          <ul className={styles.bulletList}>
            {lesson.checks.slice(0, 3).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
      </section>

      <section className={styles.cardSection}>
        <div className={styles.sectionTitle}>
          <FaClipboardList />
          <h2>What to Check</h2>
        </div>
        <div className={styles.compactCards}>
          {lesson.checks.map((check, index) => (
            <article key={check} className={styles.compactCard}>
              <div className={styles.cardNumber}>{index + 1}</div>
              <p>{check}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.cardSection}>
        <div className={styles.sectionTitle}>
          <FaPaw />
          <h2>Action Steps</h2>
        </div>
        <div className={styles.actionCards}>
          {lesson.actions.map((action, index) => (
            <article key={action} className={styles.actionCard}>
              <div className={styles.actionNumber}>{index + 1}</div>
              <div className={styles.actionContent}>
                <p className={styles.actionText}>{action}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {lesson.images?.length > 1 && (
        <section className={styles.gallerySection}>
          <div className={styles.sectionTitle}>
            <FaLightbulb />
            <h2>Simple Infographics</h2>
          </div>
          <div className={styles.galleryGrid}>
            {lesson.images.map((image) => (
              <figure key={image.src} className={styles.galleryCard}>
                <img src={image.src} alt={image.caption} loading="lazy" />
                <figcaption>{image.caption}</figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      <section className={styles.ctaSection}>
        <button
          className={styles.ctaButton}
          onClick={() => navigate(lesson.cta?.route || '/dashboard')}
        >
          <span>{lesson.cta?.label || 'Try It Now'}</span>
          <FaArrowRight />
        </button>
      </section>

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
