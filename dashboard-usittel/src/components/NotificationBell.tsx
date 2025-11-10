/**
 * Componente de Notificaciones
 * Diseño minimalista y profesional - Sin iconos
 */

'use client';

import { useEffect, useState } from 'react';

interface Alert {
  id: number;
  rule_id: number;
  sensor_id: string;
  sensor_name: string;
  status: string;
  message?: string;
  timestamp?: number; // Unix timestamp en segundos
  triggered_at?: string; // ISO string (fallback)
  success: boolean;
}

export default function NotificationBell() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastCheckTime, setLastCheckTime] = useState<number>(Date.now());
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Sincronizar tema
  useEffect(() => {
    const savedTheme = localStorage.getItem('dashboard-theme') as 'light' | 'dark' | null;
    if (savedTheme) setTheme(savedTheme);
    
    const handleStorageChange = () => {
      const newTheme = localStorage.getItem('dashboard-theme') as 'light' | 'dark' | null;
      if (newTheme) setTheme(newTheme);
    };
    
    window.addEventListener('storage', handleStorageChange);
    const interval = setInterval(() => {
      const currentTheme = localStorage.getItem('dashboard-theme') as 'light' | 'dark' | null;
      if (currentTheme && currentTheme !== theme) setTheme(currentTheme);
    }, 500);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [theme]);

  // Cargar alertas cada 30 segundos
  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchAlerts = async () => {
    try {
      const response = await fetch('/api/alerts/history?limit=20');
      const data = await response.json();
      
      if (data.success) {
        setAlerts(data.data);
        
        const newAlerts = data.data.filter((alert: Alert) => {
          const alertTime = alert.timestamp 
            ? alert.timestamp * 1000  // Unix timestamp en segundos → ms
            : new Date(alert.triggered_at || 0).getTime();
          return alertTime > lastCheckTime;
        });
        
        setUnreadCount(newAlerts.length);
      }
    } catch (error) {
      console.error('Error cargando alertas:', error);
    }
  };

  const handleOpen = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setUnreadCount(0);
      setLastCheckTime(Date.now());
    }
  };

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

  const formatTime = (timestampOrDate: string | number | undefined) => {
    // Puede venir como timestamp Unix (segundos) o como string ISO
    if (!timestampOrDate) return 'N/A';
    
    let date: Date;
    
    if (typeof timestampOrDate === 'number') {
      // Unix timestamp en segundos
      date = new Date(timestampOrDate * 1000);
    } else {
      // String ISO
      date = new Date(timestampOrDate);
    }
    
    // Validar que la fecha es válida
    if (isNaN(date.getTime())) {
      return 'N/A';
    }
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `${diffMins}m`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d`;
  };

  return (
    <div className="relative">
      {/* En mobile: Link directo | En desktop: Botón con dropdown */}
      
      {/* Mobile: Link directo a página de alertas */}
      <a
        href="/dashboard/alertas"
        className={`sm:hidden relative px-3 py-2 rounded-md border text-sm transition-all duration-200 hover:scale-105 flex items-center gap-2 ${
          theme === 'light'
            ? 'bg-white border-gray-300 text-gray-700 hover:bg-gray-100 hover:border-gray-400'
            : 'bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-750 hover:border-gray-500'
        }`}
        aria-label="Ver alertas"
      >
        {/* Icono campana - solo líneas */}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        
        <span>Alertas</span>
        
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </a>

      {/* Desktop: Botón con dropdown */}
      <button
        onClick={handleOpen}
        className={`hidden sm:flex relative px-3 py-2 rounded-md border text-sm transition-all duration-200 hover:scale-105 items-center gap-2 ${
          theme === 'light'
            ? 'bg-white border-gray-300 text-gray-700 hover:bg-gray-100 hover:border-gray-400'
            : 'bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-750 hover:border-gray-500'
        }`}
        aria-label="Notificaciones"
      >
        {/* Icono campana - solo líneas */}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        
        <span>Alertas</span>
        
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          <div className={`absolute right-0 mt-2 w-full sm:w-96 max-w-[calc(100vw-2rem)] rounded-lg border shadow-xl z-50 max-h-[600px] overflow-hidden flex flex-col ${
            theme === 'light'
              ? 'bg-white border-gray-200'
              : 'bg-gray-900 border-gray-700'
          }`}>
            {/* Header */}
            <div className={`p-4 border-b flex items-center justify-between ${
              theme === 'light' ? 'border-gray-200' : 'border-gray-700'
            }`}>
              <div className={`text-sm font-medium ${
                theme === 'light' ? 'text-gray-900' : 'text-white'
              }`}>
                Alertas recientes
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className={`text-xs ${
                  theme === 'light' ? 'text-gray-500 hover:text-gray-700' : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                Cerrar
              </button>
            </div>

            {/* Lista */}
            <div className="overflow-y-auto flex-1">
              {alerts.length === 0 ? (
                <div className={`p-8 text-center text-sm ${
                  theme === 'light' ? 'text-gray-500' : 'text-gray-400'
                }`}>
                  No hay alertas todavía
                </div>
              ) : (
                alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-4 border-b transition-colors ${
                      theme === 'light'
                        ? 'border-gray-100 hover:bg-gray-50'
                        : 'border-gray-700 hover:bg-gray-800'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`text-lg ${getStatusColor(alert.status)}`}>
                        {getStatusIndicator(alert.status)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className={`text-sm font-medium truncate ${
                            theme === 'light' ? 'text-gray-900' : 'text-white'
                          }`}>
                            {alert.sensor_name}
                          </span>
                          <span className={`text-xs whitespace-nowrap ${
                            theme === 'light' ? 'text-gray-500' : 'text-gray-400'
                          }`}>
                            {formatTime(alert.timestamp || alert.triggered_at || 0)}
                          </span>
                        </div>
                        
                        <p className={`text-xs ${
                          theme === 'light' ? 'text-gray-600' : 'text-gray-400'
                        }`}>
                          {alert.status}
                        </p>
                        
                        {alert.message && (
                          <p className={`text-xs mt-1 line-clamp-2 ${
                            theme === 'light' ? 'text-gray-500' : 'text-gray-400'
                          }`}>
                            {alert.message}
                          </p>
                        )}

                        <div className="mt-2">
                          {alert.success ? (
                            <span className={`text-xs ${
                              theme === 'light' ? 'text-green-600' : 'text-green-400'
                            }`}>
                              Notificación enviada
                            </span>
                          ) : (
                            <span className={`text-xs ${
                              theme === 'light' ? 'text-red-600' : 'text-red-400'
                            }`}>
                              Error al enviar
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {alerts.length > 0 && (
              <div className={`p-3 border-t ${
                theme === 'light'
                  ? 'border-gray-200 bg-gray-50'
                  : 'border-gray-700 bg-gray-800'
              }`}>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    window.location.href = '/dashboard/alertas';
                  }}
                  className={`w-full text-sm hover:underline transition-all duration-200 hover:scale-105 ${
                    theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                  }`}
                >
                  Ver todas las alertas
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
