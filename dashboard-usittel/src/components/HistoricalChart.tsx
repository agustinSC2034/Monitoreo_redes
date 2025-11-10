'use client';

/**
 * 📊 Componente: Gráfico Histórico SIMPLIFICADO
 * 
 * Usa historicdata.xml de PRTG con el canal "Traffic Total (Speed)"
 * que es el que muestra PRTG en su interfaz web
 */

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
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
  timestamp_ms: number;
  time: string;
  valueInKbps: number;
  valueInMbps: number;
}

export default function HistoricalChart({ 
  sensorId, 
  sensorName
}: HistoricalChartProps) {
  const [data, setData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unit, setUnit] = useState<'kbit' | 'mbit'>('mbit');

  // Cargar datos de 2 horas
  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/historical?sensorId=${sensorId}&days=0.0833`);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        const formatted = result.data.map((point: any) => {
          // datetime_raw ya viene en timestamp Unix (segundos)
          const date = new Date(point.datetime_raw * 1000);
          
          return {
            timestamp_ms: point.datetime_raw * 1000,
            time: date.toLocaleTimeString('es-AR', { 
              hour: '2-digit', 
              minute: '2-digit',
              timeZone: 'America/Argentina/Buenos_Aires'
            }),
            valueInKbps: point.value,
            valueInMbps: point.value / 1000
          };
        });

        setData(formatted);
      }
    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Espaciar la carga inicial según el sensor para evitar rate limiting
    // Pausas más largas para evitar errores 429/500
    const sensorDelays: Record<string, number> = {
      '13682': 0,      // CABASE - inmediato
      '13683': 2000,   // TECO - 2s
      '13684': 4000,   // ARSAT - 4s
      '2137': 6000,    // RDA - 6s
      '13673': 8000    // DTV - 8s
    };
    
    const initialDelay = sensorDelays[sensorId] || 0;
    
    console.log(`📊 [${sensorName}] Esperando ${initialDelay}ms antes de cargar...`);
    
    const initialTimeout = setTimeout(() => {
      console.log(`📊 [${sensorName}] Iniciando carga de gráfico...`);
      fetchData();
    }, initialDelay);
    
    const interval = setInterval(fetchData, 120000); // Cada 2 minutos
    
    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [sensorId]);

  const UnitButton = ({ unitType, label }: { unitType: 'kbit' | 'mbit', label: string }) => (
    <button
      onClick={() => setUnit(unitType)}
      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 ${
        unit === unitType
          ? 'bg-green-600 text-white shadow-md hover:bg-green-700'
          : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300 hover:border-gray-400'
      }`}
    >
      {label}
    </button>
  );

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 mb-4">{sensorName}</h3>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 mb-4">{sensorName}</h3>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">⚠️ Error: {error}</p>
          <button onClick={fetchData} className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg transition-all duration-200 hover:scale-105 hover:bg-red-700">
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-lg font-bold text-gray-900">{sensorName}</h3>
            <p className="text-gray-500 text-xs">Últimas 2 horas</p>
          </div>
        </div>

        <div className="flex justify-end gap-1.5">
          <UnitButton unitType="kbit" label="kbit/s" />
          <UnitButton unitType="mbit" label="Mbit/s" />
        </div>
      </div>

      {data.length > 0 ? (
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
              tickFormatter={(ts) => new Date(ts).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
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
            <Legend />
            <Line
              type="monotone"
              dataKey={unit === 'mbit' ? 'valueInMbps' : 'valueInKbps'}
              name="Tráfico"
              stroke="#2563eb"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex flex-col items-center justify-center h-64 text-gray-400">
          <p>No hay datos disponibles</p>
        </div>
      )}
    </div>
  );
}
