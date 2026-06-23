import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, FeatureGroup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import 'leaflet-draw';

// Fix for default Leaflet icon missing issues in webpack/vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// A component to control the map's view from outside
function MapController({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, zoom, { duration: 1.5 });
    }
  }, [center, zoom, map]);
  return null;
}

function DrawControlRaw({ onPolygonChange, initialPolygon }) {
  const map = useMap();
  const featureGroupRef = useRef(new L.FeatureGroup());

  useEffect(() => {
    const featureGroup = featureGroupRef.current;
    featureGroup.clearLayers();
    
    if (initialPolygon && Object.keys(initialPolygon).length > 0) {
      try {
        const geoJsonLayer = L.geoJSON(initialPolygon);
        geoJsonLayer.eachLayer((layer) => {
          featureGroup.addLayer(layer);
        });
        map.fitBounds(geoJsonLayer.getBounds(), { padding: [20, 20], maxZoom: 16 });
      } catch (err) {
        console.error('Error parsing initialPolygon:', err);
      }
    }
  }, [initialPolygon, map]);

  useEffect(() => {
    const featureGroup = featureGroupRef.current;
    map.addLayer(featureGroup);

    const drawControl = new L.Control.Draw({
      position: 'topright',
      edit: {
        featureGroup: featureGroup,
        remove: true
      },
      draw: {
        rectangle: false,
        circle: false,
        circlemarker: false,
        marker: false,
        polyline: false,
        polygon: {
          allowIntersection: false,
          drawError: { color: '#e1e100', message: '<strong>Hata:</strong> Kesişen poligon çizilemez!' },
          shapeOptions: { color: '#16a34a' }
        }
      }
    });
    map.addControl(drawControl);

    const handleCreated = (e) => {
      featureGroup.clearLayers();
      featureGroup.addLayer(e.layer);
      onPolygonChange(e.layer.toGeoJSON().geometry);
    };

    const handleEdited = (e) => {
      e.layers.eachLayer((layer) => {
        onPolygonChange(layer.toGeoJSON().geometry);
      });
    };

    const handleDeleted = () => {
      onPolygonChange(null);
    };

    map.on(L.Draw.Event.CREATED, handleCreated);
    map.on(L.Draw.Event.EDITED, handleEdited);
    map.on(L.Draw.Event.DELETED, handleDeleted);

    return () => {
      map.removeControl(drawControl);
      map.removeLayer(featureGroup);
      map.off(L.Draw.Event.CREATED, handleCreated);
      map.off(L.Draw.Event.EDITED, handleEdited);
      map.off(L.Draw.Event.DELETED, handleDeleted);
    };
  }, [map, onPolygonChange]);

  return null;
}

export default function MapPolygonSelector({ onPolygonChange, initialPolygon }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [mapCenter, setMapCenter] = useState([39.92077, 32.85411]);
  const [mapZoom, setMapZoom] = useState(6);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (data && data.length > 0) {
        setMapCenter([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
        setMapZoom(13); // Zoom in closer for a specific location
      } else {
        alert('Konum bulunamadı.');
      }
    } catch (err) {
      alert('Arama sırasında bir hata oluştu.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleFindMe = () => {
    if (!navigator.geolocation) {
      alert('Tarayıcınız konum özelliğini desteklemiyor.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setMapCenter([position.coords.latitude, position.coords.longitude]);
        setMapZoom(16); // Zoom very close for GPS
      },
      (error) => {
        alert('Konum alınamadı. Lütfen tarayıcıdan konum izni verdiğinizden emin olun.');
      }
    );
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex-1 flex shadow-sm rounded-md">
          <input 
            type="text" 
            placeholder="İl, ilçe veya köy ara (Örn: Çumra, Konya)" 
            className="input rounded-r-none border-r-0 focus:ring-0 focus:border-earth-400"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSearch())}
          />
          <button 
            type="button" 
            onClick={handleSearch} 
            disabled={isSearching}
            className="bg-earth-600 hover:bg-earth-700 text-white px-4 rounded-r-md transition-colors font-medium text-sm disabled:opacity-70 border border-earth-600"
          >
            {isSearching ? '...' : 'Ara'}
          </button>
        </div>
        <button 
          type="button" 
          onClick={handleFindMe}
          className="flex items-center justify-center gap-2 bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 px-4 py-2 rounded-md transition-colors text-sm font-medium whitespace-nowrap shadow-sm"
        >
          📍 Konumumu Bul
        </button>
      </div>

      <div className="h-72 w-full rounded-md overflow-hidden border border-earth-300 relative z-0">
        <MapContainer center={mapCenter} zoom={mapZoom} style={{ height: '100%', width: '100%' }}>
          <MapController center={mapCenter} zoom={mapZoom} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          />
          <DrawControlRaw onPolygonChange={onPolygonChange} initialPolygon={initialPolygon} />
        </MapContainer>
      </div>
    </div>
  );
}
