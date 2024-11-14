import AWS from '../aws-config';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/ManageAds.css';

const s3 = new AWS.S3();
const dynamoDb = new AWS.DynamoDB.DocumentClient();

const ManageAds = () => {
    const [ads, setAds] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showCreateOptions, setShowCreateOptions] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [fileName, setFileName] = useState('');
    const [previewUrl, setPreviewUrl] = useState(null);
    const [previewType, setPreviewType] = useState(''); // Track type of preview
    const navigate = useNavigate();

    useEffect(() => {
        const fetchAdsFromDynamoDB = async () => {
            const params = { TableName: 'Ads' };
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

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        setSelectedFile(file);
        setFileName(file.name);
        setPreviewUrl(URL.createObjectURL(file));
        setPreviewType(file.type.split('/')[0]); // Set the preview type based on file type
    };

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
            setAds([...ads, newAd]);
            alert('Ad uploaded successfully!');
            setSelectedFile(null);
            setFileName('');
            setPreviewUrl(null);
            setPreviewType(''); // Clear the preview type
            setShowCreateOptions(false);
        } catch (error) {
            console.error("Error uploading ad:", error);
            alert("Failed to upload ad.");
        }
    };

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

    const handleEditAd = (ad) => {
        navigate('/edit-template', { state: { ad } });
    };

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
        <div className="manage-ads">
            <h2 className="page-title">Manage Ads</h2>

            <div className="search-container">
                <input
                    type="text"
                    placeholder="Search ads..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                />
                <button className="search-button">Search</button>
            </div>

            <button
                onClick={() => setShowCreateOptions(!showCreateOptions)}
                className="create-ad-button"
            >
                Create New Ad
            </button>

            {showCreateOptions && (
                <div className="create-options">
                    <button
                        onClick={() => navigate('/adTemplate')}
                        className="template-button"
                    >
                        Choose Template
                    </button>

                    <div>
                        <h4>Or, Upload Media</h4>
                        {previewUrl && (
                            <div style={{ marginBottom: '10px', textAlign: 'center' }}>
                                {previewType === 'image' && (
                                    <img
                                        src={previewUrl}
                                        alt="Preview"
                                        className="preview-image"
                                        style={{
                                            width: '100%',
                                            maxHeight: '200px',
                                            objectFit: 'cover',
                                            borderRadius: '5px',
                                            marginBottom: '5px',
                                            cursor: 'pointer',
                                        }}
                                    />
                                )}
                                {previewType === 'video' && (
                                    <video
                                        src={previewUrl}
                                        controls
                                        className="preview-video"
                                        style={{
                                            width: '100%',
                                            maxHeight: '200px',
                                            objectFit: 'cover',
                                            borderRadius: '5px',
                                            marginBottom: '5px',
                                            cursor: 'pointer',
                                        }}
                                    />
                                )}
                            </div>
                        )}
                        <input
                            type="text"
                            placeholder="Ad name"
                            value={fileName}
                            onChange={(e) => setFileName(e.target.value)}
                            className="file-name-input"
                        />
                        <input type="file" accept="image/*,video/*,audio/*" onChange={handleFileChange} />
                        <button onClick={uploadAdToS3} className="upload-button">
                            Upload Ad
                        </button>
                    </div>
                </div>
            )}

            <div className="ad-gallery">
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
                        {ad.type === 'image' && (
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
                        )}
                        {ad.type === 'video' && (
                            <video
                                src={ad.url}
                                controls
                                style={{
                                    width: '100%',
                                    height: '100px',
                                    objectFit: 'cover',
                                    borderRadius: '5px',
                                    marginBottom: '5px'
                                }}
                            />
                        )}
                        {ad.type === 'audio' && (
                            <audio
                                src={ad.url}
                                controls
                                style={{
                                    width: '100%',
                                    marginBottom: '5px'
                                }}
                            />
                        )}
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
                                cursor: 'pointer',
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
