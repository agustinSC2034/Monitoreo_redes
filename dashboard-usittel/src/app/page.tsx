/**
 * 🏠 Dashboard Principal - Monitoreo USITTEL Tandil
 * 
 * Muestra el estado en tiempo real de los 4 enlaces WAN principales:
 * - CABASE
 * - TECO
 * - IPLANxARSAT
 * - ARSAT CNO1
 * 
 * Se auto-actualiza cada 30 segundos
 */

'use client';

import { useEffect, useState } from 'react';

import MapView from '@/components/MapView';
import SensorCard from '@/components/SensorCard';

// 📦 Tipo de dato del sensor
interface Sensor {
  id: string;
  name: string;
  device: string;
  status: string;
  statusRaw: number;
  lastValue: string;
  lastCheck: string;
  message: string;
  priority: number;
}

// 📦 Tipo de respuesta de la API
interface ApiResponse {
  success: boolean;
  data: Sensor[];
  timestamp: string;
  count: number;
}

export default function Home() {
  // 🎯 Estado: sensores y loading
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  
  // 🗺️ Estado: tipo de vista (cards o map)
  const [viewMode, setViewMode] = useState<'cards' | 'map'>('cards');

  // 🔄 Función para obtener datos de la API
  const fetchSensors = async () => {
    try {
      const response = await fetch('/api/status');
      
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }
      
      const data: ApiResponse = await response.json();
      
      if (data.success) {
        setSensors(data.data);
        setLastUpdate(new Date().toLocaleTimeString('es-AR', { 
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        }));
        setError(null);
      } else {
        throw new Error('Error al obtener datos');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      console.error('Error al obtener sensores:', err);
    } finally {
      setLoading(false);
    }
  };

  // 🚀 Efecto: cargar datos al montar y cada 120 segundos (2 minutos)
  useEffect(() => {
    fetchSensors();
    
    // Auto-actualizar cada 120 segundos (2 minutos)
    const interval = setInterval(fetchSensors, 120000);
    
    // Limpiar intervalo al desmontar
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* 🎨 Header */}
      <header className="bg-white shadow-md">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Monitoreo USITTEL
              </h1>
              <p className="text-gray-600">Tandil - Enlaces WAN</p>
            </div>
            
            {/* 🔀 Toggle de Vista */}
            <div className="flex items-center gap-4">
              <div className="bg-gray-100 rounded-lg p-1 flex gap-1">
                <button
                  onClick={() => setViewMode('cards')}
                  className={`px-4 py-2 rounded-md font-medium transition-all flex items-center gap-2 ${
                    viewMode === 'cards'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <span>📊</span>
                  <span className="hidden sm:inline">Detalle</span>
                </button>
                <button
                  onClick={() => setViewMode('map')}
                  className={`px-4 py-2 rounded-md font-medium transition-all flex items-center gap-2 ${
                    viewMode === 'map'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <span>🗺️</span>
                  <span className="hidden sm:inline">Mapa</span>
                </button>
              </div>

              {/* Última actualización */}
              {lastUpdate && (
                <div className="text-right hidden md:block">
                  <p className="text-sm text-gray-500">Última actualización</p>
                  <p className="text-lg font-semibold text-gray-700">{lastUpdate}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 📊 Contenido principal */}
      <main className="container mx-auto px-4 py-8">
        
        {/* Estado de carga */}
        {loading && (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 text-lg">Cargando datos...</p>
            </div>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg mb-6">
            <p className="font-bold">Error al cargar datos</p>
            <p>{error}</p>
            <button 
              onClick={fetchSensors}
              className="mt-3 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* Contenido principal: Tarjetas y Gráficos o Mapa */}
        {!loading && !error && (
          <>
            {/* 🗺️ VISTA MAPA */}
            {viewMode === 'map' && (
              <div className="h-[calc(100vh-200px)] mb-8 -mx-4">
                <MapView sensors={sensors} />
              </div>
            )}

            {/* 📊 VISTA DETALLE (tarjetas + gráficos) */}
            {viewMode === 'cards' && (
              <>
                {/* Tarjetas de sensores - Layout en 5 columnas */}
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-8">
                  {sensors.map((sensor) => (
                    <SensorCard 
                      key={sensor.id}
                      {...sensor}
                    />
                  ))}
                </div>

                {/* 📈 Gráficos de PRTG - Grid de iframes */}
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 rounded-t-lg">
                    <h2 className="text-xl font-bold text-white">Gráficos Históricos (PRTG)</h2>
                    <p className="text-blue-100 text-sm">Últimas 24 horas de tráfico por sensor</p>
                  </div>
                  
                  {/* Grid de gráficos - Imágenes PNG de PRTG */}
                  <div className="grid grid-cols-1 gap-6 px-4">
                    {sensors.map((sensor) => (
                      <div key={sensor.id} className="bg-white rounded-lg shadow-lg overflow-hidden border-2 border-gray-100">
                        <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                          <h3 className="font-semibold text-gray-800">{sensor.name}</h3>
                        </div>
                        <div className="relative p-4 bg-white">
                          <img
                            src={`http://38.253.65.250:8080/chart.png?type=graph&graphid=0&id=${sensor.id}&width=1200&height=400&username=nocittel&passhash=413758319`}
                            alt={`Gráfico ${sensor.name}`}
                            className="w-full h-auto"
                            loading="lazy"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </>
        )}

      </main>

      {/* 📝 Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="container mx-auto px-4 py-6 text-center text-gray-600">
          <p>Dashboard USITTEL - Monitoreo en Tiempo Real</p>
          <p className="text-sm mt-2">
            Tarjetas: actualizadas cada 2 minutos | Gráficos: proporcionados por PRTG
          </p>
        </div>
      </footer>
    </div>
  );
}
