/**
 * 🔧 Actualizar constraint de BD y agregar regla de umbral mínimo
 * 
 * Este script:
 * 1. Actualiza el constraint de la tabla alert_rules para incluir 'traffic_low'
 * 2. Crea la regla de umbral mínimo para CABASE
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Variables de entorno no encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateConstraintAndAddRule() {
  console.log('🔧 Actualizando constraint de base de datos...\n');

  try {
    // 1. Actualizar constraint
    console.log('1️⃣ Actualizando constraint para incluir traffic_low...');
    
    const { error: dropError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE alert_rules DROP CONSTRAINT IF EXISTS alert_rules_condition_check'
    });
    
    if (dropError) {
      console.log('⚠️  No se pudo eliminar constraint (puede que no exista):', dropError.message);
    }
    
    const { error: addError } = await supabase.rpc('exec_sql', {
      sql: `ALTER TABLE alert_rules ADD CONSTRAINT alert_rules_condition_check 
            CHECK (condition IN ('down', 'warning', 'unusual', 'slow', 'traffic_low', 'traffic_spike', 'traffic_drop'))`
    });
    
    if (addError) {
      console.error('❌ Error al agregar constraint:', addError);
      console.log('\n📝 Por favor, ejecuta manualmente en la consola SQL de Supabase:');
      console.log('   scripts/update-db-constraint.sql');
      console.log('\nLuego ejecuta: node scripts/add-cabase-min-threshold.js');
      process.exit(1);
    }
    
    console.log('✅ Constraint actualizado\n');

    // 2. Crear la regla
    console.log('2️⃣ Creando regla de umbral mínimo...');
    
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
      cooldown: 300,
      priority: 'medium',
      enabled: true
    };

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
    console.log(`   Umbral mínimo: ${createdRule.threshold} Mbit/s`);
    console.log(`   Canales: ${createdRule.channels.join(', ')}`);
    console.log(`   Estado: ACTIVA ✅\n`);

    console.log('✅ ¡Proceso completado!\n');

  } catch (error) {
    console.error('❌ Error:', error.message || error);
    console.log('\n📝 Solución manual:');
    console.log('1. Ve a Supabase → SQL Editor');
    console.log('2. Ejecuta el SQL en: scripts/update-db-constraint.sql');
    console.log('3. Luego ejecuta: node scripts/add-cabase-min-threshold.js');
    process.exit(1);
  }
}

updateConstraintAndAddRule();
