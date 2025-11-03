/**
 * 🎴 Componente: Tarjeta de Sensor
 * 
 * Muestra el estado de un enlace WAN de forma visual
 * - Nombre del enlace
 * - Estado (🟢 verde si UP, 🔴 rojo si DOWN)
 * - Valor actual de tráfico
 * - Última actualización
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
}

export default function SensorCard({ 
  name, 
  device,
  status, 
  statusRaw, 
  lastValue, 
  lastCheck 
}: SensorCardProps) {
  
  // Estado para la unidad seleccionada
  const [unit, setUnit] = useState<'kbit' | 'mbit'>('mbit');
  
  // Tick para actualizar el relativo cada 30s
  const [now, setNow] = useState<Date>(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  // 🎨 Determinar el color según el estado
  const getStatusColor = (statusRaw: number) => {
    switch (statusRaw) {
      case 3: return 'bg-green-500'; // Up
      case 4: return 'bg-yellow-500'; // Warning
      case 5: return 'bg-red-500'; // Down
      case 13: return 'bg-orange-500'; // Down Acknowledged
      default: return 'bg-gray-500'; // Unknown
    }
  };

  // 🎨 Color del borde de la tarjeta
  const getBorderColor = (statusRaw: number) => {
    switch (statusRaw) {
      case 3: return 'border-green-200'; // Up
      case 4: return 'border-yellow-200'; // Warning
      case 5: return 'border-red-200'; // Down
      default: return 'border-gray-200'; // Unknown
    }
  };

  // 🧹 Limpiar HTML del lastCheck (viene con <span> y demás)
  const cleanLastCheck = (text: string) => {
    if (!text) return '';
    // 1) Eliminar HTML
    let cleaned = text.replace(/<[^>]*>/g, '').trim();
    // 2) Eliminar sufijos de tipo " [hace 9 s]" si existieran
    cleaned = cleaned.replace(/\s*\[[^\]]*\]$/g, '').trim();
    return cleaned;
  };

  // Parsear dd/MM/yyyy HH:mm:ss a Date local
  const parseArgDate = (s: string): Date | null => {
    const m = s.match(/(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2}):(\d{2})/);
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

  // Formatear relativo "hace X"
  const formatRelative = (from: Date, to: Date) => {
    const diffSec = Math.max(0, Math.floor((to.getTime() - from.getTime()) / 1000));
    if (diffSec < 60) return `hace ${diffSec} s`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `hace ${diffMin} min`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `hace ${diffHr} h`;
    const diffDay = Math.floor(diffHr / 24);
    return `hace ${diffDay} d`;
  };

  const absoluteLastCheck = useMemo(() => cleanLastCheck(lastCheck), [lastCheck]);
  const relativeLastCheck = useMemo(() => {
    const d = parseArgDate(absoluteLastCheck);
    return d ? formatRelative(d, now) : '';
  }, [absoluteLastCheck, now]);

  // Convertir el valor según la unidad seleccionada
  const displayValue = useMemo(() => {
    // lastValue viene como "4.730.793 kbit/s" (formato europeo con puntos como separador de miles)
    const match = lastValue.match(/([\d.,]+)\s*kbit\/s/i);
    if (!match) return lastValue; // Si no matchea, devolver original
    
    // Remover puntos (separadores de miles) y cambiar coma por punto (decimal)
    let numStr = match[1].replace(/\./g, '').replace(',', '.');
    const kbitValue = parseFloat(numStr);
    
    if (unit === 'kbit') {
      return `${kbitValue.toFixed(2)} kbit/s`;
    } else {
      // 1 Mbit = 1000 kbit (no 1024)
      const mbitValue = kbitValue / 1000;
      return `${mbitValue.toFixed(2)} Mbit/s`;
    }
  }, [lastValue, unit]);

  return (
    <div className={`bg-white rounded-xl shadow-lg p-6 border-2 ${getBorderColor(statusRaw)} hover:shadow-xl transition-shadow duration-300`}>
      {/* Header con nombre y estado */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-800">{name}</h3>
        <div className={`w-4 h-4 rounded-full ${getStatusColor(statusRaw)} animate-pulse`} />
      </div>

      {/* Dispositivo */}
      <p className="text-sm text-gray-500 mb-3">{device}</p>

      {/* Selector de unidad */}
      <div className="flex gap-1.5 mb-3">
        <button
          onClick={() => setUnit('kbit')}
          className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
            unit === 'kbit'
              ? 'bg-green-600 text-white shadow-md'
              : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
          }`}
        >
          kbit/s
        </button>
        <button
          onClick={() => setUnit('mbit')}
          className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
            unit === 'mbit'
              ? 'bg-green-600 text-white shadow-md'
              : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
          }`}
        >
          Mbit/s
        </button>
      </div>

      {/* Valor de tráfico (grande y destacado) */}
      <div className="mb-4">
        <p className="text-3xl font-bold text-gray-900 mb-1">
          {displayValue}
        </p>
        <p className="text-sm text-gray-600">{status}</p>
      </div>

      {/* Última actualización */}
      <div className="border-t border-gray-200 pt-3">
        <p className="text-xs text-gray-500">
          Última actualización: {absoluteLastCheck}
          {relativeLastCheck ? ` (${relativeLastCheck})` : ''}
        </p>
      </div>
    </div>
  );
}
