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

  if (loading) return <div aria-live="polite">Loading...</div>;

  return (
    <div className={styles.profileContainer}>
      <header className={styles.header}>
        <h2><FaUser aria-hidden="true" /> My Profile</h2>
      </header>
      <section className={styles.profileCard} aria-labelledby="profile-heading">
        {!isEditing ? (
          <>
            <div className={styles.section}>
              <div className={styles.actions}>
                <button
                  className={`${styles.btn} ${styles.primary}`}
                  onClick={() => setIsEditing(true)}
                  aria-label="Edit Profile"
                >
                  Edit Profile
                </button>
              </div>
              <dl className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <dt>Name</dt>
                  <dd>{user?.name || user?.username}</dd>
                </div>
                <div className={styles.infoItem}>
                  <dt>Email</dt>
                  <dd>{user?.email}</dd>
                </div>
                <div className={styles.infoItem}>
                  <dt>Contact Number</dt>
                  <dd>{user?.contactNumber || 'Not set'}</dd>
                </div>
              </dl>
            </div>
            <div className={styles.section}>
              <h3 id="notifications-heading"><FaBell aria-hidden="true" /> Notification Preferences</h3>
              <dl className={styles.infoGrid} aria-labelledby="notifications-heading">
                <div className={styles.infoItem}>
                  <dt>Email Notifications</dt>
                  <dd>{user?.emailNotifications ? 'Enabled' : 'Disabled'}</dd>
                </div>
                <div className={styles.infoItem}>
                  <dt>SMS Notifications</dt>
                  <dd>{user?.smsNotifications ? 'Enabled' : 'Disabled'}</dd>
                </div>
              </dl>
            </div>
            <div className={styles.deleteZone}>
              <h3>Danger Zone</h3>
              <p>Once you delete your account, there is no going back. Please be certain.</p>
              <div className={styles.actions}>
                <button
                  className={`${styles.btn} ${styles.danger}`}
                  onClick={handleDelete}
                  aria-label="Delete Account"
                >
                  <FaTrash aria-hidden="true" /> Delete Account
                </button>
              </div>
            </div>
          </>
        ) : (
          <form onSubmit={handleSubmit} aria-labelledby="edit-profile-heading">
            <div className={styles.section}>
              <h3 id="edit-profile-heading">Edit Profile</h3>
              <div className={styles.formGroup}>
                <label htmlFor="name">Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  aria-required="true"
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="contactNumber">Contact Number</label>
                <input
                  type="tel"
                  id="contactNumber"
                  name="contactNumber"
                  value={formData.contactNumber}
                  onChange={handleChange}
                  placeholder="+1 234 567 8900"
                  pattern="^\+?[1-9]\d{1,14}$"
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
                <button
                  type="button"
                  className={`${styles.btn} ${styles.secondary}`}
                  onClick={() => setIsEditing(false)}
                  aria-label="Cancel Edit"
                >
                  <FaTimes aria-hidden="true" /> Cancel
                </button>
                <button type="submit" className={`${styles.btn} ${styles.primary}`}>
                  <FaSave aria-hidden="true" /> Save Changes
                </button>
              </div>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}