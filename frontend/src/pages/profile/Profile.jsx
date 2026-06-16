import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { getCurrentUser, updateProfile, deleteAccount, logout } from '../../api';
import styles from './Profile.module.scss';
import { FaUser, FaSave, FaTimes, FaTrash, FaChevronRight } from 'react-icons/fa';

export default function Profile() {
  const navigate = useNavigate();
  const context = useOutletContext();
  const initialUser = context?.user;

  const [user, setUser] = useState(initialUser);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(!initialUser);
  const [formData, setFormData] = useState({
    name: initialUser?.name || initialUser?.username || '',
    contactNumber: initialUser?.contactNumber || '',
    emailNotifications: initialUser?.emailNotifications ?? true,
    smsNotifications: initialUser?.smsNotifications ?? false
  });

  useEffect(() => {
    if (!initialUser) {
      loadUser();
    }
  }, [initialUser]);

  const loadUser = async () => {
    try {
      const userData = await getCurrentUser();
      setUser(userData);
      setFormData({
        name: userData.name || userData.username || '',
        contactNumber: userData.contactNumber || '',
        emailNotifications: typeof userData.emailNotifications === 'boolean' ? userData.emailNotifications : true,
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

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loader}></div>
      </div>
    );
  }

  const displayName = user?.name || user?.username || 'Fishkeeper';
  const displayEmail = user?.email || 'No email provided';

  if (isEditing) {
    return (
      <div className={styles.profileContainer}>
        <div className={styles.header}>
          <h2>Edit Profile</h2>
          <button className={styles.cancelBtn} onClick={() => setIsEditing(false)}>Cancel</button>
        </div>
        
        <form onSubmit={handleSubmit} className={styles.formContainer}>
          <div className={styles.formSection}>
            <div className={styles.inputGroup}>
              <label htmlFor="name">Name</label>
              <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="contactNumber">Contact Number</label>
              <input type="tel" id="contactNumber" name="contactNumber" value={formData.contactNumber} onChange={handleChange} placeholder="+1 234 567 8900" />
            </div>
          </div>

          <div className={styles.formSectionTitle}>Notifications</div>
          <div className={styles.formSection}>
            <div className={styles.toggleRow}>
              <label htmlFor="emailNotifications">Email Notifications</label>
              <div className={styles.toggleWrapper}>
                <input type="checkbox" id="emailNotifications" name="emailNotifications" checked={formData.emailNotifications} onChange={handleChange} />
                <div className={styles.toggleSwitch}></div>
              </div>
            </div>
            <div className={styles.toggleRow}>
              <label htmlFor="smsNotifications">SMS Notifications</label>
              <div className={styles.toggleWrapper}>
                <input type="checkbox" id="smsNotifications" name="smsNotifications" checked={formData.smsNotifications} onChange={handleChange} />
                <div className={styles.toggleSwitch}></div>
              </div>
            </div>
          </div>

          <button type="submit" className={styles.primaryBtn}>
            Save Changes
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className={styles.profileContainer}>
      <div className={styles.avatarSection}>
        <div className={styles.avatarCircle}>
          {displayName.charAt(0).toUpperCase()}
        </div>
        <h2 className={styles.userName}>{displayName}</h2>
        <p className={styles.userEmail}>{displayEmail}</p>
        <button className={styles.editPill} onClick={() => setIsEditing(true)}>
          Edit Profile
        </button>
      </div>

      <div className={styles.listSection}>
        <div className={styles.listItem}>
          <div className={styles.listLabel}>Contact Number</div>
          <div className={styles.listValue}>{user?.contactNumber || 'Not set'}</div>
        </div>
        <div className={styles.listItem}>
          <div className={styles.listLabel}>Email Notifications</div>
          <div className={styles.listValue}>{user?.emailNotifications ? 'On' : 'Off'}</div>
        </div>
        <div className={styles.listItem}>
          <div className={styles.listLabel}>SMS Notifications</div>
          <div className={styles.listValue}>{user?.smsNotifications ? 'On' : 'Off'}</div>
        </div>
      </div>

      <div className={styles.listSection}>
        <button className={styles.listItemAction} onClick={handleLogout}>
          <div className={styles.listLabelAction}>Log Out</div>
          <FaChevronRight className={styles.chevron} />
        </button>
      </div>

      <div className={styles.listSection}>
        <button className={styles.listItemActionDanger} onClick={handleDelete}>
          <div className={styles.listLabelDanger}>Delete Account</div>
        </button>
      </div>
    </div>
  );
}