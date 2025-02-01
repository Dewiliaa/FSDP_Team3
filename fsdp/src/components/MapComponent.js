import React from 'react';
import { GoogleMap, useJsApiLoader } from '@react-google-maps/api';

const MapComponent = () => {
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: 'AIzaSyDxpHAlVKW2udhCJPTo_ipzvtAx2O8lqwQ',
    });

    const mapOptions = {
        fullscreenControl: true,
        streetViewControl: true,
        mapTypeControl: true,
        zoomControl: true,
        mapTypeControlOptions: {
            position: window.google?.maps?.ControlPosition?.TOP_RIGHT
        }
    };

    return isLoaded ? (
        <GoogleMap
            mapContainerClassName="map-container"
            center={{ lat: 1.3521, lng: 103.8198 }}
            zoom={12}
            options={mapOptions}
        >
        </GoogleMap>
    ) : <></>;
};

export default React.memo(MapComponent);