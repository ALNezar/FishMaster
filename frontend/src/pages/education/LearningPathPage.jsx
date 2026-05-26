import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getLearningPaths, getLessons, getLearningProgress } from '../../api';
import { FaArrowRight, FaCheckCircle, FaClock, FaLayerGroup } from 'react-icons/fa';
import styles from './LearningPathPage.module.scss';
import placeholderImage from '../../assets/images/learning/placeholder.svg';

function LearningPathPage() {
  const navigate = useNavigate();
  const { pathId } = useParams();

  const [path, setPath] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [completedIds, setCompletedIds] = useState([]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const [pathsData, lessonsData, progressData] = await Promise.all([
        getLearningPaths(),
        getLessons(pathId),
        getLearningProgress(),
      ]);

      if (!mounted) return;
      setPath(pathsData.find((item) => item.id === pathId) || null);
      setLessons(lessonsData || []);
      setCompletedIds(progressData?.completedLessonIds || []);
    };

    load().catch((err) => console.error('Failed to load learning path:', err));
    return () => {
      mounted = false;
    };
  }, [pathId]);

  const progressPercent = useMemo(() => {
    if (lessons.length === 0) return 0;
    const done = lessons.filter((lesson) => completedIds.includes(lesson.id)).length;
    return Math.round((done / lessons.length) * 100);
  }, [lessons, completedIds]);

  if (!path) {
    return <div className={styles.fallback}>Learning path not found.</div>;
  }

  return (
    <div className={styles.wrapper}>
      <header className={styles.hero}>
        <div className={styles.heroCopy}>
          <div className={styles.badge}>{path.level}</div>
          <h1>{path.title}</h1>
          <p className={styles.heroDesc}>{path.description}</p>
          <div className={styles.heroStats}>
            <span><FaLayerGroup /> {path.lessonsCount} lessons</span>
            <span><FaClock /> {path.durationMin} min</span>
            <span>{progressPercent}% complete</span>
          </div>
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: `${progressPercent}%` }} />
          </div>
        </div>
        <img
          className={styles.heroImage}
          src={path.sensorImage}
          alt={`${path.title} visual`}
          onError={(e) => {
            // fallback to local placeholder if the image fails to load
            // eslint-disable-next-line no-param-reassign
            e.currentTarget.onerror = null;
            e.currentTarget.src = placeholderImage;
          }}
        />
      </header>

      <section className={styles.sectionIntro}>
        <h2>Lessons in this path</h2>
        <p>Short sections, clear visuals, and one action at a time.</p>
      </section>

      <div className={styles.lessonGrid}>
        {lessons.map((lesson, index) => {
          const completed = completedIds.includes(lesson.id);
          return (
            <button
              key={lesson.id}
              className={`${styles.lessonCard} ${completed ? styles.completed : ''}`}
              onClick={() => navigate(`/education/lesson/${lesson.id}`)}
            >
              <div className={styles.lessonMedia}>
                <img
                  src={lesson.image}
                  alt={`${lesson.title} visual`}
                  loading="lazy"
                  onError={(e) => {
                    // fallback to local placeholder
                    // eslint-disable-next-line no-param-reassign
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = placeholderImage;
                  }}
                />
                <span className={styles.lessonNumber}>{index + 1}</span>
              </div>
              <div className={styles.lessonContent}>
                <div className={styles.lessonMetaRow}>
                  <p className={styles.lessonTopic}>{lesson.topic}</p>
                  <span className={styles.lessonTag}>{lesson.difficulty}</span>
                </div>
                <h3>{lesson.title}</h3>
                <p className={styles.lessonSummary}>{lesson.summary}</p>
                <div className={styles.lessonFooter}>
                  <span className={styles.duration}>⏱️ {lesson.durationMin} min</span>
                  {completed && (
                    <div className={styles.completedBadge}>
                      <FaCheckCircle /> Completed
                    </div>
                  )}
                </div>
              </div>
              <div className={styles.lessonAction}><FaArrowRight /></div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default LearningPathPage;
