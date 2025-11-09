/**
 * 🔧 Script para agregar número de WhatsApp a los destinatarios de la regla 6
 * 
 * Ejecutar con: node scripts/fix-whatsapp-recipients.js
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Faltan variables de entorno:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixRecipients() {
  try {
    console.log('🔧 Actualizando destinatarios de la regla 6...');
    
    // Actualizar regla 6: agregar número de WhatsApp
    const { data, error } = await supabase
      .from('alert_rules')
      .update({
        recipients: JSON.stringify([
          'agustin.scutari@it-tel.com.ar',  // Email
          '+5491124682247'                    // WhatsApp
        ])
      })
      .eq('id', 6)
      .select();
    
    if (error) {
      console.error('❌ Error:', error);
      process.exit(1);
    }
    
    console.log('✅ Regla 6 actualizada exitosamente:');
    console.log(JSON.stringify(data, null, 2));
    
    // Verificar todas las reglas
    const { data: allRules, error: listError } = await supabase
      .from('alert_rules')
      .select('id, name, channels, recipients')
      .order('id');
    
    if (listError) {
      console.error('❌ Error listando reglas:', listError);
      process.exit(1);
    }
    
    console.log('\n📋 Todas las reglas:');
    allRules.forEach(rule => {
      const channels = JSON.parse(rule.channels);
      const recipients = JSON.parse(rule.recipients);
      console.log(`\n  ID ${rule.id}: ${rule.name}`);
      console.log(`    Canales: ${channels.join(', ')}`);
      console.log(`    Destinatarios: ${recipients.join(', ')}`);
    });
    
  } catch (err) {
    console.error('❌ Error inesperado:', err);
    process.exit(1);
  }
}

fixRecipients();
