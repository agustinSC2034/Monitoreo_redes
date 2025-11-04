/**
 * Script para crear una alerta de prueba en la base de datos
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '..', 'data', 'monitoring.db');

console.log('📂 Ruta de base de datos:', DB_PATH);

if (!fs.existsSync(DB_PATH)) {
  console.error('❌ La base de datos no existe. Ejecuta el servidor primero para crearla.');
  process.exit(1);
}

try {
  const db = new Database(DB_PATH);
  
  // Primero, crear una regla de alerta si no existe
  const ruleStmt = db.prepare(`
    INSERT OR IGNORE INTO alert_rules (
      name, sensor_id, condition, threshold, 
      channels, recipients, cooldown, priority, active
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  ruleStmt.run(
    'Prueba - IPLANxARSAT DOWN',
    '13684',
    'status_down',
    0,
    'dashboard',
    'sistema',
    300,
    'critical',
    1
  );
  
  // Obtener el ID de la regla
  const rule = db.prepare("SELECT id FROM alert_rules WHERE sensor_id = ? AND name LIKE 'Prueba%' LIMIT 1").get('13684');
  
  if (!rule) {
    throw new Error('No se pudo crear la regla de alerta');
  }
  
  // Insertar alerta de prueba
  const stmt = db.prepare(`
    INSERT INTO alert_history (
      rule_id,
      sensor_id,
      sensor_name,
      status,
      message,
      channels_sent,
      recipients,
      success,
      triggered_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  const now = new Date().toISOString();
  
  const result = stmt.run(
    rule.id, // rule_id
    '13684', // IPLANxARSAT
    'IPLANxARSAT (L2L x ARSAT)',
    'Down',
    '⚠️ ALERTA DE PRUEBA: Este es un ejemplo de cómo se verán las alertas en la campanita. El sensor IPLANxARSAT ha sido marcado como DOWN para demostración.',
    'dashboard', // canales de notificación
    'sistema',
    1, // success
    now
  );
  
  console.log('✅ Alerta de prueba creada exitosamente');
  console.log('📋 Detalles:');
  console.log('   - Sensor: IPLANxARSAT (13684)');
  console.log('   - Tipo: status_down');
  console.log('   - Severidad: critical');
  console.log('   - Fecha:', now);
  console.log('   - ID insertado:', result.lastInsertRowid);
  
  // Verificar cuántas alertas hay
  const count = db.prepare('SELECT COUNT(*) as total FROM alert_history').get();
  console.log('\n📊 Total de alertas en la base de datos:', count.total);
  
  db.close();
  console.log('\n🎉 ¡Recarga el dashboard y verás la campanita con notificación!');
  
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
