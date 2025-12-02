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
  unit?: 'kbit' | 'mbit';
  onUnitChange?: (unit: 'kbit' | 'mbit') => void;
  isWholesale?: boolean; // Nuevo: indica si es un enlace mayorista principal
}

export default function SensorCard({ 
  name, 
  device,
  status, 
  statusRaw, 
  lastValue, 
  lastCheck,
  theme = 'light',
  unit: externalUnit,
  onUnitChange,
  isWholesale = false
}: SensorCardProps) {
  
  const [internalUnit, setInternalUnit] = useState<'kbit' | 'mbit'>('mbit');
  const unit = externalUnit !== undefined ? externalUnit : internalUnit;
  
  const handleUnitChange = (newUnit: 'kbit' | 'mbit') => {
    if (onUnitChange) {
      onUnitChange(newUnit);
    } else {
      setInternalUnit(newUnit);
    }
  };
  
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

  // Parsear fecha (asumiendo que viene en hora de Argentina UTC-3)
  const parseArgDate = (s: string): Date | null => {
    const m = s.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{2}):(\d{2}):(\d{2})/);
    if (!m) return null;
    const [, dd, mm, yyyy, HH, MM, SS] = m;
    
    // Crear la fecha en formato ISO con zona horaria de Argentina (UTC-3)
    const isoString = `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}T${HH}:${MM}:${SS}-03:00`;
    return new Date(isoString);
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
        {/* Nombre con ícono si es mayorista */}
        <div className={`text-sm font-medium mb-1 flex items-center gap-2 ${
          theme === 'light' ? 'text-gray-900' : 'text-white'
        }`}>
          {isWholesale && (
            <span 
              className="text-base" 
              title="Enlace mayorista principal"
            >
              🌐
            </span>
          )}
          <span>{name}</span>
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
            onClick={() => handleUnitChange('kbit')}
            className={`flex-1 px-2 py-1 rounded text-xs transition-all duration-200 hover:scale-105 ${
              unit === 'kbit'
                ? theme === 'light'
                  ? 'bg-gray-900 text-white hover:bg-gray-800'
                  : 'bg-white text-gray-900 hover:bg-gray-100'
                : theme === 'light'
                  ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            kbit/s
          </button>
          <button
            onClick={() => handleUnitChange('mbit')}
            className={`flex-1 px-2 py-1 rounded text-xs transition-all duration-200 hover:scale-105 ${
              unit === 'mbit'
                ? theme === 'light'
                  ? 'bg-gray-900 text-white hover:bg-gray-800'
                  : 'bg-white text-gray-900 hover:bg-gray-100'
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
