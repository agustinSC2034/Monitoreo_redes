'use client';

import { useEffect, useState } from 'react';

import Link from 'next/link';

interface AlertRule {
  id: number;
  name: string;
  sensor_id: string;
  condition: string;
  threshold?: number;
  priority: string;
  channels: string[];
  recipients: string[];
  cooldown: number;
  enabled: boolean;
}

export default function AlertasConfigPage() {
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [locationFilter, setLocationFilter] = useState<'tandil' | 'matanza'>('tandil'); // Removido 'all', por defecto 'tandil'
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

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

  useEffect(() => {
    fetchRules();
    // Actualizar cada 30 segundos
    const interval = setInterval(fetchRules, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchRules = async () => {
    try {
      const response = await fetch('/api/alerts/rules?all=true');
      const data = await response.json();
      if (data.success) {
        // Parsear campos JSON si vienen como strings
        const parsedRules = data.data.map((rule: any) => ({
          ...rule,
          channels: typeof rule.channels === 'string' ? JSON.parse(rule.channels) : rule.channels,
          recipients: typeof rule.recipients === 'string' ? JSON.parse(rule.recipients) : rule.recipients
        }));
        setRules(parsedRules);
      }
    } catch (error) {
      console.error('Error cargando reglas:', error);
    } finally {
      setLoading(false);
    }
  };

  // Determinar ubicación basada en sensor_id
  const getSensorLocation = (sensorId: string): 'tandil' | 'matanza' => {
    const tandilIds = ['13682', '13684', '13683', '2137', '13673'];
    const matanzaIds = ['5187', '4736', '4737', '5159', '3942', '6689', '4665', '4642'];
    
    if (tandilIds.includes(sensorId)) return 'tandil';
    if (matanzaIds.includes(sensorId)) return 'matanza';
    return 'tandil';
  };

  // Filtrar por ubicación
  // Filtrar siempre por ubicación (no hay opción 'all')
  const filteredRules = rules.filter(rule => getSensorLocation(rule.sensor_id) === locationFilter);

  const enabledRules = filteredRules.filter(r => r.enabled);
  const disabledRules = filteredRules.filter(r => !r.enabled);

  const getConditionLabel = (condition: string) => {
    const labels: Record<string, string> = {
      'down': 'Enlace Caído',
      'warning': 'Warning',
      'slow': 'Umbral de Tráfico',
      'traffic_spike': 'Aumento Brusco',
      'traffic_drop': 'Caída Brusca',
      'unusual': 'Estado Inusual'
    };
    return labels[condition] || condition;
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      'critical': theme === 'light' ? 'text-red-600' : 'text-red-400',
      'high': theme === 'light' ? 'text-orange-600' : 'text-orange-400',
      'medium': theme === 'light' ? 'text-yellow-600' : 'text-yellow-400',
      'low': theme === 'light' ? 'text-blue-600' : 'text-blue-400'
    };
    return colors[priority] || (theme === 'light' ? 'text-gray-600' : 'text-gray-400');
  };

  const RuleCard = ({ rule, isEnabled }: { rule: AlertRule; isEnabled: boolean }) => (
    <div className={`rounded-lg border p-4 ${
      theme === 'light'
        ? 'bg-white border-gray-200'
        : 'bg-gray-800 border-gray-700'
    }`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className={`text-sm font-medium ${
              theme === 'light' ? 'text-gray-900' : 'text-white'
            }`}>
              {rule.name}
            </h3>
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
              isEnabled
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
            }`}>
              {isEnabled ? 'Activa' : 'Inactiva'}
            </span>
          </div>
          
          <p className={`text-xs ${
            theme === 'light' ? 'text-gray-500' : 'text-gray-400'
          }`}>
            Sensor: {rule.sensor_id}
          </p>
        </div>

        <span className={`text-xs font-medium ${getPriorityColor(rule.priority)}`}>
          {rule.priority.toUpperCase()}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <div>
          <span className={`font-medium ${
            theme === 'light' ? 'text-gray-700' : 'text-gray-300'
          }`}>
            Condición:
          </span>
          <p className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}>
            {getConditionLabel(rule.condition)}
            {rule.threshold && ` (${rule.threshold} Mbit/s)`}
          </p>
        </div>

        <div>
          <span className={`font-medium ${
            theme === 'light' ? 'text-gray-700' : 'text-gray-300'
          }`}>
            Canales:
          </span>
          <p className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}>
            {Array.isArray(rule.channels) ? rule.channels.filter(c => c === 'email').join(', ') : 'email'}
          </p>
        </div>

        <div>
          <span className={`font-medium ${
            theme === 'light' ? 'text-gray-700' : 'text-gray-300'
          }`}>
            Cooldown:
          </span>
          <p className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}>
            {rule.cooldown < 60 ? `${rule.cooldown}s` : `${Math.floor(rule.cooldown / 60)}min`}
          </p>
        </div>

        <div>
          <span className={`font-medium ${
            theme === 'light' ? 'text-gray-700' : 'text-gray-300'
          }`}>
            Destinatarios:
          </span>
          <p className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}>
            {Array.isArray(rule.recipients) ? rule.recipients.filter(r => r.includes('@')).length : 0}
          </p>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className={`min-h-screen ${theme === 'light' ? 'bg-gray-50' : 'bg-gray-900'}`}>
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className={`h-8 rounded w-1/4 ${theme === 'light' ? 'bg-gray-200' : 'bg-gray-700'}`}></div>
            <div className={`h-32 rounded ${theme === 'light' ? 'bg-gray-200' : 'bg-gray-700'}`}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme === 'light' ? 'bg-gray-50' : 'bg-gray-900'}`}>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard/alertas"
            className={`text-sm mb-4 inline-flex items-center gap-2 ${
              theme === 'light' ? 'text-gray-600 hover:text-gray-900' : 'text-gray-400 hover:text-white'
            }`}
          >
            ← Volver al Historial
          </Link>
          
          <h1 className={`text-3xl font-bold ${
            theme === 'light' ? 'text-gray-900' : 'text-white'
          }`}>
            Configuración de Alertas
          </h1>
          
          <p className={`mt-2 ${
            theme === 'light' ? 'text-gray-600' : 'text-gray-400'
          }`}>
            Visualización en tiempo real de todas las reglas de alertas configuradas
          </p>

          {/* Filtro por ubicación */}
          <div className="mt-6 flex items-center gap-2">
            <span className={`text-sm ${
              theme === 'light' ? 'text-gray-700' : 'text-gray-300'
            }`}>
              Filtrar por ubicación:
            </span>
            <div className="flex rounded-md overflow-hidden border">
              <button
                onClick={() => setLocationFilter('tandil')}
                className={`px-3 py-1.5 text-xs sm:text-sm transition-colors ${
                  locationFilter === 'tandil'
                    ? theme === 'light'
                      ? 'bg-gray-900 text-white'
                      : 'bg-white text-gray-900'
                    : theme === 'light'
                      ? 'bg-white text-gray-700 hover:bg-gray-50'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                } ${theme === 'light' ? 'border-gray-300' : 'border-gray-600'}`}
              >
                USITTEL (Tandil)
              </button>
              <button
                onClick={() => setLocationFilter('matanza')}
                className={`px-3 py-1.5 text-xs sm:text-sm transition-colors border-l ${
                  locationFilter === 'matanza'
                    ? theme === 'light'
                      ? 'bg-gray-900 text-white'
                      : 'bg-white text-gray-900'
                    : theme === 'light'
                      ? 'bg-white text-gray-700 hover:bg-gray-50'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                } ${theme === 'light' ? 'border-gray-300' : 'border-gray-600'}`}
              >
                LARANET (La Matanza)
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className={`rounded-lg border p-4 ${
            theme === 'light'
              ? 'bg-white border-gray-200'
              : 'bg-gray-800 border-gray-700'
          }`}>
            <div className="text-2xl font-bold text-green-500">
              {enabledRules.length}
            </div>
            <div className={`text-sm ${
              theme === 'light' ? 'text-gray-600' : 'text-gray-400'
            }`}>
              Alertas Activas
            </div>
          </div>

          <div className={`rounded-lg border p-4 ${
            theme === 'light'
              ? 'bg-white border-gray-200'
              : 'bg-gray-800 border-gray-700'
          }`}>
            <div className={`text-2xl font-bold ${
              theme === 'light' ? 'text-gray-500' : 'text-gray-400'
            }`}>
              {disabledRules.length}
            </div>
            <div className={`text-sm ${
              theme === 'light' ? 'text-gray-600' : 'text-gray-400'
            }`}>
              Alertas Inactivas
            </div>
          </div>
        </div>

        {/* Alertas Activas */}
        <div className="mb-8">
          <h2 className={`text-xl font-bold mb-4 ${
            theme === 'light' ? 'text-gray-900' : 'text-white'
          }`}>
            Alertas Activas ({enabledRules.length})
          </h2>
          
          {enabledRules.length === 0 ? (
            <p className={`text-sm ${
              theme === 'light' ? 'text-gray-500' : 'text-gray-400'
            }`}>
              No hay alertas activas configuradas
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {enabledRules.map(rule => (
                <RuleCard key={rule.id} rule={rule} isEnabled={true} />
              ))}
            </div>
          )}
        </div>

        {/* Alertas Inactivas */}
        {disabledRules.length > 0 && (
          <div>
            <h2 className={`text-xl font-bold mb-4 ${
              theme === 'light' ? 'text-gray-900' : 'text-white'
            }`}>
              Alertas Inactivas ({disabledRules.length})
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {disabledRules.map(rule => (
                <RuleCard key={rule.id} rule={rule} isEnabled={false} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
