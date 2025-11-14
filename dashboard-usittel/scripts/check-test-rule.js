/**
 * 🔍 Verificar regla de prueba
 */

const fs = require('fs');
const path = require('path');

// Leer .env.local manualmente
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

async function checkTestRule() {
  console.log('🔍 Verificando regla de prueba (ID: 24)...\n');

  try {
    const { data, error } = await supabase
      .from('alert_rules')
      .select('*')
      .eq('id', 24)
      .single();

    if (error) throw error;

    if (!data) {
      console.log('❌ No se encontró la regla de prueba');
      return;
    }

    console.log('📋 Regla encontrada:');
    console.log('   ID:', data.id);
    console.log('   Nombre:', data.name);
    console.log('   Sensor ID:', data.sensor_id);
    console.log('   Condición:', data.condition);
    console.log('   Umbral:', data.threshold, 'Mbit/s');
    console.log('   Cooldown:', data.cooldown, 'segundos');
    console.log('   Enabled:', data.enabled);
    console.log('   Canales:', JSON.stringify(data.channels));
    console.log('   Recipients:', JSON.stringify(data.recipients));
    console.log('   Priority:', data.priority);
    console.log('   Created at:', data.created_at);
    console.log('');

    // Verificar configuración
    let issues = [];
    
    if (!data.enabled) issues.push('❌ La regla está DESACTIVADA');
    if (data.sensor_id !== '13682') issues.push('⚠️ Sensor ID incorrecto');
    if (data.condition !== 'slow') issues.push('⚠️ Condición incorrecta');
    if (data.threshold !== 1) issues.push('⚠️ Umbral incorrecto');
    if (!data.channels || !data.channels.includes('email')) issues.push('❌ No tiene canal email');
    if (!data.recipients || data.recipients.length === 0) issues.push('❌ No tiene recipients');

    if (issues.length > 0) {
      console.log('⚠️  Problemas encontrados:');
      issues.forEach(issue => console.log('   ' + issue));
    } else {
      console.log('✅ La regla está configurada correctamente!');
      console.log('');
      console.log('🤔 Si no llegan alertas, el problema puede ser:');
      console.log('   1. El servicio de email no está enviando');
      console.log('   2. El cooldown en memoria está bloqueando');
      console.log('   3. La lógica de alertMonitor no está detectando la condición');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkTestRule();
