/**
 * 📱 Script: Actualizar destinatarios de alertas
 * 
 * Agrega WhatsApp y emails a todas las reglas existentes
 * 
 * Uso: node scripts/update-alert-recipients.js
 */

const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'data', 'monitoring.db');

// Configuración de destinatarios
const RECIPIENTS = {
  emails: [
    'agustin.scutari@it-tel.com.ar'
    // Agregar más emails aquí
  ],
  whatsapp: [
    '+5491124682247'
    // Agregar más números aquí (deben estar en Sandbox)
  ]
};

async function updateRecipients() {
  try {
    console.log('🔄 Actualizando destinatarios de alertas...\n');
    
    const db = new Database(DB_PATH);
    
    // Obtener todas las reglas activas
    const rules = db.prepare('SELECT * FROM alert_rules WHERE active = 1').all();
    
    if (rules.length === 0) {
      console.log('⚠️  No hay reglas activas para actualizar');
      db.close();
      return;
    }
    
    console.log(`📋 Reglas encontradas: ${rules.length}\n`);
    
    // Preparar canales y destinatarios
    const channels = [];
    const allRecipients = [];
    
    if (RECIPIENTS.emails.length > 0) {
      channels.push('email');
      allRecipients.push(...RECIPIENTS.emails);
    }
    
    if (RECIPIENTS.whatsapp.length > 0) {
      channels.push('whatsapp');
      allRecipients.push(...RECIPIENTS.whatsapp);
    }
    
    console.log('🎯 Configuración:');
    console.log(`   Canales: ${channels.join(', ')}`);
    console.log(`   Emails: ${RECIPIENTS.emails.join(', ')}`);
    console.log(`   WhatsApp: ${RECIPIENTS.whatsapp.join(', ')}\n`);
    
    // Actualizar todas las reglas
    const updateStmt = db.prepare(`
      UPDATE alert_rules 
      SET 
        channels = ?,
        recipients = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    
    let updated = 0;
    
    for (const rule of rules) {
      updateStmt.run(
        JSON.stringify(channels),
        JSON.stringify(allRecipients),
        rule.id
      );
      
      console.log(`✅ ${rule.name}`);
      console.log(`   Sensor ID: ${rule.sensor_id}`);
      console.log(`   Canales: ${channels.join(', ')}`);
      console.log(`   Destinatarios: ${allRecipients.length}`);
      console.log('');
      
      updated++;
    }
    
    db.close();
    
    console.log(`\n🎉 ¡Listo! ${updated} reglas actualizadas correctamente`);
    console.log('\n📊 Resumen:');
    console.log(`   ✅ ${RECIPIENTS.emails.length} email(s) configurado(s)`);
    console.log(`   ✅ ${RECIPIENTS.whatsapp.length} WhatsApp(s) configurado(s)`);
    console.log('\n🚨 Las alertas automáticas ahora enviarán por ambos canales');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Ejecutar
updateRecipients();
