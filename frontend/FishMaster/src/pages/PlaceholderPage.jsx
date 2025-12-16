import React from 'react';
import Card from '../components/common/card/card.jsx';
import { useNavigate } from 'react-router-dom';
import { FaTools } from 'react-icons/fa';

const PlaceholderPage = ({ title }) => {
    const navigate = useNavigate();

    return (
        <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
            <Card>
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                    <FaTools size={48} color="#1277b0" style={{ marginBottom: '1rem' }} />
                    <h1 style={{ color: '#3d3021', marginBottom: '1rem' }}>{title}</h1>
                    <p style={{ fontSize: '1.2rem', color: '#666', marginBottom: '2rem' }}>
                        This feature is coming soon! We're working hard to simulate the best fishkeeping experience for you.
                    </p>
                    <button
                        onClick={() => navigate('/dashboard')}
                        style={{
                            padding: '10px 20px',
                            background: '#1277b0',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '1rem'
                        }}
                    >
                        Back to Dashboard
                    </button>
                </div>
            </Card>
        </div>
    );
};

export default PlaceholderPage;
