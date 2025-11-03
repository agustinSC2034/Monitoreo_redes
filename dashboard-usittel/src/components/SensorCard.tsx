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

  // Parsear dd/MM/yyyy HH:mm:ss a Date local y restar 3 horas
  const parseArgDate = (s: string): Date | null => {
    const m = s.match(/(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2}):(\d{2})/);
    if (!m) return null;
    const [, dd, mm, yyyy, HH, MM, SS] = m;
    const date = new Date(
      parseInt(yyyy),
      parseInt(mm) - 1,
      parseInt(dd),
      parseInt(HH),
      parseInt(MM),
      parseInt(SS)
    );
    // Restar 3 horas para ajustar zona horaria
    date.setHours(date.getHours() - 3);
    return date;
  };

  // Formatear fecha ajustada para display
  const formatDisplayDate = (d: Date): string => {
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
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
    <div className={`rounded-xl shadow-lg p-6 border-2 hover:shadow-xl transition-all duration-300 ${
      getBorderColor(statusRaw)
    } ${
      theme === 'light' ? 'bg-white' : 'bg-gray-800'
    }`}>
      {/* Header con nombre y estado */}
      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-xl font-bold transition-colors duration-300 ${
          theme === 'light' ? 'text-gray-800' : 'text-gray-100'
        }`}>{name}</h3>
        <div className={`w-4 h-4 rounded-full ${getStatusColor(statusRaw)} animate-pulse`} />
      </div>

      {/* Dispositivo */}
      <p className={`text-sm mb-3 transition-colors duration-300 ${
        theme === 'light' ? 'text-gray-500' : 'text-gray-400'
      }`}>{device}</p>

      {/* Selector de unidad */}
      <div className="flex gap-1.5 mb-3">
        <button
          onClick={() => setUnit('kbit')}
          className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
            unit === 'kbit'
              ? 'bg-green-600 text-white shadow-md'
              : theme === 'light'
                ? 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600'
          }`}
        >
          kbit/s
        </button>
        <button
          onClick={() => setUnit('mbit')}
          className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
            unit === 'mbit'
              ? 'bg-green-600 text-white shadow-md'
              : theme === 'light'
                ? 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600'
          }`}
        >
          Mbit/s
        </button>
      </div>

      {/* Valor de tráfico (grande y destacado) */}
      <div className="mb-4">
        <p className={`text-3xl font-bold mb-1 transition-colors duration-300 ${
          theme === 'light' ? 'text-gray-900' : 'text-gray-100'
        }`}>
          {displayValue}
        </p>
        <p className={`text-sm transition-colors duration-300 ${
          theme === 'light' ? 'text-gray-600' : 'text-gray-400'
        }`}>{status}</p>
      </div>

      {/* Última actualización */}
      <div className={`border-t pt-3 transition-colors duration-300 ${
        theme === 'light' ? 'border-gray-200' : 'border-gray-700'
      }`}>
        <p className={`text-xs transition-colors duration-300 ${
          theme === 'light' ? 'text-gray-500' : 'text-gray-400'
        }`}>
          Última actualización: {absoluteLastCheck}
          {relativeLastCheck ? ` (${relativeLastCheck})` : ''}
        </p>
      </div>
    </div>
  );
}
