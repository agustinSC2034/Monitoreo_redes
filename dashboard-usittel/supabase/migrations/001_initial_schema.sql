-- ========================================
-- 🗄️ MIGRACIÓN A SUPABASE
-- Dashboard USITTEL - Monitoreo de Red
-- ========================================
-- Este archivo contiene el schema completo de la base de datos
-- Ejecutar en Supabase SQL Editor

-- ========================================
-- Tabla: Historial de estados de sensores
-- ========================================
CREATE TABLE IF NOT EXISTS sensor_history (
  id BIGSERIAL PRIMARY KEY,
  sensor_id VARCHAR(50) NOT NULL,
  sensor_name VARCHAR(200) NOT NULL,
  status VARCHAR(50) NOT NULL,
  status_raw INTEGER NOT NULL,
  message TEXT,
  lastvalue TEXT,
  timestamp BIGINT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para sensor_history
CREATE INDEX IF NOT EXISTS idx_sensor_timestamp ON sensor_history(sensor_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_timestamp ON sensor_history(timestamp);
CREATE INDEX IF NOT EXISTS idx_status ON sensor_history(status);

-- ========================================
-- Tabla: Reglas de alertas
-- ========================================
CREATE TABLE IF NOT EXISTS alert_rules (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  sensor_id VARCHAR(50) NOT NULL,
  condition VARCHAR(50) NOT NULL,
  threshold REAL,
  duration INTEGER,
  channels JSONB NOT NULL,
  recipients JSONB NOT NULL,
  cooldown INTEGER DEFAULT 300,
  priority VARCHAR(20) DEFAULT 'medium',
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para búsqueda rápida de reglas activas
CREATE INDEX IF NOT EXISTS idx_alert_rules_sensor_active ON alert_rules(sensor_id, active);

-- ========================================
-- Tabla: Historial de alertas disparadas
-- ========================================
CREATE TABLE IF NOT EXISTS alert_history (
  id BIGSERIAL PRIMARY KEY,
  rule_id BIGINT NOT NULL,
  sensor_id VARCHAR(50) NOT NULL,
  sensor_name VARCHAR(200) NOT NULL,
  status VARCHAR(50) NOT NULL,
  message TEXT,
  channels_sent JSONB,
  recipients JSONB,
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT,
  triggered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (rule_id) REFERENCES alert_rules(id) ON DELETE CASCADE
);

-- Índice para historial de alertas
CREATE INDEX IF NOT EXISTS idx_alert_history_triggered ON alert_history(triggered_at DESC);
CREATE INDEX IF NOT EXISTS idx_alert_history_sensor ON alert_history(sensor_id);

-- ========================================
-- Tabla: Cambios de estado detectados
-- ========================================
CREATE TABLE IF NOT EXISTS status_changes (
  id BIGSERIAL PRIMARY KEY,
  sensor_id VARCHAR(50) NOT NULL,
  sensor_name VARCHAR(200) NOT NULL,
  old_status VARCHAR(50) NOT NULL,
  new_status VARCHAR(50) NOT NULL,
  duration INTEGER,
  timestamp BIGINT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para status_changes
CREATE INDEX IF NOT EXISTS idx_status_sensor_timestamp ON status_changes(sensor_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_status_changes_timestamp ON status_changes(timestamp DESC);

-- ========================================
-- Tabla: Logs del sistema
-- ========================================
CREATE TABLE IF NOT EXISTS system_logs (
  id BIGSERIAL PRIMARY KEY,
  level VARCHAR(20) NOT NULL,
  category VARCHAR(50) NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB,
  timestamp BIGINT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para system_logs
CREATE INDEX IF NOT EXISTS idx_level ON system_logs(level);
CREATE INDEX IF NOT EXISTS idx_category ON system_logs(category);
CREATE INDEX IF NOT EXISTS idx_log_timestamp ON system_logs(timestamp);

-- ========================================
-- Funciones auxiliares
-- ========================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para alert_rules
DROP TRIGGER IF EXISTS update_alert_rules_updated_at ON alert_rules;
CREATE TRIGGER update_alert_rules_updated_at
  BEFORE UPDATE ON alert_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- Políticas de seguridad (RLS)
-- ========================================
-- Por ahora deshabilitadas para simplificar
-- En producción, considera habilitar RLS

ALTER TABLE sensor_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE alert_rules DISABLE ROW LEVEL SECURITY;
ALTER TABLE alert_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE status_changes DISABLE ROW LEVEL SECURITY;
ALTER TABLE system_logs DISABLE ROW LEVEL SECURITY;

-- ========================================
-- Comentarios en las tablas
-- ========================================
COMMENT ON TABLE sensor_history IS 'Historial completo de estados de sensores PRTG';
COMMENT ON TABLE alert_rules IS 'Reglas configuradas para disparar alertas';
COMMENT ON TABLE alert_history IS 'Registro de todas las alertas enviadas';
COMMENT ON TABLE status_changes IS 'Detección de cambios de estado (Up->Down, etc)';
COMMENT ON TABLE system_logs IS 'Logs internos del sistema de monitoreo';

-- ========================================
-- Fin de la migración
-- ========================================
