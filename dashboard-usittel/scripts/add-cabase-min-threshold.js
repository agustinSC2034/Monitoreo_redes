/**
 * 🔧 Agregar Alerta de Umbral Mínimo para CABASE
 * 
 * Este script crea una regla de alerta para detectar cuando el tráfico de CABASE
 * cae por debajo de 200 Mbit/s (excepto cuando está DOWN, que tiene prioridad).
 * 
 * Regla:
 * - Sensor: CABASE (13682)
 * - Condición: traffic_low (tráfico < umbral mínimo)
 * - Umbral: 200 Mbit/s
 * - Canales: Email + Telegram
 * - Cooldown: 300 segundos (5 minutos)
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Variables de entorno no encontradas');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'OK' : 'FALTA');
  console.error('   SUPABASE_KEY:', supabaseKey ? 'OK' : 'FALTA');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function addCabaseMinThreshold() {
  console.log('🔧 Agregando regla de umbral mínimo para CABASE...\n');

  try {
    // Verificar si ya existe una regla de umbral mínimo para CABASE
    const { data: existingRules, error: checkError } = await supabase
      .from('alert_rules')
      .select('*')
      .eq('sensor_id', '13682')
      .eq('condition', 'traffic_low');

    if (checkError) {
      throw checkError;
    }

    if (existingRules && existingRules.length > 0) {
      console.log('⚠️  Ya existe una regla de umbral mínimo para CABASE:');
      console.log(`   ID: ${existingRules[0].id}`);
      console.log(`   Nombre: ${existingRules[0].name}`);
      console.log(`   Umbral: ${existingRules[0].threshold} Mbit/s`);
      console.log('\n¿Deseas continuar? Esto creará una regla duplicada.');
      console.log('Presiona Ctrl+C para cancelar o espera 5 segundos para continuar...\n');
      
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    // Crear la nueva regla
    const newRule = {
      name: 'CABASE < 200 Mbit/s (Umbral Mínimo)',
      sensor_id: '13682',
      condition: 'traffic_low',
      threshold: 200,
      channels: ['email', 'telegram'],
      recipients: [
        'agustin.scutari@it-tel.com.ar',
        'ja@it-tel.com.ar',
        'md@it-tel.com.ar'
      ],
      cooldown: 300, // 5 minutos
      priority: 'medium',
      enabled: true
    };

    console.log('📝 Creando regla con los siguientes datos:');
    console.log(JSON.stringify(newRule, null, 2));
    console.log('');

    const { data: createdRule, error: createError } = await supabase
      .from('alert_rules')
      .insert([newRule])
      .select()
      .single();

    if (createError) {
      throw createError;
    }

    console.log('✅ Regla creada exitosamente:');
    console.log(`   ID: ${createdRule.id}`);
    console.log(`   Nombre: ${createdRule.name}`);
    console.log(`   Sensor: CABASE (13682)`);
    console.log(`   Condición: traffic_low (tráfico < umbral mínimo)`);
    console.log(`   Umbral: ${createdRule.threshold} Mbit/s`);
    console.log(`   Canales: ${createdRule.channels.join(', ')}`);
    console.log(`   Destinatarios: ${createdRule.recipients.length} emails`);
    createdRule.recipients.forEach(email => {
      console.log(`     • ${email}`);
    });
    console.log(`   Cooldown: ${createdRule.cooldown} segundos (${createdRule.cooldown / 60} minutos)`);
    console.log(`   Prioridad: ${createdRule.priority}`);
    console.log(`   Estado: ${createdRule.enabled ? 'ACTIVA ✅' : 'INACTIVA ❌'}`);
    console.log('');

    console.log('📋 Nota importante:');
    console.log('   • Esta alerta se dispara cuando el tráfico cae por debajo de 200 Mbit/s');
    console.log('   • Si el sensor está DOWN, NO se dispara (prioridad a alerta de caída)');
    console.log('   • Solo se envía desde GitHub Actions (cada 5 minutos)');
    console.log('   • Cooldown de 5 minutos entre alertas');
    console.log('');

    console.log('✅ ¡Configuración completada!\n');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

addCabaseMinThreshold();
