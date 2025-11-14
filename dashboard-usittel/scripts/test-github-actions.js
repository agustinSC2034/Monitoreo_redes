/**
 * 🧪 Script de Prueba para GitHub Actions
 * 
 * Crea una regla temporal que siempre se dispara para verificar que
 * GitHub Actions está enviando alertas automáticamente.
 * 
 * La regla:
 * - Se dispara cuando CABASE > 1 Mbit/s (siempre se cumple)
 * - Solo envía a: agustin.scutari@it-tel.com.ar
 * - Cooldown: 1 hora (3600s)
 * - Solo email, sin telegram
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

async function createTestRule() {
  console.log('🧪 Creando regla de prueba para GitHub Actions...\n');

  const testRule = {
    name: '🧪 TEST GitHub Actions - CABASE (BORRAR DESPUÉS)',
    sensor_id: '13682', // CABASE
    condition: 'slow',
    threshold: 1, // 1 Mbit/s - siempre se cumple
    cooldown: 3600, // 1 hora
    priority: 'high',
    enabled: true,
    channels: ['email'], // Solo email
    recipients: ['agustin.scutari@it-tel.com.ar'],
    created_at: Math.floor(Date.now() / 1000)
  };

  try {
    const { data, error } = await supabase
      .from('alert_rules')
      .insert(testRule)
      .select()
      .single();

    if (error) throw error;

    console.log('✅ Regla de prueba creada exitosamente!');
    console.log(`📋 ID: ${data.id}`);
    console.log(`📧 Destinatario: agustin.scutari@it-tel.com.ar`);
    console.log(`🎯 Condición: CABASE > 1 Mbit/s (siempre se cumple)`);
    console.log(`⏱️  Cooldown: 1 hora`);
    console.log('');
    console.log('⏳ En menos de 5 minutos deberías recibir el email de prueba.');
    console.log('   (GitHub Actions ejecuta cada 5 minutos)');
    console.log('');
    console.log('🗑️  Para eliminar la regla después, ejecuta:');
    console.log(`   node scripts/delete-test-rule.js ${data.id}`);
    console.log('');

    return data.id;

  } catch (error) {
    console.error('❌ Error creando regla:', error.message);
    process.exit(1);
  }
}

createTestRule();
