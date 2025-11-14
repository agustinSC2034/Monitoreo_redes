/**
 * 🐛 Debug: Simular processSensorData para la regla de prueba
 */

const fs = require('fs');
const path = require('path');

// Leer .env.local
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars = {};

envContent.split('\n').forEach(line => {
  line = line.trim();
  if (line && !line.startsWith('#')) {
    const equalIndex = line.indexOf('=');
    if (equalIndex > 0) {
      const key = line.substring(0, equalIndex).trim();
      const value = line.substring(equalIndex + 1).trim();
      envVars[key] = value;
    }
  }
});

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  envVars.NEXT_PUBLIC_SUPABASE_URL,
  envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

function parseTrafficValue(lastvalue) {
  if (!lastvalue || typeof lastvalue !== 'string') return null;

  const match = lastvalue.match(/([\d,.]+)\s*(kbit|mbit|gbit|tbit)/i);
  if (!match) return null;

  let value = parseFloat(match[1].replace(/\./g, '').replace(',', '.'));
  const unit = match[2].toLowerCase();

  switch (unit) {
    case 'kbit':
      return value / 1000;
    case 'mbit':
      return value;
    case 'gbit':
      return value * 1000;
    case 'tbit':
      return value * 1000000;
    default:
      return null;
  }
}

async function debugTestRule() {
  console.log('🐛 Iniciando debug de regla de prueba...\n');

  // 1. Obtener la regla
  console.log('1️⃣ Obteniendo regla de prueba (ID: 24)...');
  const { data: rule, error: ruleError } = await supabase
    .from('alert_rules')
    .select('*')
    .eq('id', 24)
    .single();

  if (ruleError || !rule) {
    console.error('❌ Error obteniendo regla:', ruleError);
    return;
  }

  console.log(`✅ Regla encontrada: ${rule.name}`);
  console.log(`   Enabled: ${rule.enabled}`);
  console.log(`   Sensor: ${rule.sensor_id}`);
  console.log(`   Condición: ${rule.condition}`);
  console.log(`   Umbral: ${rule.threshold} Mbit/s`);
  console.log(`   Cooldown: ${rule.cooldown}s\n`);

  // 2. Simular datos del sensor CABASE
  const sensorData = {
    sensor_id: '13682',
    name: 'CABASE',
    status: 'Disponible',
    status_raw: 3,
    lastvalue: '4.758.439 kbit/s' // Dato real del último chequeo
  };

  console.log('2️⃣ Datos del sensor (simulados):');
  console.log(`   Sensor ID: ${sensorData.sensor_id}`);
  console.log(`   Nombre: ${sensorData.name}`);
  console.log(`   Status: ${sensorData.status}`);
  console.log(`   Last Value: ${sensorData.lastvalue}\n`);

  // 3. Evaluar condición
  console.log('3️⃣ Evaluando condición "slow"...');
  
  if (rule.condition === 'slow') {
    if (rule.threshold && sensorData.lastvalue) {
      const trafficValue = parseTrafficValue(sensorData.lastvalue);
      console.log(`   📊 Tráfico parseado: ${trafficValue} Mbit/s`);
      console.log(`   🎯 Umbral configurado: ${rule.threshold} Mbit/s`);
      
      if (trafficValue !== null) {
        const shouldTrigger = trafficValue > rule.threshold;
        console.log(`   ✨ ${trafficValue} > ${rule.threshold}? ${shouldTrigger}`);
        
        if (shouldTrigger) {
          console.log('\n✅ LA CONDICIÓN SE CUMPLE - DEBERÍA DISPARAR ALERTA\n');
          
          // 4. Verificar canales y recipients
          console.log('4️⃣ Verificando canales de notificación:');
          console.log(`   Canales: ${JSON.stringify(rule.channels)}`);
          console.log(`   Recipients: ${JSON.stringify(rule.recipients)}`);
          
          if (rule.channels && rule.channels.includes('email')) {
            console.log('   ✅ Canal email configurado');
            
            if (rule.recipients && rule.recipients.length > 0) {
              console.log(`   ✅ Email recipients: ${rule.recipients.join(', ')}`);
              console.log('\n🎉 TODO ESTÁ CONFIGURADO CORRECTAMENTE PARA ENVIAR EMAIL!\n');
              console.log('🤔 Si no llega el email, el problema está en:');
              console.log('   1. El código de Vercel no está ejecutando processSensorData()');
              console.log('   2. El servicio emailService.ts está fallando silenciosamente');
              console.log('   3. Los emails están yendo a spam');
              console.log('   4. El cooldown en memoria está bloqueando (aunque sea 0s)');
            } else {
              console.log('   ❌ NO HAY RECIPIENTS CONFIGURADOS');
            }
          } else {
            console.log('   ❌ Canal email NO está en la lista de canales');
          }
        } else {
          console.log('\n❌ La condición NO se cumple - no dispara alerta');
        }
      } else {
        console.log('   ❌ No se pudo parsear el valor de tráfico');
      }
    } else {
      console.log('   ❌ Falta threshold o lastvalue');
    }
  } else {
    console.log(`   ❌ Condición incorrecta: ${rule.condition}`);
  }
}

debugTestRule().catch(console.error);
