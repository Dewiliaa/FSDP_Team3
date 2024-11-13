import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useImage } from '../components/ImageContext';

const ManageAds = () => {
    const [ads, setAds] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [dropdownOpen, setDropdownOpen] = useState(null);
    const [galleryImages, setGalleryImages] = useState([]); // State to store gallery images
    const navigate = useNavigate();
    const { editedImage, setEditedImage } = useImage();

    // Load the edited images from localStorage when component mounts
    useEffect(() => {
        const allEditedImages = [];
        // Loop through localStorage and find all keys that start with "edited"
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('edited')) {
                allEditedImages.push(localStorage.getItem(key));
            }
        }
        setGalleryImages(allEditedImages); // Set the gallery images in state

        // Map over the ads to assign images from localStorage if available
        setAds(prevAds => {
            return prevAds.map((ad, index) => ({
                ...ad,
                image: allEditedImages[index] || ad.image
            }));
        });
    }, []); // Empty dependency array ensures this effect runs only once

    // Function to delete an ad
    const deleteAd = (id) => {
        setAds(ads.filter(ad => ad.id !== id));
        setDropdownOpen(null);
    };

    // Function to delete an image from the gallery and localStorage
    const deleteImageFromGallery = (imageUrl) => {
        // Remove the image from the galleryImages array
        setGalleryImages(galleryImages.filter(img => img !== imageUrl));

        // Find the index of the image in localStorage and remove it
        let i = 1;
        while (localStorage.getItem(`edited${i}`)) {
            if (localStorage.getItem(`edited${i}`) === imageUrl) {
                localStorage.removeItem(`edited${i}`);
                break;
            }
            i++;
        }
    };

    // Handle image upload for an ad
    const handleImageUpload = (id, event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setAds(ads.map(ad =>
                    ad.id === id ? { ...ad, image: reader.result } : ad
                ));

                // Store the uploaded image in localStorage
                const uploadedImageCount = localStorage.length + 1;
                localStorage.setItem(`edited${uploadedImageCount}`, reader.result);
                setGalleryImages([...galleryImages, reader.result]); // Update the gallery state
            };
            reader.readAsDataURL(file);
        }
    };

    // Function to create a new ad
    const createAd = () => {
        const newAd = {
            id: ads.length + 1,
            name: `Ad Placeholder ${ads.length + 1}`,
            image: null,
        };
        setAds([...ads, newAd]);
    };

    // Filter ads based on search term
    const filteredAds = ads.filter(ad => ad.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="manageAds" style={{ padding: '10px', maxWidth: '400px', margin: '0 auto' }}>
            <h2 className="page-title" style={{ marginBottom: '15px', fontSize: '1.2rem' }}>Manage Ads</h2>

            {/* Search bar */}
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

            {/* List of ads */}
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
                                    {/* Ad Image Display */}
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

                                    {/* Image Upload */}
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

                                    {/* Delete and Choose Template buttons */}
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

            {/* Gallery Section */}
            <div style={{ marginTop: '20px' }}>
                <h3>Recently Edited Images</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                    {galleryImages.map((imageUrl, index) => (
                        <div
                            key={index}
                            style={{
                                position: 'relative',
                                margin: '10px',
                                width: '100px',
                                height: '100px',
                                overflow: 'hidden',
                                borderRadius: '5px',
                            }}
                        >
                            <img
                                src={imageUrl}
                                alt="Edited"
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    borderRadius: '5px',
                                }}
                            />
                            <button
                                onClick={() => deleteImageFromGallery(imageUrl)}
                                style={{
                                    position: 'absolute',
                                    top: '5px',
                                    right: '5px',
                                    padding: '5px',
                                    backgroundColor: '#ff5f5f',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '50%',
                                    cursor: 'pointer',
                                }}
                            >
                                ×
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            <button
                onClick={createAd}
                style={{
                    marginTop: '20px',
                    padding: '8px 16px',
                    backgroundColor: '#6a4fe7',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                }}
            >
                Create New Ad
            </button>
        </div>
    );
};

export default ManageAds;
