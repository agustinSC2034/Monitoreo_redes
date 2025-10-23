'use client';

/**
 * 📊 Componente: Gráfico Histórico
 * 
 * Muestra un gráfico de línea con el tráfico histórico de un sensor
 * Utiliza Recharts para la visualización
 */

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { useEffect, useState } from 'react';

interface HistoricalChartProps {
  sensorId: string;
  sensorName: string;
  days?: number;
}

interface ChartDataPoint {
  timestamp: string;
  datetime_raw: number;
  value: number;
  valueFormatted: string;
}

export default function HistoricalChart({ 
  sensorId, 
  sensorName, 
  days = 1 
}: HistoricalChartProps) {
  const CACHE_TTL_MS = 600000; // 10 minutos (aumentado para reducir peticiones a PRTG)
  const REFRESH_INTERVAL_MS = 600000; // 10 minutos (sincronizado con caché)
  
  const [data, setData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState(days);
  const [unit, setUnit] = useState<'kbit' | 'mbit'>('kbit'); // CAMBIADO: arranca en kbit/s como PRTG
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [relativeTime, setRelativeTime] = useState<string>('');

  // 🧠 Cache helpers
  const cacheKey = (period: number) => `historical:${sensorId}:${period}`;
  const readCache = (period: number) => {
    try {
      const raw = localStorage.getItem(cacheKey(period));
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (Date.now() - parsed.timestamp < CACHE_TTL_MS && Array.isArray(parsed.data)) {
        return parsed.data as ChartDataPoint[];
      }
      return null;
    } catch { return null; }
  };
  const writeCache = (period: number, payload: any) => {
    try {
      localStorage.setItem(cacheKey(period), JSON.stringify({ timestamp: Date.now(), data: payload }));
    } catch {}
  };

  // 🔄 Cargar datos históricos con delay para evitar rate limiting y cache TTL 2min
  const fetchHistoricalData = async (period: number, retryCount = 0) => {
    // Si hay datos y solo estamos refrescando, no mostrar loading
    if (data.length === 0) {
      setLoading(true);
    }
    setError(null);

    try {
      // Intentar cache primero (evita refetch al cambiar de vista)
      const cached = readCache(period);
      if (cached) {
        setData(cached);
        setLastUpdate(new Date()); // Actualizar lastUpdate aunque sea de caché
        setLoading(false);
        return;
      }

      const response = await fetch(
        `/api/historical?sensorId=${sensorId}&days=${period}`
      );

      if (!response.ok) {
        // Si es error 429 (rate limit), NO mostrar error crítico - mantener datos actuales
        if (response.status === 429) {
          console.warn(`⚠️ Rate limit en sensor ${sensorId}, reintentando en 30s...`);
          // Reintentar después de 30 segundos SIN mostrar error al usuario
          setTimeout(() => fetchHistoricalData(period, retryCount), 30000);
          setLoading(false);
          return;
        }
        // Si es error 500 y es el primer intento, reintentar después de 3 segundos
        if (response.status === 500 && retryCount < 1) {
          console.warn(`⚠️ Error 500 en sensor ${sensorId}, reintentando (${retryCount + 1}/1)...`);
          await new Promise(resolve => setTimeout(resolve, 3000));
          return fetchHistoricalData(period, retryCount + 1);
        }
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        // Formatear datos para Recharts con timestamp único en cada punto
        const formattedData = result.data.map((point: ChartDataPoint, index: number) => {
          // PRTG envía timestamp como texto: "22/10/2025 12:40:00 - 12:45:00"
          // Vamos a parsear la PRIMERA fecha (inicio del intervalo)
          const timestampText = point.timestamp; // ej: "22/10/2025 12:40:00 - 12:45:00"
          const startDateTime = timestampText.split(' - ')[0]; // "22/10/2025 12:40:00"
          
          // Parsear: dd/MM/yyyy HH:mm:ss
          const [datePart, timePart] = startDateTime.split(' ');
          const [day, month, year] = datePart.split('/').map(Number);
          const [hours, minutes, seconds] = timePart.split(':').map(Number);
          
          // Crear fecha en UTC (ya viene en hora Argentina desde PRTG)
          const utcDate = new Date(Date.UTC(year, month - 1, day, hours, minutes, seconds));
          const timestamp_ms = utcDate.getTime();
          
          // Formatear para display
          const dayStr = String(day).padStart(2, '0');
          const monthStr = String(month).padStart(2, '0');
          const hoursStr = String(hours).padStart(2, '0');
          const minutesStr = String(minutes).padStart(2, '0');
          
          return {
            ...point,
            // Timestamp Unix en milisegundos para el eje X
            timestamp_ms: timestamp_ms,
            // Hora formateada (HH:mm)
            time: `${hoursStr}:${minutesStr}`,
            // Fecha formateada (DD/MM)
            date: `${dayStr}/${monthStr}`,
            // Fecha completa (DD/MM HH:mm)
            fullDateTime: `${dayStr}/${monthStr} ${hoursStr}:${minutesStr}`,
            valueInKbps: point.value.toFixed(2), // Valor en kbit/s original
            valueInMbps: (point.value / 1024).toFixed(2) // Convertir kbit/s a Mbit/s
          };
        });

        setData(formattedData);
        setLastUpdate(new Date()); // Actualizar timestamp de última actualización
        writeCache(period, formattedData);
      } else {
        throw new Error(result.error || 'No se pudieron cargar los datos');
      }
    } catch (err) {
      console.error('Error al cargar datos históricos:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  // 🚀 Cargar datos al montar el componente con delay escalonado LARGO
  useEffect(() => {
    // Mapeo explícito de IDs a índices para delays predecibles
    const sensorDelayMap: Record<string, number> = {
      '13682': 0,     // CABASE - 0s
      '13683': 5000,  // TECO - 5s
      '13684': 10000, // IPLAN - 10s
      '2137': 15000,  // RDA (vlan500-WAN) - 15s
      '13673': 20000  // RDB-DTV - 20s
    };
    
    const delayMs = sensorDelayMap[sensorId] || 0;
    
    console.log(`⏱️ Sensor ${sensorId} (${sensorName}) cargará en ${delayMs/1000}s`);
    
    const timer = setTimeout(() => {
      fetchHistoricalData(selectedPeriod);
    }, delayMs);
    
    return () => clearTimeout(timer);
  }, [sensorId, selectedPeriod]);

  // 🔄 Auto-refresh cada 10 minutos (sincronizado con caché)
  useEffect(() => {
    // Mapeo de delays para el auto-refresh (más espaciados para evitar 429)
    const sensorRefreshDelayMap: Record<string, number> = {
      '13682': 0,      // CABASE - 0s
      '13683': 10000,  // TECO - 10s
      '13684': 20000,  // IPLAN - 20s
      '2137': 30000,   // RDA - 30s
      '13673': 40000   // RDB-DTV - 40s
    };
    
    const delayMs = sensorRefreshDelayMap[sensorId] || 0;
    
    const refreshTimer = setInterval(() => {
      // Solo refrescar si el caché expiró (checkeado dentro de fetchHistoricalData)
      console.log(`🔄 Auto-refresh programado para ${sensorName} (delay ${delayMs/1000}s)`);
      setTimeout(() => {
        fetchHistoricalData(selectedPeriod);
      }, delayMs);
    }, REFRESH_INTERVAL_MS);
    
    return () => clearInterval(refreshTimer);
  }, [sensorId, selectedPeriod]);

  // ⏰ Actualizar tiempo relativo cada 30 segundos
  useEffect(() => {
    const formatRelative = (date: Date): string => {
      const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
      
      if (seconds < 60) return `hace ${seconds} s`;
      const minutes = Math.floor(seconds / 60);
      if (minutes < 60) return `hace ${minutes} min`;
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return `hace ${hours} h`;
      const days = Math.floor(hours / 24);
      return `hace ${days} d`;
    };

    const updateRelativeTime = () => {
      if (lastUpdate) {
        setRelativeTime(formatRelative(lastUpdate));
      }
    };

    updateRelativeTime();
    const timer = setInterval(updateRelativeTime, 30000); // Actualizar cada 30s
    
    return () => clearInterval(timer);
  }, [lastUpdate]);

  // �📊 Custom Tooltip para el gráfico
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const value = unit === 'mbit' ? data.valueInMbps : data.valueInKbps;
      const unitLabel = unit === 'mbit' ? 'Mbit/s' : 'kbit/s';
      
      return (
        <div className="bg-gradient-to-br from-blue-50 to-white p-4 rounded-xl shadow-xl border-2 border-blue-200">
          <p className="text-xs text-gray-500 mb-1">📅 {data.fullDateTime || `${data.date} - ${data.time}`}</p>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold text-blue-600">
              {value}
            </p>
            <p className="text-lg font-semibold text-gray-700">
              {unitLabel}
            </p>
          </div>
          <p className="text-xs text-gray-400 mt-1">Velocidad en este momento</p>
        </div>
      );
    }
    return null;
  };

  // 🎨 Botones de período
  const PeriodButton = ({ period, label }: { period: number, label: string }) => (
    <button
      onClick={() => setSelectedPeriod(period)}
      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
        selectedPeriod === period
          ? 'bg-blue-600 text-white shadow-md'
          : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
      }`}
    >
      {label}
    </button>
  );

  // 🎨 Botones de unidad
  const UnitButton = ({ unitType, label }: { unitType: 'kbit' | 'mbit', label: string }) => (
    <button
      onClick={() => setUnit(unitType)}
      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
        unit === unitType
          ? 'bg-green-600 text-white shadow-md'
          : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
      {/* 📌 Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-lg font-bold text-gray-900">{sensorName}</h3>
            <p className="text-gray-500 text-xs">Histórico de Tráfico</p>
          </div>
        </div>

        {/* 🔘 Controles */}
        <div className="flex items-center justify-between gap-2">
          {/* Selector de período */}
          <div className="flex gap-1.5">
            <PeriodButton period={1} label="24h" />
            <PeriodButton period={7} label="7d" />
            <PeriodButton period={30} label="30d" />
          </div>

          {/* Selector de unidad */}
          <div className="flex gap-1.5">
            <UnitButton unitType="kbit" label="kbit/s" />
            <UnitButton unitType="mbit" label="Mbit/s" />
          </div>
        </div>
      </div>

      {/* 🔄 Estado de carga */}
      {loading && (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* ❌ Error */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 font-medium">⚠️ Error al cargar datos</p>
          <p className="text-red-600 text-sm mt-1">{error}</p>
          <button
            onClick={() => fetchHistoricalData(selectedPeriod)}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            🔄 Reintentar
          </button>
        </div>
      )}

      {/* 📈 Gráfico */}
      {!loading && !error && data.length > 0 && (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="timestamp_ms"
              domain={['dataMin', 'dataMax']}
              scale="time"
              type="number"
              stroke="#6b7280"
              style={{ fontSize: '11px' }}
              angle={-45}
              textAnchor="end"
              height={80}
              tickFormatter={(timestamp) => {
                // timestamp ya viene en la zona horaria correcta (Argentina)
                const date = new Date(timestamp);
                const hours = String(date.getUTCHours()).padStart(2, '0');
                const minutes = String(date.getUTCMinutes()).padStart(2, '0');
                return `${hours}:${minutes}`;
              }}
            />
            <YAxis 
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
              label={{ 
                value: unit === 'mbit' ? 'Tráfico (Mbit/s)' : 'Tráfico (kbit/s)', 
                angle: -90, 
                position: 'insideLeft',
                style: { fontSize: '12px', fill: '#6b7280' }
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line
              type="monotone"
              dataKey={unit === 'mbit' ? 'valueInMbps' : 'valueInKbps'}
              name="Tráfico"
              stroke="#2563eb"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}

      {/* 📊 Estadísticas */}
      {!loading && !error && data.length > 0 && (
        <>
          <div className="mt-4 grid grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-lg p-3">
              <p className="text-xs text-gray-600">Promedio</p>
              <p className="text-lg font-bold text-blue-700">
                {(() => {
                  const getValue = (d: any) => unit === 'mbit' ? parseFloat(d.valueInMbps) : parseFloat(d.valueInKbps);
                  const avg = data.reduce((acc, d: any) => acc + getValue(d), 0) / data.length;
                  return `${avg.toFixed(2)} ${unit === 'mbit' ? 'Mbit/s' : 'kbit/s'}`;
                })()}
              </p>
            </div>
            <div className="bg-green-50 rounded-lg p-3">
              <p className="text-xs text-gray-600">Máximo</p>
              <p className="text-lg font-bold text-green-700">
                {(() => {
                  const getValue = (d: any) => unit === 'mbit' ? parseFloat(d.valueInMbps) : parseFloat(d.valueInKbps);
                  const max = Math.max(...data.map(getValue));
                  return `${max.toFixed(2)} ${unit === 'mbit' ? 'Mbit/s' : 'kbit/s'}`;
                })()}
              </p>
            </div>
            <div className="bg-purple-50 rounded-lg p-3">
              <p className="text-xs text-gray-600">Mínimo</p>
              <p className="text-lg font-bold text-purple-700">
                {(() => {
                  const getValue = (d: any) => unit === 'mbit' ? parseFloat(d.valueInMbps) : parseFloat(d.valueInKbps);
                  const min = Math.min(...data.map(getValue));
                  return `${min.toFixed(2)} ${unit === 'mbit' ? 'Mbit/s' : 'kbit/s'}`;
                })()}
              </p>
            </div>
          </div>

          {/* ⏰ Última actualización */}
          {lastUpdate && (
            <div className="mt-3 text-center">
              <p className="text-xs text-gray-500">
                Última actualización: {lastUpdate.toLocaleString('es-AR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                  hour12: false
                })} {relativeTime && `(${relativeTime})`}
              </p>
            </div>
          )}
        </>
      )}

      {/* 📭 Sin datos */}
      {!loading && !error && data.length === 0 && (
        <div className="flex flex-col items-center justify-center h-64 text-gray-400">
          <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p className="text-lg font-medium">No hay datos disponibles</p>
          <p className="text-sm">para el período seleccionado</p>
        </div>
      )}
    </div>
  );
}
