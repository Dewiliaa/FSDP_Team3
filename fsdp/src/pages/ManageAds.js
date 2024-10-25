import React, { useState } from 'react';

const ManageAds = () => {
    const [ads, setAds] = useState([]); // Initialize with an empty array
    const [searchTerm, setSearchTerm] = useState('');
    const [dropdownOpen, setDropdownOpen] = useState(null); // Track which dropdown is open

    // Function to delete an ad
    const deleteAd = (id) => {
        setAds(ads.filter(ad => ad.id !== id));
        setDropdownOpen(null); // Close the dropdown after deletion
    };

    // Function to handle image upload
    const handleImageUpload = (id, event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setAds(ads.map(ad => 
                    ad.id === id ? { ...ad, image: reader.result } : ad
                ));
            };
            reader.readAsDataURL(file); // Convert the file to a base64 URL
        }
    };

    // Function to create a new ad placeholder
    const createAd = () => {
        const newAd = {
            id: ads.length + 1, // Unique ID
            name: `Ad Placeholder ${ads.length + 1}`,
            image: null, // New ad starts with no image
        };
        setAds([...ads, newAd]);
    };

    // Filter ads based on the search term
    const filteredAds = ads.filter(ad => ad.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="manageAds" style={{ padding: '10px', maxWidth: '400px', margin: '0 auto' }}>
            <h2 className="page-title" style={{ marginBottom: '15px', fontSize: '1.2rem' }}>Manage Ads</h2>

            {/* Search Bar */}
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

            {/* List of Ads */}
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

                        {/* Dropdown Button */}
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
                                    {/* Placeholder for Image */}
                                    <div style={{ marginBottom: '10px', textAlign: 'center' }}>
                                        <div
                                            style={{
                                                width: '100%',
                                                height: '200px', // Increased height for the image placeholder
                                                backgroundColor: '#f0f0f0', // Placeholder background color
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
                                                        objectFit: 'cover', // Cover the area
                                                    }}
                                                />
                                            ) : (
                                                // Ad Template Inside Placeholder
                                                <span style={{ lineHeight: '200px', color: '#999', fontSize: '1.2rem', fontWeight: 'bold' }}>
                                                    {ad.name} Template
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Upload Image Button */}
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

                                    {/* File Input for Image Upload */}
                                    <input
                                        id={`file-input-${ad.id}`} // Unique ID for file input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleImageUpload(ad.id, e)} // Handle image upload
                                        style={{ display: 'none' }} // Hide the input
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
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Create New Ad Button */}
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
