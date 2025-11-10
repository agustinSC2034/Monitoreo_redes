/**
 * Página de Historial de Alertas
 * Diseño minimalista y profesional
 */

'use client';

import { useEffect, useState } from 'react';

import Link from 'next/link';

interface Alert {
  id: number;
  rule_id: number;
  sensor_id: string;
  sensor_name: string;
  status: string;
  message?: string;
  channels_sent: string[];
  recipients: string[];
  timestamp?: number; // Unix timestamp en segundos
  triggered_at?: string; // ISO string (legacy)
  success: boolean;
}

export default function AlertasPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'success' | 'failed'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | '24h' | '7d' | '30d'>('all');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const savedTheme = localStorage.getItem('dashboard-theme') as 'light' | 'dark' | null;
    if (savedTheme) setTheme(savedTheme);
  }, []);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      const response = await fetch('/api/alerts/history?limit=100');
      const data = await response.json();
      
      if (data.success) {
        setAlerts(data.data);
      }
    } catch (error) {
      console.error('Error cargando alertas:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    // Filtro por estado
    if (filter === 'success' && !alert.success) return false;
    if (filter === 'failed' && alert.success) return false;
    
    // Filtro por fecha
    if (dateFilter !== 'all') {
      let alertTime: number;
      
      if (alert.timestamp) {
        // Unix timestamp en segundos → milisegundos
        alertTime = alert.timestamp * 1000;
      } else if (alert.triggered_at) {
        // ISO string
        const date = new Date(alert.triggered_at);
        if (isNaN(date.getTime())) return true;
        alertTime = date.getTime();
      } else {
        return true; // Sin timestamp, incluirla
      }
      
      const now = Date.now();
      const diffMs = now - alertTime;
      const diffHours = diffMs / (1000 * 60 * 60);
      
      if (dateFilter === '24h' && diffHours > 24) return false;
      if (dateFilter === '7d' && diffHours > 24 * 7) return false;
      if (dateFilter === '30d' && diffHours > 24 * 30) return false;
    }
    
    return true;
  });

  const getStatusIndicator = (status: string) => {
    if (status.toLowerCase().includes('down')) return '●';
    if (status.toLowerCase().includes('warning')) return '▲';
    return '✓';
  };

  const getStatusColor = (status: string) => {
    if (status.toLowerCase().includes('down')) return 'text-red-500';
    if (status.toLowerCase().includes('warning')) return 'text-yellow-500';
    return 'text-green-500';
  };

  return (
    <div className={`min-h-screen ${
      theme === 'light' ? 'bg-gray-50' : 'bg-gray-900'
    }`}>
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/"
            className={`inline-block text-sm mb-4 ${
              theme === 'light'
                ? 'text-gray-600 hover:text-gray-900'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            ← Volver al Dashboard
          </Link>
          
          <div className="flex items-center justify-between mb-2">
            <h1 className={`text-2xl font-light ${
              theme === 'light' ? 'text-gray-900' : 'text-white'
            }`}>
              Historial de Alertas
            </h1>
            
            <Link
              href="/dashboard/alertas/configuracion"
              className={`px-4 py-2 rounded-md border text-sm transition-all duration-200 hover:scale-105 ${
                theme === 'light'
                  ? 'bg-white border-gray-300 text-gray-700 hover:bg-gray-100 hover:border-gray-400'
                  : 'bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-750 hover:border-gray-500'
              }`}
            >
              Configuración
            </Link>
          </div>
          
          <p className={`text-sm ${
            theme === 'light' ? 'text-gray-600' : 'text-gray-400'
          }`}>
            Registro completo de todas las alertas del sistema
          </p>
        </div>

        {/* Filtros */}
        <div className={`rounded-lg border p-4 mb-6 ${
          theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700'
        }`}>
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Filtro por estado */}
            <div className="flex flex-wrap gap-2 items-center">
              <span className={`text-sm ${
                theme === 'light' ? 'text-gray-700' : 'text-gray-300'
              }`}>
                Estado:
              </span>
              <div className="flex rounded-md overflow-hidden border">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-3 py-1.5 text-xs sm:text-sm transition-colors ${
                    filter === 'all'
                      ? theme === 'light'
                        ? 'bg-gray-900 text-white'
                        : 'bg-white text-gray-900'
                      : theme === 'light'
                        ? 'bg-white text-gray-700 hover:bg-gray-50'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  } ${theme === 'light' ? 'border-gray-300' : 'border-gray-600'}`}
                >
                  Todas
                </button>
                <button
                  onClick={() => setFilter('success')}
                  className={`px-3 py-1.5 text-xs sm:text-sm transition-colors border-l ${
                    filter === 'success'
                      ? theme === 'light'
                        ? 'bg-gray-900 text-white'
                        : 'bg-white text-gray-900'
                      : theme === 'light'
                        ? 'bg-white text-gray-700 hover:bg-gray-50'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  } ${theme === 'light' ? 'border-gray-300' : 'border-gray-600'}`}
                >
                  Exitosas
                </button>
                <button
                  onClick={() => setFilter('failed')}
                  className={`px-3 py-1.5 text-xs sm:text-sm transition-colors border-l ${
                    filter === 'failed'
                      ? theme === 'light'
                        ? 'bg-gray-900 text-white'
                        : 'bg-white text-gray-900'
                      : theme === 'light'
                        ? 'bg-white text-gray-700 hover:bg-gray-50'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  } ${theme === 'light' ? 'border-gray-300' : 'border-gray-600'}`}
                >
                  Fallidas
                </button>
              </div>
            </div>

            {/* Filtro por fecha */}
            <div className="flex flex-wrap gap-2 items-center">
              <span className={`text-sm ${
                theme === 'light' ? 'text-gray-700' : 'text-gray-300'
              }`}>
                Período:
              </span>
              <div className="flex rounded-md overflow-hidden border">
                <button
                  onClick={() => setDateFilter('all')}
                  className={`px-3 py-1.5 text-xs sm:text-sm transition-colors ${
                    dateFilter === 'all'
                      ? theme === 'light'
                        ? 'bg-gray-900 text-white'
                        : 'bg-white text-gray-900'
                      : theme === 'light'
                        ? 'bg-white text-gray-700 hover:bg-gray-50'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  } ${theme === 'light' ? 'border-gray-300' : 'border-gray-600'}`}
                >
                  Todo
                </button>
                <button
                  onClick={() => setDateFilter('24h')}
                  className={`px-3 py-1.5 text-xs sm:text-sm transition-colors border-l ${
                    dateFilter === '24h'
                      ? theme === 'light'
                        ? 'bg-gray-900 text-white'
                        : 'bg-white text-gray-900'
                      : theme === 'light'
                        ? 'bg-white text-gray-700 hover:bg-gray-50'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  } ${theme === 'light' ? 'border-gray-300' : 'border-gray-600'}`}
                >
                  24h
                </button>
                <button
                  onClick={() => setDateFilter('7d')}
                  className={`px-3 py-1.5 text-xs sm:text-sm transition-colors border-l ${
                    dateFilter === '7d'
                      ? theme === 'light'
                        ? 'bg-gray-900 text-white'
                        : 'bg-white text-gray-900'
                      : theme === 'light'
                        ? 'bg-white text-gray-700 hover:bg-gray-50'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  } ${theme === 'light' ? 'border-gray-300' : 'border-gray-600'}`}
                >
                  7 días
                </button>
                <button
                  onClick={() => setDateFilter('30d')}
                  className={`px-3 py-1.5 text-xs sm:text-sm transition-colors border-l ${
                    dateFilter === '30d'
                      ? theme === 'light'
                        ? 'bg-gray-900 text-white'
                        : 'bg-white text-gray-900'
                      : theme === 'light'
                        ? 'bg-white text-gray-700 hover:bg-gray-50'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  } ${theme === 'light' ? 'border-gray-300' : 'border-gray-600'}`}
                >
                  30 días
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de alertas */}
        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-12">
              <p className={`text-sm ${
                theme === 'light' ? 'text-gray-600' : 'text-gray-400'
              }`}>Cargando alertas...</p>
            </div>
          ) : filteredAlerts.length === 0 ? (
            <div className={`rounded-lg border p-12 text-center ${
              theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700'
            }`}>
              <p className={`text-sm ${
                theme === 'light' ? 'text-gray-600' : 'text-gray-400'
              }`}>
                No hay alertas para mostrar
              </p>
            </div>
          ) : (
            filteredAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`rounded-lg border p-4 hover:border-gray-400 transition-colors ${
                  theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700'
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Indicador */}
                  <div className={`text-xl mt-0.5 ${getStatusColor(alert.status)}`}>
                    {getStatusIndicator(alert.status)}
                  </div>

                  {/* Contenido */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-4 mb-2">
                      <div className={`text-sm font-medium ${
                        theme === 'light' ? 'text-gray-900' : 'text-white'
                      }`}>
                        {alert.sensor_name}
                      </div>
                      <div className={`text-xs whitespace-nowrap ${
                        theme === 'light' ? 'text-gray-500' : 'text-gray-400'
                      }`}>
                        {(() => {
                          // Prioridad 1: timestamp (Unix en segundos)
                          if (alert.timestamp) {
                            const date = new Date(alert.timestamp * 1000);
                            return date.toLocaleString('es-AR', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                              hour12: true
                            });
                          }
                          
                          // Prioridad 2: triggered_at (ISO string)
                          if (alert.triggered_at) {
                            const date = new Date(alert.triggered_at);
                            if (isNaN(date.getTime())) return 'Invalid Date';
                            return date.toLocaleString('es-AR', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                              hour12: true
                            });
                          }
                          
                          // Prioridad 3: Buscar en el mensaje (legacy)
                          const timestampMatch = alert.message?.match(/TIMESTAMP:\s*(\d{1,2})\/(\d{1,2})\/(\d{4}),?\s*(\d{2}):(\d{2}):(\d{2})/);
                          if (timestampMatch) {
                            const [, dd, mm, yyyy, HH, MM, SS] = timestampMatch;
                            const date = new Date(
                              parseInt(yyyy),
                              parseInt(mm) - 1,
                              parseInt(dd),
                              parseInt(HH),
                              parseInt(MM),
                              parseInt(SS)
                            );
                            if (!isNaN(date.getTime())) {
                              return date.toLocaleString('es-AR', {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit',
                                hour12: true
                              });
                            }
                          }
                          
                          return 'N/A';
                        })()}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-2">
                      <div className={`text-xs ${
                        theme === 'light' ? 'text-gray-600' : 'text-gray-400'
                      }`}>
                        Estado: <span className={getStatusColor(alert.status)}>{alert.status}</span>
                      </div>
                      
                      <div className={`text-xs ${
                        theme === 'light' ? 'text-gray-600' : 'text-gray-400'
                      }`}>
                        Sensor: {alert.sensor_id}
                      </div>
                    </div>

                    {alert.message && (
                      <p className={`text-xs mb-2 ${
                        theme === 'light' ? 'text-gray-600' : 'text-gray-400'
                      }`}>
                        {alert.message}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-3 text-xs">
                      <div className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}>
                        Canales: {alert.channels_sent.join(', ') || 'Ninguno'}
                      </div>
                      
                      <div>
                        {alert.success ? (
                          <span className="text-green-600">Enviada exitosamente</span>
                        ) : (
                          <span className="text-red-600">Error al enviar</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
