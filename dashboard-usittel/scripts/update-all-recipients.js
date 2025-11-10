/**
 * Script para actualizar destinatarios de TODAS las reglas de alertas
 * Agrega md@it-tel.com.ar y ja@it-tel.com.ar además de agustin.scutari@it-tel.com.ar
 */

// Conectar a Supabase directamente
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Falta configuración de Supabase');
  console.error('Set: NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Los 3 destinatarios
const emailRecipients = [
  'agustin.scutari@it-tel.com.ar',
  'md@it-tel.com.ar',
  'ja@it-tel.com.ar'
];

async function updateAllRules() {
  console.log('🔄 Actualizando destinatarios de TODAS las reglas de alertas...\n');
  console.log(`📧 Nuevos destinatarios de email:`);
  emailRecipients.forEach(r => console.log(`   - ${r}`));
  console.log('');
  
  try {
    // Obtener todas las reglas
    const { data: rules, error } = await supabase
      .from('alert_rules')
      .select('*');
    
    if (error) {
      console.error('❌ Error obteniendo reglas:', error);
      return;
    }
    
    console.log(`📋 Encontradas ${rules.length} reglas totales\n`);
    
    for (const rule of rules) {
      // Parsear recipients actual (puede ser string o array)
      let currentRecipients = [];
      try {
        currentRecipients = typeof rule.recipients === 'string' 
          ? JSON.parse(rule.recipients) 
          : rule.recipients;
      } catch (e) {
        console.warn(`⚠️ Error parseando recipients de regla ${rule.id}`);
      }
      
      // Separar emails de WhatsApp
      const whatsappNumbers = currentRecipients.filter(r => r.startsWith('+'));
      
      // Combinar: emails actualizados + WhatsApp existentes
      const newRecipients = [...emailRecipients, ...whatsappNumbers];
      
      // Actualizar en la BD
      const { error: updateError } = await supabase
        .from('alert_rules')
        .update({ recipients: newRecipients })
        .eq('id', rule.id);
      
      if (updateError) {
        console.error(`❌ Error actualizando regla ${rule.id} (${rule.name}):`, updateError);
      } else {
        console.log(`✅ ${rule.name} (ID: ${rule.id})`);
      }
    }
    
    console.log('\n✅ Proceso completado');
    console.log('🔍 Verifica en: /dashboard/alertas/configuracion');
    
  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

updateAllRules();
