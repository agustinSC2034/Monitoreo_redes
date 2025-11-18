/**
 * 🔧 Restaurar configuración de producción
 * 
 * Este script:
 * 1. Restaura el umbral de CABASE a 8500 Mbit/s
 * 2. Agrega ja@it-tel.com.ar y md@it-tel.com.ar a las alertas de email
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function restoreProductionConfig() {
  console.log('🔧 Restaurando configuración de producción...\n');

  try {
    // 1. Restaurar umbral de CABASE a 8500 Mbit/s
    console.log('1️⃣ Actualizando umbral de CABASE a 8500 Mbit/s...');
    
    const { data: cabaseRule, error: updateError } = await supabase
      .from('alert_rules')
      .update({
        name: 'CABASE > 8500 Mbit/s',
        threshold: 8500,
        cooldown: 300, // 5 minutos
        recipients: [
          'agustin.scutari@it-tel.com.ar',
          'ja@it-tel.com.ar',
          'md@it-tel.com.ar'
        ]
      })
      .eq('id', 6)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    console.log('✅ Regla CABASE actualizada:');
    console.log(`   - Nombre: ${cabaseRule.name}`);
    console.log(`   - Umbral: ${cabaseRule.threshold} Mbit/s`);
    console.log(`   - Cooldown: ${cabaseRule.cooldown} segundos (${cabaseRule.cooldown / 60} minutos)`);
    console.log(`   - Destinatarios:`);
    cabaseRule.recipients.forEach(email => {
      console.log(`     • ${email}`);
    });
    console.log('');

    // 2. Actualizar TODAS las reglas para agregar los nuevos destinatarios
    console.log('2️⃣ Actualizando destinatarios en TODAS las reglas de alertas...');
    
    const { data: allRules, error: fetchError } = await supabase
      .from('alert_rules')
      .select('*')
      .eq('enabled', true);

    if (fetchError) {
      throw fetchError;
    }

    console.log(`\nEncontradas ${allRules.length} reglas activas\n`);

    for (const rule of allRules) {
      // Solo actualizar si tiene email en los canales
      if (!rule.channels.includes('email')) {
        console.log(`⏭️  Saltando regla ${rule.id}: "${rule.name}" (no usa email)`);
        continue;
      }

      // Agregar los nuevos emails si no están ya
      const currentRecipients = rule.recipients || [];
      const newRecipients = [
        ...new Set([
          ...currentRecipients,
          'agustin.scutari@it-tel.com.ar',
          'ja@it-tel.com.ar',
          'md@it-tel.com.ar'
        ])
      ];

      const { error: updateRuleError } = await supabase
        .from('alert_rules')
        .update({
          recipients: newRecipients
        })
        .eq('id', rule.id);

      if (updateRuleError) {
        console.error(`❌ Error actualizando regla ${rule.id}:`, updateRuleError);
        continue;
      }

      console.log(`✅ Regla ${rule.id}: "${rule.name}"`);
      console.log(`   Destinatarios actualizados: ${newRecipients.length} emails`);
      newRecipients.forEach(email => {
        console.log(`     • ${email}`);
      });
      console.log('');
    }

    console.log('\n✅ ¡Configuración de producción restaurada exitosamente!\n');
    console.log('📝 Resumen:');
    console.log('   - CABASE: 8500 Mbit/s (umbral de producción)');
    console.log('   - Cooldown: 5 minutos');
    console.log('   - Destinatarios: 3 emails (agustin, ja, md)');
    console.log('   - Aplicado a todas las reglas activas con canal email');
    console.log('');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

restoreProductionConfig();
