/**
 * Script para actualizar nombres de reglas de LARANET
 * Los nombres deben coincidir con los del dashboard
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Falta configuración de Supabase');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Mapeo correcto: sensor_id -> nombre del dashboard
const correctNames = {
  '5159': 'sfp28-10-WANxIPLAN - Enlace Caído',
  '4737': 'sfp28-12-WAN1-PPAL - Enlace Caído',
  '3942': 'sfp-sfpplus1-WAN LARA1-RDA-1-LARA - Enlace Caído',
  '5187': 'VLAN500-WAN (Lomas de Eziza) - Enlace Caído',
  '4736': 'sfp28-11-WAN2-BACKUP - Enlace Caído',
  '6689': 'IPTV-Modulador 1 - Enlace Caído',
  '4665': 'VLAN500-WAN (LARA 2.2) - Enlace Caído',
  '4642': 'vlan500-iBGP (LARA 2.1) - Enlace Caído'
};

async function updateRuleNames() {
  console.log('🔄 Actualizando nombres de reglas de LARANET...\n');
  
  try {
    // Obtener reglas de LARANET
    const { data: rules, error } = await supabase
      .from('alert_rules')
      .select('*')
      .in('sensor_id', Object.keys(correctNames));
    
    if (error) {
      console.error('❌ Error obteniendo reglas:', error);
      return;
    }
    
    console.log(`📋 Encontradas ${rules.length} reglas de LARANET\n`);
    
    for (const rule of rules) {
      const correctName = correctNames[rule.sensor_id];
      
      if (rule.name === correctName) {
        console.log(`✓ ${rule.sensor_id}: Ya tiene el nombre correcto`);
        continue;
      }
      
      console.log(`🔄 Actualizando sensor ${rule.sensor_id}:`);
      console.log(`   Anterior: "${rule.name}"`);
      console.log(`   Nuevo:    "${correctName}"`);
      
      const { error: updateError } = await supabase
        .from('alert_rules')
        .update({ name: correctName })
        .eq('id', rule.id);
      
      if (updateError) {
        console.error(`   ❌ Error: ${updateError.message}`);
      } else {
        console.log(`   ✅ Actualizado\n`);
      }
    }
    
    console.log('✅ Proceso completado');
    console.log('🔍 Verifica en: /dashboard/alertas/configuracion');
    
  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

updateRuleNames();
