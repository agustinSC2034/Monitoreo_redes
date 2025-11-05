/**
 * Componente: Tarjeta de Sensor
 * Diseño minimalista y profesional
 */

import { useEffect, useMemo, useState } from 'react';

interface SensorCardProps {
  id: string;
  name: string;
  device: string;
  status: string;
  statusRaw: number;
  lastValue: string;
  lastCheck: string;
  message: string;
  theme?: 'light' | 'dark';
}

export default function SensorCard({ 
  name, 
  device,
  status, 
  statusRaw, 
  lastValue, 
  lastCheck,
  theme = 'light'
}: SensorCardProps) {
  
  const [unit, setUnit] = useState<'kbit' | 'mbit'>('mbit');
  const [now, setNow] = useState<Date>(new Date());
  
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  // Determinar el color según el estado
  const getStatusColor = (statusRaw: number) => {
    switch (statusRaw) {
      case 3: return theme === 'light' ? 'bg-green-500' : 'bg-green-400';
      case 4: return theme === 'light' ? 'bg-yellow-500' : 'bg-yellow-400';
      case 5: return theme === 'light' ? 'bg-red-500' : 'bg-red-400';
      case 13: return theme === 'light' ? 'bg-orange-500' : 'bg-orange-400';
      default: return theme === 'light' ? 'bg-gray-400' : 'bg-gray-500';
    }
  };

  // Limpiar HTML del lastCheck
  const cleanLastCheck = (text: string) => {
    if (!text) return '';
    let cleaned = text.replace(/<[^>]*>/g, '').trim();
    cleaned = cleaned.replace(/\s*\[[^\]]*\]$/g, '').trim();
    return cleaned;
  };

  // Parsear fecha
  const parseArgDate = (s: string): Date | null => {
    const m = s.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{2}):(\d{2}):(\d{2})/);
    if (!m) return null;
    const [, dd, mm, yyyy, HH, MM, SS] = m;
    return new Date(
      parseInt(yyyy),
      parseInt(mm) - 1,
      parseInt(dd),
      parseInt(HH),
      parseInt(MM),
      parseInt(SS)
    );
  };

  // Formatear fecha
  const formatDisplayDate = (d: Date): string => {
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  };

  // Formatear relativo
  const formatRelative = (from: Date, to: Date) => {
    const diffSec = Math.max(0, Math.floor((to.getTime() - from.getTime()) / 1000));
    if (diffSec < 60) return `${diffSec}s`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h`;
    const diffDay = Math.floor(diffHr / 24);
    return `${diffDay}d`;
  };

  const absoluteLastCheck = useMemo(() => {
    const cleaned = cleanLastCheck(lastCheck);
    const d = parseArgDate(cleaned);
    return d ? formatDisplayDate(d) : cleaned;
  }, [lastCheck]);
  
  const relativeLastCheck = useMemo(() => {
    const cleaned = cleanLastCheck(lastCheck);
    const d = parseArgDate(cleaned);
    return d ? formatRelative(d, now) : '';
  }, [lastCheck, now]);

  // Convertir el valor según la unidad
  const displayValue = useMemo(() => {
    const match = lastValue.match(/([\d.,]+)\s*kbit\/s/i);
    if (!match) return lastValue;
    
    let numStr = match[1].replace(/\./g, '').replace(',', '.');
    const kbitValue = parseFloat(numStr);
    
    if (unit === 'kbit') {
      return `${kbitValue.toFixed(2)} kbit/s`;
    } else {
      const mbitValue = kbitValue / 1000;
      return `${mbitValue.toFixed(2)} Mbit/s`;
    }
  }, [lastValue, unit]);

  return (
    <div className={`rounded-lg border overflow-hidden transition-all ${
      theme === 'light'
        ? 'bg-white border-gray-200 hover:border-gray-300'
        : 'bg-gray-800 border-gray-700 hover:border-gray-600'
    }`}>
      {/* Indicador de estado */}
      <div className={`h-1 ${getStatusColor(statusRaw)}`}></div>
      
      <div className="p-4">
        {/* Nombre */}
        <div className={`text-sm font-medium mb-1 ${
          theme === 'light' ? 'text-gray-900' : 'text-white'
        }`}>
          {name}
        </div>

        {/* Dispositivo */}
        <div className={`text-xs mb-3 ${
          theme === 'light' ? 'text-gray-500' : 'text-gray-400'
        }`}>
          {device}
        </div>

        {/* Selector de unidad */}
        <div className="flex gap-1 mb-3">
          <button
            onClick={() => setUnit('kbit')}
            className={`flex-1 px-2 py-1 rounded text-xs transition-colors ${
              unit === 'kbit'
                ? theme === 'light'
                  ? 'bg-gray-900 text-white'
                  : 'bg-white text-gray-900'
                : theme === 'light'
                  ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            kbit/s
          </button>
          <button
            onClick={() => setUnit('mbit')}
            className={`flex-1 px-2 py-1 rounded text-xs transition-colors ${
              unit === 'mbit'
                ? theme === 'light'
                  ? 'bg-gray-900 text-white'
                  : 'bg-white text-gray-900'
                : theme === 'light'
                  ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Mbit/s
          </button>
        </div>

        {/* Valor de tráfico */}
        <div className="mb-3">
          <div className={`text-2xl font-light mb-1 ${
            theme === 'light' ? 'text-gray-900' : 'text-white'
          }`}>
            {displayValue}
          </div>
          <div className={`text-xs ${
            theme === 'light' ? 'text-gray-600' : 'text-gray-400'
          }`}>
            {status}
          </div>
        </div>

        {/* Última actualización */}
        <div className={`pt-3 border-t text-xs ${
          theme === 'light' ? 'border-gray-200 text-gray-500' : 'border-gray-700 text-gray-400'
        }`}>
          <div>{absoluteLastCheck}</div>
          {relativeLastCheck && (
            <div className="mt-0.5">{relativeLastCheck}</div>
          )}
        </div>
      </div>
    </div>
  );
}
