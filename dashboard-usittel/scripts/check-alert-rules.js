/**
 * Script para verificar todas las reglas de alerta activas
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Falta configuración de Supabase');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRules() {
  try {
    const { data: rules, error } = await supabase
      .from('alert_rules')
      .select('*')
      .eq('enabled', true)
      .order('sensor_id', { ascending: true });

    if (error) {
      console.error('❌ Error:', error);
      return;
    }

    console.log(`\n📋 Total de reglas activas: ${rules.length}\n`);

    // Agrupar por sensor (primeros 3 dígitos indican ubicación)
    const byLocation = {
      tandil: rules.filter(r => String(r.sensor_id).startsWith('13') || String(r.sensor_id).startsWith('2')),
      matanza: rules.filter(r => !String(r.sensor_id).startsWith('13') && !String(r.sensor_id).startsWith('2'))
    };

    console.log('🏢 TANDIL:', byLocation.tandil.length, 'reglas');
    byLocation.tandil.forEach(rule => {
      console.log(`  - [${rule.condition}] ${rule.name} (sensor ${rule.sensor_id})`);
    });

    console.log('\n🏢 LA MATANZA:', byLocation.matanza.length, 'reglas');
    byLocation.matanza.forEach(rule => {
      console.log(`  - [${rule.condition}] ${rule.name} (sensor ${rule.sensor_id})`);
    });

    // Buscar reglas problemáticas (down/warning que disparan sin cambio de estado)
    console.log('\n🔍 Reglas con condición "down" o "warning":');
    const downWarning = rules.filter(r => ['down', 'warning'].includes(r.condition));
    if (downWarning.length === 0) {
      console.log('  ✅ No hay reglas "down" o "warning" (todas usan state_change)');
    } else {
      downWarning.forEach(rule => {
        console.log(`  ⚠️  [${rule.condition}] ${rule.name} - Sensor ${rule.sensor_id}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkRules();
