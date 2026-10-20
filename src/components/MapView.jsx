import { useEffect, useMemo } from 'react';
import L from 'leaflet';
import { MapContainer, Marker, Polyline, TileLayer, Tooltip, useMap, useMapEvents } from 'react-leaflet';

const CENTER = [11.0168, 76.9558]; // Coimbatore / transit origin

function Clicks({ onClick }) {
  useMapEvents({ click: (e) => onClick && onClick({ lat: e.latlng.lat, lng: e.latlng.lng }) });
  return null;
}

function Fit({ points }) {
  const map = useMap();
  const key = points.map((p) => `${p.lat.toFixed(4)},${p.lng.toFixed(4)}`).join('|');
  useEffect(() => {
    if (points.length > 1) {
      map.fitBounds(points.map((p) => [p.lat, p.lng]), {
        padding: [60, 60],
        maxZoom: 16,
        animate: true,
      });
    } else if (points.length === 1) {
      map.setView([points[0].lat, points[0].lng], 14, { animate: true });
    }
  }, [key, map]);
  return null;
}

function getVehicleSvg(type = 'car') {
  if (type === 'bike') {
    return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="18.5" cy="17.5" r="3.5"/><path d="M15 6h-3l-3 6.5h6.5l2-3.5h3"/><path d="M9 17.5l3-8"/></svg>`;
  }
  if (type === 'auto') {
    return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M3 13h4l2-6h9a2 2 0 0 1 2 2v6h-1"/><path d="M9 7h8v5H9z"/></svg>`;
  }
  return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 16h14a2 2 0 0 0 2-2l-1.5-5a2 2 0 0 0-1.9-1.4H6.4A2 2 0 0 0 4.5 9L3 14a2 2 0 0 0 2 2z"/><circle cx="7" cy="16.5" r="2.5"/><circle cx="17" cy="16.5" r="2.5"/></svg>`;
}

function createMarkerIcon({ label, isSearching, vehicleType }) {
  if (label === 'Pickup') {
    return L.divIcon({
      className: 'custom-map-marker',
      html: `
        <div class="marker-pickup-wrap">
          ${isSearching ? '<span class="radar-pulse-ring"></span>' : ''}
          <span class="marker-pickup-core"></span>
        </div>
      `,
      iconSize: [34, 34],
      iconAnchor: [17, 17],
    });
  }

  if (label === 'Drop') {
    return L.divIcon({
      className: 'custom-map-marker',
      html: `
        <div class="marker-drop-wrap">
          <span class="marker-drop-core"></span>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });
  }

  if (label === 'Driver' || label === 'You') {
    return L.divIcon({
      className: 'custom-map-marker',
      html: `
        <div class="marker-driver-wrap">
          ${getVehicleSvg(vehicleType || 'car')}
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    });
  }

  // Generic request or other points
  return L.divIcon({
    className: 'custom-map-marker',
    html: `
      <div class="flex items-center justify-center w-7 h-7 rounded-full bg-[#FFC400] text-[#14171A] border-2 border-[#14171A] font-bold text-xs shadow-md">
        📍
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

export default function MapView({
  markers = [],
  line,
  onClick,
  height = '100%',
  className = '',
  isSearching = false,
  vehicleType = 'car',
}) {
  const memoIcons = useMemo(() => {
    const map = new Map();
    markers.forEach((m) => {
      const key = `${m.label}-${isSearching}-${vehicleType}`;
      if (!map.has(key)) {
        map.set(key, createMarkerIcon({ label: m.label, isSearching, vehicleType: m.vehicleType || vehicleType }));
      }
    });
    return map;
  }, [markers, isSearching, vehicleType]);

  return (
    <div className={`relative h-full w-full overflow-hidden ${className}`} style={{ height: typeof height === 'number' ? `${height}px` : height }}>
      <MapContainer
        center={CENTER}
        zoom={13}
        zoomControl={false}
        style={{ height: '100%', width: '100%' }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />
        <Clicks onClick={onClick} />
        <Fit points={markers} />

        {line && (
          <>
            <Polyline
              positions={line}
              pathOptions={{
                color: '#FFC400',
                weight: 8,
                opacity: 0.6,
                lineCap: 'round',
                lineJoin: 'round',
              }}
            />
            <Polyline
              positions={line}
              pathOptions={{
                color: '#14171A',
                weight: 4,
                opacity: 0.95,
                lineCap: 'round',
                lineJoin: 'round',
              }}
            />
          </>
        )}

        {markers.map((m) => {
          const key = `${m.label}-${isSearching}-${vehicleType}`;
          const icon = memoIcons.get(key) || createMarkerIcon({ label: m.label, isSearching, vehicleType });
          return (
            <Marker key={m.label} position={[m.lat, m.lng]} icon={icon}>
              <Tooltip permanent direction="top" className="transit-tooltip">
                {m.label}
              </Tooltip>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
