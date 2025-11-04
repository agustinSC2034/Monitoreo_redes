/**
 * 💾 Gestor de Base de Datos SQLite
 * 
 * Este archivo maneja la base de datos local para:
 * - Historial de estados de sensores
 * - Configuración de reglas de alertas
 * - Registro de alertas disparadas
 * - Logs de eventos
 */

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Ruta de la base de datos (en el directorio del proyecto)
const DB_PATH = path.join(process.cwd(), 'data', 'monitoring.db');

// Crear directorio si no existe
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
  console.log('📁 Directorio de datos creado:', dataDir);
}

// Conexión a la base de datos
let db: Database.Database;

/**
 * 🔌 Obtener instancia de la base de datos (Singleton)
 */
export function getDB(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL'); // Mejor performance
    console.log('✅ Conexión a base de datos establecida:', DB_PATH);
    initDatabase();
  }
  return db;
}

/**
 * 🏗️ Inicializar tablas de la base de datos
 */
function initDatabase() {
  const db = getDB();

  // Tabla: Historial de estados de sensores
  db.exec(`
    CREATE TABLE IF NOT EXISTS sensor_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sensor_id VARCHAR(50) NOT NULL,
      sensor_name VARCHAR(200) NOT NULL,
      status VARCHAR(50) NOT NULL,
      status_raw INTEGER NOT NULL,
      message TEXT,
      lastvalue TEXT,
      timestamp INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // Crear índices para sensor_history
  db.exec(`CREATE INDEX IF NOT EXISTS idx_sensor_timestamp ON sensor_history(sensor_id, timestamp)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_timestamp ON sensor_history(timestamp)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_status ON sensor_history(status)`);

  // Tabla: Reglas de alertas
  db.exec(`
    CREATE TABLE IF NOT EXISTS alert_rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name VARCHAR(200) NOT NULL,
      sensor_id VARCHAR(50) NOT NULL,
      condition VARCHAR(50) NOT NULL,
      threshold REAL,
      duration INTEGER,
      channels TEXT NOT NULL,
      recipients TEXT NOT NULL,
      cooldown INTEGER DEFAULT 300,
      priority VARCHAR(20) DEFAULT 'medium',
      active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tabla: Alertas disparadas (historial)
  db.exec(`
    CREATE TABLE IF NOT EXISTS alert_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      rule_id INTEGER NOT NULL,
      sensor_id VARCHAR(50) NOT NULL,
      sensor_name VARCHAR(200) NOT NULL,
      status VARCHAR(50) NOT NULL,
      message TEXT,
      channels_sent TEXT,
      recipients TEXT,
      success BOOLEAN DEFAULT 1,
      error_message TEXT,
      triggered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (rule_id) REFERENCES alert_rules(id)
    )
  `);

  // Tabla: Logs de eventos del sistema
  db.exec(`
    CREATE TABLE IF NOT EXISTS system_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      level VARCHAR(20) NOT NULL,
      category VARCHAR(50) NOT NULL,
      message TEXT NOT NULL,
      metadata TEXT,
      timestamp INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // Crear índices para system_logs
  db.exec(`CREATE INDEX IF NOT EXISTS idx_level ON system_logs(level)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_category ON system_logs(category)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_log_timestamp ON system_logs(timestamp)`);

  // Tabla: Detección de cambios de estado
  db.exec(`
    CREATE TABLE IF NOT EXISTS status_changes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sensor_id VARCHAR(50) NOT NULL,
      sensor_name VARCHAR(200) NOT NULL,
      old_status VARCHAR(50) NOT NULL,
      new_status VARCHAR(50) NOT NULL,
      duration INTEGER,
      timestamp INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // Crear índice para status_changes
  db.exec(`CREATE INDEX IF NOT EXISTS idx_status_sensor_timestamp ON status_changes(sensor_id, timestamp)`);

  console.log('✅ Tablas de base de datos inicializadas');
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
  condition: 'down' | 'warning' | 'unusual' | 'slow';
  threshold?: number;
  duration?: number;
  channels: string[]; // ['email', 'whatsapp']
  recipients: string[]; // ['user@example.com', '+5491234567890']
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

export function saveSensorHistory(data: SensorHistory) {
  const db = getDB();
  const stmt = db.prepare(`
    INSERT INTO sensor_history (sensor_id, sensor_name, status, status_raw, message, lastvalue, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  
  return stmt.run(
    data.sensor_id,
    data.sensor_name,
    data.status,
    data.status_raw,
    data.message || null,
    data.lastvalue || null,
    data.timestamp
  );
}

export function getSensorHistory(sensorId: string, limit: number = 100) {
  const db = getDB();
  const stmt = db.prepare(`
    SELECT * FROM sensor_history 
    WHERE sensor_id = ? 
    ORDER BY timestamp DESC 
    LIMIT ?
  `);
  
  return stmt.all(sensorId, limit) as SensorHistory[];
}

export function getAllRecentHistory(limit: number = 1000) {
  const db = getDB();
  const stmt = db.prepare(`
    SELECT * FROM sensor_history 
    ORDER BY timestamp DESC 
    LIMIT ?
  `);
  
  return stmt.all(limit) as SensorHistory[];
}

// ========== ALERT RULES ==========

export function createAlertRule(rule: AlertRule) {
  const db = getDB();
  const stmt = db.prepare(`
    INSERT INTO alert_rules (name, sensor_id, condition, threshold, duration, channels, recipients, cooldown, priority, active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  return stmt.run(
    rule.name,
    rule.sensor_id,
    rule.condition,
    rule.threshold || null,
    rule.duration || null,
    JSON.stringify(rule.channels),
    JSON.stringify(rule.recipients),
    rule.cooldown,
    rule.priority,
    rule.active ? 1 : 0
  );
}

export function getAlertRules(activeOnly: boolean = true) {
  const db = getDB();
  const query = activeOnly
    ? 'SELECT * FROM alert_rules WHERE active = 1'
    : 'SELECT * FROM alert_rules';
  
  const rules = db.prepare(query).all() as any[];
  
  // Parsear JSON de channels y recipients
  return rules.map(rule => ({
    ...rule,
    channels: JSON.parse(rule.channels),
    recipients: JSON.parse(rule.recipients),
    active: rule.active === 1
  })) as AlertRule[];
}

export function getAlertRuleBySensor(sensorId: string) {
  const db = getDB();
  const stmt = db.prepare(`
    SELECT * FROM alert_rules 
    WHERE sensor_id = ? AND active = 1
  `);
  
  const rules = stmt.all(sensorId) as any[];
  
  return rules.map(rule => ({
    ...rule,
    channels: JSON.parse(rule.channels),
    recipients: JSON.parse(rule.recipients),
    active: rule.active === 1
  })) as AlertRule[];
}

export function updateAlertRule(id: number, updates: Partial<AlertRule>) {
  const db = getDB();
  const fields = [];
  const values = [];
  
  if (updates.name) {
    fields.push('name = ?');
    values.push(updates.name);
  }
  if (updates.condition) {
    fields.push('condition = ?');
    values.push(updates.condition);
  }
  if (updates.threshold !== undefined) {
    fields.push('threshold = ?');
    values.push(updates.threshold);
  }
  if (updates.channels) {
    fields.push('channels = ?');
    values.push(JSON.stringify(updates.channels));
  }
  if (updates.recipients) {
    fields.push('recipients = ?');
    values.push(JSON.stringify(updates.recipients));
  }
  if (updates.active !== undefined) {
    fields.push('active = ?');
    values.push(updates.active ? 1 : 0);
  }
  
  fields.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);
  
  const stmt = db.prepare(`
    UPDATE alert_rules 
    SET ${fields.join(', ')}
    WHERE id = ?
  `);
  
  return stmt.run(...values);
}

export function deleteAlertRule(id: number) {
  const db = getDB();
  const stmt = db.prepare('DELETE FROM alert_rules WHERE id = ?');
  return stmt.run(id);
}

// ========== ALERT HISTORY ==========

export function saveAlertHistory(alert: AlertHistory) {
  const db = getDB();
  const stmt = db.prepare(`
    INSERT INTO alert_history (rule_id, sensor_id, sensor_name, status, message, channels_sent, recipients, success, error_message)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  return stmt.run(
    alert.rule_id,
    alert.sensor_id,
    alert.sensor_name,
    alert.status,
    alert.message || null,
    JSON.stringify(alert.channels_sent),
    JSON.stringify(alert.recipients),
    alert.success ? 1 : 0,
    alert.error_message || null
  );
}

export function getAlertHistory(limit: number = 100) {
  const db = getDB();
  const stmt = db.prepare(`
    SELECT * FROM alert_history 
    ORDER BY triggered_at DESC 
    LIMIT ?
  `);
  
  const alerts = stmt.all(limit) as any[];
  
  return alerts.map(alert => ({
    ...alert,
    channels_sent: JSON.parse(alert.channels_sent),
    recipients: JSON.parse(alert.recipients),
    success: alert.success === 1
  })) as AlertHistory[];
}

// ========== STATUS CHANGES ==========

export function saveStatusChange(change: StatusChange) {
  const db = getDB();
  const stmt = db.prepare(`
    INSERT INTO status_changes (sensor_id, sensor_name, old_status, new_status, duration, timestamp)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  return stmt.run(
    change.sensor_id,
    change.sensor_name,
    change.old_status,
    change.new_status,
    change.duration || null,
    change.timestamp
  );
}

export function getStatusChanges(sensorId?: string, limit: number = 100) {
  const db = getDB();
  const query = sensorId
    ? 'SELECT * FROM status_changes WHERE sensor_id = ? ORDER BY timestamp DESC LIMIT ?'
    : 'SELECT * FROM status_changes ORDER BY timestamp DESC LIMIT ?';
  
  const stmt = db.prepare(query);
  const params = sensorId ? [sensorId, limit] : [limit];
  
  return stmt.all(...params) as StatusChange[];
}

// ========== SYSTEM LOGS ==========

export function saveSystemLog(log: SystemLog) {
  const db = getDB();
  const stmt = db.prepare(`
    INSERT INTO system_logs (level, category, message, metadata, timestamp)
    VALUES (?, ?, ?, ?, ?)
  `);
  
  return stmt.run(
    log.level,
    log.category,
    log.message,
    log.metadata ? JSON.stringify(log.metadata) : null,
    log.timestamp
  );
}

export function getSystemLogs(level?: string, category?: string, limit: number = 100) {
  const db = getDB();
  let query = 'SELECT * FROM system_logs WHERE 1=1';
  const params: any[] = [];
  
  if (level) {
    query += ' AND level = ?';
    params.push(level);
  }
  
  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }
  
  query += ' ORDER BY timestamp DESC LIMIT ?';
  params.push(limit);
  
  const stmt = db.prepare(query);
  const logs = stmt.all(...params) as any[];
  
  return logs.map(log => ({
    ...log,
    metadata: log.metadata ? JSON.parse(log.metadata) : null
  })) as SystemLog[];
}

// ========== ESTADÍSTICAS ==========

export function getSensorUptime(sensorId: string, days: number = 7) {
  const db = getDB();
  const startTime = Date.now() / 1000 - (days * 24 * 60 * 60);
  
  const stmt = db.prepare(`
    SELECT 
      COUNT(*) as total_records,
      SUM(CASE WHEN status_raw = 3 THEN 1 ELSE 0 END) as up_count,
      SUM(CASE WHEN status_raw = 5 THEN 1 ELSE 0 END) as down_count,
      SUM(CASE WHEN status_raw = 4 THEN 1 ELSE 0 END) as warning_count
    FROM sensor_history
    WHERE sensor_id = ? AND timestamp >= ?
  `);
  
  const result = stmt.get(sensorId, startTime) as any;
  
  if (!result || result.total_records === 0) {
    return { uptime: 100, downtime: 0, warning: 0 };
  }
  
  return {
    uptime: (result.up_count / result.total_records) * 100,
    downtime: (result.down_count / result.total_records) * 100,
    warning: (result.warning_count / result.total_records) * 100,
    total_records: result.total_records
  };
}

export function getDowntimeEvents(sensorId: string, days: number = 7) {
  const db = getDB();
  const startTime = Date.now() / 1000 - (days * 24 * 60 * 60);
  
  const stmt = db.prepare(`
    SELECT * FROM status_changes
    WHERE sensor_id = ? AND new_status = 'Down' AND timestamp >= ?
    ORDER BY timestamp DESC
  `);
  
  return stmt.all(sensorId, startTime) as StatusChange[];
}

// Cerrar conexión al terminar (solo en desarrollo)
if (process.env.NODE_ENV !== 'production') {
  process.on('exit', () => {
    if (db) {
      db.close();
      console.log('🔒 Conexión a base de datos cerrada');
    }
  });
}

export default getDB;
