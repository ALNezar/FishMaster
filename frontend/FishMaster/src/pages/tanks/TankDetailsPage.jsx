import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Card from '../../components/common/card/card';
import Button from '../../components/common/button/button';
import api from '../../services/api';
import styles from './TankDetailsPage.module.scss';

const TankDetailsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [tank, setTank] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({ name: '', sizeLiters: '' });
    const [error, setError] = useState('');

    useEffect(() => {
        fetchTankDetails();
    }, [id]);

    const fetchTankDetails = async () => {
        try {
            setLoading(true);
            const data = await api.apiRequest(`/tanks/${id}`);
            setTank(data);
            setEditForm({ name: data.name, sizeLiters: data.sizeLiters });
        } catch (err) {
            console.error(err);
            setError('Failed to load tank details.');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            const updated = await api.apiRequest(`/tanks/${id}`, {
                method: 'PUT',
                body: JSON.stringify(editForm)
            });
            setTank(updated);
            setIsEditing(false);
        } catch (err) {
            setError('Failed to update tank.');
        }
    };

    if (loading) return <div className={styles.loading}>Loading tank...</div>;
    if (!tank) return <div className={styles.error}>Tank not found.</div>;

    return (
        <div className={styles.pageContainer}>
            <button className={styles.backBtn} onClick={() => navigate('/tanks')}>
                ← Back to Tanks
            </button>

            <div className={styles.header}>
                <h1 className={isEditing ? styles.hidden : ''}>{tank.name}</h1>
                <div className={styles.actions}>
                    {isEditing ? (
                        <Button onClick={() => setIsEditing(false)}>Cancel</Button>
                    ) : (
                        <Button onClick={() => setIsEditing(true)}>Edit Details</Button>
                    )}
                </div>
            </div>

            {error && <div className={styles.error}>{error}</div>}

            {isEditing && (
                <Card className={styles.editCard}>
                    <form onSubmit={handleUpdate}>
                        <div className={styles.formGroup}>
                            <label>Tank Name</label>
                            <input
                                type="text"
                                value={editForm.name}
                                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                required
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Size (Liters)</label>
                            <input
                                type="number"
                                value={editForm.sizeLiters}
                                onChange={(e) => setEditForm({ ...editForm, sizeLiters: e.target.value })}
                                required
                            />
                        </div>
                        <Button type="submit">Save Changes</Button>
                    </form>
                </Card>
            )}

            <div className={styles.grid}>
                {/* STATUS CARD */}
                <Card className={styles.statusCard}>
                    <h2>Current Status</h2>
                    <div className={styles.statusItems}>
                        <div className={styles.statusItem}>
                            <span>pH</span>
                            <strong>
                                {tank.waterParameters ? tank.waterParameters.ph : 'N/A'}
                            </strong>
                        </div>
                        <div className={styles.statusItem}>
                            <span>Temp</span>
                            <strong>
                                {tank.waterParameters ? `${tank.waterParameters.temperature}°C` : 'N/A'}
                            </strong>
                        </div>
                    </div>
                </Card>

                {/* FISH LIST */}
                <Card className={styles.fishCard}>
                    <h2>Inhabitants</h2>
                    {tank.fish && tank.fish.length > 0 ? (
                        <ul className={styles.fishList}>
                            {tank.fish.map(fish => (
                                <li key={fish.id} className={styles.fishItem}>
                                    <span className={styles.fishIcon}>🐟</span>
                                    <div className={styles.fishDetails}>
                                        <strong>{fish.name}</strong>
                                        <small>{fish.fishType ? fish.fishType.name : 'Unknown Species'}</small>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className={styles.emptyText}>No fish in this tank yet.</p>
                    )}
                </Card>
            </div>
        </div>
    );
};

export default TankDetailsPage;
