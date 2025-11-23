import { useEffect } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default marker icon issue with webpack
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface VesselMapProps {
  latitude: number;
  longitude: number;
  locationName?: string;
  depth?: number;
  zoom?: number;
}

export default function VesselMap({ latitude, longitude, locationName, depth, zoom = 13 }: VesselMapProps) {
  const safeLatitude = Number.isFinite(latitude) ? latitude : 0;
  const safeLongitude = Number.isFinite(longitude) ? longitude : 0;
  const formatCoordinate = (value: number) => (Number.isFinite(value) ? value.toFixed(6) : '0.000000');

  useEffect(() => {
    // Create map
    const map = L.map('vessel-map').setView([safeLatitude, safeLongitude], zoom);

    // Add OpenStreetMap tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    // Add satellite imagery layer (optional toggle)
    const satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri',
      maxZoom: 19,
    });

    // Add marker for location
    const marker = L.marker([safeLatitude, safeLongitude]).addTo(map);
    
    // Popup content
    const popupContent = `
      <div class="font-semibold text-blue-900">
        <div class="text-base mb-1">${locationName || 'Vessel Location'}</div>
        <div class="text-xs text-blue-900/70">
          <div>📍 ${formatCoordinate(safeLatitude)}, ${formatCoordinate(safeLongitude)}</div>
          ${depth ? `<div>⚓ Depth: ${depth}m</div>` : ''}
        </div>
      </div>
    `;
    marker.bindPopup(popupContent).openPopup();

    // Add circle to show approximate area
    L.circle([safeLatitude, safeLongitude], {
      color: '#2563eb', // blue-600
      fillColor: '#3b82f6', // blue-500
      fillOpacity: 0.15,
      radius: 500 // 500 meter radius
    }).addTo(map);

    // Add layer control
    const baseMaps = {
      'Street Map': L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }),
      'Satellite': satellite
    };
    L.control.layers(baseMaps).addTo(map);

    // Cleanup on unmount
    return () => {
      map.remove();
    };
  }, [safeLatitude, safeLongitude, locationName, depth, zoom]);

  return (
    <div className="relative w-full h-full isolate">
      <div id="vessel-map" className="w-full h-full rounded-xl border-2 border-blue-200 relative z-0"></div>
      <div className="absolute top-3 right-3 bg-white/90 backdrop-blur px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-900 border border-blue-200 shadow-sm z-10 pointer-events-none">
        🌍 Live Map View
      </div>
    </div>
  );
}
