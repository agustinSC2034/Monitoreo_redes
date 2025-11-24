/**
 * 💾 Gestor de Base de Datos Supabase (PostgreSQL)
 * 
 * Migrado desde SQLite a Supabase para deployment en Vercel
 */

import { SupabaseClient, createClient } from '@supabase/supabase-js';

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

let supabase: SupabaseClient;

/**
 * 🔌 Obtener cliente de Supabase (Singleton)
 */
export function getDB(): SupabaseClient {
  if (!supabase) {
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('❌ Supabase no configurado. Verifica NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local');
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
}

export interface AlertRule {
  id?: number;
  name: string;
  sensor_id: string;
  condition: 'down' | 'warning' | 'unusual' | 'slow' | 'traffic_low' | 'traffic_spike' | 'traffic_drop';
  threshold?: number;
  channels: string[];
  recipients: string[];
  cooldown: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  created_at?: number;
}

export interface AlertHistory {
  id?: number;
  rule_id: number;
  sensor_id: string;
  sensor_name: string;
  status: string;
  message: string;
  channels_sent: string[];
  recipients: string[];
  success: boolean;
  error_message?: string;
  timestamp?: number;
  created_at?: string; // Timestamp de creación en formato ISO
}

export interface StatusChange {
  id?: number;
  sensor_id: string;
  sensor_name: string;
  old_status: string;
  new_status: string;
  duration?: number;
  timestamp: number;
}

export interface SystemLog {
  id?: number;
  level: 'info' | 'warn' | 'error' | 'debug';
  category: string;
  message: string;
  metadata?: any;
  timestamp: number;
}

/**
 * 📊 Funciones de acceso a datos
 */

// ========== SENSOR HISTORY ==========

export async function saveSensorHistory(data: SensorHistory) {
  const db = getDB();
  const { error } = await db
    .from('sensor_history')
    .insert({
      sensor_id: data.sensor_id,
      sensor_name: data.sensor_name,
      status: data.status,
      status_raw: data.status_raw,
      message: data.message || null,
      lastvalue: data.lastvalue || null,
      timestamp: data.timestamp
    });
  
  if (error) {
    console.error('❌ Error guardando historial de sensor:', error);
    throw error;
  }
}

export async function getSensorHistory(sensorId: string, limit: number = 100): Promise<SensorHistory[]> {
  const db = getDB();
  const { data, error } = await db
    .from('sensor_history')
    .select('*')
    .eq('sensor_id', sensorId)
    .order('timestamp', { ascending: false })
    .limit(limit);
  
  if (error) {
    console.error('❌ Error obteniendo historial:', error);
    return [];
  }
  
  return data || [];
}

export async function getAllRecentHistory(limit: number = 1000): Promise<SensorHistory[]> {
  const db = getDB();
  const { data, error } = await db
    .from('sensor_history')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(limit);
  
  if (error) {
    console.error('❌ Error obteniendo historial reciente:', error);
    return [];
  }
  
  return data || [];
}

// ========== ALERT RULES ==========

export async function createAlertRule(rule: AlertRule) {
  const db = getDB();
  const { data, error } = await db
    .from('alert_rules')
    .insert({
      name: rule.name,
      sensor_id: rule.sensor_id,
      condition: rule.condition,
      threshold: rule.threshold || null,
      channels: rule.channels,
      recipients: rule.recipients,
      cooldown: rule.cooldown,
      priority: rule.priority,
      enabled: rule.enabled
    })
    .select();
  
  if (error) {
    console.error('❌ Error creando regla de alerta:', error);
    throw error;
  }
  
  return data?.[0];
}

export async function getAlertRules(activeOnly: boolean = true): Promise<AlertRule[]> {
  const db = getDB();
  let query = db.from('alert_rules').select('*');
  
  if (activeOnly) {
    query = query.eq('enabled', true);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('❌ Error obteniendo reglas de alerta:', error);
    return [];
  }
  
  // Parsear channels si viene como string
  const rules = (data || []).map(rule => ({
    ...rule,
    channels: typeof rule.channels === 'string' ? JSON.parse(rule.channels) : rule.channels
  }));
  
  return rules;
}

export async function getAlertRuleBySensor(sensorId: string): Promise<AlertRule[]> {
  const db = getDB();
  const { data, error } = await db
    .from('alert_rules')
    .select('*')
    .eq('sensor_id', sensorId)
    .eq('enabled', true);
  
  if (error) {
    console.error('❌ Error obteniendo reglas por sensor:', error);
    return [];
  }
  
  // Parsear channels si viene como string
  const rules = (data || []).map(rule => ({
    ...rule,
    channels: typeof rule.channels === 'string' ? JSON.parse(rule.channels) : rule.channels
  }));
  
  return rules;
}

export async function updateAlertRule(id: number, updates: Partial<AlertRule>) {
  const db = getDB();
  const { error } = await db
    .from('alert_rules')
    .update(updates)
    .eq('id', id);
  
  if (error) {
    console.error('❌ Error actualizando regla:', error);
    throw error;
  }
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
}

// ========== ALERT HISTORY ==========

export async function saveAlertHistory(alert: AlertHistory) {
  const db = getDB();
  const { error } = await db
    .from('alert_history')
    .insert({
      rule_id: alert.rule_id,
      sensor_id: alert.sensor_id,
      sensor_name: alert.sensor_name,
      status: alert.status,
      message: alert.message,
      channels_sent: alert.channels_sent,
      recipients: alert.recipients,
      success: alert.success,
      error_message: alert.error_message || null
    });
  
  if (error) {
    console.error('❌ Error guardando historial de alerta:', error);
    throw error;
  }
}

export async function getAlertHistory(limit: number = 100): Promise<AlertHistory[]> {
  const db = getDB();
  const { data, error } = await db
    .from('alert_history')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(limit);
  
  if (error) {
    console.error('❌ Error obteniendo historial de alertas:', error);
    return [];
  }
  
  return data || [];
}

/**
 * 🔍 Obtener la última alerta enviada para una regla y sensor específicos
 */
export async function getLastAlertForRule(ruleId: number, sensorId: string): Promise<AlertHistory | null> {
  const db = getDB();
  const { data, error } = await db
    .from('alert_history')
    .select('*')
    .eq('rule_id', ruleId)
    .eq('sensor_id', sensorId)
    .eq('success', true)
    .order('timestamp', { ascending: false })
    .limit(1);
  
  if (error) {
    console.error('❌ Error obteniendo última alerta:', error);
    return null;
  }
  
  return data && data.length > 0 ? data[0] : null;
}

/**
 * 🔍 Obtener el último cambio de estado registrado para un sensor
 */
export async function getLastStatusChange(sensorId: string): Promise<StatusChange | null> {
  const db = getDB();
  const { data, error } = await db
    .from('status_changes')
    .select('*')
    .eq('sensor_id', sensorId)
    .order('timestamp', { ascending: false })
    .limit(1);
  
  if (error) {
    console.error('❌ Error obteniendo último cambio de estado:', error);
    return null;
  }
  
  return data && data.length > 0 ? data[0] : null;
}

// ========== STATUS CHANGES ==========

export async function saveStatusChange(change: StatusChange) {
  const db = getDB();
  const { error } = await db
    .from('status_changes')
    .insert({
      sensor_id: change.sensor_id,
      sensor_name: change.sensor_name,
      old_status: change.old_status,
      new_status: change.new_status,
      duration: change.duration || null,
      timestamp: change.timestamp
    });
  
  if (error) {
    console.error('❌ Error guardando cambio de estado:', error);
    throw error;
  }
}

export async function getStatusChanges(sensorId?: string, limit: number = 100): Promise<StatusChange[]> {
  const db = getDB();
  let query = db.from('status_changes').select('*');
  
  if (sensorId) {
    query = query.eq('sensor_id', sensorId);
  }
  
  const { data, error } = await query
    .order('timestamp', { ascending: false })
    .limit(limit);
  
  if (error) {
    console.error('❌ Error obteniendo cambios de estado:', error);
    return [];
  }
  
  return data || [];
}

// ========== SYSTEM LOGS ==========

export async function saveSystemLog(log: SystemLog) {
  const db = getDB();
  const { error } = await db
    .from('system_logs')
    .insert({
      level: log.level,
      category: log.category,
      message: log.message,
      metadata: log.metadata || null,
      timestamp: log.timestamp
    });
  
  if (error) {
    console.error('❌ Error guardando log del sistema:', error);
    // No lanzar error para logs, solo registrar
  }
}

export async function getSystemLogs(
  level?: string,
  category?: string,
  limit: number = 100
): Promise<SystemLog[]> {
  const db = getDB();
  let query = db.from('system_logs').select('*');
  
  if (level) {
    query = query.eq('level', level);
  }
  
  if (category) {
    query = query.eq('category', category);
  }
  
  const { data, error } = await query
    .order('timestamp', { ascending: false })
    .limit(limit);
  
  if (error) {
    console.error('❌ Error obteniendo logs:', error);
    return [];
  }
  
  return data || [];
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
  
  if (error || !data || data.length === 0) {
    return { uptime: 100, downtime: 0, warning: 0, total_records: 0 };
  }
  
  const total = data.length;
  const upCount = data.filter(r => r.status_raw === 3).length;
  const downCount = data.filter(r => r.status_raw === 5).length;
  const warningCount = data.filter(r => r.status_raw === 4).length;
  
  return {
    uptime: (upCount / total) * 100,
    downtime: (downCount / total) * 100,
    warning: (warningCount / total) * 100,
    total_records: total
  };
}

export async function getDowntimeEvents(sensorId: string, days: number = 7): Promise<StatusChange[]> {
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
    return [];
  }
  
  return data || [];
}

export default getDB;
