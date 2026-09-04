import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Navigation, Compass, MapPin } from 'lucide-react';

// Custom SVG Icons for Leaflet markers
const createCustomIcon = (svgString, color) => {
  return L.divIcon({
    html: `<div style="display:flex;align-items:center;justify:center;width:32px;height:32px;background:${color};border-radius:50%;border:2px solid #ffffff;box-shadow:0 4px 6px -1px rgba(0,0,0,0.5);">${svgString}</div>`,
    className: '',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
};

const shopIcon = createCustomIcon('🏪', '#38bdf8');
const deliveryIcon = createCustomIcon('🛵', '#f59e0b');
const destinationIcon = createCustomIcon('🏠', '#10b981');

// Helper to Recenter Map smoothly
function RecenterAutomatically({ location }) {
  const map = useMap();
  useEffect(() => {
    if (location && location[0] && location[1]) {
      map.setView(location, map.getZoom());
    }
  }, [location, map]);
  return null;
}

// Haversine formula for calculating distance in kilometers
function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return (R * c).toFixed(1);
}

export default function LiveDeliveryMap({
  driverLocation,
  shopLocation,
  destinationLocation,
  lastUpdated,
  isLive,
  shopName,
  destinationAddress,
}) {
  const [centerLocation, setCenterLocation] = useState(
    driverLocation || destinationLocation || shopLocation || [28.6139, 77.209]
  );
  const [userInteracted, setUserInteracted] = useState(false);

  useEffect(() => {
    if (driverLocation && !userInteracted) {
      setCenterLocation(driverLocation);
    }
  }, [driverLocation, userInteracted]);

  const distanceKm =
    driverLocation && destinationLocation
      ? calculateHaversineDistance(
          driverLocation[0],
          driverLocation[1],
          destinationLocation[0],
          destinationLocation[1]
        )
      : null;

  // Basic estimated ETA calculation assuming 20 km/h average speed in campus
  const estimatedMin = distanceKm ? Math.max(2, Math.round((distanceKm / 20) * 60)) : null;

  const secondsAgo = lastUpdated ? Math.floor((Date.now() - new Date(lastUpdated).getTime()) / 1000) : null;
  const isStale = secondsAgo !== null && secondsAgo > 45;

  return (
    <div style={{ background: 'var(--surface)', borderRadius: '0.75rem', border: '1px solid var(--border-color)', overflow: 'hidden', marginBottom: '1.5rem' }}>
      {/* Live Map Top Status Header */}
      <div
        style={{
          padding: '0.85rem 1.25rem',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          justify: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem',
          background: 'rgba(7, 17, 31, 0.8)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: isLive && !isStale ? '#10b981' : '#f59e0b',
              boxShadow: isLive && !isStale ? '0 0 8px #10b981' : 'none',
            }}
          />
          <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>
            {isLive && !isStale
              ? `LIVE TRACKING (${secondsAgo !== null ? `${secondsAgo}s ago` : 'Connected'})`
              : isStale
              ? 'Location update delayed'
              : 'Waiting for partner location...'}
          </strong>
        </div>

        {distanceKm && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.85rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>
              Distance: <strong style={{ color: 'var(--primary)' }}>{distanceKm} km</strong>
            </span>
            {estimatedMin && (
              <span style={{ color: 'var(--text-secondary)' }}>
                Est. ETA: <strong style={{ color: '#10b981' }}>~{estimatedMin} min</strong>
              </span>
            )}
          </div>
        )}

        {driverLocation && (
          <button
            onClick={() => {
              setCenterLocation(driverLocation);
              setUserInteracted(false);
            }}
            className="btn-secondary"
            style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
          >
            <Compass size={12} />
            <span>Center Marker</span>
          </button>
        )}
      </div>

      {/* Leaflet Map Rendering Container */}
      <div style={{ height: '340px', width: '100%', position: 'relative' }}>
        <MapContainer
          center={centerLocation}
          zoom={15}
          scrollWheelZoom={false}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {!userInteracted && <RecenterAutomatically location={driverLocation || centerLocation} />}

          {/* Shop Marker */}
          {shopLocation && (
            <Marker position={shopLocation} icon={shopIcon}>
              <Popup>
                <div style={{ color: '#000', fontSize: '0.85rem' }}>
                  <strong>🏪 {shopName || 'Shop'}</strong>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Destination Marker */}
          {destinationLocation && (
            <Marker position={destinationLocation} icon={destinationIcon}>
              <Popup>
                <div style={{ color: '#000', fontSize: '0.85rem' }}>
                  <strong>🏠 Delivery Destination</strong>
                  <p style={{ margin: 0 }}>{destinationAddress}</p>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Driver Marker */}
          {driverLocation && (
            <Marker position={driverLocation} icon={deliveryIcon}>
              <Popup>
                <div style={{ color: '#000', fontSize: '0.85rem' }}>
                  <strong>🛵 Delivery Partner</strong>
                  <p style={{ margin: 0 }}>{isLive ? 'Live Sharing' : 'Last Known Location'}</p>
                </div>
              </Popup>
            </Marker>
          )}
        </MapContainer>
      </div>
    </div>
  );
}
