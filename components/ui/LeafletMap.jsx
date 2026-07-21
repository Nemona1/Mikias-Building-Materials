// components/ui/LeafletMap.jsx - Updated with correct coordinates
'use client';

import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet with Next.js
const fixLeafletIcon = () => {
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  });
};

export default function LeafletMap({ 
  position = [9.01498522831663,38.748420763541816 ], 
  zoom = 17,
  title = 'Mikias Ayele Building Materials & Electrical',
  address = 'Mexico, Sengatera, Addis Ababa, Ethiopia',
  phone = '+251 911 912 611'
}) {
  const mapRef = useRef(null);

  useEffect(() => {
    fixLeafletIcon();
  }, []);

  const defaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

  return (
    <div className="rounded-xl overflow-hidden border border-border shadow-lg relative">
      <MapContainer
        ref={mapRef}
        center={position}
        zoom={zoom}
        style={{ height: '400px', width: '100%' }}
        zoomControl={true}
        scrollWheelZoom={true}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker 
          position={position} 
          icon={defaultIcon}
        >
          <Popup>
            <div className="text-center p-2">
              <strong className="text-foreground block text-sm font-semibold">{title}</strong>
              <p className="text-muted text-xs mt-1">{address}</p>
              <p className="text-primary text-xs font-medium mt-1">{phone}</p>
              <a 
                href="https://maps.app.goo.gl/XZYxH2MrHKEv5M7q6" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-1 inline-block"
              >
                View in Google Maps
              </a>
            </div>
          </Popup>
        </Marker>
      </MapContainer>

      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10">
        <div className="bg-card/90 backdrop-blur-sm rounded-lg px-4 py-2 border border-border shadow-lg">
          <div className="flex items-center gap-2 text-xs text-muted">
            <span className="inline-block w-2 h-2 rounded-full bg-primary animate-pulse"></span>
            <span>📍 Mexico, Sengatera, Addis Ababa</span>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .leaflet-container {
          background: var(--color-background);
        }
        .leaflet-popup-content-wrapper {
          background: var(--color-card);
          color: var(--color-foreground);
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        .leaflet-popup-tip {
          background: var(--color-card);
        }
        .leaflet-control-zoom a {
          background: var(--color-card);
          color: var(--color-foreground);
          border-color: var(--color-border);
        }
        .leaflet-control-zoom a:hover {
          background: var(--color-muted/10);
        }
        .leaflet-tile-pane {
          filter: brightness(0.9) saturate(0.8);
        }
        .dark .leaflet-tile-pane {
          filter: brightness(0.7) saturate(0.6) invert(0.1);
        }
      `}</style>
    </div>
  );
}