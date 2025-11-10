/**
 * Script para actualizar destinatarios de las reglas de LARANET
 * Agrega md@it-tel.com.ar y ja@it-tel.com.ar además de agustin.scutari@it-tel.com.ar
 */

const VERCEL_URL = process.env.VERCEL_URL || 'https://monitoreo-redes-6srvgsivg-agustins-projects-03ad7204.vercel.app';

// Los 3 destinatarios
const recipients = [
  'agustin.scutari@it-tel.com.ar',
  'md@it-tel.com.ar',
  'ja@it-tel.com.ar'
];

// IDs de sensores LARANET
const laranetSensorIds = ['5187', '4736', '4737', '5159', '3942', '6689', '4665', '4642'];

async function getAllRules() {
  const response = await fetch(`${VERCEL_URL}/api/alerts/rules?all=true`);
  const data = await response.json();
  return data.success ? data.data : [];
}

async function updateRule(ruleId, newRecipients) {
  try {
    const response = await fetch(`${VERCEL_URL}/api/alerts/rules/${ruleId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipients: newRecipients
      })
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error(`❌ Error actualizando regla ${ruleId}:`, error.message);
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log('🔄 Actualizando destinatarios de reglas LARANET...\n');
  console.log(`📧 Nuevos destinatarios:`);
  recipients.forEach(r => console.log(`   - ${r}`));
  console.log('');
  
  // Obtener todas las reglas
  const allRules = await getAllRules();
  
  // Filtrar solo reglas de sensores LARANET
  const laranetRules = allRules.filter(rule => 
    laranetSensorIds.includes(rule.sensor_id)
  );
  
  console.log(`📋 Encontradas ${laranetRules.length} reglas de LARANET\n`);
  
  for (const rule of laranetRules) {
    console.log(`Actualizando: ${rule.name} (ID: ${rule.id})`);
    const result = await updateRule(rule.id, recipients);
    
    if (result.success) {
      console.log(`✅ Actualizada exitosamente`);
    } else {
      console.log(`❌ Error: ${result.error}`);
    }
    console.log('');
    
    // Pequeña pausa
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  
  console.log('✅ Proceso completado');
}

main().catch(console.error);
