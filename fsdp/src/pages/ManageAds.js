import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useImage } from '../components/ImageContext';

const ManageAds = () => {
    const [ads, setAds] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [dropdownOpen, setDropdownOpen] = useState(null);
    const navigate = useNavigate();
    const { editedImage, setEditedImage } = useImage();

    useEffect(() => {
        if (editedImage) {
            setAds(prevAds => {
                if (prevAds.length === 0) {
                    return [{
                        id: 1,
                        name: 'Ad Placeholder 1',
                        image: editedImage
                    }];
                } else {
                    return prevAds.map(ad =>
                        ad.id === (dropdownOpen || 1)
                        ? { ...ad, image: editedImage }
                        : ad
                    );
                }
            });
            setEditedImage(null);
        }
    }, [editedImage, dropdownOpen, setEditedImage]);

    const deleteAd = (id) => {
        setAds(ads.filter(ad => ad.id !== id));
        setDropdownOpen(null);
    };

    const handleImageUpload = (id, event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setAds(ads.map(ad => 
                    ad.id === id ? { ...ad, image: reader.result } : ad
                ));
            };
            reader.readAsDataURL(file);
        }
    };

    const createAd = () => {
        const newAd = {
            id: ads.length + 1,
            name: `Ad Placeholder ${ads.length + 1}`,
            image: null,
        };
        setAds([...ads, newAd]);
    };

    const filteredAds = ads.filter(ad => ad.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="manageAds" style={{ padding: '10px', maxWidth: '400px', margin: '0 auto' }}>
            <h2 className="page-title" style={{ marginBottom: '15px', fontSize: '1.2rem' }}>Manage Ads</h2>

            <div style={{ display: 'flex', marginBottom: '15px' }}>
                <input
                    type="text"
                    placeholder="Search ads..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ padding: '8px', flex: 1, marginRight: '10px' }}
                />
                <button
                    style={{
                        padding: '8px 16px',
                        backgroundColor: '#6a4fe7',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer',
                    }}
                >
                    Search
                </button>
            </div>

            <div>
                {filteredAds.map((ad) => (
                    <div
                        key={ad.id}
                        className="ad-item"
                        style={{
                            border: '1px solid #ccc',
                            borderRadius: '5px',
                            marginBottom: '8px',
                            padding: '8px',
                            fontSize: '0.9rem',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                        }}
                    >
                        <span>{ad.name}</span>

                        <div style={{ position: 'relative' }}>
                            <button
                                onClick={() => setDropdownOpen(dropdownOpen === ad.id ? null : ad.id)}
                                style={{
                                    padding: '5px 10px',
                                    backgroundColor: '#ccc',
                                    border: 'none',
                                    borderRadius: '5px',
                                    cursor: 'pointer',
                                    marginLeft: '10px',
                                }}
                            >
                                ▼
                            </button>
                            {dropdownOpen === ad.id && (
                                <div
                                    style={{
                                        position: 'absolute',
                                        top: '30px',
                                        right: '0',
                                        backgroundColor: '#fff',
                                        border: '1px solid #ccc',
                                        borderRadius: '5px',
                                        boxShadow: '0 2px 5px rgba(0,0,0,0.15)',
                                        zIndex: 1,
                                        padding: '10px',
                                        minWidth: '150px',
                                    }}
                                >
                                    <div style={{ marginBottom: '10px', textAlign: 'center' }}>
                                        <div
                                            style={{
                                                width: '100%',
                                                height: '200px',
                                                backgroundColor: '#f0f0f0',
                                                border: '1px dashed #ccc',
                                                borderRadius: '5px',
                                                overflow: 'hidden',
                                                position: 'relative',
                                            }}
                                        >
                                            {ad.image ? (
                                                <img
                                                    src={ad.image}
                                                    alt="Ad"
                                                    style={{
                                                        width: '100%',
                                                        height: '100%',
                                                        objectFit: 'cover',
                                                    }}
                                                />
                                            ) : (
                                                <span style={{ lineHeight: '200px', color: '#999', fontSize: '1.2rem', fontWeight: 'bold' }}>
                                                    {ad.name} Template
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => document.getElementById(`file-input-${ad.id}`).click()}
                                        style={{
                                            padding: '5px 10px',
                                            backgroundColor: '#6a4fe7',
                                            color: '#fff',
                                            border: 'none',
                                            borderRadius: '5px',
                                            cursor: 'pointer',
                                            width: '100%',
                                            marginBottom: '10px',
                                        }}
                                    >
                                        Upload Image
                                    </button>

                                    <input
                                        id={`file-input-${ad.id}`}
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleImageUpload(ad.id, e)}
                                        style={{ display: 'none' }}
                                    />

                                    <button
                                        onClick={() => deleteAd(ad.id)}
                                        style={{
                                            padding: '10px',
                                            cursor: 'pointer',
                                            width: '100%',
                                            textAlign: 'left',
                                            background: 'none',
                                            border: 'none',
                                            color: 'red',
                                        }}
                                    >
                                        Delete
                                    </button>

                                    <button
                                        onClick={() => navigate('/adTemplate')}
                                        style={{
                                            padding: '10px',
                                            cursor: 'pointer',
                                            width: '100%',
                                            textAlign: 'left',
                                            background: 'none',
                                            border: 'none',
                                            color: '#6a4fe7',
                                            fontWeight: 'bold',
                                        }}
                                    >
                                        Choose Template
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <button
                onClick={createAd}
                style={{
                    padding: '8px 16px',
                    backgroundColor: '#6a4fe7',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    marginTop: '15px',
                    display: 'block',
                    marginLeft: 'auto',
                    marginRight: 'auto',
                    fontSize: '0.9rem',
                }}
            >
                + Create New Ad
            </button>
        </div>
    );
};

export default ManageAds;
