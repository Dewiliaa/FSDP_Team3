import AWS from '../aws-config';
import React, { useState, useEffect } from 'react';
import '../App.css';
import { FaUpload, FaTrash, FaEye } from 'react-icons/fa';

// Initialize S3 instance
const s3 = new AWS.S3();

const Library = () => {
    const [mediaFiles, setMediaFiles] = useState([]);
    const [previewMedia, setPreviewMedia] = useState(null);
    const [mediaType, setMediaType] = useState('All');

    // Fetch media files and load from localStorage if available
    useEffect(() => {
        const fetchMediaFiles = async () => {
            const storedFiles = localStorage.getItem('mediaFiles');
            if (storedFiles) {
                setMediaFiles(JSON.parse(storedFiles));
            } else {
                try {
                    const params = {
                        Bucket: process.env.REACT_APP_S3_BUCKET_NAME,
                        Prefix: 'media/',
                    };

                    const data = await s3.listObjectsV2(params).promise();
                    const files = data.Contents.map((item) => ({
                        id: item.Key,
                        name: item.Key.split('/').pop(),
                        type: item.Key.split('.').pop(),
                        url: `https://mediastorage-bytefsdp.s3.amazonaws.com/media/${item.Key.split('/').pop()}?t=${new Date().getTime()}`, // Cache busting
                    }));

                    setMediaFiles(files);
                    localStorage.setItem('mediaFiles', JSON.stringify(files)); // Store in localStorage
                } catch (error) {
                    console.error('Error fetching media files:', error);
                }
            }
        };

        fetchMediaFiles();
    }, []);

    // Handle file upload
    const handleFileUpload = async (e) => {
        const files = Array.from(e.target.files);
        const uploadedFiles = [];

        for (const file of files) {
            try {
                const params = {
                    Bucket: process.env.REACT_APP_S3_BUCKET_NAME,
                    Key: `media/${Date.now()}_${file.name}`,
                    Body: file,
                    ACL: 'public-read', // Ensure the file is publicly accessible
                    ContentType: file.type,
                };

                const data = await s3.upload(params).promise();

                uploadedFiles.push({
                    id: data.Key,
                    name: file.name,
                    type: file.type.split('/')[0], // Image, Audio, Video
                    url: `${data.Location}?t=${new Date().getTime()}`, // Cache busting
                });
            } catch (error) {
                console.error('Error uploading file:', error);
            }
        }

        setMediaFiles((prev) => {
            const updatedFiles = [...prev, ...uploadedFiles];
            localStorage.setItem('mediaFiles', JSON.stringify(updatedFiles)); // Store updated files in localStorage
            return updatedFiles;
        });
    };

    // Handle file deletion
    const handleDelete = async (id) => {
        try {
            const params = {
                Bucket: process.env.REACT_APP_S3_BUCKET_NAME,
                Key: id,
            };

            await s3.deleteObject(params).promise();
            window.alert('File has been successfully deleted.');

            const updatedFiles = mediaFiles.filter(file => file.id !== id);
            setMediaFiles(updatedFiles);
            localStorage.setItem('mediaFiles', JSON.stringify(updatedFiles)); // Update localStorage
            console.log(`File ${id} deleted successfully from S3.`);
        } catch (error) {
            console.error('Error deleting file from S3:', error);
        }
    };

    // Filter files based on selected media type
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
