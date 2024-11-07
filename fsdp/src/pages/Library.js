import AWS from '../aws-config'; // Import your AWS config
import React, { useState } from 'react';
import '../App.css';
import { FaUpload, FaTrash, FaEye } from 'react-icons/fa';

// Initialize S3 instance
const s3 = new AWS.S3();

const Library = () => {
    const [mediaFiles, setMediaFiles] = useState([]);
    const [previewMedia, setPreviewMedia] = useState(null); // For modal preview
    const [mediaType, setMediaType] = useState('All'); // Filter type

    const handleFileUpload = async (e) => {
        const files = Array.from(e.target.files);
        const uploadedFiles = [];

        for (const file of files) {
            try {
                // Configure parameters for S3 upload
                const params = {
                    Bucket: process.env.REACT_APP_S3_BUCKET_NAME, // Define in .env
                    Key: `media/${Date.now()}_${file.name}`, // Custom path and unique name
                    Body: file,
                    ACL: 'public-read', // Makes file publicly accessible
                    ContentType: file.type, // Set file type
                };

                // Upload to S3
                const data = await s3.upload(params).promise();

                // Push file data with the S3 URL to mediaFiles state
                uploadedFiles.push({
                    id: data.Key,
                    name: file.name,
                    type: file.type.split('/')[0], // Image, video, audio
                    url: data.Location, // S3 file URL
                });
            } catch (error) {
                console.error('Error uploading file:', error);
            }
        }

        // Update the state with uploaded files
        setMediaFiles((prev) => [...prev, ...uploadedFiles]);
    };

    const handleDelete = (id) => {
        setMediaFiles((prev) => prev.filter(file => file.id !== id));
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
                            {/* Display Image */}
                            {file.type === 'image' && (
                                <img src={file.url} alt={file.name} />
                            )}
                            {/* Display Video */}
                            {file.type === 'video' && (
                                <video src={file.url} controls />
                            )}
                            {/* Display Audio */}
                            {file.type === 'audio' && (
                                <audio src={file.url} controls />
                            )}
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
