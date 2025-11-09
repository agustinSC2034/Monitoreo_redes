/**
 * 💾 Gestor de Base de Datos con Supabase (PostgreSQL)
 * 
 * Este archivo maneja la base de datos en Supabase para:
 * - Historial de estados de sensores
 * - Configuración de reglas de alertas
 * - Registro de alertas disparadas
 * - Logs de eventos
 * 
 * MIGRADO DE: SQLite (better-sqlite3) → Supabase (PostgreSQL)
 */

import { SupabaseClient, createClient } from '@supabase/supabase-js';

// Configuración de Supabase
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

let supabase: SupabaseClient | null = null;

/**
 * 🔌 Obtener cliente de Supabase (Singleton)
 */
export function getDB(): SupabaseClient {
  if (!supabase) {
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('❌ SUPABASE_URL y SUPABASE_ANON_KEY deben estar configuradas en .env.local');
    }
    
    supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✅ Cliente de Supabase inicializado');
  }
  return supabase;
}

/**
 * 📝 Interfaces TypeScript para los modelos
 */

export interface SensorHistory {
  id?: number;
  sensor_id: string;
  sensor_name: string;
  status: string;
  status_raw: number;
  message?: string;
  lastvalue?: string;
  timestamp: number;
  created_at?: string;
}

export interface AlertRule {
  id?: number;
  name: string;
  sensor_id: string;
  condition: 'down' | 'warning' | 'unusual' | 'slow' | 'traffic_spike' | 'traffic_drop';
  threshold?: number;
  duration?: number;
  channels: string[];
  recipients: string[];
  cooldown: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AlertHistory {
  id?: number;
  rule_id: number;
  sensor_id: string;
  sensor_name: string;
  status: string;
  message?: string;
  channels_sent: string[];
  recipients: string[];
  success: boolean;
  error_message?: string;
  triggered_at?: string;
}

export interface StatusChange {
  id?: number;
  sensor_id: string;
  sensor_name: string;
  old_status: string;
  new_status: string;
  duration?: number;
  timestamp: number;
  created_at?: string;
}

export interface SystemLog {
  id?: number;
  level: 'info' | 'warn' | 'error' | 'debug';
  category: string;
  message: string;
  metadata?: any;
  timestamp: number;
  created_at?: string;
}

/**
 * 📊 Funciones de acceso a datos
 */

// ========== SENSOR HISTORY ==========

export async function saveSensorHistory(data: SensorHistory) {
  const db = getDB();
  
  const { data: result, error } = await db
    .from('sensor_history')
    .insert([{
      sensor_id: data.sensor_id,
      sensor_name: data.sensor_name,
      status: data.status,
      status_raw: data.status_raw,
      message: data.message || null,
      lastvalue: data.lastvalue || null,
      timestamp: data.timestamp
    }])
    .select();
  
  if (error) {
    console.error('❌ Error guardando historial:', error);
    throw error;
  }
  
  return result;
}

export async function getSensorHistory(sensorId: string, limit: number = 100) {
  const db = getDB();
  
  const { data, error } = await db
    .from('sensor_history')
    .select('*')
    .eq('sensor_id', sensorId)
    .order('timestamp', { ascending: false })
    .limit(limit);
  
  if (error) {
    console.error('❌ Error obteniendo historial:', error);
    throw error;
  }
  
  return data as SensorHistory[];
}

export async function getAllRecentHistory(limit: number = 1000) {
  const db = getDB();
  
  const { data, error } = await db
    .from('sensor_history')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(limit);
  
  if (error) {
    console.error('❌ Error obteniendo historial reciente:', error);
    throw error;
  }
  
  return data as SensorHistory[];
}

// ========== ALERT RULES ==========

export async function createAlertRule(rule: AlertRule) {
  const db = getDB();
  
  const { data, error } = await db
    .from('alert_rules')
    .insert([{
      name: rule.name,
      sensor_id: rule.sensor_id,
      condition: rule.condition,
      threshold: rule.threshold || null,
      duration: rule.duration || null,
      channels: rule.channels,
      recipients: rule.recipients,
      cooldown: rule.cooldown,
      priority: rule.priority,
      active: rule.active
    }])
    .select();
  
  if (error) {
    console.error('❌ Error creando regla:', error);
    throw error;
  }
  
  return data;
}

export async function getAlertRules(activeOnly: boolean = true) {
  const db = getDB();
  
  let query = db.from('alert_rules').select('*');
  
  if (activeOnly) {
    query = query.eq('active', true);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('❌ Error obteniendo reglas:', error);
    throw error;
  }
  
  return data as AlertRule[];
}

export async function getAlertRuleBySensor(sensorId: string) {
  const db = getDB();
  
  const { data, error } = await db
    .from('alert_rules')
    .select('*')
    .eq('sensor_id', sensorId)
    .eq('active', true);
  
  if (error) {
    console.error('❌ Error obteniendo reglas por sensor:', error);
    throw error;
  }
  
  return data as AlertRule[];
}

export async function updateAlertRule(id: number, updates: Partial<AlertRule>) {
  const db = getDB();
  
  const { data, error } = await db
    .from('alert_rules')
    .update(updates)
    .eq('id', id)
    .select();
  
  if (error) {
    console.error('❌ Error actualizando regla:', error);
    throw error;
  }
  
  return data;
}

export async function deleteAlertRule(id: number) {
  const db = getDB();
  
  const { error } = await db
    .from('alert_rules')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('❌ Error eliminando regla:', error);
    throw error;
  }
  
  return true;
}

// ========== ALERT HISTORY ==========

export async function saveAlertHistory(alert: AlertHistory) {
  const db = getDB();
  
  const { data, error } = await db
    .from('alert_history')
    .insert([{
      rule_id: alert.rule_id,
      sensor_id: alert.sensor_id,
      sensor_name: alert.sensor_name,
      status: alert.status,
      message: alert.message || null,
      channels_sent: alert.channels_sent,
      recipients: alert.recipients,
      success: alert.success,
      error_message: alert.error_message || null
    }])
    .select();
  
  if (error) {
    console.error('❌ Error guardando historial de alerta:', error);
    throw error;
  }
  
  return data;
}

export async function getAlertHistory(limit: number = 100) {
  const db = getDB();
  
  const { data, error } = await db
    .from('alert_history')
    .select('*')
    .order('triggered_at', { ascending: false })
    .limit(limit);
  
  if (error) {
    console.error('❌ Error obteniendo historial de alertas:', error);
    throw error;
  }
  
  return data as AlertHistory[];
}

// ========== STATUS CHANGES ==========

export async function saveStatusChange(change: StatusChange) {
  const db = getDB();
  
  const { data, error } = await db
    .from('status_changes')
    .insert([{
      sensor_id: change.sensor_id,
      sensor_name: change.sensor_name,
      old_status: change.old_status,
      new_status: change.new_status,
      duration: change.duration || null,
      timestamp: change.timestamp
    }])
    .select();
  
  if (error) {
    console.error('❌ Error guardando cambio de estado:', error);
    throw error;
  }
  
  return data;
}

export async function getStatusChanges(sensorId?: string, limit: number = 100) {
  const db = getDB();
  
  let query = db
    .from('status_changes')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(limit);
  
  if (sensorId) {
    query = query.eq('sensor_id', sensorId);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('❌ Error obteniendo cambios de estado:', error);
    throw error;
  }
  
  return data as StatusChange[];
}

// ========== SYSTEM LOGS ==========

export async function saveSystemLog(log: SystemLog) {
  const db = getDB();
  
  const { data, error } = await db
    .from('system_logs')
    .insert([{
      level: log.level,
      category: log.category,
      message: log.message,
      metadata: log.metadata || null,
      timestamp: log.timestamp
    }])
    .select();
  
  if (error) {
    console.error('❌ Error guardando log del sistema:', error);
    throw error;
  }
  
  return data;
}

export async function getSystemLogs(level?: string, category?: string, limit: number = 100) {
  const db = getDB();
  
  let query = db
    .from('system_logs')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(limit);
  
  if (level) {
    query = query.eq('level', level);
  }
  
  if (category) {
    query = query.eq('category', category);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('❌ Error obteniendo logs del sistema:', error);
    throw error;
  }
  
  return data as SystemLog[];
}

// ========== ESTADÍSTICAS ==========

export async function getSensorUptime(sensorId: string, days: number = 7) {
  const db = getDB();
  const startTime = Math.floor(Date.now() / 1000) - (days * 24 * 60 * 60);
  
  const { data, error } = await db
    .from('sensor_history')
    .select('status_raw')
    .eq('sensor_id', sensorId)
    .gte('timestamp', startTime);
  
  if (error) {
    console.error('❌ Error obteniendo uptime:', error);
    return { uptime: 100, downtime: 0, warning: 0, total_records: 0 };
  }
  
  if (!data || data.length === 0) {
    return { uptime: 100, downtime: 0, warning: 0, total_records: 0 };
  }
  
  const totalRecords = data.length;
  const upCount = data.filter((r: any) => r.status_raw === 3).length;
  const downCount = data.filter((r: any) => r.status_raw === 5).length;
  const warningCount = data.filter((r: any) => r.status_raw === 4).length;
  
  return {
    uptime: (upCount / totalRecords) * 100,
    downtime: (downCount / totalRecords) * 100,
    warning: (warningCount / totalRecords) * 100,
    total_records: totalRecords
  };
}

export async function getDowntimeEvents(sensorId: string, days: number = 7) {
  const db = getDB();
  const startTime = Math.floor(Date.now() / 1000) - (days * 24 * 60 * 60);
  
  const { data, error } = await db
    .from('status_changes')
    .select('*')
    .eq('sensor_id', sensorId)
    .eq('new_status', 'Down')
    .gte('timestamp', startTime)
    .order('timestamp', { ascending: false });
  
  if (error) {
    console.error('❌ Error obteniendo eventos de caída:', error);
    throw error;
  }
  
  return data as StatusChange[];
}

/**
 * 📋 Obtener UNA regla de alerta por ID
 */
export async function getAlertRule(ruleId: number): Promise<AlertRule | null> {
  const db = getDB();
  
  const { data, error } = await db
    .from('alert_rules')
    .select('*')
    .eq('id', ruleId)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') {
      // No encontrado
      return null;
    }
    console.error('❌ Error obteniendo regla:', error);
    throw error;
  }
  
  if (!data) return null;
  
  return {
    ...data,
    channels: JSON.parse(data.channels),
    recipients: JSON.parse(data.recipients)
  } as AlertRule;
}

/**
 * 🔄 Actualizar destinatarios de una regla
 */
export async function updateAlertRuleRecipients(
  ruleId: number,
  recipients: string[]
): Promise<boolean> {
  const db = getDB();
  
  const { error } = await db
    .from('alert_rules')
    .update({ recipients: JSON.stringify(recipients) })
    .eq('id', ruleId);
  
  if (error) {
    console.error('❌ Error actualizando destinatarios:', error);
    return false;
  }
  
  console.log(`✅ Regla ${ruleId} actualizada: ${recipients.length} destinatarios`);
  return true;
}

export default getDB;
