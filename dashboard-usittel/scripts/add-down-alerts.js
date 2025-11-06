/**
 * 🚨 Script: Agregar alertas de estado DOWN
 * 
 * Agrega reglas para detectar cuando un enlace cae (DOWN)
 * 
 * Uso: node scripts/add-down-alerts.js
 */

const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'data', 'monitoring.db');

// Destinatarios (deben coincidir con las reglas existentes)
const CHANNELS = ['email', 'whatsapp'];
const RECIPIENTS = [
  'agustin.scutari@it-tel.com.ar',
  '+5491124682247'
];

// Reglas de alertas DOWN para sensores críticos
const DOWN_ALERTS = [
  {
    name: 'CABASE - Enlace Caído (DOWN)',
    sensor_id: '13682',
    condition: 'down',
    priority: 'critical',
    cooldown: 300 // 5 minutos
  },
  {
    name: 'IPLANxARSAT - Enlace Caído (DOWN)',
    sensor_id: '13684',
    condition: 'down',
    priority: 'critical',
    cooldown: 300
  },
  {
    name: 'TECO - Enlace Caído (DOWN)',
    sensor_id: '13683',
    condition: 'down',
    priority: 'high',
    cooldown: 300
  },
  {
    name: 'RDA-WAN - Enlace Caído (DOWN)',
    sensor_id: '2137',
    condition: 'down',
    priority: 'critical',
    cooldown: 300
  },
  {
    name: 'RDB-DTV - Enlace Caído (DOWN)',
    sensor_id: '13673',
    condition: 'down',
    priority: 'high',
    cooldown: 300
  }
];

async function addDownAlerts() {
  try {
    console.log('🚨 Agregando alertas de estado DOWN...\n');
    
    const db = new Database(DB_PATH);
    
    // Verificar si ya existen reglas DOWN
    const existingDown = db.prepare("SELECT COUNT(*) as count FROM alert_rules WHERE condition = 'down'").get();
    
    if (existingDown.count > 0) {
      console.log(`⚠️  Ya existen ${existingDown.count} reglas DOWN configuradas`);
      console.log('    Si quieres recrearlas, elimínalas primero.');
      db.close();
      return;
    }
    
    // Preparar INSERT
    const insertStmt = db.prepare(`
      INSERT INTO alert_rules (
        name, sensor_id, condition, threshold, duration,
        channels, recipients, cooldown, priority, active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `);
    
    let created = 0;
    
    console.log('📋 Creando reglas de alerta DOWN:\n');
    
    for (const alert of DOWN_ALERTS) {
      const result = insertStmt.run(
        alert.name,
        alert.sensor_id,
        alert.condition,
        null, // threshold (no aplica para DOWN)
        null, // duration (no aplica para DOWN)
        JSON.stringify(CHANNELS),
        JSON.stringify(RECIPIENTS),
        alert.cooldown,
        alert.priority
      );
      
      console.log(`✅ ${alert.name}`);
      console.log(`   Sensor ID: ${alert.sensor_id}`);
      console.log(`   Prioridad: ${alert.priority.toUpperCase()}`);
      console.log(`   Cooldown: ${alert.cooldown}s (${alert.cooldown / 60} min)`);
      console.log('');
      
      created++;
    }
    
    db.close();
    
    console.log(`\n🎉 ¡Listo! ${created} reglas DOWN creadas correctamente\n`);
    console.log('📊 Resumen:');
    console.log(`   ✅ ${created} alertas de estado DOWN configuradas`);
    console.log(`   📧 Email: ${RECIPIENTS.filter(r => r.includes('@')).join(', ')}`);
    console.log(`   📱 WhatsApp: ${RECIPIENTS.filter(r => r.startsWith('+')).join(', ')}`);
    console.log('\n🚨 El sistema ahora alertará cuando un enlace caiga (DOWN)');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Ejecutar
addDownAlerts();
