'use client';

/**
 * 📊 Hook: Recolector de Datos Históricos
 * 
 * Este hook hace polling cada 2-3 minutos a /api/table.json (la misma fuente que las tarjetas)
 * y guarda los valores en localStorage para construir un historial confiable.
 * 
 * Ventajas:
 * - Usa EXACTAMENTE la misma fuente que las tarjetas (100% consistencia)
 * - No dependemos de historicdata.xml que tiene valores diferentes
 * - Control total sobre los datos
 */

import { useEffect } from 'react';

const POLL_INTERVAL_MS = 2 * 60 * 1000; // 2 minutos
const MAX_HISTORY_MS = 2 * 60 * 60 * 1000; // 2 horas
const STORAGE_KEY_PREFIX = 'sensor_history_';

interface DataPoint {
  timestamp: number; // Unix timestamp en ms
  value: number; // kbit/s
  formattedValue: string; // "4.521.281 kbit/s"
}

interface SensorHistory {
  sensorId: string;
  data: DataPoint[];
  lastUpdate: number;
}

/**
 * Guarda un punto de datos en el historial del sensor
 */
function saveDataPoint(sensorId: string, value: number, formattedValue: string) {
  const storageKey = `${STORAGE_KEY_PREFIX}${sensorId}`;
  
  try {
    // Leer historial existente
    const existingRaw = localStorage.getItem(storageKey);
    let history: SensorHistory = existingRaw 
      ? JSON.parse(existingRaw)
      : { sensorId, data: [], lastUpdate: 0 };

    // Agregar nuevo punto
    const now = Date.now();
    const newPoint: DataPoint = {
      timestamp: now,
      value,
      formattedValue
    };

    history.data.push(newPoint);
    history.lastUpdate = now;

    // Limpiar datos antiguos (>2 horas)
    const cutoffTime = now - MAX_HISTORY_MS;
    history.data = history.data.filter(point => point.timestamp >= cutoffTime);

    // Guardar en localStorage
    localStorage.setItem(storageKey, JSON.stringify(history));
    
    console.log(`📊 [${sensorId}] Guardado: ${value.toFixed(2)} kbit/s (${history.data.length} puntos en historial)`);
  } catch (error) {
    console.error(`❌ Error guardando datos para sensor ${sensorId}:`, error);
  }
}

/**
 * Lee el historial completo de un sensor
 */
export function getHistoryForSensor(sensorId: string): DataPoint[] {
  const storageKey = `${STORAGE_KEY_PREFIX}${sensorId}`;
  
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return [];
    
    const history: SensorHistory = JSON.parse(raw);
    
    // Limpiar datos antiguos antes de retornar
    const now = Date.now();
    const cutoffTime = now - MAX_HISTORY_MS;
    const filteredData = history.data.filter(point => point.timestamp >= cutoffTime);
    
    return filteredData;
  } catch (error) {
    console.error(`❌ Error leyendo historial de sensor ${sensorId}:`, error);
    return [];
  }
}

/**
 * Obtiene los datos actuales de todos los sensores desde /api/sensors
 */
async function fetchCurrentSensorData() {
  try {
    const response = await fetch('/api/sensors');
    
    if (!response.ok) {
      console.warn(`⚠️ Error fetching sensors: ${response.status}`);
      return;
    }

    const result = await response.json();
    
    if (!result.success || !result.data) {
      console.warn('⚠️ No se recibieron datos de sensores');
      return;
    }

    // Guardar cada sensor en el historial
    for (const sensor of result.data) {
      if (sensor.lastvalue_raw && sensor.lastvalue) {
        saveDataPoint(
          sensor.objid.toString(),
          sensor.lastvalue_raw, // valor en kbit/s
          sensor.lastvalue // string formateado "4.521.281 kbit/s"
        );
      }
    }
  } catch (error) {
    console.error('❌ Error en fetchCurrentSensorData:', error);
  }
}

/**
 * Hook principal: inicia el polling automático
 */
export function useHistoricalDataCollector() {
  useEffect(() => {
    console.log('🚀 Iniciando recolector de datos históricos...');
    
    // Capturar datos inmediatamente al montar
    fetchCurrentSensorData();
    
    // Luego cada 2 minutos
    const intervalId = setInterval(() => {
      console.log('🔄 Actualizando datos históricos...');
      fetchCurrentSensorData();
    }, POLL_INTERVAL_MS);
    
    return () => {
      console.log('🛑 Deteniendo recolector de datos históricos');
      clearInterval(intervalId);
    };
  }, []);
}

/**
 * Limpia todo el historial (útil para debugging)
 */
export function clearAllHistory() {
  const keys = Object.keys(localStorage);
  keys.forEach(key => {
    if (key.startsWith(STORAGE_KEY_PREFIX)) {
      localStorage.removeItem(key);
    }
  });
  console.log('🗑️ Historial completo eliminado');
}
