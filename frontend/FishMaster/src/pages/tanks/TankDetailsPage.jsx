import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Card from '../../components/common/card/card';
import Button from '../../components/common/button/button';
import api, { getFishTypes, addFishToTank, removeFishFromTank } from '../../services/api';
import styles from './TankDetailsPage.module.scss';
import { FaFish, FaPlus, FaTrash, FaEdit, FaTimes, FaThermometerHalf, FaTint, FaExclamationTriangle } from 'react-icons/fa';

const TankDetailsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [tank, setTank] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({ name: '', sizeLiters: '' });
    const [error, setError] = useState('');
    
    // Fish management state
    const [showAddFish, setShowAddFish] = useState(false);
    const [fishTypes, setFishTypes] = useState([]);
    const [newFish, setNewFish] = useState({ name: '', fishTypeId: '' });
    const [addingFish, setAddingFish] = useState(false);

    useEffect(() => {
        fetchTankDetails();
        loadFishTypes();
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

    const loadFishTypes = async () => {
        try {
            const types = await getFishTypes();
            setFishTypes(types || []);
        } catch (err) {
            console.error('Failed to load fish types:', err);
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

    const handleAddFish = async (e) => {
        e.preventDefault();
        if (!newFish.name.trim() || !newFish.fishTypeId) {
            setError('Please enter a name and select a species.');
            return;
        }

        setAddingFish(true);
        setError('');

        try {
            await addFishToTank(id, {
                name: newFish.name,
                fishTypeId: parseInt(newFish.fishTypeId)
            });
            
            // Refresh tank data to get updated fish list
            await fetchTankDetails();
            
            // Reset form
            setNewFish({ name: '', fishTypeId: '' });
            setShowAddFish(false);
        } catch (err) {
            setError(err.message || 'Failed to add fish.');
        } finally {
            setAddingFish(false);
        }
    };

    const handleRemoveFish = async (fishId) => {
        if (!window.confirm('Are you sure you want to remove this fish?')) return;

        try {
            await removeFishFromTank(id, fishId);
            await fetchTankDetails();
        } catch (err) {
            setError('Failed to remove fish.');
        }
    };

    const getSelectedFishType = () => {
        if (!newFish.fishTypeId) return null;
        return fishTypes.find(ft => ft.id === parseInt(newFish.fishTypeId));
    };

    // Calculate tank stocking status based on fish requirements
    const stockingStatus = useMemo(() => {
        if (!tank || !tank.fish || tank.fish.length === 0) {
            return { status: 'empty', percentage: 0, warnings: [], totalRequired: 0 };
        }

        // Group fish by species and calculate requirements
        const fishBySpecies = {};
        tank.fish.forEach(fish => {
            const speciesName = fish.fishType?.name || 'Unknown';
            if (!fishBySpecies[speciesName]) {
                fishBySpecies[speciesName] = {
                    count: 0,
                    minTankSize: fish.fishType?.minTankSize || 10,
                    name: speciesName
                };
            }
            fishBySpecies[speciesName].count++;
        });

        // Calculate total required space (rough estimate: minTankSize for first fish, +50% for each additional)
        let totalRequired = 0;
        const warnings = [];

        Object.values(fishBySpecies).forEach(species => {
            const baseSize = species.minTankSize;
            const additionalFish = Math.max(0, species.count - 1);
            const speciesRequirement = baseSize + (additionalFish * baseSize * 0.5);
            totalRequired += speciesRequirement;

            if (speciesRequirement > tank.sizeLiters) {
                warnings.push({
                    species: species.name,
                    count: species.count,
                    required: Math.ceil(speciesRequirement),
                    minPerFish: species.minTankSize
                });
            }
        });

        const percentage = Math.round((totalRequired / tank.sizeLiters) * 100);
        let status = 'good';
        if (percentage > 100) status = 'overstocked';
        else if (percentage > 80) status = 'warning';

        return { status, percentage, warnings, totalRequired: Math.ceil(totalRequired) };
    }, [tank]);

    // Check if adding a new fish would cause overstocking
    const getAddFishWarning = () => {
        const selectedType = getSelectedFishType();
        if (!selectedType || !tank) return null;

        const currentRequired = stockingStatus.totalRequired;
        const additionalRequired = selectedType.minTankSize * 0.5; // Additional fish needs ~50% of base
        const newTotal = currentRequired + (stockingStatus.percentage === 0 ? selectedType.minTankSize : additionalRequired);
        
        if (newTotal > tank.sizeLiters) {
            return {
                message: `Adding this ${selectedType.name} may overstock your tank!`,
                required: Math.ceil(newTotal),
                available: tank.sizeLiters,
                deficit: Math.ceil(newTotal - tank.sizeLiters)
            };
        }
        return null;
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
                        <Button onClick={() => setIsEditing(true)}><FaEdit /> Edit Details</Button>
                    )}
                </div>
            </div>

            {error && <div className={styles.error}>{error}</div>}

            {/* Tank Capacity Warning Banner */}
            {stockingStatus.status !== 'empty' && stockingStatus.status !== 'good' && (
                <div className={`${styles.stockingWarning} ${styles[stockingStatus.status]}`}>
                    <FaExclamationTriangle />
                    <div className={styles.warningContent}>
                        <strong>
                            {stockingStatus.status === 'overstocked' 
                                ? '⚠️ Tank Overstocked!' 
                                : '⚡ Tank Nearly Full'}
                        </strong>
                        <p>
                            Your fish need approximately <strong>{stockingStatus.totalRequired}L</strong> but your tank is only <strong>{tank.sizeLiters}L</strong>.
                            {stockingStatus.status === 'overstocked' && ' Consider upgrading to a larger tank or rehoming some fish.'}
                        </p>
                        {stockingStatus.warnings.length > 0 && (
                            <ul className={styles.warningList}>
                                {stockingStatus.warnings.map((w, i) => (
                                    <li key={i}>
                                        {w.count}x {w.species} need ~{w.required}L (min {w.minPerFish}L per fish)
                                    </li>
                                ))}
                            </ul>
                        )}
                        <div className={styles.capacityBar}>
                            <div 
                                className={styles.capacityFill} 
                                style={{ width: `${Math.min(stockingStatus.percentage, 100)}%` }}
                            />
                            <span>{stockingStatus.percentage}% capacity</span>
                        </div>
                    </div>
                </div>
            )}

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
                    <h2><FaThermometerHalf /> Current Status</h2>
                    <div className={styles.statusItems}>
                        <div className={styles.statusItem}>
                            <span className={styles.statusIcon}><FaTint /></span>
                            <div className={styles.statusInfo}>
                                <span className={styles.statusLabel}>pH Level</span>
                                <strong className={styles.statusValue}>
                                    {tank.waterParameters?.ph || tank.waterParameters?.targetPh || 'N/A'}
                                </strong>
                            </div>
                        </div>
                        <div className={styles.statusItem}>
                            <span className={styles.statusIcon}><FaThermometerHalf /></span>
                            <div className={styles.statusInfo}>
                                <span className={styles.statusLabel}>Temperature</span>
                                <strong className={styles.statusValue}>
                                    {tank.waterParameters?.temperature || tank.waterParameters?.targetTemperature 
                                        ? `${tank.waterParameters?.temperature || tank.waterParameters?.targetTemperature}°C` 
                                        : 'N/A'}
                                </strong>
                            </div>
                        </div>
                        <div className={styles.statusItem}>
                            <span className={styles.statusIcon}>💧</span>
                            <div className={styles.statusInfo}>
                                <span className={styles.statusLabel}>Volume</span>
                                <strong className={styles.statusValue}>{tank.sizeLiters}L</strong>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* FISH LIST */}
                <Card className={styles.fishCard}>
                    <div className={styles.fishHeader}>
                        <h2><FaFish /> Inhabitants ({tank.fish?.length || 0})</h2>
                        <Button 
                            className={styles.addFishBtn}
                            onClick={() => setShowAddFish(!showAddFish)}
                        >
                            {showAddFish ? <><FaTimes /> Cancel</> : <><FaPlus /> Add Fish</>}
                        </Button>
                    </div>

                    {/* Add Fish Form */}
                    {showAddFish && (
                        <div className={styles.addFishForm}>
                            <form onSubmit={handleAddFish}>
                                <div className={styles.formRow}>
                                    <div className={styles.formGroup}>
                                        <label>Fish Name</label>
                                        <input
                                            type="text"
                                            value={newFish.name}
                                            onChange={(e) => setNewFish({ ...newFish, name: e.target.value })}
                                            placeholder="e.g., Nemo"
                                            required
                                        />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>Species</label>
                                        <select
                                            value={newFish.fishTypeId}
                                            onChange={(e) => setNewFish({ ...newFish, fishTypeId: e.target.value })}
                                            required
                                        >
                                            <option value="">Select species...</option>
                                            {fishTypes.map(type => (
                                                <option key={type.id} value={type.id}>
                                                    {type.name} ({type.careLevel})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                
                                {/* Species Info Preview */}
                                {getSelectedFishType() && (
                                    <div className={styles.speciesInfo}>
                                        <h4>🐟 {getSelectedFishType().name}</h4>
                                        <div className={styles.speciesDetails}>
                                            <span>Care: <strong>{getSelectedFishType().careLevel}</strong></span>
                                            <span>Min Tank: <strong>{getSelectedFishType().minTankSize}L</strong></span>
                                            <span>Temp: <strong>{getSelectedFishType().temperatureMin}-{getSelectedFishType().temperatureMax}°C</strong></span>
                                            <span>pH: <strong>{getSelectedFishType().phMin}-{getSelectedFishType().phMax}</strong></span>
                                        </div>
                                        
                                        {/* Add Fish Warning */}
                                        {getAddFishWarning() && (
                                            <div className={styles.addFishWarning}>
                                                <FaExclamationTriangle />
                                                <div>
                                                    <strong>{getAddFishWarning().message}</strong>
                                                    <small>
                                                        Estimated need: {getAddFishWarning().required}L | 
                                                        Tank size: {getAddFishWarning().available}L | 
                                                        Shortage: {getAddFishWarning().deficit}L
                                                    </small>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                                
                                <Button type="submit" disabled={addingFish}>
                                    {addingFish ? 'Adding...' : 'Add Fish to Tank'}
                                </Button>
                            </form>
                        </div>
                    )}

                    {tank.fish && tank.fish.length > 0 ? (
                        <ul className={styles.fishList}>
                            {tank.fish.map(fish => (
                                <li key={fish.id} className={styles.fishItem}>
                                    <span className={styles.fishIcon}>🐟</span>
                                    <div className={styles.fishDetails}>
                                        <strong>{fish.name}</strong>
                                        <small>{fish.fishType?.name || 'Unknown Species'}</small>
                                        {fish.fishType?.careLevel && (
                                            <span className={`${styles.careBadge} ${styles[fish.fishType.careLevel.toLowerCase()]}`}>
                                                {fish.fishType.careLevel}
                                            </span>
                                        )}
                                    </div>
                                    <button 
                                        className={styles.removeFishBtn}
                                        onClick={() => handleRemoveFish(fish.id)}
                                        title="Remove fish"
                                    >
                                        <FaTrash />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className={styles.emptyFish}>
                            <span className={styles.emptyIcon}>🐠</span>
                            <p>No fish in this tank yet.</p>
                            <small>Click "Add Fish" to add your first inhabitant!</small>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
};

export default TankDetailsPage;
