// src/pages/MapPage.jsx
import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

// tile layer options
const MAP_LAYERS = {
  OSM: {
    key: 'OSM',
    name: 'OpenStreetMap',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
  },
  CartoLight: {
    key: 'CartoLight',
    name: 'Carto Light',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; CartoDB',
  },
  CartoDark: {
    key: 'CartoDark',
    name: 'Carto Dark',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; CartoDB',
  },
  StamenToner: {
    key: 'StamenToner',
    name: 'Stamen Toner',
    url: 'https://stamen-tiles.a.ssl.fastly.net/toner/{z}/{x}/{y}.png',
    attribution: '&copy; Stamen',
  },
  StamenWatercolor: {
    key: 'StamenWatercolor',
    name: 'Watercolor',
    url: 'https://stamen-tiles.a.ssl.fastly.net/watercolor/{z}/{x}/{y}.jpg',
    attribution: '&copy; Stamen',
  },
};

// leaflet icon fix
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// small locate component (centers map to user's location)
function Locate({ setCenter }) {
  const map = useMap();
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        map.setView([latitude, longitude], 13);
        setCenter({ lat: latitude, lng: longitude });
      },
      (err) => console.warn('geolocation err', err),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [map, setCenter]);
  return null;
}

export default function MapPage() {
  const { user, logout } = useAuth();

  // layout & map state
  const [center, setCenter] = useState({ lat: 20.5937, lng: 78.9629 });
  const [zoom, setZoom] = useState(5);
  const [markers, setMarkers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [layerKey, setLayerKey] = useState('OSM'); // selected base layer

  // map instance ref
  const mapRef = useRef(null);
  const [mounted, setMounted] = useState(false);

  // mount guard (avoids SSR/hydration/StrictMode races)
  useEffect(() => {
    const id = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(id);
  }, []);

  // cleanup Leaflet map on unmount
  useEffect(() => {
    return () => {
      try {
        if (mapRef.current) {
          mapRef.current.remove();
          mapRef.current = null;
        }
        if (typeof window !== 'undefined') {
          window.__leaflet_map_instance = null;
        }
      } catch (err) {
        /* ignore */
      }
    };
  }, []);

  // fetch markers near center (5 km)
  const fetchMarkers = async (lat, lng) => {
    setLoading(true);
    try {
      const res = await api.get('/map/markers', { params: { lat, lng, radius: 5 } });
      setMarkers(res.data.markers || []);
    } catch (err) {
      console.error('fetch markers error', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (center.lat && center.lng) fetchMarkers(center.lat, center.lng);
  }, [center.lat, center.lng]);

  const handleMapCreated = (mapInstance) => {
    // defensive: remove any previous instance
    try {
      if (typeof window !== 'undefined') {
        const prev = window.__leaflet_map_instance;
        if (prev && prev !== mapInstance) {
          try { prev.remove(); } catch (e) {}
        }
        window.__leaflet_map_instance = mapInstance;
      }
    } catch (err) {
      // ignore
    }

    if (mapRef.current && mapRef.current !== mapInstance) {
      try { mapRef.current.remove(); } catch (e) {}
    }
    mapRef.current = mapInstance;

    // sync zoom state when map changes
    mapInstance.on('zoomend', () => {
      setZoom(mapInstance.getZoom());
    });

    mapInstance.on('moveend', () => {
      const c = mapInstance.getCenter();
      setCenter({ lat: c.lat, lng: c.lng });
    });
  };

  // custom zoom in/out handlers
  const zoomIn = () => {
    if (!mapRef.current) return;
    const z = mapRef.current.getZoom();
    mapRef.current.setZoom(z + 1);
  };
  const zoomOut = () => {
    if (!mapRef.current) return;
    const z = mapRef.current.getZoom();
    mapRef.current.setZoom(z - 1);
  };

  // change base layer (just switching state to re-render TileLayer)
  const onChangeLayer = (e) => setLayerKey(e.target.value);

  if (!mounted) {
    // placeholder box while client mount happens
    return <div className="min-h-[600px] flex items-center justify-center">Loading map...</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-4xl bg-white rounded-lg shadow-lg p-4">
        {/* header: user + controls */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="text-sm font-medium">Hello, {user?.phone || 'User'}</div>
            <button onClick={logout} className="text-sm text-red-600 hover:underline">Logout</button>
          </div>

          <div className="flex items-center gap-3">
            {/* layer selector */}
            <select
              value={layerKey}
              onChange={onChangeLayer}
              className="px-3 py-1 border rounded bg-white"
              aria-label="Map style"
            >
              {Object.values(MAP_LAYERS).map((l) => (
                <option key={l.key} value={l.key}>{l.name}</option>
              ))}
            </select>

            {/* zoom controls */}
            <div className="inline-flex flex-col border rounded overflow-hidden">
              <button onClick={zoomIn} className="px-3 py-1 hover:bg-gray-100">＋</button>
              <button onClick={zoomOut} className="px-3 py-1 hover:bg-gray-100">－</button>
            </div>

            <div className="text-sm text-gray-600">Zoom: {zoom}</div>
          </div>
        </div>

        {/* map box - medium size */}
        <div className="w-full h-[600px] rounded overflow-hidden border">
          <MapContainer
            center={[center.lat, center.lng]}
            zoom={zoom}
            style={{ height: '100%', width: '100%' }}
            whenCreated={handleMapCreated}
            zoomControl={false} // hide default control because we provide our own
          >
            <TileLayer
              key={layerKey} // re-create layer when key changes
              url={MAP_LAYERS[layerKey].url}
              attribution={MAP_LAYERS[layerKey].attribution}
            />
            <Locate setCenter={setCenter} />
            {markers.map((m) => (
              <Marker
                key={m._id}
                position={[m.location.coordinates[1], m.location.coordinates[0]]}
              >
                <Popup>
                  <div>
                    <h3 className="font-bold">{m.title}</h3>
                    <p>{m.description}</p>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        {/* optional footer */}
        <div className="mt-3 text-sm text-gray-500">
          Showing markers near {center.lat.toFixed(4)}, {center.lng.toFixed(4)} — {loading ? 'Loading...' : `${markers.length} markers`}
        </div>
      </div>
    </div>
  );
}
