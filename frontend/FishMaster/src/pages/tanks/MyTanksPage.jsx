import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/common/button/button';
import api from '../../services/api';
import styles from './MyTanksPage.module.scss';
import Wave from 'react-wavify';

// High-quality aquarium images from Unsplash
const AQUARIUM_IMAGES = [
    'https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?q=80&w=800&auto=format&fit=crop', // Fish & coral
    'https://images.unsplash.com/photo-1524704654690-b56c05c78a00?q=80&w=800&auto=format&fit=crop', // Blue tank
    'https://images.unsplash.com/photo-1546026423-cc4642628d2b?q=80&w=800&auto=format&fit=crop', // Planted tank
    'https://images.unsplash.com/photo-1535591273668-578e31182c4f?q=80&w=800&auto=format&fit=crop', // Clownfish
    'https://images.unsplash.com/photo-1516934024742-b461fba47600?q=80&w=800&auto=format&fit=crop', // Goldfish
    'https://images.unsplash.com/photo-1621236162359-5b682b13735f?q=80&w=800&auto=format&fit=crop', // Aquascape
    'https://images.unsplash.com/photo-1520315342629-6ea920342047?q=80&w=800&auto=format&fit=crop', // Jellyfish
    'https://images.unsplash.com/photo-1571752726703-426e92546a67?q=80&w=800&auto=format&fit=crop', // Betta
];

const MyTanksPage = () => {
    const navigate = useNavigate();
    const [tanks, setTanks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newTank, setNewTank] = useState({ name: '', sizeLiters: '' });
    const [error, setError] = useState('');

    useEffect(() => {
        fetchTanks();
    }, []);

    const fetchTanks = async () => {
        try {
            setLoading(true);
            const data = await api.apiRequest('/tanks');
            setTanks(data || []);
        } catch (err) {
            console.error(err);
            setError('Failed to load tanks.');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTank = async (e) => {
        e.preventDefault();
        try {
            if (!newTank.name || !newTank.sizeLiters) return;
            await api.apiRequest('/tanks', {
                method: 'POST',
                body: JSON.stringify(newTank)
            });
            setNewTank({ name: '', sizeLiters: '' });
            setShowAddForm(false);
            fetchTanks();
        } catch (err) {
            setError(err.message || 'Failed to create tank');
        }
    };

    const handleDeleteTank = async (id, e) => {
        e.stopPropagation(); // prevent navigation
        if (!window.confirm('Are you sure you want to delete this tank?')) return;
        try {
            await api.apiRequest(`/tanks/${id}`, { method: 'DELETE' });
            fetchTanks();
        } catch (err) {
            alert('Failed to delete tank');
        }
    };

    // Helper to pick a deterministic image for a tank ID
    const getTankImage = (id) => {
        if (!id) return AQUARIUM_IMAGES[0];
        // Convert id to string and create hash
        const idString = String(id);
        let hash = 0;
        for (let i = 0; i < idString.length; i++) {
            hash = idString.charCodeAt(i) + ((hash << 5) - hash);
        }
        const index = Math.abs(hash) % AQUARIUM_IMAGES.length;
        return AQUARIUM_IMAGES[index];
    };

    if (loading) return (
        <div className={styles.loadingContainer}>
            <div className={styles.loader}>🐟</div>
            <p>Loading your underwater worlds...</p>
        </div>
    );

    return (
        <div className={styles.pageWrapper}>
            {/* Subtle header wave */}
            <div className={styles.headerWave}>
                <Wave fill="#eef7fb" paused={false} options={{ height: 20, amplitude: 20, speed: 0.15, points: 3 }} />
            </div>

            <div className={styles.pageContainer}>
                <div className={styles.header}>
                    <div className={styles.titleSection}>
                        <h1>My Aquariums</h1>
                        <p className={styles.subtitle}>Manage and monitor your aquatic ecosystems</p>
                    </div>
                    <Button className={styles.addBtn} onClick={() => setShowAddForm(!showAddForm)}>
                        {showAddForm ? 'Close' : '+ Add Aquarium'}
                    </Button>
                </div>

                {error && <div className={styles.error}>{error}</div>}

                {/* Add Form with Drawer-like animation (controlled by CSS) */}
                <div className={`${styles.addFormContainer} ${showAddForm ? styles.open : ''}`}>
                    <div className={styles.formContent}>
                        <h2>Create New Habitat</h2>
                        <form onSubmit={handleCreateTank}>
                            <div className={styles.formGroup}>
                                <label>Tank Name</label>
                                <input
                                    type="text"
                                    value={newTank.name}
                                    onChange={(e) => setNewTank({ ...newTank, name: e.target.value })}
                                    placeholder="e.g. Tropical Paradise"
                                    required
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Volume (Liters)</label>
                                <input
                                    type="number"
                                    value={newTank.sizeLiters}
                                    onChange={(e) => setNewTank({ ...newTank, sizeLiters: e.target.value })}
                                    placeholder="e.g. 60"
                                    required
                                />
                            </div>
                            <Button type="submit" className={styles.createBtn}>Create Tank</Button>
                        </form>
                    </div>
                </div>

                <div className={styles.tankGrid}>
                    {tanks.length === 0 && !showAddForm ? (
                        <div className={styles.emptyState}>
                            <div className={styles.emptyIcon}>🌊</div>
                            <h3>No Aquariums Yet</h3>
                            <p>Start your journey by adding your first tank.</p>
                            <Button className={styles.addBtn} onClick={() => setShowAddForm(true)}>Add Your First Tank</Button>
                        </div>
                    ) : (
                        tanks.map(tank => (
                            <div
                                key={tank.id}
                                className={styles.tankCard}
                                onClick={() => navigate(`/tanks/${tank.id}`)}
                            >
                                <div className={styles.cardImage} style={{ backgroundImage: `url(${getTankImage(tank.id)})` }}>
                                    <div className={styles.imageOverlay}>
                                        <span className={styles.viewLabel}>View Details</span>
                                    </div>
                                </div>
                                <div className={styles.cardContent}>
                                    <h3 className={styles.tankName}>{tank.name}</h3>
                                    <div className={styles.tankMeta}>
                                        <span>💧 {tank.sizeLiters}L</span>
                                        <span>🐟 {tank.fish ? tank.fish.length : 0} Fish</span>
                                    </div>
                                    <div className={styles.statusIndicator}>
                                        <span className={styles.statusDot}></span>
                                        Good Condition
                                    </div>
                                </div>
                                <button
                                    className={styles.deleteBtn}
                                    onClick={(e) => handleDeleteTank(tank.id, e)}
                                    title="Delete Tank"
                                >
                                    ×
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default MyTanksPage;