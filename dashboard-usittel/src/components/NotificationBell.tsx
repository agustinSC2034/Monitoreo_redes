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
      
      if (data.success) {
        setAlerts(data.data);
        
        // Contar alertas nuevas (después del último check)
        const newAlerts = data.data.filter((alert: Alert) => {
          const alertTime = new Date(alert.triggered_at).getTime();
          return alertTime > lastCheckTime;
        });
        
        if (newAlerts.length > 0) {
          setUnreadCount(prev => prev + newAlerts.length);
        }
      }
    } catch (error) {
      console.error('Error cargando alertas:', error);
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
        className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-label="Notificaciones"
      >
        <Bell className={`w-6 h-6 ${unreadCount > 0 ? 'text-blue-500 animate-pulse' : 'text-gray-600 dark:text-gray-400'}`} />
        
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
          <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-900 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 z-50 max-h-[600px] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="font-semibold text-lg">🔔 Alertas Recientes</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Lista de alertas */}
            <div className="overflow-y-auto flex-1">
              {alerts.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>No hay alertas todavía</p>
                  <p className="text-sm mt-1">Las alertas aparecerán aquí cuando se detecten problemas</p>
                </div>
              ) : (
                alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="p-4 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      {/* Icono según el estado */}
                      <div className="mt-1">
                        {getAlertIcon(alert.status)}
                      </div>

                      {/* Contenido */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="font-semibold text-sm truncate">
                            {alert.sensor_name}
                          </span>
                          <span className="text-xs text-gray-500 whitespace-nowrap">
                            {formatTime(alert.triggered_at)}
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Estado: <span className={`font-medium ${
                            alert.status.toLowerCase().includes('down') ? 'text-red-600' :
                            alert.status.toLowerCase().includes('warning') ? 'text-yellow-600' :
                            'text-green-600'
                          }`}>
                            {alert.status}
                          </span>
                        </p>
                        
                        {alert.message && (
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                            {alert.message}
                          </p>
                        )}

                        {/* Indicador de éxito/fallo */}
                        <div className="mt-2 flex items-center gap-2">
                          {alert.success ? (
                            <span className="text-xs text-green-600 dark:text-green-400">
                              ✓ Notificación enviada
                            </span>
                          ) : (
                            <span className="text-xs text-red-600 dark:text-red-400">
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
              <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    // TODO: Navegar a página de historial completo
                    window.location.href = '/dashboard/alertas';
                  }}
                  className="w-full text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium"
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
