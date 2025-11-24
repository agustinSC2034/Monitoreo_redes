/**
 * 🔧 Agregar regla de umbral mínimo usando INSERT directo
 * 
 * Este script inserta la regla directamente usando SQL raw
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

async function addRuleDirectly() {
  console.log('🔧 Creando regla de umbral mínimo para CABASE...\n');
  console.log('⚠️  NOTA: Si falla por constraint, necesitas actualizar la BD manualmente.\n');

  try {
    // Primero, verificar si ya existe
    const { data: existing } = await supabase
      .from('alert_rules')
      .select('id, name')
      .eq('sensor_id', '13682')
      .ilike('name', '%mínimo%');

    if (existing && existing.length > 0) {
      console.log('✅ Ya existe una regla de umbral mínimo para CABASE:');
      console.log(`   ID: ${existing[0].id}`);
      console.log(`   Nombre: ${existing[0].name}`);
      console.log('\n✅ No es necesario crear otra regla.\n');
      return;
    }

    // Insertar usando SQL directo para evitar el constraint
    console.log('📝 Insertando regla...');
    
    const sql = `
      INSERT INTO alert_rules 
        (name, sensor_id, condition, threshold, priority, channels, recipients, cooldown, enabled) 
      VALUES 
        ('CABASE < 200 Mbit/s (Umbral Mínimo)', 
         '13682', 
         'traffic_low', 
         200, 
         'medium', 
         ARRAY['email', 'telegram']::text[], 
         ARRAY['agustin.scutari@it-tel.com.ar', 'ja@it-tel.com.ar', 'md@it-tel.com.ar']::text[], 
         300, 
         true)
      RETURNING *;
    `;

    // Intentar con RPC si existe
    const { data, error } = await supabase.rpc('exec_sql', { query: sql });
    
    if (error) {
      console.log('⚠️  No se puede usar RPC, intentando insert normal...\n');
      
      // Intentar insert normal
      const { data: insertData, error: insertError } = await supabase
        .from('alert_rules')
        .insert([{
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
        }])
        .select()
        .single();

      if (insertError) {
        console.error('❌ Error al insertar:', insertError.message);
        console.log('\n📋 SOLUCIÓN MANUAL:');
        console.log('1. Ve a Supabase → SQL Editor');
        console.log('2. Ejecuta este SQL:\n');
        console.log('-- Paso 1: Actualizar constraint');
        console.log("ALTER TABLE alert_rules DROP CONSTRAINT IF EXISTS alert_rules_condition_check;");
        console.log("ALTER TABLE alert_rules ADD CONSTRAINT alert_rules_condition_check");
        console.log("CHECK (condition IN ('down', 'warning', 'unusual', 'slow', 'traffic_low', 'traffic_spike', 'traffic_drop'));\n");
        console.log('-- Paso 2: Insertar regla');
        console.log(sql);
        console.log('\n');
        process.exit(1);
      }

      console.log('✅ Regla creada:');
      console.log(`   ID: ${insertData.id}`);
      console.log(`   Nombre: ${insertData.name}\n`);
    } else {
      console.log('✅ Regla creada exitosamente!\n');
    }

    console.log('✅ Proceso completado. La regla está activa.\n');

  } catch (error) {
    console.error('❌ Error:', error.message || error);
    console.log('\n📋 Por favor ejecuta manualmente en Supabase SQL Editor:');
    console.log('   Ver: scripts/update-db-constraint.sql\n');
    process.exit(1);
  }
}

addRuleDirectly();
