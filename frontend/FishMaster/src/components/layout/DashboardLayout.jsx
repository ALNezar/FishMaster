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
                navigate('/login');
                return;
            }
            try {
                await getCurrentUser();
            } catch (err) {
                console.error('Auth check failed:', err);
                logout();
                navigate('/login');
            } finally {
                setLoading(false);
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
