import React, { useState } from 'react';

const templates = [
    { id: 1, name: 'Template 1', image: 'link_to_image_1' },
    { id: 2, name: 'Template 2', image: 'link_to_image_2' },
    { id: 3, name: 'Template 3', image: 'link_to_image_3' },
    // Add more templates as needed
];

const ChooseTemplate = () => {
    const [selectedTemplate, setSelectedTemplate] = useState(null);

    const handleTemplateClick = (template) => {
        setSelectedTemplate(template);
    };

    const handleClosePopup = () => {
        setSelectedTemplate(null);
    };

    // Inline styles
    const styles = {
        container: {
            padding: '20px',
        },
        gallery: {
            display: 'flex',
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
                        <img src={template.image} alt={template.name} />
                        <p>{template.name}</p>
                    </div>
                ))}
            </div>

            {selectedTemplate && (
                <div style={styles.popup}>
                    <div style={styles.popupContent}>
                        <span style={styles.close} onClick={handleClosePopup}>&times;</span>
                        <h3>{selectedTemplate.name}</h3>
                        <img src={selectedTemplate.image} alt={selectedTemplate.name} />
                        <button style={styles.customizeButton}>Customize this template</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChooseTemplate;
