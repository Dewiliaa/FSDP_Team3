import AWS from '../aws-config';
import React, { useState, useEffect } from 'react';
import '../App.css';
import { FaUpload, FaTrash, FaEye } from 'react-icons/fa';

// Initialize S3 and DynamoDB Document Client
const s3 = new AWS.S3();
const dynamoDb = new AWS.DynamoDB.DocumentClient();

const Library = () => {
    const [mediaFiles, setMediaFiles] = useState([]);
    const [previewMedia, setPreviewMedia] = useState(null);
    const [mediaType, setMediaType] = useState('All');
    const [filterCategory, setFilterCategory] = useState('All');
    const [category, setCategory] = useState(''); // State for category selection (File or Ad)
    const [selectedFile, setSelectedFile] = useState(null); // To store the selected file temporarily
    const [fileName, setFileName] = useState(''); // State to store user-defined file name

    // Fetch media files from DynamoDB upon component mount
    useEffect(() => {
        const fetchMediaFiles = async () => {
            try {
                const mediaParams = {
                    TableName: 'Media'
                };
                const adsParams = {
                    TableName: 'Ads'
                };
                // Fetch media files from both tables
                const [mediaData, adsData] = await Promise.all([
                    dynamoDb.scan(mediaParams).promise(),
                    dynamoDb.scan(adsParams).promise()
                ]);

                // Map through both media and ads, then combine
                const mediaFilesFromDB = [
                    ...mediaData.Items.map(item => ({
                        id: item.img_id,
                        name: item.name,
                        type: item.type,
                        url: item.url,
                        category: 'file'
                    })),
                    ...adsData.Items.map(item => ({
                        id: item.ad_id,
                        name: item.name,
                        type: item.type,
                        url: item.url,
                        category: 'ads'
                    }))
                ];

                setMediaFiles(mediaFilesFromDB);
            } catch (error) {
                console.error('Error fetching media files from DynamoDB:', error);
            }
        };
        fetchMediaFiles();
    }, []);

    // Handle file selection and reset states for category and file name
    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        setSelectedFile(file);
        setFileName(''); // Reset file name
        setCategory(''); // Reset category selection
    };

    // Upload file to S3 and save metadata in DynamoDB
    const uploadFileToS3 = async (file, category, name) => {
        try {
            const params = {
                Bucket: process.env.REACT_APP_S3_BUCKET_NAME,
                Key: `media/${Date.now()}_${file.name}`,
                Body: file,
                ACL: 'public-read',
                ContentType: file.type,
            };

            const data = await s3.upload(params).promise();

            // Save metadata to DynamoDB based on category
            const dynamoParams = {
                TableName: category === 'ads' ? 'Ads' : 'Media',
                Item: {
                    [category === 'ads' ? 'ad_id' : 'img_id']: data.Key,
                    name: name || file.name,
                    type: file.type.split('/')[0],
                    uploadDate: new Date().toISOString(),
                    url: data.Location,
                },
            };

            await dynamoDb.put(dynamoParams).promise();
            console.log("Metadata saved to DynamoDB successfully.");

            const newFile = {
                id: data.Key,
                name: name || file.name,
                type: file.type.split('/')[0],
                url: data.Location,
                category: category,
            };

            setMediaFiles((prev) => [...prev, newFile]);
            window.alert('File uploaded successfully!');
            setSelectedFile(null); // Clear selected file
            setFileName(''); // Clear file name input
            setCategory(''); // Reset category

        } catch (error) {
            console.error("Error uploading file:", error);
            window.alert('Error uploading file');
        }
    };

    // Trigger file upload upon confirming the selected category
    const handleCategorySelection = () => {
        if (selectedFile && category) {
            uploadFileToS3(selectedFile, category, fileName);
        } else {
            window.alert('Please select a category and enter a file name.');
        }
    };

    const handleDelete = async (id, category) => {
        try {
            // Immediately remove the item from the frontend
            setMediaFiles((prev) => prev.filter(file => file.id !== id));

            const s3Params = {
                Bucket: process.env.REACT_APP_S3_BUCKET_NAME,
                Key: id,
            };

            // Delete file from S3
            await s3.deleteObject(s3Params).promise();
            console.log(`File ${id} deleted successfully from S3.`);

            const dynamoDeleteParams = {
                TableName: category === 'ads' ? 'Ads' : 'Media',
                Key: { [category === 'ads' ? 'ad_id' : 'img_id']: id },
            };

            // Delete metadata from DynamoDB
            await dynamoDb.delete(dynamoDeleteParams).promise();
            console.log(`Metadata for ${id} deleted successfully from DynamoDB ${category === 'ads' ? 'Ads' : 'Media'} table.`);

            window.alert('File has been successfully deleted.');
        } catch (error) {
            console.error('Error deleting file:', error);
            window.alert('Failed to delete file from the database.');
        }
    };

    const filteredFiles = mediaFiles.filter(file =>
        (mediaType === 'All' || file.type === mediaType.toLowerCase()) &&
        (filterCategory === 'All' || file.category === filterCategory)
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
                        onChange={handleFileUpload}
                        accept="image/*, video/*, audio/*"
                        hidden
                    />
                </div>
            </header>

            {/* Category Selection Modal */}
            {selectedFile && (
                <div className="category-modal">
                    <p>Enter a name for your file:</p>
                    <input
                        type="text"
                        value={fileName}
                        onChange={(e) => setFileName(e.target.value)}
                        placeholder="Enter file name"
                        className="file-name-input"
                    />
                    <p>Choose a category for your file:</p>
                    <select 
                        value={category} 
                        onChange={(e) => setCategory(e.target.value)} 
                        className="category-dropdown"
                    >
                        <option value="" disabled>Select Category</option>
                        <option value="file">Save as File</option>
                        <option value="ads">Save as Ad</option>
                    </select>
                    <button className="upload-confirm-button" onClick={handleCategorySelection}>Upload</button>
                </div>
            )}

            {/* Filter Section */}
            <div className="filter-container">
                <label>Filter by Type:</label>
                <select value={mediaType} onChange={(e) => setMediaType(e.target.value)} className="media-type-dropdown">
                    <option value="All">All</option>
                    <option value="Image">Images</option>
                    <option value="Video">Videos</option>
                    <option value="Audio">Audio</option>
                </select>

                <label>Filter by Category:</label>
                <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="category-dropdown">
                    <option value="All">All</option>
                    <option value="file">File</option>
                    <option value="ads">Ad</option>
                </select>
            </div>

            {/* Media Grid */}
            <div className="media-grid">
                {filteredFiles.map((file) => (
                    <div key={file.id} className="media-card">
                        <div className="media-preview">
                            {file.type === 'image' && <img src={file.url} alt={file.name} />}
                            {file.type === 'video' && <video src={file.url} controls />}
                            {file.type === 'audio' && <audio src={file.url} controls />}
                        </div>
                        <div className="media-info">
                            <p className="media-name">{file.name}</p>
                            <div className="media-actions">
                                <button onClick={() => setPreviewMedia(file)}><FaEye /> Preview</button>
                                <button onClick={() => handleDelete(file.id, file.category)}><FaTrash /> Delete</button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Preview Modal */}
            {previewMedia && (
                <div className="preview-modal" onClick={() => setPreviewMedia(null)}>
                    <div className="preview-content" onClick={(e) => e.stopPropagation()}>
                        {previewMedia.type === 'image' && <img src={previewMedia.url} alt={previewMedia.name} />}
                        {previewMedia.type === 'video' && <video src={previewMedia.url} controls />}
                        {previewMedia.type === 'audio' && <audio src={previewMedia.url} controls />}
                        <p className="preview-name">{previewMedia.name}</p>
                        <button className="close-button" onClick={() => setPreviewMedia(null)}>Close</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Library;
