import React, { useState, useEffect } from 'react';
import AWS from '../aws-config';
import { FaSearch, FaSpinner } from 'react-icons/fa';
import '../styles/Librarypanel.css';

const s3 = new AWS.S3();
const dynamoDb = new AWS.DynamoDB.DocumentClient();

const LibraryPanel = ({ onImageSelect }) => {
  const [mediaFiles, setMediaFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');

  useEffect(() => {
    fetchMediaFiles();
  }, []);

  const fetchMediaFiles = async () => {
    try {
      const mediaParams = { TableName: 'Media' };
      const adsParams = { TableName: 'Ads' };
      
      const [mediaData, adsData] = await Promise.all([
        dynamoDb.scan(mediaParams).promise(),
        dynamoDb.scan(adsParams).promise()
      ]);

      const allFiles = [
        ...mediaData.Items.map(item => ({
          ...item,
          type: 'media'
        })),
        ...adsData.Items.map(item => ({
          ...item,
          type: 'ad'
        }))
      ];

      setMediaFiles(allFiles);
    } catch (error) {
      console.error('Error fetching media files:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (e, image) => {
    console.log("Dragging image:", image); // ✅ Debugging log
    e.dataTransfer.setData(
      "application/json",
      JSON.stringify({ url: image.url, name: image.name })
    );
  };
  
  
  const filteredFiles = mediaFiles.filter(file => {
    const matchesSearch = file.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = selectedFilter === 'all' || file.type === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="library-panel">
      <div className="library-header">
        <h3>Media Library</h3>
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search media..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <FaSearch className="search-icon" />
        </div>
        <select
          value={selectedFilter}
          onChange={(e) => setSelectedFilter(e.target.value)}
          className="filter-select"
        >
          <option value="all">All</option>
          <option value="media">Media</option>
          <option value="ad">Ads</option>
        </select>
      </div>

      <div className="library-content">
        {loading ? (
          <div className="loading-state">
            <FaSpinner className="spinner" />
            <p>Loading media...</p>
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="empty-state">
            <p>No media files found</p>
          </div>
        ) : (
          <div className="media-grid">
            {filteredFiles.map((file) => (
              <div
                key={file.img_id || file.ad_id}
                className="media-item"
                draggable
                onDragStart={(e) => handleDragStart(e, file)}
                onClick={() => onImageSelect(file)}
              >
                <img src={file.url} alt={file.name} />
                <span className="media-name">{file.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LibraryPanel;