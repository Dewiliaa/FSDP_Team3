import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate for navigation
import template1 from '../assets/Template1.png'; // Import local images
import template2 from '../assets/Template2.png';
import template3 from '../assets/Template3.png';

const templates = [
    { 
        id: 1, 
        name: 'Template 1', 
        image: template1,
        canvaLink: 'https://www.canva.com/design/xxxxx-template-1' // Replace with actual Canva link
    },
    { 
        id: 2, 
        name: 'Template 2', 
        image: template2,
        canvaLink: 'https://www.canva.com/design/xxxxx-template-2' // Replace with actual Canva link
    },
    { 
        id: 3, 
        name: 'Template 3', 
        image: template3,
        canvaLink: 'https://www.canva.com/design/xxxxx-template-3' // Replace with actual Canva link
    },
];

const CanvaPage = () => {
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const navigate = useNavigate(); // Hook to navigate between routes

    const handleTemplateClick = (template) => {
        setSelectedTemplate(template);
    };

    const handleClosePopup = () => {
        setSelectedTemplate(null);
    };

    const handleCustomizeClick = () => {
        // Navigate to the Canva template URL
        if (selectedTemplate && selectedTemplate.canvaLink) {
            window.open(selectedTemplate.canvaLink, '_blank'); // Open the Canva template link in a new tab
        }
    };

    // Inline styles
    const styles = {
        container: {
            padding: '20px',
        },
        gallery: {
            display: 'flex',
            justifyContent: 'center', // Center the templates
            flexWrap: 'wrap',
            gap: '15px',
        },
        card: {
            border: '1px solid #ccc',
            borderRadius: '5px',
            cursor: 'pointer',
            textAlign: 'center',
            padding: '10px',
            transition: 'transform 0.2s',
            width: '200px', // Set a fixed width for consistent card sizes
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)', // Optional: add shadow for better visibility
        },
        cardHover: {
            transform: 'scale(1.05)',
        },
        popup: {
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
        },
        popupContent: {
            background: 'white',
            padding: '20px',
            borderRadius: '5px',
            textAlign: 'center',
            position: 'relative',
        },
        close: {
            cursor: 'pointer',
            position: 'absolute',
            top: '10px',
            right: '15px',
            fontSize: '20px',
        },
        customizeButton: {
            backgroundColor: '#6a4fe7',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            padding: '10px 15px',
            cursor: 'pointer',
        },
        popupImage: {
            width: '150px', // Set a fixed width for the popup image
            height: 'auto', // Maintain aspect ratio
            borderRadius: '5px',
        },
    };

    return (
        <div style={styles.container}>
            <h2 className="page-title">Choose Template</h2>

            <div style={styles.gallery}>
                {templates.map((template) => (
                    <div
                        key={template.id}
                        style={styles.card}
                        onClick={() => handleTemplateClick(template)}
                        onMouseEnter={(e) => (e.currentTarget.style.transform = styles.cardHover.transform)}
                        onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                    >
                        <img src={template.image} alt={template.name} style={{ width: '100%', height: 'auto', borderRadius: '5px' }} />
                        <p>{template.name}</p>
                    </div>
                ))}
            </div>

            {selectedTemplate && (
                <div style={styles.popup}>
                    <div style={styles.popupContent}>
                        <span style={styles.close} onClick={handleClosePopup}>&times;</span>
                        <h3>{selectedTemplate.name}</h3>
                        <img src={selectedTemplate.image} alt={selectedTemplate.name} style={styles.popupImage} />
                        <button style={styles.customizeButton} onClick={handleCustomizeClick}>
                            Customize this template
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CanvaPage;
