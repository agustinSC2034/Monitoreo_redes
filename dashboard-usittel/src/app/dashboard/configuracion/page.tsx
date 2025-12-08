/**
 * 🔧 Página de Configuración de Alertas
 * 
 * Permite activar/desactivar reglas de alerta individuales
 */

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
  enabled: boolean;
  created_at?: number;
  cooldown: number;
  channels: string[];
  recipients: string[];
}

interface RulesData {
  tandil: AlertRule[];
  matanza: AlertRule[];
  total: number;
}

export default function ConfiguracionPage() {
  const [rules, setRules] = useState<RulesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<number | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Cargar tema
  useEffect(() => {
    const savedTheme = localStorage.getItem('dashboard-theme') as 'light' | 'dark' | null;
    if (savedTheme) setTheme(savedTheme);
  }, []);

  // Cargar reglas
  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/alerts/rules?all=true');
      
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Agrupar por ubicación
        const tandilRules = data.data.filter((rule: AlertRule) => {
          const sensorId = parseInt(rule.sensor_id);
          return sensorId >= 10000 || sensorId === 2137;
        });
        
        const matanzaRules = data.data.filter((rule: AlertRule) => {
          const sensorId = parseInt(rule.sensor_id);
          return sensorId < 10000 && sensorId !== 2137;
        });
        
        setRules({
          tandil: tandilRules,
          matanza: matanzaRules,
          total: data.data.length
        });
        setError(null);
      } else {
        throw new Error(data.error || 'Error al cargar reglas');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      console.error('Error al obtener reglas:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleRule = async (ruleId: number, currentEnabled: boolean) => {
    try {
      setSaving(ruleId);
      
      const response = await fetch('/api/alerts/rules', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: ruleId,
          enabled: !currentEnabled
        })
      });
      
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Actualizar estado local
        setRules(prev => {
          if (!prev) return null;
          
          const updateRules = (rules: AlertRule[]) =>
            rules.map(rule =>
              rule.id === ruleId ? { ...rule, enabled: !currentEnabled } : rule
            );
          
          return {
            ...prev,
            tandil: updateRules(prev.tandil),
            matanza: updateRules(prev.matanza)
          };
        });
      } else {
        throw new Error(data.error || 'Error al actualizar regla');
      }
    } catch (err) {
      console.error('Error al actualizar regla:', err);
      alert(`Error: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    } finally {
      setSaving(null);
    }
  };

  const getPriorityColor = (priority: string, enabled: boolean) => {
    if (!enabled) return theme === 'light' ? 'text-gray-400' : 'text-gray-600';
    
    switch (priority) {
      case 'critical': return 'text-red-600';
      case 'high': return 'text-orange-500';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-blue-500';
      default: return theme === 'light' ? 'text-gray-600' : 'text-gray-400';
    }
  };

  const getConditionLabel = (condition: string) => {
    const labels: Record<string, string> = {
      'down': 'Caído',
      'warning': 'Advertencia',
      'slow': 'Lento',
      'traffic_low': 'Tráfico Bajo',
      'traffic_spike': 'Pico de Tráfico',
      'traffic_drop': 'Caída de Tráfico',
      'unusual': 'Inusual'
    };
    return labels[condition] || condition;
  };

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return 'Fecha no disponible';
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('es-AR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  };

  const RuleItem = ({ rule }: { rule: AlertRule }) => {
    const isSaving = saving === rule.id;
    
    return (
      <div className={`p-4 rounded-lg border ${
        theme === 'light'
          ? rule.enabled 
            ? 'bg-white border-gray-200' 
            : 'bg-gray-50 border-gray-200'
          : rule.enabled
            ? 'bg-gray-800 border-gray-700'
            : 'bg-gray-900 border-gray-800'
      }`}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className={`text-sm font-medium ${
                rule.enabled
                  ? theme === 'light' ? 'text-gray-900' : 'text-white'
                  : theme === 'light' ? 'text-gray-500' : 'text-gray-500'
              }`}>
                {rule.name}
              </h3>
              <span className={`text-xs px-2 py-0.5 rounded ${getPriorityColor(rule.priority, rule.enabled)}`}>
                {rule.priority}
              </span>
            </div>
            
            <div className={`text-xs space-y-1 ${
              theme === 'light' ? 'text-gray-600' : 'text-gray-400'
            }`}>
              <div>
                <span className="font-medium">Sensor:</span> {rule.sensor_id} | 
                <span className="font-medium ml-2">Tipo:</span> {getConditionLabel(rule.condition)}
                {rule.threshold && (
                  <> | <span className="font-medium">Umbral:</span> {rule.threshold} Mbit/s</>
                )}
              </div>
              <div>
                <span className="font-medium">Cooldown:</span> {Math.floor(rule.cooldown / 60)} min | 
                <span className="font-medium ml-2">Canales:</span> {rule.channels.join(', ')}
              </div>
              <div className="text-xs">
                <span className="font-medium">Creada:</span> {formatDate(rule.created_at)}
              </div>
            </div>
          </div>
          
          <button
            onClick={() => toggleRule(rule.id, rule.enabled)}
            disabled={isSaving}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              isSaving
                ? 'opacity-50 cursor-not-allowed'
                : 'cursor-pointer'
            } ${
              rule.enabled
                ? 'bg-green-500 focus:ring-green-500'
                : theme === 'light'
                  ? 'bg-gray-300 focus:ring-gray-400'
                  : 'bg-gray-700 focus:ring-gray-600'
            }`}
            title={rule.enabled ? 'Click para desactivar' : 'Click para activar'}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                rule.enabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className={`min-h-screen ${
      theme === 'light' ? 'bg-gray-50' : 'bg-gray-900'
    }`}>
      {/* Header */}
      <header className={`border-b ${
        theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700'
      }`}>
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className={`text-sm ${
                  theme === 'light'
                    ? 'text-gray-600 hover:text-gray-900'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                ← Volver al Dashboard
              </Link>
              <div className={`text-2xl font-light ${
                theme === 'light' ? 'text-gray-900' : 'text-white'
              }`}>
                ⚙️ Configuración de Alertas
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Contenido */}
      <main className="container mx-auto px-6 py-8">
        {loading ? (
          <div className="text-center py-12">
            <div className={`text-lg ${
              theme === 'light' ? 'text-gray-600' : 'text-gray-400'
            }`}>
              Cargando reglas...
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="text-red-500 text-lg mb-4">
              ❌ Error: {error}
            </div>
            <button
              onClick={fetchRules}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Reintentar
            </button>
          </div>
        ) : rules ? (
          <div className="space-y-8">
            {/* Información */}
            <div className={`p-4 rounded-lg border ${
              theme === 'light'
                ? 'bg-blue-50 border-blue-200'
                : 'bg-blue-900/20 border-blue-800'
            }`}>
              <p className={`text-sm ${
                theme === 'light' ? 'text-blue-800' : 'text-blue-300'
              }`}>
                💡 <strong>Información:</strong> Las reglas desactivadas no dispararán alertas, 
                incluso si GitHub Actions detecta un problema. Los cambios se guardan inmediatamente 
                y se aplican en la próxima ejecución del monitoreo.
              </p>
            </div>

            {/* Estadísticas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className={`p-4 rounded-lg border ${
                theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700'
              }`}>
                <div className={`text-2xl font-bold ${
                  theme === 'light' ? 'text-gray-900' : 'text-white'
                }`}>
                  {rules.total}
                </div>
                <div className={`text-sm ${
                  theme === 'light' ? 'text-gray-600' : 'text-gray-400'
                }`}>
                  Total de Reglas
                </div>
              </div>
              
              <div className={`p-4 rounded-lg border ${
                theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700'
              }`}>
                <div className={`text-2xl font-bold text-green-600`}>
                  {[...rules.tandil, ...rules.matanza].filter(r => r.enabled).length}
                </div>
                <div className={`text-sm ${
                  theme === 'light' ? 'text-gray-600' : 'text-gray-400'
                }`}>
                  Activas
                </div>
              </div>
              
              <div className={`p-4 rounded-lg border ${
                theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700'
              }`}>
                <div className={`text-2xl font-bold text-gray-600`}>
                  {[...rules.tandil, ...rules.matanza].filter(r => !r.enabled).length}
                </div>
                <div className={`text-sm ${
                  theme === 'light' ? 'text-gray-600' : 'text-gray-400'
                }`}>
                  Inactivas
                </div>
              </div>
            </div>

            {/* USITTEL TANDIL */}
            {rules.tandil.length > 0 && (
              <div>
                <h2 className={`text-xl font-semibold mb-4 ${
                  theme === 'light' ? 'text-gray-900' : 'text-white'
                }`}>
                  🏢 USITTEL TANDIL
                  <span className={`text-sm font-normal ml-2 ${
                    theme === 'light' ? 'text-gray-500' : 'text-gray-400'
                  }`}>
                    ({rules.tandil.length} reglas)
                  </span>
                </h2>
                <div className="space-y-3">
                  {rules.tandil.map(rule => (
                    <RuleItem key={rule.id} rule={rule} />
                  ))}
                </div>
              </div>
            )}

            {/* LARANET LA MATANZA */}
            {rules.matanza.length > 0 && (
              <div>
                <h2 className={`text-xl font-semibold mb-4 ${
                  theme === 'light' ? 'text-gray-900' : 'text-white'
                }`}>
                  🏢 LARANET LA MATANZA
                  <span className={`text-sm font-normal ml-2 ${
                    theme === 'light' ? 'text-gray-500' : 'text-gray-400'
                  }`}>
                    ({rules.matanza.length} reglas)
                  </span>
                </h2>
                <div className="space-y-3">
                  {rules.matanza.map(rule => (
                    <RuleItem key={rule.id} rule={rule} />
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </main>
    </div>
  );
}
