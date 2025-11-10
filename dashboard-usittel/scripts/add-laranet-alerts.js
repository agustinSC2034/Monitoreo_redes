/**
 * Script para agregar reglas de alertas para sensores LARANET (La Matanza)
 * Crea reglas de "Enlace Caído" para los 8 sensores
 */

const VERCEL_URL = process.env.VERCEL_URL || 'https://monitoreo-redes-44f9ixb7a-agustins-projects-03ad7204.vercel.app';

// Sensores LARANET con sus nombres
const laranetSensors = [
  { id: '5187', name: 'VLAN500-WAN (Lomas de Eziza)' },
  { id: '4736', name: 'Túnel a Lomas de Zamora' },
  { id: '4737', name: 'Túnel a Monte Grande' },
  { id: '5159', name: 'Moron' },
  { id: '3942', name: 'Zárate' },
  { id: '6689', name: 'Túnel a José C Paz' },
  { id: '4665', name: 'Túnel a San Miguel' },
  { id: '4642', name: 'Túnel a Moreno' }
];

// Solo email para pruebas (como indicaste)
const testRecipient = 'agustin.scutari@it-tel.com.ar';

async function createDownAlertRule(sensorId, sensorName) {
  try {
    const response = await fetch(`${VERCEL_URL}/api/alerts/rules`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `${sensorName} - Enlace Caído`,
        sensor_id: sensorId,
        condition: 'down',
        threshold: null,
        priority: 'critical',
        channels: ['email'],
        recipients: [testRecipient],
        cooldown: 300,
        active: true
      })
    });

    const result = await response.json();
    
    if (result.success) {
      console.log(`✅ Regla creada para ${sensorName} (${sensorId})`);
    } else {
      console.error(`❌ Error creando regla para ${sensorId}:`, result.error);
    }
    
    return result;
  } catch (error) {
    console.error(`❌ Error en la petición para ${sensorId}:`, error.message);
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log('🚀 Creando reglas de alertas para LARANET (La Matanza)...\n');
  console.log(`📧 Destinatario de prueba: ${testRecipient}\n`);
  
  for (const sensor of laranetSensors) {
    await createDownAlertRule(sensor.id, sensor.name);
    // Pequeña pausa entre requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n✅ Proceso completado');
  console.log('🔍 Verifica las reglas en: /dashboard/alertas/configuracion');
}

main().catch(console.error);
