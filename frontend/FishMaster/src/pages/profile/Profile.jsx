import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, updateProfile, deleteAccount, logout } from '../../services/api';
import styles from './Profile.module.scss';
import { FaUser, FaSave, FaTimes, FaTrash, FaPhone, FaEnvelope, FaBell } from 'react-icons/fa';

export default function Profile() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        name: '',
        contactNumber: '',
        emailNotifications: true,
        smsNotifications: false
    });

    useEffect(() => {
        loadUser();
    }, []);

    const loadUser = async () => {
        try {
            const userData = await getCurrentUser();
            setUser(userData);
            setFormData({
                name: userData.name || userData.username || '',
                contactNumber: userData.contactNumber || '',
                emailNotifications: typeof userData.emailNotifications === 'boolean' ? userData.emailNotifications : false,
                smsNotifications: typeof userData.smsNotifications === 'boolean' ? userData.smsNotifications : false
            });
        } catch (err) {
            console.error('Failed to load profile:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const updatedUser = await updateProfile(formData);
            setUser(updatedUser);
            setIsEditing(false);
        } catch (err) {
            console.error('Failed to update profile:', err);
            alert('Failed to update profile');
        }
    };

    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
            try {
                await deleteAccount();
                logout();
                navigate('/login');
            } catch (err) {
                console.error('Failed to delete account:', err);
                alert('Failed to delete account');
            }
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className={styles.profileContainer}>
            <div className={styles.header}>
                <h2><FaUser /> My Profile</h2>
            </div>

            <div className={styles.profileCard}>
                {!isEditing ? (
                    <>
                        <div className={styles.section}>
                            <div className={styles.actions}>
                                <button className={`${styles.btn} ${styles.primary}`} onClick={() => setIsEditing(true)}>
                                    Edit Profile
                                </button>
                            </div>

                            <div className={styles.infoGrid}>
                                <div className={styles.infoItem}>
                                    <label>Name</label>
                                    <p>{user?.name || user?.username}</p>
                                </div>
                                <div className={styles.infoItem}>
                                    <label>Email</label>
                                    <p>{user?.email}</p>
                                </div>
                                <div className={styles.infoItem}>
                                    <label>Contact Number</label>
                                    <p>{user?.contactNumber || 'Not set'}</p>
                                </div>
                            </div>
                        </div>

                        <div className={styles.section}>
                            <h3><FaBell /> Notification Preferences</h3>
                            <div className={styles.infoGrid}>
                                <div className={styles.infoItem}>
                                    <label>Email Notifications</label>
                                    <p>{user?.emailNotifications ? 'Enabled' : 'Disabled'}</p>
                                </div>
                                <div className={styles.infoItem}>
                                    <label>SMS Notifications</label>
                                    <p>{user?.smsNotifications ? 'Enabled' : 'Disabled'}</p>
                                </div>
                            </div>
                        </div>

                        <div className={styles.deleteZone}>
                            <h3>Danger Zone</h3>
                            <p>Once you delete your account, there is no going back. Please be certain.</p>
                            <div className={styles.actions}>
                                <button className={`${styles.btn} ${styles.danger}`} onClick={handleDelete}>
                                    <FaTrash /> Delete Account
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <div className={styles.section}>
                            <h3>Edit Profile</h3>

                            <div className={styles.formGroup}>
                                <label>Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label>Contact Number</label>
                                <input
                                    type="text"
                                    name="contactNumber"
                                    value={formData.contactNumber}
                                    onChange={handleChange}
                                    placeholder="+1 234 567 8900"
                                />
                            </div>

                            <div className={styles.section}>
                                <h3>Notifications</h3>
                                <div className={styles.checkboxGroup}>
                                    <input
                                        type="checkbox"
                                        id="emailNotifications"
                                        name="emailNotifications"
                                        checked={formData.emailNotifications}
                                        onChange={handleChange}
                                    />
                                    <label htmlFor="emailNotifications">Email Notifications</label>
                                </div>

                                <div className={styles.checkboxGroup}>
                                    <input
                                        type="checkbox"
                                        id="smsNotifications"
                                        name="smsNotifications"
                                        checked={formData.smsNotifications}
                                        onChange={handleChange}
                                    />
                                    <label htmlFor="smsNotifications">SMS Notifications</label>
                                </div>
                            </div>

                            <div className={styles.actions}>
                                <button type="button" className={`${styles.btn} ${styles.secondary}`} onClick={() => setIsEditing(false)}>
                                    <FaTimes /> Cancel
                                </button>
                                <button type="submit" className={`${styles.btn} ${styles.primary}`}>
                                    <FaSave /> Save Changes
                                </button>
                            </div>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
