
import { s3, s3Bucket2 } from '../aws-config';
import React, { useState, useEffect } from 'react';
import '../App.css';
import { FaUpload, FaTrash, FaEye } from 'react-icons/fa';

// Initialize S3 instance
const s3 = new AWS.S3();

const Library = () => {
    const [mediaFiles, setMediaFiles] = useState([]);
    const [previewMedia, setPreviewMedia] = useState(null);
    const [mediaType, setMediaType] = useState('All');

    useEffect(() => {
        const fetchMediaFiles = async () => {
            try {
                const params = {
                    Bucket: process.env.REACT_APP_S3_BUCKET_NAME,
                    Prefix: 'media/', 
                };
                console.log('Fetching with params:', params);
    
                const data = await s3.listObjectsV2(params).promise();
                console.log('Fetched data:', data);

                const files = data.Contents.map((item) => ({
                    id: item.Key,
                    name: item.Key.split('/').pop(),
                    type: item.Key.split('.').pop(),
                    url: s3.getSignedUrl('getObject', { Bucket: params.Bucket, Key: item.Key }),
                }));
                setMediaFiles(files);
            } catch (error) {
                console.error('Error fetching media files:', error);
            }
        };
    
        fetchMediaFiles();
    }, []);
    

    const handleFileUpload = async (e) => {
        const files = Array.from(e.target.files);
        const uploadedFiles = [];

        for (const file of files) {
            try {
                const params = {
                    Bucket: process.env.REACT_APP_S3_BUCKET_NAME,
                    Key: `media/${Date.now()}_${file.name}`,
                    Body: file,
                    ACL: 'public-read',
                    ContentType: file.type,
                };

                const data = await s3.upload(params).promise();

                uploadedFiles.push({
                    id: data.Key,
                    name: file.name,
                    type: file.type.split('/')[0],
                    url: data.Location,
                });
            } catch (error) {
                console.error('Error uploading file:', error);
            }
        }

        setMediaFiles((prev) => [...prev, ...uploadedFiles]);
    };

    const handleDelete = async (id) => {
        try {
            const params = {
                Bucket: process.env.REACT_APP_S3_BUCKET_NAME,
                Key: id,
            };

            await s3.deleteObject(params).promise();
            window.alert('File has been successfully deleted.');

            setMediaFiles((prev) => prev.filter(file => file.id !== id));
            console.log(`File ${id} deleted successfully from S3.`);
        } catch (error) {
            console.error('Error deleting file from S3:', error);
        }
    };

    const filteredFiles = mediaFiles.filter(file =>
        mediaType === 'All' || file.type === mediaType.toLowerCase()
    );

    return (
        <div className="library-page">
            <header className="library-header">
                <h1>Media Library</h1>
                <div className="upload-container">
                    <label htmlFor="file-upload" className="upload-label">
                        <FaUpload /> Upload Media
                    </label>
                    <input
                        type="file"
                        id="file-upload"
                        multiple
                        onChange={handleFileUpload}
                        accept="image/*, video/*, audio/*"
                        hidden
                    />
                </div>
            </header>

            <div className="filter-container">
                <label>Filter by Type:</label>
                <select value={mediaType} onChange={(e) => setMediaType(e.target.value)}>
                    <option value="All">All</option>
                    <option value="Image">Images</option>
                    <option value="Video">Videos</option>
                    <option value="Audio">Audio</option>
                </select>
            </div>

            <div className="media-grid">
                {filteredFiles.map((file) => (
                    <div key={file.id} className="media-card">
                        <div className="media-preview">
                            {file.type === 'image' && <img src={file.url} alt={file.name} />}
                            {file.type === 'video' && <video src={file.url} controls />}
                            {file.type === 'audio' && <audio src={file.url} controls />}
                        </div>
                        <div className="media-info">
                            <p>{file.name}</p>
                            <div className="media-actions">
                                <button onClick={() => setPreviewMedia(file)}><FaEye /> Preview</button>
                                <button onClick={() => handleDelete(file.id)}><FaTrash /> Delete</button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {previewMedia && (
                <div className="preview-modal" onClick={() => setPreviewMedia(null)}>
                    <div className="preview-content" onClick={(e) => e.stopPropagation()}>
                        {previewMedia.type === 'image' && <img src={previewMedia.url} alt={previewMedia.name} />}
                        {previewMedia.type === 'video' && <video src={previewMedia.url} controls />}
                        {previewMedia.type === 'audio' && <audio src={previewMedia.url} controls />}
                        <p>{previewMedia.name}</p>
                        <button className="close-button" onClick={() => setPreviewMedia(null)}>Close</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Library;
