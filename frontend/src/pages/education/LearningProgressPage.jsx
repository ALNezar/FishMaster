import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getLearningProgress, getLearningPaths } from '../../api';
import { FaTrophy, FaFire, FaBook, FaArrowRight, FaCheckCircle, FaClock } from 'react-icons/fa';
import styles from './LearningProgressPage.module.scss';

function LearningProgressPage() {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(null);
  const [paths, setPaths] = useState([]);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      const [progressData, pathsData] = await Promise.all([getLearningProgress(), getLearningPaths()]);
      if (!mounted) return;
      setProgress(progressData);
      setPaths(pathsData);
    };

    load().catch((err) => console.error('Failed to load progress:', err));
    return () => {
      mounted = false;
    };
  }, []);

  if (!progress) {
    return <div className={styles.fallback}>Loading your progress...</div>;
  }

  const levelName = () => {
    const rate = progress.completionRate;
    if (rate >= 80) return 'Master';
    if (rate >= 60) return 'Pro';
    if (rate >= 40) return 'Intermediate';
    if (rate >= 20) return 'Beginner';
    return 'Novice';
  };

  return (
    <div className={styles.wrapper}>
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1>Your Learning Journey</h1>
          <p className={styles.subtitle}>Short lessons, clear visuals, and steady progress across every sensor topic.</p>
        </div>

        <div className={styles.statGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <FaTrophy />
            </div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>{levelName()}</div>
              <div className={styles.statLabel}>Level</div>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <FaBook />
            </div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>{progress.viewedCount}</div>
              <div className={styles.statLabel}>Sections Viewed</div>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <FaFire />
            </div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>{progress.streakDays}</div>
              <div className={styles.statLabel}>Day Streak</div>
            </div>
          </div>
        </div>

        <div className={styles.overallProgress}>
          <div className={styles.progressMeta}>
            <span>Overall Progress</span>
            <span className={styles.percent}>{progress.completionRate}%</span>
          </div>
          <div className={styles.progressBar}>
            <div 
              className={styles.progressFill} 
              style={{ width: `${progress.completionRate}%` }}
            />
          </div>
        </div>
      </section>

      <section className={styles.pathsSection}>
        <div className={styles.sectionHeader}>
          <h2>Learning Paths</h2>
          <p>Tap a path to continue where you left off.</p>
        </div>
        <div className={styles.pathsGrid}>
          {progress.pathProgress.map((item) => {
            const path = paths.find((entry) => entry.id === item.pathId);
            const isComplete = item.percent === 100;
            
            return (
              <button
                key={item.pathId}
                className={`${styles.pathCard} ${isComplete ? styles.pathComplete : ''}`}
                onClick={() => navigate(`/education/path/${item.pathId}`)}
              >
                  <div className={styles.pathHeader}>
                    <div>
                      <p className={styles.pathTopic}>{path?.level || 'Path'}</p>
                      <h3>{path?.title || item.title}</h3>
                    </div>
                    {isComplete && <div className={styles.completeBadge}><FaCheckCircle /> Complete</div>}
                  </div>

                  <p className={styles.pathProgress}>{item.completed} of {item.total} lessons</p>

                  <div className={styles.pathProgressBar}>
                    <div className={styles.pathProgressFill} style={{ width: `${item.percent}%` }} />
                  </div>

                  <div className={styles.pathFooter}>
                    <span className={styles.percent}><FaClock /> {item.percent}%</span>
                    <FaArrowRight className={styles.arrow} />
                </div>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}

export default LearningProgressPage;
