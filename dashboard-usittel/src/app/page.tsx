/**
 * Dashboard Principal - Monitoreo ITTEL
 * Diseño minimalista y profesional
 */

'use client';

import { useEffect, useState } from 'react';

import MapView from '@/components/MapView';
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
  const [viewMode, setViewMode] = useState<'cards' | 'map'>('cards');
  const [location, setLocation] = useState<'tandil' | 'matanza'>('tandil');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [graphTimestamp, setGraphTimestamp] = useState<number>(Date.now());
  const [currentTime, setCurrentTime] = useState<string>('');

  // Cargar y guardar tema
  useEffect(() => {
    const savedTheme = localStorage.getItem('dashboard-theme') as 'light' | 'dark' | null;
    if (savedTheme) setTheme(savedTheme);
  }, []);

  useEffect(() => {
    localStorage.setItem('dashboard-theme', theme);
  }, [theme]);

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

  // Obtener datos de la API
  const fetchSensors = async () => {
    try {
      const response = await fetch('/api/status');
      
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

  // Auto-actualización cada 2 minutos
  useEffect(() => {
    fetchSensors();
    const interval = setInterval(fetchSensors, 120000);
    return () => clearInterval(interval);
  }, []);

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
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo y título */}
            <div className="flex items-center gap-4">
              <div className={`text-2xl font-light ${
                theme === 'light' ? 'text-gray-900' : 'text-white'
              }`}>
                ITTEL Monitoreo
              </div>
              <div className={`hidden sm:flex items-center gap-2 text-sm ${
                theme === 'light' ? 'text-gray-500' : 'text-gray-400'
              }`}>
                <span className="w-1 h-1 rounded-full bg-current"></span>
                <span>{location === 'tandil' ? 'USITTEL Tandil' : 'LARANET La Matanza'}</span>
              </div>
            </div>
            
            {/* Controles */}
            <div className="flex items-center gap-3">
              {/* Selector de ubicación */}
              <div className={`flex rounded-md overflow-hidden border ${
                theme === 'light' ? 'border-gray-300' : 'border-gray-600'
              }`}>
                <button
                  onClick={() => setLocation('tandil')}
                  className={`px-4 py-2 text-sm transition-colors ${
                    location === 'tandil'
                      ? theme === 'light'
                        ? 'bg-gray-900 text-white'
                        : 'bg-white text-gray-900'
                      : theme === 'light'
                        ? 'bg-white text-gray-700 hover:bg-gray-50'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  Tandil
                </button>
                <button
                  onClick={() => setLocation('matanza')}
                  className={`px-4 py-2 text-sm transition-colors border-l ${
                    theme === 'light' ? 'border-gray-300' : 'border-gray-600'
                  } ${
                    location === 'matanza'
                      ? theme === 'light'
                        ? 'bg-gray-900 text-white'
                        : 'bg-white text-gray-900'
                      : theme === 'light'
                        ? 'bg-white text-gray-700 hover:bg-gray-50'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  La Matanza
                </button>
              </div>
              
              {/* Vista */}
              <div className={`flex rounded-md overflow-hidden border ${
                theme === 'light' ? 'border-gray-300' : 'border-gray-600'
              }`}>
                <button
                  onClick={() => setViewMode('cards')}
                  className={`px-4 py-2 text-sm transition-colors ${
                    viewMode === 'cards'
                      ? theme === 'light'
                        ? 'bg-gray-900 text-white'
                        : 'bg-white text-gray-900'
                      : theme === 'light'
                        ? 'bg-white text-gray-700 hover:bg-gray-50'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  Detalle
                </button>
                <button
                  onClick={() => setViewMode('map')}
                  className={`px-4 py-2 text-sm transition-colors border-l ${
                    theme === 'light' ? 'border-gray-300' : 'border-gray-600'
                  } ${
                    viewMode === 'map'
                      ? theme === 'light'
                        ? 'bg-gray-900 text-white'
                        : 'bg-white text-gray-900'
                      : theme === 'light'
                        ? 'bg-white text-gray-700 hover:bg-gray-50'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  Mapa
                </button>
              </div>
              
              <NotificationBell />
              
              {/* Tema - más estrecho con icono minimalista */}
              <button
                onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                className={`px-2 py-2 rounded-md border transition-colors ${
                  theme === 'light'
                    ? 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                    : 'bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700'
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
          
          {/* Info bar */}
          <div className={`mt-3 flex items-center gap-6 text-xs ${
            theme === 'light' ? 'text-gray-500' : 'text-gray-400'
          }`}>
            <span>Hora actual: {currentTime}</span>
            {lastUpdate && <span>Última actualización: {lastUpdate}</span>}
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="container mx-auto px-6 py-8">
        
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
              className={`mt-3 px-4 py-2 rounded-md text-sm ${
                theme === 'light'
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-red-700 hover:bg-red-600 text-white'
              }`}
            >
              Reintentar
            </button>
          </div>
        )}

        {!loading && !error && location === 'tandil' && (
          <>
            {viewMode === 'map' && (
              <div className="h-[calc(100vh-200px)] -mx-6">
                <MapView sensors={sensors} />
              </div>
            )}

            {viewMode === 'cards' && (
              <>
                {/* Grid de sensores */}
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
                  {sensors.map((sensor) => (
                    <SensorCard 
                      key={sensor.id}
                      {...sensor}
                      theme={theme}
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
                          src={`http://38.253.65.250:8080/chart.png?type=graph&graphid=0&id=${sensor.id}&width=1200&height=400&username=nocittel&passhash=413758319&_=${graphTimestamp}`}
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
            )}
          </>
        )}

        {!loading && !error && location === 'matanza' && (
          <div className={`rounded-lg border text-center py-16 ${
            theme === 'light'
              ? 'bg-white border-gray-200'
              : 'bg-gray-800 border-gray-700'
          }`}>
            <div className={`text-sm ${
              theme === 'light' ? 'text-gray-600' : 'text-gray-400'
            }`}>
              Sistema LARANET La Matanza en configuración
            </div>
          </div>
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
