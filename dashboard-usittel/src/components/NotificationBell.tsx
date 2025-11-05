/**
 * 🔔 Componente de Notificaciones
 * 
 * Muestra una campanita con un badge del número de alertas nuevas
 * Al hacer click, se despliega un dropdown con las últimas alertas
 */

'use client';

import { AlertTriangle, Bell, CheckCircle, X, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Alert {
  id: number;
  rule_id: number;
  sensor_id: string;
  sensor_name: string;
  status: string;
  message?: string;
  triggered_at: string;
  success: boolean;
}

export default function NotificationBell() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastCheckTime, setLastCheckTime] = useState<number>(Date.now());
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Sincronizar tema con localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('dashboard-theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
    }
    
    // Escuchar cambios en el tema
    const handleStorageChange = () => {
      const newTheme = localStorage.getItem('dashboard-theme') as 'light' | 'dark' | null;
      if (newTheme) {
        setTheme(newTheme);
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    // También escuchar cambios locales
    const interval = setInterval(() => {
      const currentTheme = localStorage.getItem('dashboard-theme') as 'light' | 'dark' | null;
      if (currentTheme && currentTheme !== theme) {
        setTheme(currentTheme);
      }
    }, 500);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [theme]);

  // Cargar alertas cada 30 segundos
  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 30000); // 30 segundos
    return () => clearInterval(interval);
  }, []);

  const fetchAlerts = async () => {
    try {
      const response = await fetch('/api/alerts/history?limit=20');
      const data = await response.json();
      
      console.log('🔔 Alertas recibidas:', data);
      
      if (data.success) {
        setAlerts(data.data);
        
        // Contar alertas nuevas (después del último check)
        const newAlerts = data.data.filter((alert: Alert) => {
          const alertTime = new Date(alert.triggered_at).getTime();
          return alertTime > lastCheckTime;
        });
        
        console.log('🔔 Alertas nuevas:', newAlerts.length, 'de', data.data.length);
        console.log('🔔 Último check:', new Date(lastCheckTime).toLocaleString());
        
        // CORREGIDO: Reemplazar contador en vez de sumar
        setUnreadCount(newAlerts.length);
      }
    } catch (error) {
      console.error('❌ Error cargando alertas:', error);
    }
  };

  const handleOpen = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      // Al abrir, marcar como leídas
      setUnreadCount(0);
      setLastCheckTime(Date.now());
    }
  };

  const getAlertIcon = (status: string) => {
    if (status.toLowerCase().includes('down')) {
      return <XCircle className="w-5 h-5 text-red-500" />;
    } else if (status.toLowerCase().includes('warning')) {
      return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
    } else {
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `Hace ${diffMins}m`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `Hace ${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    return `Hace ${diffDays}d`;
  };

  return (
    <div className="relative">
      {/* Botón de campanita */}
      <button
        onClick={handleOpen}
        className={`relative p-2 rounded-lg transition-colors ${
          theme === 'light'
            ? 'hover:bg-gray-100'
            : 'hover:bg-gray-800'
        }`}
        aria-label="Notificaciones"
      >
        <Bell className={`w-6 h-6 ${
          unreadCount > 0 
            ? 'text-blue-500 animate-pulse' 
            : theme === 'light'
              ? 'text-gray-600'
              : 'text-gray-400'
        }`} />
        
        {/* Badge con número de alertas nuevas */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-bounce">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown de alertas */}
      {isOpen && (
        <>
          {/* Overlay para cerrar al hacer click fuera */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Panel de notificaciones */}
          <div className={`absolute right-0 mt-2 w-96 rounded-lg shadow-2xl border z-50 max-h-[600px] overflow-hidden flex flex-col transition-colors duration-300 ${
            theme === 'light'
              ? 'bg-white border-gray-200'
              : 'bg-gray-900 border-gray-700'
          }`}>
            {/* Header */}
            <div className={`p-4 border-b flex items-center justify-between transition-colors duration-300 ${
              theme === 'light'
                ? 'border-gray-200'
                : 'border-gray-700'
            }`}>
              <h3 className={`font-semibold text-lg transition-colors duration-300 ${
                theme === 'light' ? 'text-gray-900' : 'text-white'
              }`}>🔔 Alertas Recientes</h3>
              <button
                onClick={() => setIsOpen(false)}
                className={`p-1 rounded transition-colors ${
                  theme === 'light'
                    ? 'hover:bg-gray-100'
                    : 'hover:bg-gray-800'
                }`}
              >
                <X className={`w-5 h-5 ${
                  theme === 'light' ? 'text-gray-600' : 'text-gray-400'
                }`} />
              </button>
            </div>

            {/* Lista de alertas */}
            <div className="overflow-y-auto flex-1">
              {alerts.length === 0 ? (
                <div className={`p-8 text-center transition-colors duration-300 ${
                  theme === 'light' ? 'text-gray-500' : 'text-gray-400'
                }`}>
                  <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>No hay alertas todavía</p>
                  <p className="text-sm mt-1">Las alertas aparecerán aquí cuando se detecten problemas</p>
                </div>
              ) : (
                alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-4 border-b transition-colors ${
                      theme === 'light'
                        ? 'border-gray-100 hover:bg-gray-50'
                        : 'border-gray-800 hover:bg-gray-800'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Icono según el estado */}
                      <div className="mt-1">
                        {getAlertIcon(alert.status)}
                      </div>

                      {/* Contenido */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className={`font-semibold text-sm truncate transition-colors duration-300 ${
                            theme === 'light' ? 'text-gray-900' : 'text-white'
                          }`}>
                            {alert.sensor_name}
                          </span>
                          <span className={`text-xs whitespace-nowrap transition-colors duration-300 ${
                            theme === 'light' ? 'text-gray-500' : 'text-gray-400'
                          }`}>
                            {formatTime(alert.triggered_at)}
                          </span>
                        </div>
                        
                        <p className={`text-sm transition-colors duration-300 ${
                          theme === 'light' ? 'text-gray-600' : 'text-gray-400'
                        }`}>
                          Estado: <span className={`font-medium ${
                            alert.status.toLowerCase().includes('down') ? 'text-red-600' :
                            alert.status.toLowerCase().includes('warning') ? 'text-yellow-600' :
                            'text-green-600'
                          }`}>
                            {alert.status}
                          </span>
                        </p>
                        
                        {alert.message && (
                          <p className={`text-xs mt-1 line-clamp-2 transition-colors duration-300 ${
                            theme === 'light' ? 'text-gray-500' : 'text-gray-400'
                          }`}>
                            {alert.message}
                          </p>
                        )}

                        {/* Indicador de éxito/fallo */}
                        <div className="mt-2 flex items-center gap-2">
                          {alert.success ? (
                            <span className={`text-xs transition-colors duration-300 ${
                              theme === 'light' ? 'text-green-600' : 'text-green-400'
                            }`}>
                              ✓ Notificación enviada
                            </span>
                          ) : (
                            <span className={`text-xs transition-colors duration-300 ${
                              theme === 'light' ? 'text-red-600' : 'text-red-400'
                            }`}>
                              ✗ Error al enviar
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
              <div className={`p-3 border-t transition-colors duration-300 ${
                theme === 'light'
                  ? 'border-gray-200 bg-gray-50'
                  : 'border-gray-700 bg-gray-800'
              }`}>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    window.location.href = '/dashboard/alertas';
                  }}
                  className={`w-full text-sm hover:underline font-medium transition-colors duration-300 ${
                    theme === 'light' ? 'text-blue-600' : 'text-blue-400'
                  }`}
                >
                  Ver todas las alertas →
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
