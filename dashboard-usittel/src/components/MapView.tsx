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
    <div className="w-full h-full px-4">
      {/* Contenedor con bordes redondeados y sombra */}
      <div className="relative h-full bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200">
        {/* Iframe con el mapa de PRTG original */}
        <iframe
          src={PRTG_MAP_URL}
          className="w-full h-full border-0"
          title="Mapa de Red PRTG - Grupo ITTEL Tandil"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          loading="eager"
        />
        
        {/* Header decorativo opcional */}
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-white/95 via-white/80 to-transparent backdrop-blur-sm px-6 py-3 z-10 pointer-events-none">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🗺️</span>
            <div>
              <p className="text-sm font-semibold text-gray-800">Mapa de Red PRTG</p>
              <p className="text-xs text-gray-600">Grupo ITTEL Tandil - En vivo</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
