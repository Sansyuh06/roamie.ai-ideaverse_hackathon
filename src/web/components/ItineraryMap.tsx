import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../lib/api';
import { MapPin } from 'lucide-react';

// Fix leaflet default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom numbered orange pin
function numberedIcon(num: number) {
  return L.divIcon({
    className: 'custom-pin',
    html: `<div style="background:#EF5C00;color:white;width:28px;height:28px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,0.3);border:2px solid white;"><span style="transform:rotate(45deg);font-size:12px;font-weight:700;font-family:sans-serif;">${num}</span></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28],
  });
}

interface PinData {
  lat: number;
  lng: number;
  title: string;
  location: string;
  time: string;
  num: number;
}

function FitBounds({ pins, center }: { pins: PinData[]; center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    if (pins.length > 0) {
      const bounds = L.latLngBounds(pins.map(p => [p.lat, p.lng] as [number, number]));
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    } else {
      map.setView(center, 11);
    }
  }, [pins, center, map]);
  return null;
}

export default function ItineraryMap({ destination, events }: { destination: string; events: any[] }) {
  const [center, setCenter] = useState<[number, number]>([20, 0]);
  const [pins, setPins] = useState<PinData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      // 1. Geocode the destination for the map center
      try {
        const { data } = await api.get(`/geocode/coords?q=${encodeURIComponent(destination)}`);
        if (!cancelled && data?.lat) setCenter([data.lat, data.lng]);
      } catch { /* ignore */ }

      // 2. Geocode each unique activity location (limit to avoid rate limits)
      const located: PinData[] = [];
      const seen = new Set<string>();
      let num = 1;
      for (const evt of events.slice(0, 8)) {
        const loc = evt.location || evt.title;
        if (!loc || seen.has(loc) || loc.toLowerCase().includes('transit')) continue;
        seen.add(loc);
        try {
          const query = `${loc}, ${destination}`;
          const { data } = await api.get(`/geocode/coords?q=${encodeURIComponent(query)}`);
          if (data?.lat) {
            located.push({ lat: data.lat, lng: data.lng, title: evt.title, location: loc, time: evt.time, num: num++ });
          }
        } catch { /* skip */ }
      }
      if (!cancelled) {
        setPins(located);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [destination, JSON.stringify(events.map((e: any) => e.location))]);

  return (
    <div className="relative w-full h-[320px] rounded-2xl overflow-hidden border border-border">
      {loading && (
        <div className="absolute inset-0 z-[500] bg-surface/70 backdrop-blur-sm flex items-center justify-center">
          <div className="text-center">
            <MapPin size={24} className="text-brand-primary mx-auto mb-2 animate-bounce" />
            <p className="text-xs font-medium text-text-secondary">Mapping locations…</p>
          </div>
        </div>
      )}
      <MapContainer center={center} zoom={11} style={{ height: '100%', width: '100%' }} zoomControl={true}>
        <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" attribution="© CARTO © OpenStreetMap" />
        <FitBounds pins={pins} center={center} />
        {pins.map((pin) => (
          <Marker key={pin.num} position={[pin.lat, pin.lng]} icon={numberedIcon(pin.num)}>
            <Popup>
              <div style={{ fontFamily: 'sans-serif' }}>
                <strong style={{ color: '#EF5C00' }}>{pin.time}</strong>
                <p style={{ margin: '2px 0', fontWeight: 600 }}>{pin.title}</p>
                <p style={{ margin: 0, fontSize: 12, color: '#666' }}>{pin.location}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      {!loading && pins.length > 0 && (
        <div className="absolute bottom-3 left-3 z-[500] bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-md text-xs font-bold text-text flex items-center gap-1.5">
          <MapPin size={12} className="text-brand-primary" /> {pins.length} stops mapped
        </div>
      )}
    </div>
  );
}
