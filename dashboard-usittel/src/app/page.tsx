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
  
  // 🏢 Estado: localidad seleccionada (Tandil o Matanza)
  const [location, setLocation] = useState<'tandil' | 'matanza'>('tandil');
  
  // ⏰ Estado: timestamp para forzar actualización de gráficos
  const [graphTimestamp, setGraphTimestamp] = useState<number>(Date.now());

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
        // Actualizar timestamp de gráficos para forzar recarga
        setGraphTimestamp(Date.now());
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
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {location === 'tandil' ? 'Monitoreo USITTEL' : 'Monitoreo LARANET'}
              </h1>
              <p className="text-gray-600">
                {location === 'tandil' ? 'Tandil - Enlaces WAN' : 'La Matanza - Enlaces WAN'}
              </p>
            </div>
            
            {/* 🏢 Selector de Localidad */}
            <div className="flex items-center gap-4">
              <div className={`rounded-lg p-1 flex gap-1 ${
                location === 'tandil' ? 'bg-blue-100' : 'bg-purple-100'
              }`}>
                <button
                  onClick={() => setLocation('tandil')}
                  className={`px-5 py-2 rounded-md font-semibold transition-all ${
                    location === 'tandil'
                      ? 'bg-green-600 text-white shadow-md'
                      : 'text-gray-700 hover:bg-white/50'
                  }`}
                >
                  USITTEL
                </button>
                <button
                  onClick={() => setLocation('matanza')}
                  className={`px-5 py-2 rounded-md font-semibold transition-all ${
                    location === 'matanza'
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'text-gray-700 hover:bg-white/50'
                  }`}
                >
                  LARANET
                </button>
              </div>
              
              {/* 🔀 Toggle de Vista */}
              <div className="bg-gray-100 rounded-lg p-1 flex gap-1">
                <button
                  onClick={() => setViewMode('cards')}
                  className={`px-4 py-2 rounded-md font-medium transition-all flex items-center gap-2 ${
                    viewMode === 'cards'
                      ? `${location === 'tandil' ? 'bg-blue-600' : 'bg-purple-600'} text-white shadow-md`
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
                      ? `${location === 'tandil' ? 'bg-blue-600' : 'bg-purple-600'} text-white shadow-md`
                      : 'text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <span>🗺️</span>
                  <span className="hidden sm:inline">Mapa</span>
                </button>
              </div>

              {/* Última actualización */}
              {lastUpdate && (
                <div className="text-right hidden lg:block">
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
            {/* ========================================
                 🏔️ TANDIL - USITTEL
                ======================================== */}
            {location === 'tandil' && (
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
                                src={`http://38.253.65.250:8080/chart.png?type=graph&graphid=0&id=${sensor.id}&width=1200&height=400&username=nocittel&passhash=413758319&_=${graphTimestamp}`}
                                alt={`Gráfico ${sensor.name}`}
                                className="w-full h-auto"
                                loading="lazy"
                                key={graphTimestamp}
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

            {/* ========================================
                 🏙️ MATANZA - LARANET
                ======================================== */}
            {location === 'matanza' && (
              <>
                {/* 🗺️ VISTA MAPA - MATANZA */}
                {viewMode === 'map' && (
                  <div className="h-[calc(100vh-200px)] mb-8 -mx-4 bg-white rounded-lg shadow-lg flex items-center justify-center">
                    <div className="text-center p-12">
                      <div className="text-6xl mb-4">🏙️</div>
                      <h3 className="text-2xl font-bold text-gray-800 mb-2">Mapa de Matanza</h3>
                      <p className="text-gray-600">Próximamente: Vista de mapa para LaraNet Matanza</p>
                    </div>
                  </div>
                )}

                {/* 📊 VISTA DETALLE - MATANZA */}
                {viewMode === 'cards' && (
                  <div className="space-y-6">
                    {/* Banner informativo */}
                    <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg shadow-xl p-8 text-white text-center">
                      <div className="text-5xl mb-4">🏙️</div>
                      <h2 className="text-3xl font-bold mb-2">LaraNet Matanza</h2>
                      <p className="text-purple-100 text-lg">Sistema de monitoreo en configuración</p>
                    </div>

                    {/* Grid de tarjetas placeholder */}
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                        <div key={i} className="bg-white rounded-xl shadow-lg p-6 border-2 border-purple-200 animate-pulse">
                          <div className="flex items-center justify-between mb-4">
                            <div className="h-6 bg-gray-200 rounded w-32"></div>
                            <div className="w-4 h-4 rounded-full bg-gray-300"></div>
                          </div>
                          <div className="h-4 bg-gray-200 rounded w-24 mb-4"></div>
                          <div className="h-10 bg-gray-200 rounded w-full mb-4"></div>
                          <div className="h-4 bg-gray-200 rounded w-full"></div>
                        </div>
                      ))}
                    </div>

                    {/* Sección de gráficos placeholder */}
                    <div className="space-y-6 mt-8">
                      <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4 rounded-t-lg">
                        <h2 className="text-xl font-bold text-white">Gráficos Históricos</h2>
                        <p className="text-purple-100 text-sm">Datos de sensores LaraNet - Próximamente</p>
                      </div>
                      
                      <div className="grid grid-cols-1 gap-6 px-4">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                          <div key={i} className="bg-white rounded-lg shadow-lg overflow-hidden border-2 border-purple-100">
                            <div className="bg-purple-50 px-4 py-2 border-b border-purple-200">
                              <div className="h-6 bg-purple-200 rounded w-48 animate-pulse"></div>
                            </div>
                            <div className="relative p-4 bg-gray-50 h-96 flex items-center justify-center">
                              <div className="text-center">
                                <div className="text-4xl mb-3">📊</div>
                                <p className="text-gray-500 font-medium">Gráfico {i}</p>
                                <p className="text-gray-400 text-sm">En configuración</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}

      </main>

      {/* 📝 Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="container mx-auto px-4 py-6 text-center text-gray-600">
          <p className="font-semibold">
            {location === 'tandil' ? 'Dashboard USITTEL' : 'Dashboard LARANET'} - Monitoreo en Tiempo Real
          </p>
          <p className="text-sm mt-2">
            {location === 'tandil' 
              ? 'Tarjetas: actualizadas cada 2 minutos | Gráficos: proporcionados por PRTG'
              : 'Sistema LaraNet en configuración - Próximamente datos en tiempo real'
            }
          </p>
        </div>
      </footer>
    </div>
  );
}
