//ManageAds.js
import AWS from '../aws-config';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Initialize S3 and DynamoDB Document Client
const s3 = new AWS.S3();
const dynamoDb = new AWS.DynamoDB.DocumentClient();

const ManageAds = () => {
    const [ads, setAds] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showCreateOptions, setShowCreateOptions] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [fileName, setFileName] = useState('');
    const [previewUrl, setPreviewUrl] = useState(null);
    const navigate = useNavigate();

    // Fetch ads from DynamoDB
    useEffect(() => {
        const fetchAdsFromDynamoDB = async () => {
            const params = {
                TableName: 'Ads',
            };

            try {
                const data = await dynamoDb.scan(params).promise();
                const retrievedAds = data.Items.map(ad => ({
                    id: ad.ad_id,
                    name: ad.name,
                    type: ad.type,
                    url: ad.url,
                }));
                setAds(retrievedAds);
            } catch (error) {
                console.error("Error fetching ads from DynamoDB:", error);
            }
        };

        fetchAdsFromDynamoDB();
    }, []);

    // Handle file selection for preview
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        setSelectedFile(file);
        setPreviewUrl(URL.createObjectURL(file));
    };

    // Upload image to S3 and save metadata to DynamoDB
    const uploadAdToS3 = async () => {
        if (!selectedFile || !fileName) {
            alert("Please select a file and enter a name.");
            return;
        }

        const s3Params = {
            Bucket: process.env.REACT_APP_S3_BUCKET_NAME,
            Key: `media/${Date.now()}_${selectedFile.name}`,
            Body: selectedFile,
            ACL: 'public-read',
            ContentType: selectedFile.type,
        };

        try {
            const data = await s3.upload(s3Params).promise();
            const s3Url = data.Location;

            const newAd = {
                id: data.Key,
                name: fileName,
                type: selectedFile.type.split('/')[0],
                url: s3Url,
            };

            // Save to DynamoDB
            const dynamoParams = {
                TableName: 'Ads',
                Item: {
                    ad_id: newAd.id,
                    name: newAd.name,
                    type: newAd.type,
                    url: newAd.url,
                    uploadDate: new Date().toISOString(),
                },
            };
            await dynamoDb.put(dynamoParams).promise();

            // Update state with the new ad
            setAds([...ads, newAd]);
            alert('Ad uploaded successfully!');
            setSelectedFile(null);
            setFileName('');
            setPreviewUrl(null);
            setShowCreateOptions(false);
        } catch (error) {
            console.error("Error uploading ad:", error);
            alert("Failed to upload ad.");
        }
    };

    // Delete ad from S3 and DynamoDB
    const deleteAd = async (adId) => {
        const s3Params = {
            Bucket: process.env.REACT_APP_S3_BUCKET_NAME,
            Key: adId,
        };

        const dynamoParams = {
            TableName: 'Ads',
            Key: { ad_id: adId },
        };

        try {
            await s3.deleteObject(s3Params).promise();
            await dynamoDb.delete(dynamoParams).promise();

            setAds(ads.filter(ad => ad.id !== adId));
            alert('Ad deleted successfully!');
        } catch (error) {
            console.error('Error deleting ad:', error);
            alert("Failed to delete ad.");
        }
    };

    // Filter ads based on search term
    const filteredAds = ads.filter(ad =>
        ad.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleEdit = (ad) => {
        navigate('/edit-Template', {
            state: {
                imageUrl: ad.url,
                imageName: ad.name,
                imageId: ad.id
            }
        });
    };

    return (
        <div className="manageAds" style={{ padding: '10px', maxWidth: '600px', margin: '0 auto' }}>
            <h2 className="page-title" style={{ marginBottom: '15px', fontSize: '1.5rem' }}>Manage Ads</h2>

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

            {/* Create New Ad Button */}
            <button
                onClick={() => setShowCreateOptions(!showCreateOptions)}
                style={{
                    marginBottom: '20px',
                    padding: '8px 16px',
                    backgroundColor: '#6a4fe7',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    width: '100%',
                }}
            >
                Create New Ad
            </button>

            {/* Create Ad Options */}
            {showCreateOptions && (
                <div style={{ marginBottom: '20px' }}>
                    <button
                        onClick={() => navigate('/adTemplate')}
                        style={{
                            padding: '10px',
                            marginBottom: '10px',
                            backgroundColor: '#6a4fe7',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            width: '100%',
                        }}
                    >
                        Choose Template
                    </button>

                    <div>
                        <h4>Or, Upload an Image</h4>
                        {previewUrl && (
                            <div style={{ marginBottom: '10px', textAlign: 'center' }}>
                                <img src={previewUrl} 
                                alt="Preview"
                                style={{ 
                                    width: '100%',
                                    maxHeight: '200px',
                                    objectFit: 'cover',
                                    borderRadius: '5px',
                                    marginBottom: '5px',
                                    cursor: 'pointer',
                                    }} />
                            </div>
                        )}
                        <input
                            type="text"
                            placeholder="Ad name"
                            value={fileName}
                            onChange={(e) => setFileName(e.target.value)}
                            style={{ padding: '8px', width: '100%', marginBottom: '10px' }}
                        />
                        <input type="file" accept="image/*" onChange={handleFileChange} />
                        <button
                            onClick={uploadAdToS3}
                            style={{
                                marginTop: '10px',
                                padding: '8px 16px',
                                backgroundColor: '#6a4fe7',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '5px',
                                cursor: 'pointer',
                                width: '100%',
                            }}
                        >
                            Upload Ad
                        </button>
                    </div>
                </div>
            )}

            {/* Gallery of Ads */}
            <div className="ad-gallery" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '10px' }}>
                {filteredAds.map((ad) => (
                    <div
                        key={ad.id}
                        className="ad-item"
                        style={{
                            border: '1px solid #ccc',
                            borderRadius: '5px',
                            padding: '8px',
                            fontSize: '0.9rem',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                        }}
                    >
                        <img
                            src={ad.url}
                            alt={ad.name}
                            style={{
                                width: '100%',
                                height: '100px',
                                objectFit: 'cover',
                                borderRadius: '5px',
                                marginBottom: '5px'
                            }}
                        />
                        <p style={{ fontWeight: 'bold', marginBottom: '5px' }}>{ad.name}</p>
                        <button
                            onClick={() => deleteAd(ad.id)}
                            style={{
                                padding: '5px 10px',
                                backgroundColor: '#ff5f5f',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '5px',
                                cursor: 'pointer',
                            }}
                        >
                            Delete
                        </button>
                        <button
                            onClick={() => handleEdit(ad)}
                            style={{
                                padding: '5px 10px',
                                backgroundColor: '#4CAF50',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '5px',
                                cursoer: 'pointer',
                            }}
                        >
                            Edit
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ManageAds;
