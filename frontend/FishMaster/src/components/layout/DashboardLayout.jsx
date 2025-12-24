import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import NavBar from '../common/nav/NavBar';
import { isAuthenticated, getCurrentUser, logout } from '../../services/api';
import styles from './DashboardLayout.module.scss';
import Wave from 'react-wavify';

export default function DashboardLayout() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            if (!isAuthenticated()) {
                navigate('/login', { replace: true });
                return;
            }
            try {
                await getCurrentUser();
                setLoading(false);
            } catch (err) {
                console.error('Auth check failed:', err);
                // Only logout if it's a 401/403 auth error, not network errors
                if (err.message?.includes('401') || err.message?.includes('403') || err.message?.includes('Unauthorized')) {
                    logout();
                    navigate('/login', { replace: true });
                } else {
                    // For other errors (network, etc.), still show dashboard
                    setLoading(false);
                }
            }
        };
        checkAuth();
    }, [navigate]);

    if (loading) {
        return <div className={styles.loading}>Loading...</div>;
    }

    return (
        <div className={styles.layout}>
            <NavBar />

            {/* Shared Background Wave for all dashboard pages */}
            <div className={styles.waveBackground}>
                <Wave
                    fill="#1277b0"
                    paused={false}
                    options={{
                        height: '100%',
                        width: '100%',
                        height: -10,
                        amplitude: 25,
                        speed: 0.15,
                        points: 4
                    }}
                />
                <Wave
                    fill="#043158ff"
                    paused={false}
                    options={{
                        height: 10,
                        amplitude: 25,
                        speed: 0.15,
                        points: 4
                    }}
                />
            </div>

            <main className={styles.content}>
                <Outlet />
            </main>
        </div>
    );
}
