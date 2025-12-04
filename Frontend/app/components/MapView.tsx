import { useEffect, useRef, useState } from 'react';

// Fix iconos
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

// El código que usa 'L' se mueve dentro del useEffect después de importar Leaflet

interface MapViewProps {
  latitud?: number;
  longitud?: number;
  direccion?: string;
  nombre?: string;
  height?: string;
  zoom?: number;
}

export function MapView({
  latitud,
  longitud,
  direccion,
  nombre,
  height = '400px',
  zoom = 15
}: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    // Verificar coordenadas
    if (!latitud || !longitud) {
      setError('Coordenadas no disponibles');
      setIsLoading(false);
      return;
    }

    // Solo ejecutar en el cliente
    if (typeof window === 'undefined') return;

    let isMounted = true;

    const initMap = async () => {
      try {
        const L = await import('leaflet');
        
    // Fix para iconos
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });

        // Definir el icono por defecto usando los imports locales
        const DefaultIcon = L.icon({
          iconUrl: icon,
          shadowUrl: iconShadow,
          iconSize: [25, 41],
          iconAnchor: [12, 41],
        });

        L.Marker.prototype.options.icon = DefaultIcon;

        if (!mapRef.current || !isMounted) return;

        const map = L.map(mapRef.current).setView([latitud, longitud], zoom);
        mapInstanceRef.current = map;

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19,
        }).addTo(map);

        const marker = L.marker([latitud, longitud]).addTo(map);

        if (nombre || direccion) {
          marker.bindPopup(`
            <div style="padding: 8px; max-width: 200px;">
              ${nombre ? `<h3 style="margin: 0 0 8px 0; font-weight: bold; font-size: 14px;">${nombre}</h3>` : ''}
              ${direccion ? `<p style="margin: 0; font-size: 12px; color: #666;">${direccion}</p>` : ''}
              <p style="margin: 8px 0 0 0; font-size: 11px; color: #999;">
                ${latitud.toFixed(6)}, ${longitud.toFixed(6)}
              </p>
            </div>
          `).openPopup();
        }

        if (isMounted) {
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Error inicializando mapa:', err);
        if (isMounted) {
          setError('Error al cargar el mapa');
          setIsLoading(false);
        }
      }
    };

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [latitud, longitud, nombre, direccion, zoom]);

  if (error) {
    return (
      <div 
        className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-500"
        style={{ height }}
      >
        <svg className="w-12 h-12 mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
        <p className="text-sm font-medium">{error}</p>
        {direccion && (
          <p className="text-xs mt-2 text-center max-w-xs">{direccion}</p>
        )}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div 
        className="bg-gray-50 rounded-lg flex items-center justify-center"
        style={{ height }}
      >
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-blue-600 mb-2"></div>
          <p className="text-sm text-gray-600">Cargando mapa...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={mapRef} 
      style={{ height }} 
      className="rounded-lg shadow-sm border-2 border-gray-200"
    />
  );
}

// ✅ Componente de Mapa Estático (para listas)
export function StaticMapPreview({
  latitud,
  longitud,
  width = 300,
  height = 200,
  zoom = 15
}: {
  latitud?: number;
  longitud?: number;
  width?: number;
  height?: number;
  zoom?: number;
}) {
  if (!latitud || !longitud) {
    return (
      <div 
        className="bg-gray-100 rounded-lg flex items-center justify-center"
        style={{ width, height }}
      >
        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
      </div>
    );
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY || '';
  const staticMapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${latitud},${longitud}&zoom=${zoom}&size=${width}x${height}&markers=color:red%7C${latitud},${longitud}&key=${apiKey}`;

  return (
    <img
      src={staticMapUrl}
      alt="Mapa de ubicación"
      className="rounded-lg object-cover"
      style={{ width, height }}
    />
  );
}
