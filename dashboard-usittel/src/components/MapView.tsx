/**
 * 🗺️ Vista de Mapa de Red - Solución Híbrida
 * 
 * Intenta cargar el mapa via iframe, si falla muestra botón directo
 */

'use client';

import { useState } from 'react';

interface MapViewProps {
  sensors: any[];
}

export default function MapView({ sensors }: MapViewProps) {
  const [iframeError, setIframeError] = useState(false);
  const DIRECT_MAP_URL = 'http://38.253.65.250:8080/public/mapshow.htm?id=2197&mapid=7418EC41-A903-47CF-87A2-70E6CC8AAFF5';

  // Si hay error, mostrar botón directo
  if (iframeError) {
    return (
      <div className="w-full h-full px-4">
        <div className="relative h-full bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl shadow-2xl overflow-hidden border border-gray-200 flex items-center justify-center">
          <div className="text-center max-w-2xl px-8">
            <div className="mb-8">
              <span className="text-7xl block mb-4">🗺️</span>
              <h2 className="text-3xl font-bold text-gray-800 mb-3">
                Mapa de Red PRTG
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                Grupo ITTEL Tandil - Visualización en tiempo real
              </p>
            </div>

            <a
              href={DIRECT_MAP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            >
              <span className="text-2xl">🔗</span>
              <span>Abrir Mapa Interactivo de PRTG</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>

            <div className="mt-8 pt-8 border-t border-gray-300">
              <p className="text-sm text-gray-500 mb-4">
                El mapa se abrirá en una nueva ventana con acceso directo al servidor PRTG
              </p>
              
              <div className="grid grid-cols-3 gap-4 mt-6">
                <div className="bg-white/70 rounded-lg p-4 backdrop-blur-sm">
                  <div className="text-2xl font-bold text-blue-600">
                    {sensors.filter(s => s.status === 'Up').length}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">Sensores Online</div>
                </div>
                <div className="bg-white/70 rounded-lg p-4 backdrop-blur-sm">
                  <div className="text-2xl font-bold text-red-600">
                    {sensors.filter(s => s.status === 'Down').length}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">Sensores Offline</div>
                </div>
                <div className="bg-white/70 rounded-lg p-4 backdrop-blur-sm">
                  <div className="text-2xl font-bold text-yellow-600">
                    {sensors.filter(s => s.status === 'Warning').length}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">Con Advertencias</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full px-4">
      <div className="relative h-full bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200">
        <iframe
          src={DIRECT_MAP_URL}
          className="w-full h-full border-0"
          title="Mapa de Red PRTG - Grupo ITTEL Tandil"
          onError={() => setIframeError(true)}
          loading="eager"
        />
        
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
