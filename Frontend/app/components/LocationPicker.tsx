import { useEffect, useState, useRef } from 'react';

interface LocationPickerProps {
  initialLat?: number;
  initialLng?: number;
  onLocationSelect: (lat: number, lng: number) => void;
  height?: string;
}

export function LocationPicker({
  initialLat = 6.2476, // Medellín por defecto
  initialLng = -75.5658,
  onLocationSelect,
  height = '400px'
}: LocationPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<[number, number]>([initialLat, initialLng]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  useEffect(() => {
    // Solo ejecutar en el cliente
    if (typeof window === 'undefined') return;

    let isMounted = true;

    const initMap = async () => {
      try {
        // Importar Leaflet dinámicamente
        const L = await import('leaflet');
        
        // Fix para iconos de Leaflet
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
          iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        });

        if (!mapRef.current || !isMounted) return;

        // Crear mapa
        const map = L.map(mapRef.current).setView(position, 13);
        mapInstanceRef.current = map;

        // Agregar capa de tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19,
        }).addTo(map);

        // Agregar marcador inicial
        const marker = L.marker(position, { draggable: true }).addTo(map);
        markerRef.current = marker;

        marker.bindPopup(`
          <div style="padding: 8px;">
            <p style="margin: 0; font-weight: bold; font-size: 14px;">Ubicación seleccionada</p>
            <p style="margin: 4px 0 0 0; font-size: 12px; color: #666;">
              Lat: ${position[0].toFixed(6)}<br/>
              Lng: ${position[1].toFixed(6)}
            </p>
          </div>
        `).openPopup();

        // Evento click en el mapa
        map.on('click', (e: any) => {
          const { lat, lng } = e.latlng;
          const newPosition: [number, number] = [lat, lng];
          
          setPosition(newPosition);
          marker.setLatLng(newPosition);
          marker.bindPopup(`
            <div style="padding: 8px;">
              <p style="margin: 0; font-weight: bold; font-size: 14px;">Ubicación seleccionada</p>
              <p style="margin: 4px 0 0 0; font-size: 12px; color: #666;">
                Lat: ${lat.toFixed(6)}<br/>
                Lng: ${lng.toFixed(6)}
              </p>
            </div>
          `).openPopup();
          
          onLocationSelect(lat, lng);
        });

        // Evento drag del marcador
        marker.on('dragend', () => {
          const newPos = marker.getLatLng();
          const newPosition: [number, number] = [newPos.lat, newPos.lng];
          
          setPosition(newPosition);
          marker.bindPopup(`
            <div style="padding: 8px;">
              <p style="margin: 0; font-weight: bold; font-size: 14px;">Ubicación seleccionada</p>
              <p style="margin: 4px 0 0 0; font-size: 12px; color: #666;">
                Lat: ${newPos.lat.toFixed(6)}<br/>
                Lng: ${newPos.lng.toFixed(6)}
              </p>
            </div>
          `).openPopup();
          
          onLocationSelect(newPos.lat, newPos.lng);
        });

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

    // Cleanup
    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }
    };
  }, []); // Solo inicializar una vez

  // Estado de error
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
      </div>
    );
  }

  // Estado de carga
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
    <div>
      <div className="mb-2 text-sm text-gray-600 bg-blue-50 p-3 rounded-lg border border-blue-200">
        <div className="flex items-start gap-2">
          <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="font-medium text-blue-900">💡 Cómo seleccionar ubicación:</p>
            <ul className="mt-1 text-xs space-y-1">
              <li>• Haz clic en el mapa para colocar el marcador</li>
              <li>• Arrastra el marcador para ajustar la posición</li>
            </ul>
          </div>
        </div>
      </div>
      
      <div 
        ref={mapRef} 
        style={{ height }} 
        className="rounded-lg overflow-hidden border-2 border-gray-300 shadow-sm"
      />

      {/* Mostrar coordenadas seleccionadas */}
      <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-sm font-medium text-blue-900 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          📍 Coordenadas: {position[0].toFixed(6)}, {position[1].toFixed(6)}
        </p>
      </div>
    </div>
  );
}
