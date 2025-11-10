/**
 * Dashboard Principal - Monitoreo ITTEL
 * Diseño minimalista y profesional
 */

'use client';

import { useEffect, useState } from 'react';

import NotificationBell from '@/components/NotificationBell';
import SensorCard from '@/components/SensorCard';

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

interface ApiResponse {
  success: boolean;
  data: Sensor[];
  timestamp: string;
  count: number;
}

export default function Home() {
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [location, setLocation] = useState<'tandil' | 'matanza'>('tandil');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [graphTimestamp, setGraphTimestamp] = useState<number>(Date.now());
  const [currentTime, setCurrentTime] = useState<string>('');
  const [globalUnit, setGlobalUnit] = useState<'kbit' | 'mbit'>('mbit'); // Estado global para sincronizar unidades
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dashboard-viewMode');
      console.log('🔍 Cargando viewMode desde localStorage:', saved);
      return (saved as 'grid' | 'list') || 'grid';
    }
    return 'grid';
  }); // Vista: grid (actual) o list (sensor+gráfico)

  // Cargar y guardar tema
  useEffect(() => {
    const savedTheme = localStorage.getItem('dashboard-theme') as 'light' | 'dark' | null;
    if (savedTheme) setTheme(savedTheme);
  }, []);

  useEffect(() => {
    localStorage.setItem('dashboard-theme', theme);
  }, [theme]);

  // Guardar modo de vista
  useEffect(() => {
    console.log('💾 Guardando viewMode:', viewMode);
    localStorage.setItem('dashboard-viewMode', viewMode);
  }, [viewMode]);

  // Actualizar hora cada segundo
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('es-AR', { 
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }));
    };
    
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // 🔔 Disparar chequeo de alertas al cargar el dashboard
  useEffect(() => {
    const checkAlerts = async () => {
      try {
        await fetch('/api/alerts/check-now');
        console.log('✅ Chequeo de alertas ejecutado');
      } catch (err) {
        console.error('❌ Error al chequear alertas:', err);
      }
    };
    
    // Ejecutar inmediatamente
    checkAlerts();
    
    // Y luego cada 2 minutos
    const interval = setInterval(checkAlerts, 120000);
    return () => clearInterval(interval);
  }, []);

  // Obtener datos de la API
  const fetchSensors = async () => {
    try {
      const response = await fetch(`/api/status?location=${location}`);
      
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }
      
      const data: ApiResponse = await response.json();
      
      if (data.success) {
        setSensors(data.data);
        const now = new Date();
        setLastUpdate(now.toLocaleTimeString('es-AR', { 
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        }));
        setError(null);
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

  // Auto-actualización cada 2 minutos - y cuando cambie la ubicación
  useEffect(() => {
    setLoading(true);
    fetchSensors();
    const interval = setInterval(fetchSensors, 120000);
    return () => clearInterval(interval);
  }, [location]); // ← Agregado location como dependencia

  return (
    <div className={`min-h-screen ${
      theme === 'light' 
        ? 'bg-gray-50' 
        : 'bg-gray-900'
    }`}>
      {/* Header limpio y minimalista */}
      <header className={`border-b ${
        theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700'
      }`}>
        <div className="container mx-auto px-3 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            {/* Logo y título */}
            <div className="flex items-center gap-2 sm:gap-4">
              <img 
                src="/favicon.png" 
                alt="ITTEL Logo" 
                className="w-8 h-8 sm:w-10 sm:h-10"
              />
              <div className={`text-lg sm:text-2xl font-light ${
                theme === 'light' ? 'text-gray-900' : 'text-white'
              }`}>
                ITTEL Monitoreo
                <span className={`text-sm ml-2 ${
                  theme === 'light' ? 'text-gray-500' : 'text-gray-400'
                }`}>
                  {location === 'tandil' ? '(Tandil)' : '(La Matanza)'}
                </span>
              </div>
            </div>
            
            {/* Controles */}
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              {/* Selector de ubicación */}
              <div className={`flex rounded-md overflow-hidden border text-xs sm:text-sm ${
                theme === 'light' ? 'border-gray-300' : 'border-gray-600'
              }`}>
                <button
                  onClick={() => setLocation('tandil')}
                  className={`px-2 sm:px-4 py-1.5 sm:py-2 transition-all duration-200 hover:scale-105 ${
                    location === 'tandil'
                      ? theme === 'light'
                        ? 'bg-gray-900 text-white hover:bg-gray-800'
                        : 'bg-white text-gray-900 hover:bg-gray-100'
                      : theme === 'light'
                        ? 'bg-white text-gray-700 hover:bg-gray-100'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-750'
                  }`}
                >
                  USITTEL
                </button>
                <button
                  onClick={() => setLocation('matanza')}
                  className={`px-2 sm:px-4 py-1.5 sm:py-2 transition-all duration-200 hover:scale-105 border-l ${
                    theme === 'light' ? 'border-gray-300' : 'border-gray-600'
                  } ${
                    location === 'matanza'
                      ? theme === 'light'
                        ? 'bg-gray-900 text-white hover:bg-gray-800'
                        : 'bg-white text-gray-900 hover:bg-gray-100'
                      : theme === 'light'
                        ? 'bg-white text-gray-700 hover:bg-gray-100'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-750'
                  }`}
                >
                  LARANET
                </button>
              </div>
              
              {/* Botón Mapa - Visible en mobile y desktop con color según ubicación */}
              <a
                href={location === 'tandil' 
                  ? "http://38.253.65.250:8080/public/mapshow.htm?id=2197&mapid=7418EC41-A903-47CF-87A2-70E6CC8AAFF5"
                  : "http://stats.reditel.com.ar:8995/public/mapshow.htm?id=3929&mapid=90D14EB2-69FC-4D98-A211-75BDECF55027"
                }
                target="_blank"
                rel="noopener noreferrer"
                className={`px-3 sm:px-4 py-1.5 sm:py-2 text-sm rounded-md border transition-all duration-200 hover:scale-105 inline-flex items-center gap-1.5 ${
                  location === 'tandil'
                    ? 'bg-green-100 text-green-800 border-green-300 hover:bg-green-200 hover:border-green-400'
                    : 'bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-200 hover:border-blue-400'
                }`}
              >
                <span>Mapa</span>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
              
              <NotificationBell />
              
              {/* Vista - Grid o Lista */}
              <button
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                className={`px-2 py-2 rounded-md border transition-all duration-200 hover:scale-110 ${
                  theme === 'light'
                    ? 'bg-white border-gray-300 text-gray-700 hover:bg-gray-100 hover:border-gray-400'
                    : 'bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-750 hover:border-gray-500'
                }`}
                aria-label="Cambiar vista"
                title={viewMode === 'grid' ? 'Vista lista' : 'Vista cuadrícula'}
              >
                {viewMode === 'grid' ? (
                  // Icono lista (sensor + gráfico)
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="8" y1="6" x2="21" y2="6" />
                    <line x1="8" y1="12" x2="21" y2="12" />
                    <line x1="8" y1="18" x2="21" y2="18" />
                    <line x1="3" y1="6" x2="3.01" y2="6" />
                    <line x1="3" y1="12" x2="3.01" y2="12" />
                    <line x1="3" y1="18" x2="3.01" y2="18" />
                  </svg>
                ) : (
                  // Icono grid (cuadrícula)
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="7" />
                    <rect x="14" y="3" width="7" height="7" />
                    <rect x="14" y="14" width="7" height="7" />
                    <rect x="3" y="14" width="7" height="7" />
                  </svg>
                )}
              </button>
              
              {/* Tema - más estrecho con icono minimalista */}
              <button
                onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                className={`px-2 py-2 rounded-md border transition-all duration-200 hover:scale-110 hover:rotate-12 ${
                  theme === 'light'
                    ? 'bg-white border-gray-300 text-gray-700 hover:bg-gray-100 hover:border-gray-400'
                    : 'bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-750 hover:border-gray-500'
                }`}
                aria-label="Cambiar tema"
                title={theme === 'light' ? 'Modo oscuro' : 'Modo claro'}
              >
                {theme === 'light' ? (
                  // Icono luna (modo oscuro) - solo líneas
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                  </svg>
                ) : (
                  // Icono sol (modo claro) - solo líneas
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="5" />
                    <line x1="12" y1="1" x2="12" y2="3" />
                    <line x1="12" y1="21" x2="12" y2="23" />
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                    <line x1="1" y1="12" x2="3" y2="12" />
                    <line x1="21" y1="12" x2="23" y2="12" />
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="container mx-auto px-3 sm:px-6 py-4 sm:py-8">
        
        {loading && (
          <div className="flex items-center justify-center h-64">
            <div className={`text-sm ${
              theme === 'light' ? 'text-gray-500' : 'text-gray-400'
            }`}>
              Cargando datos...
            </div>
          </div>
        )}

        {error && !loading && (
          <div className={`border rounded-lg px-6 py-4 ${
            theme === 'light'
              ? 'bg-red-50 border-red-200 text-red-700'
              : 'bg-red-900/20 border-red-800 text-red-300'
          }`}>
            <div className="text-sm">Error: {error}</div>
            <button 
              onClick={fetchSensors}
              className={`mt-3 px-4 py-2 rounded-md text-sm transition-all duration-200 hover:scale-105 ${
                theme === 'light'
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-red-700 hover:bg-red-600 text-white'
              }`}
            >
              Reintentar
            </button>
          </div>
        )}

        {!loading && !error && (
          <>
            {viewMode === 'grid' ? (
              // Vista Grid (actual): Todos los sensores arriba, todos los gráficos abajo
              <>
                {/* Grid de sensores */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4 mb-6 sm:mb-8">
                  {sensors.map((sensor) => (
                    <SensorCard 
                      key={sensor.id}
                      {...sensor}
                      theme={theme}
                      unit={globalUnit}
                      onUnitChange={setGlobalUnit}
                    />
                  ))}
                </div>

                {/* Gráficos */}
                <div className={`rounded-lg border overflow-hidden ${
                  theme === 'light'
                    ? 'bg-white border-gray-200'
                    : 'bg-gray-800 border-gray-700'
                }`}>
                  <div className={`px-6 py-4 border-b ${
                    theme === 'light' ? 'border-gray-200' : 'border-gray-700'
                  }`}>
                    <div className={`text-sm font-medium ${
                      theme === 'light' ? 'text-gray-900' : 'text-white'
                    }`}>
                      Gráficos históricos
                    </div>
                    <div className={`text-xs mt-1 ${
                      theme === 'light' ? 'text-gray-500' : 'text-gray-400'
                    }`}>
                      Últimas 2 horas de tráfico
                    </div>
                  </div>
                  
                  <div className="divide-y">
                    {sensors.map((sensor) => (
                      <div key={sensor.id} className={`p-6 ${
                        theme === 'light' ? 'divide-gray-200' : 'divide-gray-700'
                      }`}>
                        <div className={`text-sm mb-4 ${
                          theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                        }`}>
                          {sensor.name}
                        </div>
                        <img
                          src={`/api/chart-proxy?id=${sensor.id}&_=${graphTimestamp}`}
                          alt={`Gráfico ${sensor.name}`}
                          className="w-full h-auto"
                          loading="lazy"
                          key={graphTimestamp}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              // Vista List: Sensor + Gráfico lado a lado, uno por uno
              <div className="space-y-6">
                {sensors.map((sensor) => (
                  <div key={sensor.id} className={`rounded-lg border overflow-hidden ${
                    theme === 'light'
                      ? 'bg-white border-gray-200'
                      : 'bg-gray-800 border-gray-700'
                  }`}>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
                      {/* Sensor a la izquierda */}
                      <div className="lg:col-span-1">
                        <SensorCard 
                          {...sensor}
                          theme={theme}
                          unit={globalUnit}
                          onUnitChange={setGlobalUnit}
                        />
                      </div>
                      
                      {/* Gráfico a la derecha */}
                      <div className="lg:col-span-2">
                        <div className={`text-sm mb-4 font-medium ${
                          theme === 'light' ? 'text-gray-900' : 'text-white'
                        }`}>
                          {sensor.name} - Últimas 2 horas
                        </div>
                        <img
                          src={`/api/chart-proxy?id=${sensor.id}&_=${graphTimestamp}`}
                          alt={`Gráfico ${sensor.name}`}
                          className="w-full h-auto rounded"
                          loading="lazy"
                          key={graphTimestamp}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

      </main>

      {/* Footer minimalista */}
      <footer className={`border-t mt-12 ${
        theme === 'light'
          ? 'bg-white border-gray-200'
          : 'bg-gray-800 border-gray-700'
      }`}>
        <div className={`container mx-auto px-6 py-4 text-center text-xs ${
          theme === 'light' ? 'text-gray-500' : 'text-gray-400'
        }`}>
          Dashboard ITTEL - Monitoreo en tiempo real - Actualización automática cada 2 minutos
        </div>
      </footer>
    </div>
  );
}
