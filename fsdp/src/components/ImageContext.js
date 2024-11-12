import React, { createContext, useContext, useState } from 'react';

const ImageContext = createContext();

export const ImageProvider = ({ children }) => {
    const [editedImage, setEditedImage] = useState(null);
    const [selectedAdId, setSelectedAdId] = useState(null);

    return (
        <ImageContext.Provider value={{ 
            editedImage, 
            setEditedImage,
            selectedAdId,
            setSelectedAdId
        }}>
            {children}
        </ImageContext.Provider>
    );
};

export const useImage = () => useContext(ImageContext);