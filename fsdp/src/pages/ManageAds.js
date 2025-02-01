import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AWS from '../aws-config';
import { Plus, Upload, Pencil, Trash2, X } from 'lucide-react';
import '../styles/ManageAds.css';

const s3 = new AWS.S3();
const dynamoDb = new AWS.DynamoDB.DocumentClient();

const ManageAds = ({ isNavExpanded }) => {
    const [ads, setAds] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showCreateOptions, setShowCreateOptions] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [fileName, setFileName] = useState('');
    const [previewUrl, setPreviewUrl] = useState(null);
    const [previewType, setPreviewType] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchAdsFromDynamoDB = async () => {
            const params = { TableName: 'Ads' };
            try {
                const data = await dynamoDb.scan(params).promise();
                console.log("ManageAds - Raw DynamoDB Items:", data.Items);
                const retrievedAds = data.Items.map(ad => {
                    console.log("ManageAds - Processing URL:", ad.url);
                    console.log("ManageAds - Processing Type:", ad.type);
                    return {
                        id: ad.ad_id,
                        name: ad.name,
                        type: ad.type.split('/')[0], // Make sure type is being processed correctly
                        url: ad.url
                    };
                });
                console.log("ManageAds - Final processed ads:", retrievedAds);
                setAds(retrievedAds);
            } catch (error) {
                console.error("Error fetching ads:", error);
            }
        };
        fetchAdsFromDynamoDB();
    }, []);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            setFileName(file.name);
            setPreviewUrl(URL.createObjectURL(file));
            setPreviewType(file.type.split('/')[0]);
        }
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
            ACL: 'public-read',  // Add this line
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
            resetUploadState();
        } catch (error) {
            console.error("Error uploading ad:", error);
            alert("Failed to upload ad.");
        }
    };

    const resetUploadState = () => {
        setSelectedFile(null);
        setFileName('');
        setPreviewUrl(null);
        setPreviewType('');
        setShowCreateOptions(false);
    };

    const deleteAd = async (adId) => {
        if (!window.confirm('Are you sure you want to delete this ad?')) return;

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

    return (
        <div className={`manage-ads ${isNavExpanded ? 'nav-expanded' : 'nav-collapsed'}`}>
            {/* Header Section */}
            <div className="manage-ads-header">
                <h1 className="page-title">Manage Ads</h1>
                <button 
                    className="create-button"
                    onClick={() => setShowCreateOptions(!showCreateOptions)}
                >
                    <Plus size={20} />
                    Create New Ad
                </button>
            </div>

            {/* Search Section */}
            <div className="search-container">
                <input
                    type="text"
                    placeholder="Search ads..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                />
            </div>

            {/* Upload Modal */}
            {showCreateOptions && (
                <div className="upload-modal">
                    <div className="upload-header">
                        <h2 className="upload-title">Create New Ad</h2>
                        <button 
                            className="close-button"
                            onClick={() => setShowCreateOptions(false)}
                        >
                            <X size={24} />
                        </button>
                    </div>
                    
                    <div className="upload-options">
                        <button
                            className="create-button"
                            onClick={() => navigate('/edit-template')}
                        >
                            <Pencil size={20} />
                            Create from canvas
                        </button>

                        <div className="upload-section">
                            <h3>Or Upload Media</h3>
                            
                            {previewUrl && (
                                <div className="upload-preview">
                                    {previewType === 'image' && (
                                        <img
                                            src={previewUrl}
                                            alt="Preview"
                                            className="ad-media"
                                        />
                                    )}
                                    {previewType === 'video' && (
                                        <video
                                            src={previewUrl}
                                            controls
                                            className="ad-media"
                                        />
                                    )}
                                </div>
                            )}

                            <input
                                type="text"
                                placeholder="Ad name"
                                value={fileName}
                                onChange={(e) => setFileName(e.target.value)}
                                className="search-input"
                            />

                            <label className="create-button" style={{ justifyContent: 'center' }}>
                                <Upload size={20} />
                                Choose File
                                <input
                                    type="file"
                                    onChange={handleFileChange}
                                    accept="image/*,video/*,audio/*"
                                    style={{ display: 'none' }}
                                />
                            </label>

                            <button
                                onClick={uploadAdToS3}
                                className="create-button"
                                style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }}
                            >
                                Upload Ad
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Ads Grid */}
            <div className="ads-grid">
                {filteredAds.map((ad) => (
                    <div key={ad.id} className="ad-card">
                        <div className="ad-media-container">
                            {ad.type === 'image' && (
                                <img
                                    src={ad.url}
                                    alt={ad.name}
                                    className="ad-media"
                                />
                            )}
                            {ad.type === 'video' && (
                                <video
                                    src={ad.url}
                                    controls
                                    className="ad-media"
                                />
                            )}
                            {ad.type === 'audio' && (
                                <audio
                                    src={ad.url}
                                    controls
                                    className="ad-media"
                                />
                            )}
                        </div>
                        
                        <div className="ad-content">
                            <h3 className="ad-title">{ad.name}</h3>
                            <div className="ad-actions">
                                <button
                                    onClick={() => deleteAd(ad.id)}
                                    className="action-button delete-button"
                                >
                                    <Trash2 size={16} />
                                    Delete
                                </button>
                                <button
                                    onClick={() => handleEditAd(ad)}
                                    className="action-button edit-button"
                                >
                                    <Pencil size={16} />
                                    Edit
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};


export default ManageAds;