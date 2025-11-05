/**
 * 📋 Página de Historial de Alertas
 * 
 * Muestra todas las alertas históricas con filtros y búsqueda
 */

'use client';

import { AlertTriangle, ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
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
  triggered_at: string;
  success: boolean;
}

export default function AlertasPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'success' | 'failed'>('all');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Sincronizar tema con localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('dashboard-theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
    }
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
    if (filter === 'all') return true;
    if (filter === 'success') return alert.success;
    if (filter === 'failed') return !alert.success;
    return true;
  });

  const getAlertIcon = (status: string) => {
    if (status.toLowerCase().includes('down')) {
      return <XCircle className="w-6 h-6 text-red-500" />;
    } else if (status.toLowerCase().includes('warning')) {
      return <AlertTriangle className="w-6 h-6 text-yellow-500" />;
    } else {
      return <CheckCircle className="w-6 h-6 text-green-500" />;
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      theme === 'light'
        ? 'bg-gradient-to-br from-blue-50 to-indigo-100'
        : 'bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900'
    }`}>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/"
            className={`inline-flex items-center gap-2 mb-4 transition-colors ${
              theme === 'light'
                ? 'text-blue-600 hover:text-blue-700'
                : 'text-blue-400 hover:text-blue-300'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al Dashboard
          </Link>
          
          <h1 className={`text-3xl font-bold mb-2 transition-colors duration-300 ${
            theme === 'light' ? 'text-gray-900' : 'text-white'
          }`}>
            Historial de Alertas
          </h1>
          <p className={`transition-colors duration-300 ${
            theme === 'light' ? 'text-gray-600' : 'text-gray-300'
          }`}>
            Registro completo de todas las alertas del sistema
          </p>
        </div>

        {/* Filtros */}
        <div className={`rounded-lg shadow-md p-4 mb-6 transition-colors duration-300 ${
          theme === 'light' ? 'bg-white' : 'bg-gray-800'
        }`}>
          <div className="flex flex-wrap gap-4 items-center">
            <span className={`font-semibold transition-colors duration-300 ${
              theme === 'light' ? 'text-gray-700' : 'text-gray-300'
            }`}>
              Filtrar:
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'all'
                    ? 'bg-blue-600 text-white'
                    : theme === 'light'
                      ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Todas ({alerts.length})
              </button>
              <button
                onClick={() => setFilter('success')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'success'
                    ? 'bg-green-600 text-white'
                    : theme === 'light'
                      ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Exitosas ({alerts.filter(a => a.success).length})
              </button>
              <button
                onClick={() => setFilter('failed')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'failed'
                    ? 'bg-red-600 text-white'
                    : theme === 'light'
                      ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Fallidas ({alerts.filter(a => !a.success).length})
              </button>
            </div>
          </div>
        </div>

        {/* Lista de alertas */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mx-auto mb-4"></div>
              <p className={`transition-colors duration-300 ${
                theme === 'light' ? 'text-gray-600' : 'text-gray-300'
              }`}>Cargando alertas...</p>
            </div>
          ) : filteredAlerts.length === 0 ? (
            <div className={`rounded-lg shadow-md p-12 text-center transition-colors duration-300 ${
              theme === 'light' ? 'bg-white' : 'bg-gray-800'
            }`}>
              <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className={`text-lg transition-colors duration-300 ${
                theme === 'light' ? 'text-gray-600' : 'text-gray-300'
              }`}>
                No hay alertas para mostrar
              </p>
            </div>
          ) : (
            filteredAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`rounded-lg shadow-md p-6 hover:shadow-lg transition-all duration-300 ${
                  theme === 'light' ? 'bg-white' : 'bg-gray-800'
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Icono */}
                  <div className="mt-1">
                    {getAlertIcon(alert.status)}
                  </div>

                  {/* Contenido */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-4 mb-2">
                      <h3 className={`text-lg font-semibold transition-colors duration-300 ${
                        theme === 'light' ? 'text-gray-900' : 'text-white'
                      }`}>
                        {alert.sensor_name}
                      </h3>
                      <span className={`text-sm whitespace-nowrap transition-colors duration-300 ${
                        theme === 'light' ? 'text-gray-500' : 'text-gray-400'
                      }`}>
                        {/* Extraer TIMESTAMP del mensaje si existe, sino usar triggered_at ajustado */}
                        {(() => {
                          // Intentar extraer TIMESTAMP del mensaje (acepta 1 o 2 dígitos en día/mes)
                          const timestampMatch = alert.message?.match(/TIMESTAMP:\s*(\d{1,2})\/(\d{1,2})\/(\d{4}),?\s*(\d{2}):(\d{2}):(\d{2})/);
                          if (timestampMatch) {
                            const [, dd, mm, yyyy, HH, MM, SS] = timestampMatch;
                            // Parsear fecha y convertir a formato con AM/PM
                            const date = new Date(
                              parseInt(yyyy),
                              parseInt(mm) - 1,
                              parseInt(dd),
                              parseInt(HH),
                              parseInt(MM),
                              parseInt(SS)
                            );
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
                          // Fallback: usar triggered_at de la BD con AM/PM
                          return new Date(alert.triggered_at).toLocaleString('es-AR', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                            hour12: true
                          });
                        })()}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                      <div>
                        <span className={`text-sm transition-colors duration-300 ${
                          theme === 'light' ? 'text-gray-600' : 'text-gray-400'
                        }`}>Estado:</span>
                        <span className={`ml-2 font-medium ${
                          alert.status.toLowerCase().includes('down') ? 'text-red-600' :
                          alert.status.toLowerCase().includes('warning') ? 'text-yellow-600' :
                          'text-green-600'
                        }`}>
                          {alert.status}
                        </span>
                      </div>
                      
                      <div>
                        <span className={`text-sm transition-colors duration-300 ${
                          theme === 'light' ? 'text-gray-600' : 'text-gray-400'
                        }`}>Sensor ID:</span>
                        <span className="ml-2 font-mono text-sm">{alert.sensor_id}</span>
                      </div>
                    </div>

                    {alert.message && (
                      <p className={`text-sm mb-3 transition-colors duration-300 ${
                        theme === 'light' ? 'text-gray-600' : 'text-gray-400'
                      }`}>
                        {alert.message}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-4 text-sm">
                      <div>
                        <span className={`transition-colors duration-300 ${
                          theme === 'light' ? 'text-gray-600' : 'text-gray-400'
                        }`}>Canales:</span>
                        <span className="ml-2 font-medium">
                          {alert.channels_sent.join(', ') || 'Ninguno'}
                        </span>
                      </div>
                      
                      <div>
                        <span className={`transition-colors duration-300 ${
                          theme === 'light' ? 'text-gray-600' : 'text-gray-400'
                        }`}>Estado:</span>
                        {alert.success ? (
                          <span className="ml-2 text-green-600 font-medium">
                            ✓ Enviada exitosamente
                          </span>
                        ) : (
                          <span className="ml-2 text-red-600 font-medium">
                            ✗ Error al enviar
                          </span>
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
