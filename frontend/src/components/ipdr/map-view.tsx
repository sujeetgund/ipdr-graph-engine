
'use client';

import { useMemo, useState } from 'react';
import { GoogleMap, useJsApiLoader, MarkerF, InfoWindowF } from '@react-google-maps/api';
import { Skeleton } from '../ui/skeleton';
import { AlertCircle } from 'lucide-react';
import { MapLocation } from '@/types/ipdr';

interface MapViewProps {
  locations: MapLocation[];
}

const containerStyle = {
  width: '100%',
  height: '100%',
};

const mapOptions = {
    styles: [
        { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
        { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
        { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
        {
          featureType: 'administrative.locality',
          elementType: 'labels.text.fill',
          stylers: [{ color: '#d59563' }],
        },
        {
          featureType: 'poi',
          elementType: 'labels.text.fill',
          stylers: [{ color: '#d59563' }],
        },
        {
          featureType: 'poi.park',
          elementType: 'geometry',
          stylers: [{ color: '#263c3f' }],
        },
        {
          featureType: 'poi.park',
          elementType: 'labels.text.fill',
          stylers: [{ color: '#6b9a76' }],
        },
        {
          featureType: 'road',
          elementType: 'geometry',
          stylers: [{ color: '#38414e' }],
        },
        {
          featureType: 'road',
          elementType: 'geometry.stroke',
          stylers: [{ color: '#212a37' }],
        },
        {
          featureType: 'road',
          elementType: 'labels.text.fill',
          stylers: [{ color: '#9ca5b3' }],
        },
        {
          featureType: 'road.highway',
          elementType: 'geometry',
          stylers: [{ color: '#746855' }],
        },
        {
          featureType: 'road.highway',
          elementType: 'geometry.stroke',
          stylers: [{ color: '#1f2835' }],
        },
        {
          featureType: 'road.highway',
          elementType: 'labels.text.fill',
          stylers: [{ color: '#f3d19c' }],
        },
        {
          featureType: 'transit',
          elementType: 'geometry',
          stylers: [{ color: '#2f3948' }],
        },
        {
          featureType: 'transit.station',
          elementType: 'labels.text.fill',
          stylers: [{ color: '#d59563' }],
        },
        {
          featureType: 'water',
          elementType: 'geometry',
          stylers: [{ color: '#17263c' }],
        },
        {
          featureType: 'water',
          elementType: 'labels.text.fill',
          stylers: [{ color: '#515c6d' }],
        },
        {
          featureType: 'water',
          elementType: 'labels.text.stroke',
          stylers: [{ color: '#17263c' }],
        },
      ],
      mapTypeControl: false,
      streetViewControl: false,
}

export function MapView({ locations }: MapViewProps) {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
  });

  const [activeMarker, setActiveMarker] = useState<string | null>(null);

  const center = useMemo(() => {
    if (locations.length === 0) {
      return { lat: 34.0522, lng: -118.2437 }; // Default to LA
    }
    const { lat, lng } = locations.reduce(
      (acc, loc) => ({ lat: acc.lat + loc.lat, lng: acc.lng + loc.lng }),
      { lat: 0, lng: 0 }
    );
    return { lat: lat / locations.length, lng: lng / locations.length };
  }, [locations]);

  if (loadError) {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center p-6 bg-destructive/10">
            <AlertCircle className="w-16 h-16 text-destructive" />
            <h1 className="mt-4 text-2xl font-bold">Map Error</h1>
            <p className="mt-2 text-muted-foreground">
                Could not load Google Maps. Please check your API key and network connection.
            </p>
        </div>
    );
  }

  if (!isLoaded) {
    return <Skeleton className="w-full h-full" />;
  }

  if (locations.length === 0) {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <AlertCircle className="w-16 h-16 text-muted-foreground" />
            <h1 className="mt-4 text-2xl font-bold">No Location Data</h1>
            <p className="mt-2 text-muted-foreground">This node has no cell tower data to display on the map.</p>
        </div>
    );
  }
  
  const handleMarkerClick = (markerId: string) => {
    setActiveMarker(markerId);
  };

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={center}
      zoom={locations.length > 1 ? 4 : 10}
      options={mapOptions}
      onClick={() => setActiveMarker(null)}
    >
      {locations.map((loc) => (
        <MarkerF 
            key={loc.id} 
            position={loc} 
            title={loc.title}
            onClick={() => handleMarkerClick(loc.id)}
        >
            {activeMarker === loc.id && (
                <InfoWindowF onCloseClick={() => setActiveMarker(null)}>
                    <div className="p-1 text-card-foreground bg-card">
                        <h4 className="font-bold text-base mb-2">{loc.title}</h4>
                        <div className="space-y-1 text-sm">
                           {Object.entries(loc.details).map(([key, value]) => (
                                <p key={key}>
                                    <span className="font-semibold">{key}:</span> {value}
                                </p>
                           ))}
                        </div>
                    </div>
                </InfoWindowF>
            )}
        </MarkerF>
      ))}
    </GoogleMap>
  );
}
