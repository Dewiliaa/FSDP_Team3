import React from 'react';
import { GoogleMap, useJsApiLoader} from '@react-google-maps/api';
import '../App.css';

// Center of map (Singapore)
const center = {
  lat: 1.3521,
  lng: 103.8198,
};

const MapComponent = () => {
  // Load the Google Maps API with API key
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: 'AIzaSyDxpHAlVKW2udhCJPTo_ipzvtAx2O8lqwQ',
  });

  return isLoaded ? (
    <GoogleMap
      mapContainerClassName="map-container"
      center={center}
      zoom={12}
    >
    </GoogleMap>
  ) : (
    <></>
  );
};

export default React.memo(MapComponent);
