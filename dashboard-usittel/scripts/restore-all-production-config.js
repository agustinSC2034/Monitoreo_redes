/**
 * 🔄 Restaurar configuración de producción completa
 * 
 * Este script actualiza TODAS las reglas activas con:
 * - 3 destinatarios de email
 * - Email + Telegram habilitados
 * - Sin enviar ninguna alerta de prueba
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Cargar variables de entorno
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    envVars[match[1].trim()] = match[2].trim();
  }
});

const supabase = createClient(
  envVars.NEXT_PUBLIC_SUPABASE_URL,
  envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Configuración de producción
const PRODUCTION_RECIPIENTS = [
  'agustin.scutari@it-tel.com.ar',
  'md@it-tel.com.ar',
  'ja@it-tel.com.ar'
];

const PRODUCTION_CHANNELS = ['email', 'telegram'];

async function restoreAllRules() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔄 RESTAURAR CONFIGURACIÓN DE PRODUCCIÓN');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Obtener todas las reglas activas (excluyendo pruebas)
  const { data: rules, error } = await supabase
    .from('alert_rules')
    .select('*')
    .eq('enabled', true)
    .not('name', 'like', '%PRUEBA%')
    .not('name', 'like', '%TEST%')
    .order('id');

  if (error) {
    console.error('❌ Error obteniendo reglas:', error.message);
    return;
  }

  console.log(`📊 Reglas de producción encontradas: ${rules.length}\n`);

  let updated = 0;
  let skipped = 0;

  for (const rule of rules) {
    // Verificar si necesita actualización
    const needsUpdate = 
      rule.recipients.length !== 3 || 
      rule.channels.length !== 2 ||
      !rule.channels.includes('telegram');

    if (!needsUpdate) {
      console.log(`⏭️  [${rule.id}] ${rule.name} - Ya está configurada correctamente`);
      skipped++;
      continue;
    }

    console.log(`🔧 [${rule.id}] ${rule.name}`);
    console.log(`   Antes: ${rule.channels.length} canales, ${rule.recipients.length} destinatarios`);

    // Actualizar regla
    const { error: updateError } = await supabase
      .from('alert_rules')
      .update({
        channels: PRODUCTION_CHANNELS,
        recipients: PRODUCTION_RECIPIENTS
      })
      .eq('id', rule.id);

    if (updateError) {
      console.log(`   ❌ Error actualizando: ${updateError.message}`);
      continue;
    }

    console.log(`   ✅ Después: 2 canales (email+telegram), 3 destinatarios`);
    updated++;
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 RESUMEN:\n');
  console.log(`✅ Reglas actualizadas: ${updated}`);
  console.log(`⏭️  Reglas sin cambios: ${skipped}`);
  console.log(`📋 Total procesadas: ${rules.length}\n`);

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ CONFIGURACIÓN DE PRODUCCIÓN COMPLETA\n');
  
  console.log('📧 Destinatarios de Email:');
  PRODUCTION_RECIPIENTS.forEach(email => {
    console.log(`   • ${email}`);
  });
  
  console.log('\n📱 Canales habilitados:');
  PRODUCTION_CHANNELS.forEach(channel => {
    console.log(`   • ${channel}`);
  });
  
  console.log('\n⚠️  IMPORTANTE:');
  console.log('   • NO se enviaron alertas de prueba');
  console.log('   • Las alertas se activarán automáticamente con GitHub Actions');
  console.log('   • Próxima ejecución: cada 5 minutos\n');
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

restoreAllRules().catch(console.error);
