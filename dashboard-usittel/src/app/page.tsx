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
  
  // 🌓 Estado: tema (light o dark)
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  
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
        // Restar 3 horas a la hora actual para ajustar la zona horaria
        const now = new Date();
        now.setHours(now.getHours() - 3);
        setLastUpdate(now.toLocaleTimeString('es-AR', { 
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
    <div className={`min-h-screen transition-colors duration-300 ${
      theme === 'light' 
        ? 'bg-gradient-to-br from-blue-50 to-indigo-100' 
        : 'bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900'
    }`}>
      {/* 🎨 Header */}
      <header className={`shadow-md transition-colors duration-300 relative ${
        theme === 'light' ? 'bg-white' : 'bg-gray-800 border-b border-gray-700'
      }`}>
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className={`text-3xl font-bold transition-colors duration-300 ${
                theme === 'light' ? 'text-gray-900' : 'text-white'
              }`}>
                {location === 'tandil' ? 'Monitoreo USITTEL' : 'Monitoreo LARANET'}
              </h1>
              <p className={`transition-colors duration-300 ${
                theme === 'light' ? 'text-gray-600' : 'text-gray-300'
              }`}>
                {location === 'tandil' ? 'Tandil - Enlaces WAN' : 'La Matanza - Enlaces WAN'}
              </p>
              {/* Última actualización debajo del subtítulo */}
              {lastUpdate && (
                <p className={`text-xs mt-1 transition-colors duration-300 ${
                  theme === 'light' ? 'text-gray-500' : 'text-gray-400'
                }`}>
                  Última actualización: {lastUpdate}
                </p>
              )}
            </div>
            
            {/* 🏢 Selectores centrados */}
            <div className="flex items-center gap-4">
              <div className={`rounded-lg p-1 flex gap-1 transition-colors duration-300 ${
                theme === 'light'
                  ? (location === 'tandil' ? 'bg-blue-100' : 'bg-purple-100')
                  : 'bg-gray-700'
              }`}>
                <button
                  onClick={() => setLocation('tandil')}
                  className={`px-5 py-2 rounded-md font-semibold transition-all ${
                    location === 'tandil'
                      ? 'bg-green-600 text-white shadow-md'
                      : theme === 'light'
                        ? 'text-gray-700 hover:bg-white/50'
                        : 'text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  USITTEL
                </button>
                <button
                  onClick={() => setLocation('matanza')}
                  className={`px-5 py-2 rounded-md font-semibold transition-all ${
                    location === 'matanza'
                      ? 'bg-purple-600 text-white shadow-md'
                      : theme === 'light'
                        ? 'text-gray-700 hover:bg-white/50'
                        : 'text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  LARANET
                </button>
              </div>
              
              {/* 🔀 Toggle de Vista */}
              <div className={`rounded-lg p-1 flex gap-1 transition-colors duration-300 ${
                theme === 'light' ? 'bg-gray-100' : 'bg-gray-700'
              }`}>
                <button
                  onClick={() => setViewMode('cards')}
                  className={`px-4 py-2 rounded-md font-medium transition-all flex items-center gap-2 ${
                    viewMode === 'cards'
                      ? `${location === 'tandil' ? 'bg-blue-600' : 'bg-purple-600'} text-white shadow-md`
                      : theme === 'light'
                        ? 'text-gray-600 hover:bg-gray-200'
                        : 'text-gray-300 hover:bg-gray-600'
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
                      : theme === 'light'
                        ? 'text-gray-600 hover:bg-gray-200'
                        : 'text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  <span>🗺️</span>
                  <span className="hidden sm:inline">Mapa</span>
                </button>
              </div>
              
              {/* 🌓 Toggle de Tema - Más pequeño y solo iconos */}
              <div className={`rounded-lg p-0.5 flex gap-0.5 transition-colors duration-300 ${
                theme === 'light' ? 'bg-gray-100' : 'bg-gray-700'
              }`}>
                <button
                  onClick={() => setTheme('light')}
                  className={`p-1.5 rounded-md text-sm transition-all ${
                    theme === 'light'
                      ? 'bg-gray-800 shadow-md'
                      : 'hover:bg-gray-600'
                  }`}
                  title="Tema claro"
                >
                  <span>☀️</span>
                </button>
                <button
                  onClick={() => setTheme('dark')}
                  className={`p-1.5 rounded-md text-sm transition-all ${
                    theme === 'dark'
                      ? 'bg-white shadow-md'
                      : 'hover:bg-gray-600'
                  }`}
                  title="Tema oscuro"
                >
                  <span>🌙</span>
                </button>
              </div>
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
              <div className={`animate-spin rounded-full h-16 w-16 border-b-4 mx-auto mb-4 ${
                location === 'tandil' ? 'border-blue-600' : 'border-purple-600'
              }`}></div>
              <p className={`text-lg transition-colors duration-300 ${
                theme === 'light' ? 'text-gray-600' : 'text-gray-300'
              }`}>Cargando datos...</p>
            </div>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className={`border px-6 py-4 rounded-lg mb-6 transition-colors duration-300 ${
            theme === 'light'
              ? 'bg-red-100 border-red-400 text-red-700'
              : 'bg-red-900/30 border-red-700 text-red-300'
          }`}>
            <p className="font-bold">Error al cargar datos</p>
            <p>{error}</p>
            <button 
              onClick={fetchSensors}
              className={`mt-3 px-4 py-2 rounded transition ${
                theme === 'light'
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-red-700 hover:bg-red-600 text-white'
              }`}
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
                          theme={theme}
                        />
                      ))}
                    </div>

                    {/* 📈 Gráficos de PRTG - Grid de iframes */}
                    <div className="space-y-6">
                      <div className={`px-6 py-4 rounded-t-lg transition-colors duration-300 ${
                        theme === 'light'
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600'
                          : 'bg-gradient-to-r from-blue-800 to-indigo-900 border border-blue-700'
                      }`}>
                        <h2 className="text-xl font-bold text-white">Gráficos Históricos (PRTG)</h2>
                        <p className={`text-sm ${theme === 'light' ? 'text-blue-100' : 'text-blue-200'}`}>
                          Últimas 2 horas de tráfico por sensor
                        </p>
                      </div>
                      
                      {/* Grid de gráficos - Imágenes PNG de PRTG */}
                      <div className="grid grid-cols-1 gap-6 px-4">
                        {sensors.map((sensor) => (
                          <div key={sensor.id} className={`rounded-lg shadow-lg overflow-hidden border-2 transition-colors duration-300 ${
                            theme === 'light'
                              ? 'bg-white border-gray-100'
                              : 'bg-gray-800 border-gray-700'
                          }`}>
                            <div className={`px-4 py-2 border-b transition-colors duration-300 ${
                              theme === 'light'
                                ? 'bg-gray-50 border-gray-200'
                                : 'bg-gray-700 border-gray-600'
                            }`}>
                              <h3 className={`font-semibold transition-colors duration-300 ${
                                theme === 'light' ? 'text-gray-800' : 'text-gray-200'
                              }`}>{sensor.name}</h3>
                            </div>
                            <div className={`relative p-4 transition-colors duration-300 ${
                              theme === 'light' ? 'bg-white' : 'bg-gray-800'
                            }`}>
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
                  <div className={`h-[calc(100vh-200px)] mb-8 -mx-4 rounded-lg shadow-lg flex items-center justify-center transition-colors duration-300 ${
                    theme === 'light' ? 'bg-white' : 'bg-gray-800 border border-gray-700'
                  }`}>
                    <div className="text-center p-12">
                      <div className="text-6xl mb-4">🏙️</div>
                      <h3 className={`text-2xl font-bold mb-2 transition-colors duration-300 ${
                        theme === 'light' ? 'text-gray-800' : 'text-gray-200'
                      }`}>Mapa de Matanza</h3>
                      <p className={`transition-colors duration-300 ${
                        theme === 'light' ? 'text-gray-600' : 'text-gray-400'
                      }`}>Próximamente: Vista de mapa para LaraNet Matanza</p>
                    </div>
                  </div>
                )}

                {/* 📊 VISTA DETALLE - MATANZA */}
                {viewMode === 'cards' && (
                  <div className="space-y-6">
                    {/* Banner informativo */}
                    <div className={`rounded-lg shadow-xl p-8 text-white text-center transition-colors duration-300 ${
                      theme === 'light'
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600'
                        : 'bg-gradient-to-r from-purple-800 to-pink-900 border border-purple-700'
                    }`}>
                      <div className="text-5xl mb-4">🏙️</div>
                      <h2 className="text-3xl font-bold mb-2">LaraNet Matanza</h2>
                      <p className={`text-lg ${theme === 'light' ? 'text-purple-100' : 'text-purple-200'}`}>
                        Sistema de monitoreo en configuración
                      </p>
                    </div>

                    {/* Grid de tarjetas placeholder */}
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                        <div key={i} className={`rounded-xl shadow-lg p-6 border-2 animate-pulse transition-colors duration-300 ${
                          theme === 'light'
                            ? 'bg-white border-purple-200'
                            : 'bg-gray-800 border-purple-700'
                        }`}>
                          <div className="flex items-center justify-between mb-4">
                            <div className={`h-6 rounded w-32 ${
                              theme === 'light' ? 'bg-gray-200' : 'bg-gray-700'
                            }`}></div>
                            <div className={`w-4 h-4 rounded-full ${
                              theme === 'light' ? 'bg-gray-300' : 'bg-gray-600'
                            }`}></div>
                          </div>
                          <div className={`h-4 rounded w-24 mb-4 ${
                            theme === 'light' ? 'bg-gray-200' : 'bg-gray-700'
                          }`}></div>
                          <div className={`h-10 rounded w-full mb-4 ${
                            theme === 'light' ? 'bg-gray-200' : 'bg-gray-700'
                          }`}></div>
                          <div className={`h-4 rounded w-full ${
                            theme === 'light' ? 'bg-gray-200' : 'bg-gray-700'
                          }`}></div>
                        </div>
                      ))}
                    </div>

                    {/* Sección de gráficos placeholder */}
                    <div className="space-y-6 mt-8">
                      <div className={`px-6 py-4 rounded-t-lg transition-colors duration-300 ${
                        theme === 'light'
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600'
                          : 'bg-gradient-to-r from-purple-800 to-pink-900 border border-purple-700'
                      }`}>
                        <h2 className="text-xl font-bold text-white">Gráficos Históricos</h2>
                        <p className={`text-sm ${theme === 'light' ? 'text-purple-100' : 'text-purple-200'}`}>
                          Datos de sensores LaraNet - Próximamente
                        </p>
                      </div>
                      
                      <div className="grid grid-cols-1 gap-6 px-4">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                          <div key={i} className={`rounded-lg shadow-lg overflow-hidden border-2 transition-colors duration-300 ${
                            theme === 'light'
                              ? 'bg-white border-purple-100'
                              : 'bg-gray-800 border-purple-700'
                          }`}>
                            <div className={`px-4 py-2 border-b transition-colors duration-300 ${
                              theme === 'light'
                                ? 'bg-purple-50 border-purple-200'
                                : 'bg-purple-900/30 border-purple-700'
                            }`}>
                              <div className={`h-6 rounded w-48 animate-pulse ${
                                theme === 'light' ? 'bg-purple-200' : 'bg-purple-700'
                              }`}></div>
                            </div>
                            <div className={`relative p-4 h-96 flex items-center justify-center transition-colors duration-300 ${
                              theme === 'light' ? 'bg-gray-50' : 'bg-gray-900'
                            }`}>
                              <div className="text-center">
                                <div className="text-4xl mb-3">📊</div>
                                <p className={`font-medium transition-colors duration-300 ${
                                  theme === 'light' ? 'text-gray-500' : 'text-gray-400'
                                }`}>Gráfico {i}</p>
                                <p className={`text-sm transition-colors duration-300 ${
                                  theme === 'light' ? 'text-gray-400' : 'text-gray-500'
                                }`}>En configuración</p>
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
      <footer className={`border-t mt-12 transition-colors duration-300 ${
        theme === 'light'
          ? 'bg-white border-gray-200'
          : 'bg-gray-800 border-gray-700'
      }`}>
        <div className={`container mx-auto px-4 py-6 text-center transition-colors duration-300 ${
          theme === 'light' ? 'text-gray-600' : 'text-gray-300'
        }`}>
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
