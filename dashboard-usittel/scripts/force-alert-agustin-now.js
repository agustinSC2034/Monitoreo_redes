/**
 * 🧪 Enviar alerta FORZADA solo a agustin.scutari@it-tel.com.ar
 * 
 * Este script:
 * 1. Crea una regla temporal con umbral BAJO (siempre se dispara)
 * 2. Fuerza el disparo inmediato
 * 3. Solo email (sin Telegram)
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const https = require('https');

// Cargar variables de entorno
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    envVars[match[1].trim()] = match[2].trim();
  }
});

const supabase = createClient(
  envVars.NEXT_PUBLIC_SUPABASE_URL,
  envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function createForceTestRule() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🧪 CREAR REGLA DE PRUEBA FORZADA');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Eliminar cualquier regla de prueba anterior
  await supabase
    .from('alert_rules')
    .delete()
    .like('name', '%PRUEBA%FORZADA%');

  console.log('📝 Creando nueva regla con umbral MUY BAJO...\n');
  
  // Crear nueva regla de UMBRAL (slow) muy bajo - siempre se dispara
  const { data: created, error } = await supabase
    .from('alert_rules')
    .insert({
      name: '🧪 PRUEBA FORZADA WAN-to-RDB > 10 Mbit/s',
      sensor_id: '13726',
      condition: 'slow', // Umbral máximo
      threshold: 10, // MUY BAJO - sensor tiene ~1800 Mbit/s actual
      priority: 'high',
      channels: ['email'], // Solo email
      recipients: ['agustin.scutari@it-tel.com.ar'], // Solo Agustín
      cooldown: 0, // Sin cooldown
      enabled: true
    })
    .select()
    .single();

  if (error) {
    console.error('❌ Error creando regla:', error.message);
    return null;
  }

  console.log('✅ Regla creada:');
  console.log(`   ID: ${created.id}`);
  console.log(`   Nombre: ${created.name}`);
  console.log(`   Sensor: 13726 (WAN-to-RDB)`);
  console.log(`   Condición: slow (umbral máximo)`);
  console.log(`   Umbral: 10 Mbit/s (sensor actual: ~1800 Mbit/s)`);
  console.log(`   Canales: ["email"]`);
  console.log(`   Destinatario: agustin.scutari@it-tel.com.ar`);
  console.log(`   Cooldown: 0`);
  console.log(`   ⚡ SE DISPARARÁ INMEDIATAMENTE\n`);

  return created.id;
}

async function triggerAlert() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🚀 FORZAR DISPARO DE ALERTA');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  return new Promise((resolve, reject) => {
    const timestamp = Date.now();
    const url = `https://monitoreo-redes.vercel.app/api/cron/check-alerts?location=tandil&_t=${timestamp}`;
    
    console.log('📞 Llamando al endpoint de alertas...');
    console.log(`   URL: ${url}`);
    console.log(`   Timestamp: ${new Date().toLocaleString('es-AR')}\n`);
    
    https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          console.log(`✅ Status HTTP: ${res.statusCode}`);
          console.log(`📊 Sensor 13726:`);
          const sensor13726 = json.results?.find(r => r.sensor_id === '13726');
          if (sensor13726) {
            console.log(`   Estado: ${sensor13726.status}`);
            console.log(`   Tráfico: ${sensor13726.value}`);
          }
          console.log('');
          resolve(json);
        } catch (e) {
          console.error('❌ Error parseando respuesta:', e.message);
          reject(e);
        }
      });
    }).on('error', (err) => {
      console.error('❌ Error en request:', err.message);
      reject(err);
    });
  });
}

async function cleanupTestRule(ruleId) {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🧹 ELIMINAR REGLA DE PRUEBA');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const { error } = await supabase
    .from('alert_rules')
    .delete()
    .eq('id', ruleId);

  if (error) {
    console.log(`⚠️  No se pudo eliminar automáticamente (ID: ${ruleId})`);
    console.log(`   Elimínala manualmente con:`);
    console.log(`   node scripts/delete-test-rule.js ${ruleId}\n`);
  } else {
    console.log(`✅ Regla de prueba eliminada (ID: ${ruleId})\n`);
  }
}

async function main() {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════╗');
  console.log('║  🧪 ALERTA FORZADA - SOLO AGUSTÍN                 ║');
  console.log('╚════════════════════════════════════════════════════╝');
  console.log('');

  try {
    // Paso 1: Crear regla de prueba con umbral bajo
    const ruleId = await createForceTestRule();
    
    if (!ruleId) {
      console.log('❌ No se pudo crear la regla de prueba');
      return;
    }

    // Esperar 3 segundos para que se guarde en BD
    console.log('⏳ Esperando 3 segundos...\n');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Paso 2: Forzar disparo de alerta
    await triggerAlert();

    // Esperar 2 segundos más
    console.log('⏳ Esperando 2 segundos...\n');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Paso 3: Eliminar regla de prueba
    await cleanupTestRule(ruleId);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ PROCESO COMPLETADO\n');
    console.log('📧 Revisa tu email: agustin.scutari@it-tel.com.ar\n');
    console.log('📝 El email debería decir:');
    console.log('   • Ubicación: USITTEL TANDIL ✅');
    console.log('   • Sensor: (080) WAN-to-RDB');
    console.log('   • Tipo: Umbral máximo de tráfico superado');
    console.log('   • Umbral: 10.00 Mbit/s');
    console.log('   • Valor actual: ~1865 Mbit/s\n');
    console.log('🔍 Si NO llega:');
    console.log('   • Revisa logs de Vercel');
    console.log('   • Busca: "🚨 Disparando alerta" o "📧 Email enviado"\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('\n❌ Error durante el test:', error.message);
    console.error(error);
  }
}

main();
