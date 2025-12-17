import fishLogo from "../../assets/images/blackandredfish.svg";
import { useEffect, useState } from 'react';
import SplitText from "../../components/common/Effect/SplitText.jsx";
import styles from './Header.module.scss';
import StickerPeel from "../../components/common/Effect/StickerPeel.jsx";

export default function Header({ user }) {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const interval = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(interval);
    }, []);

    const formattedTime = time.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });

    return (

        <header className={styles.header}>
            <div className={styles.logoWrapper}>
                <StickerPeel
                    imageSrc={fishLogo}
                    rotate={0}
                    peelBackHoverPct={22}
                    peelBackActivePct={226}
                    width={200}
                    shadowIntensity={0.6}
                    lightingIntensity={0.1}
                    initialPosition={{ x: 0, y: 0 }}
                    peelDirection={4}
                    className={styles.logo}
                />
            </div>
            <section className={styles.section}>

                <div className={styles.welcomeText}>
                    <h1>
                        <SplitText
                            text={`Hello, ${user?.name || 'Fishkeeper'}`}
                            delay={100}
                            duration={0.6}
                            ease="power3.out"
                            splitType="chars"
                            from={{ opacity: 0, y: 40 }}
                            to={{ opacity: 1, y: 0 }}
                            threshold={0.1}
                            rootMargin="-100px"
                        />
                    </h1>
                    <p>
                        Here's what's happening in your aquariums today
                        <span className={styles.shyFace}>
                        </span>.
                    </p>
                </div>
            </section>
            <div className={styles.clock}>{formattedTime}</div>
        </header>

    );
}