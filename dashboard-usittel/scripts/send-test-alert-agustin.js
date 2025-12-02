/**
 * 🧪 Enviar alerta de prueba SOLO a agustin.scutari@it-tel.com.ar
 * 
 * Este script:
 * 1. Crea/actualiza una regla temporal de prueba
 * 2. Fuerza el disparo de una alerta
 * 3. Solo envía email a Agustín (sin Telegram)
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

async function createTestRule() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🧪 CREAR REGLA DE PRUEBA TEMPORAL');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Buscar si ya existe una regla de prueba
  const { data: existingRules } = await supabase
    .from('alert_rules')
    .select('*')
    .eq('sensor_id', '13726')
    .eq('name', '🧪 PRUEBA WAN-to-RDB - Test de Ubicación');

  let ruleId;

  if (existingRules && existingRules.length > 0) {
    console.log('📝 Regla de prueba existente encontrada, actualizando...\n');
    
    // Actualizar regla existente
    const { data: updated, error } = await supabase
      .from('alert_rules')
      .update({
        condition: 'down',
        threshold: null,
        priority: 'high',
        channels: ['email'], // Solo email
        recipients: ['agustin.scutari@it-tel.com.ar'], // Solo Agustín
        cooldown: 0, // Sin cooldown para forzar disparo
        enabled: true
      })
      .eq('id', existingRules[0].id)
      .select()
      .single();

    if (error) {
      console.error('❌ Error actualizando regla:', error.message);
      return null;
    }

    ruleId = updated.id;
    console.log('✅ Regla actualizada:');
    console.log(`   ID: ${updated.id}`);
    console.log(`   Nombre: ${updated.name}`);
  } else {
    console.log('📝 Creando nueva regla de prueba...\n');
    
    // Crear nueva regla
    const { data: created, error } = await supabase
      .from('alert_rules')
      .insert({
        name: '🧪 PRUEBA WAN-to-RDB - Test de Ubicación',
        sensor_id: '13726',
        condition: 'down',
        threshold: null,
        priority: 'high',
        channels: ['email'], // Solo email
        recipients: ['agustin.scutari@it-tel.com.ar'], // Solo Agustín
        cooldown: 0, // Sin cooldown para forzar disparo
        enabled: true
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error creando regla:', error.message);
      return null;
    }

    ruleId = created.id;
    console.log('✅ Regla creada:');
    console.log(`   ID: ${created.id}`);
    console.log(`   Nombre: ${created.name}`);
  }

  console.log(`   Sensor: 13726 (WAN-to-RDB)`);
  console.log(`   Condición: down`);
  console.log(`   Canales: ["email"]`);
  console.log(`   Destinatario: agustin.scutari@it-tel.com.ar`);
  console.log(`   Cooldown: 0 (sin límite)`);
  console.log(`   Habilitada: Sí\n`);

  return ruleId;
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
          console.log(`📊 Respuesta del servidor:`);
          console.log(JSON.stringify(json, null, 2));
          console.log('');
          resolve(json);
        } catch (e) {
          console.error('❌ Error parseando respuesta:', e.message);
          console.log('Raw data:', data);
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
  console.log('🧹 LIMPIEZA (OPCIONAL)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log('⚠️  La regla de prueba quedó activa.');
  console.log('   Puedes eliminarla con:\n');
  console.log(`   node scripts/delete-test-rule.js ${ruleId}\n`);
  console.log('   O deshabilitarla manualmente en Supabase.\n');
}

async function main() {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════╗');
  console.log('║  🧪 TEST DE ALERTA - SOLO AGUSTÍN                 ║');
  console.log('╚════════════════════════════════════════════════════╝');
  console.log('');

  try {
    // Paso 1: Crear/actualizar regla de prueba
    const ruleId = await createTestRule();
    
    if (!ruleId) {
      console.log('❌ No se pudo crear/actualizar la regla de prueba');
      return;
    }

    // Esperar 2 segundos
    console.log('⏳ Esperando 2 segundos...\n');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Paso 2: Forzar disparo de alerta
    await triggerAlert();

    // Paso 3: Información de limpieza
    await cleanupTestRule(ruleId);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ PROCESO COMPLETADO\n');
    console.log('📧 Revisa tu email: agustin.scutari@it-tel.com.ar\n');
    console.log('🔍 Si NO llega el email:');
    console.log('   1. Revisa los logs de Vercel');
    console.log('   2. Busca: "🚨 Disparando alerta" o "📧 Email enviado"');
    console.log('   3. Verifica que el sensor 13726 esté DOWN o cambie de estado\n');
    console.log('📝 El email debería decir:');
    console.log('   Ubicación: USITTEL TANDIL ✅ (CORRECTO)\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('\n❌ Error durante el test:', error.message);
    console.error(error);
  }
}

main();
