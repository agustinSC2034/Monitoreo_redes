/**
 * 🗺️ Vista de Mapa de Red - PRTG Original
 * 
 * Carga directamente el mapa interactivo de PRTG en un iframe
 * URL: http://38.253.65.250:8080/public/mapshow.htm?id=2197&mapid=7418EC41-A903-47CF-87A2-70E6CC8AAFF5
 */

'use client';

interface MapViewProps {
  sensors: any[]; // No se usa pero mantenemos compatibilidad con page.tsx
}

export default function MapView({ sensors }: MapViewProps) {
  const PRTG_MAP_URL = 'http://38.253.65.250:8080/public/mapshow.htm?id=2197&mapid=7418EC41-A903-47CF-87A2-70E6CC8AAFF5';

  return (
    <div className="w-full h-full bg-gradient-to-br from-gray-50 to-blue-50 relative -mx-4 px-0">
      {/* Iframe con el mapa de PRTG original - Ancho completo */}
      <iframe
        src={PRTG_MAP_URL}
        className="w-full h-full border-0"
        title="Mapa de Red PRTG - Grupo ITTEL Tandil"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        loading="eager"
      />
      
      {/* Indicador de carga opcional */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm px-6 py-2 rounded-full shadow-lg border border-gray-200 z-10 pointer-events-none">
        <p className="text-sm text-gray-600">🗺️ Mapa PRTG en vivo - Grupo ITTEL Tandil</p>
      </div>
    </div>
  );
}
