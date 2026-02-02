import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { useEffect } from 'react';
import { SpotResponse } from '../types/api';
import L from 'leaflet';
import { ExternalLink } from 'lucide-react';

// Fix for default marker icons in Leaflet with React
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface FitBoundsProps {
  spots: SpotResponse[];
}

const FitBounds = ({ spots }: FitBoundsProps) => {
  const map = useMap();

  useEffect(() => {
    if (spots.length > 0) {
      const validSpots = spots.filter(s => s.latitude && s.longitude);
      if (validSpots.length > 0) {
        const bounds = L.latLngBounds(validSpots.map(s => [s.latitude!, s.longitude!]));
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }, [map, spots]);

  return null;
};

interface SpotMapProps {
  spots: SpotResponse[];
  center?: { lat: number; lng: number };
  zoom?: number;
  className?: string;
  onMarkerClick?: (spot: SpotResponse) => void;
}

export const SpotMap = ({ 
  spots, 
  center, 
  zoom = 13, 
  className = "h-96 w-full rounded-lg overflow-hidden border border-border",
  onMarkerClick
}: SpotMapProps) => {
  const defaultCenter = center || (spots.length > 0 && spots[0].latitude && spots[0].longitude 
    ? { lat: spots[0].latitude, lng: spots[0].longitude }
    : { lat: 0, lng: 0 });

  return (
    <div className={className}>
      <MapContainer
        center={[defaultCenter.lat, defaultCenter.lng]}
        zoom={zoom}
        scrollWheelZoom={true}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {spots.map((spot) => (
          spot.latitude && spot.longitude && (
            <Marker
              key={spot.id}
              position={[spot.latitude, spot.longitude]}
              eventHandlers={{
                click: () => onMarkerClick?.(spot),
              }}
            >
              <Popup>
                <div className="p-0.5 min-w-[120px]">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="font-semibold text-content-primary truncate">{spot.name}</div>
                    <button
                      onClick={() => {
                        if (spot.latitude && spot.longitude) {
                          window.open(`https://www.google.com/maps/search/?api=1&query=${spot.latitude},${spot.longitude}`, '_blank');
                        }
                      }}
                      className="inline-flex items-center text-[10px] text-accent hover:text-accent-hover transition-colors flex-shrink-0"
                      title="Open in Google Maps"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          )
        ))}
        <FitBounds spots={spots} />
      </MapContainer>
    </div>
  );
};
