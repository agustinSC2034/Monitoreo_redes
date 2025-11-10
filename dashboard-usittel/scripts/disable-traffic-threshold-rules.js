/**
 * Script para desactivar las reglas de umbral de tráfico (slow)
 * hasta que se confirme la capacidad real de los enlaces
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Falta configuración de Supabase');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function disableTrafficThresholdRules() {
  console.log('🔄 Desactivando reglas de umbral de tráfico...\n');
  
  // Reglas a desactivar
  const rulesToDisable = [
    { sensor_id: '13684', name: 'IPLAN ARSAT > 1000 Mbit/s' },
    { sensor_id: '13682', name: 'CABASE > 8000 Mbit/s' }
  ];
  
  for (const rule of rulesToDisable) {
    console.log(`⏸️  Desactivando: ${rule.name} (sensor ${rule.sensor_id})`);
    
    const { data, error } = await supabase
      .from('alert_rules')
      .update({ enabled: false })
      .eq('sensor_id', rule.sensor_id)
      .eq('condition', 'slow')
      .select();
    
    if (error) {
      console.error(`   ❌ Error:`, error.message);
    } else if (data && data.length > 0) {
      console.log(`   ✅ Desactivada (ID: ${data[0].id})`);
    } else {
      console.log(`   ⚠️  No se encontró la regla`);
    }
  }
  
  console.log('\n✅ Proceso completado');
  console.log('📝 Nota: Las reglas siguen en la BD pero están desactivadas');
  console.log('💡 Para reactivarlas, cambiar enabled=true cuando se confirme la capacidad');
}

disableTrafficThresholdRules();
