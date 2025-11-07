/**
 * 🧪 API para Crear Alerta de Prueba CABASE
 * 
 * Endpoint: POST /api/alerts/test-cabase
 * 
 * Crea una regla: CABASE > 4500 Mbit/s
 * Notifica por EMAIL + WHATSAPP
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAlertRule, getAlertRules } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    // Verificar si ya existe la regla
    const existingRules = await getAlertRules(false);
    const testRuleName = 'PRUEBA: CABASE > 4500 Mbit/s (Email + WhatsApp)';
    const testRuleExists = existingRules.find(r => r.name === testRuleName);
    
    if (testRuleExists) {
      return NextResponse.json({
        success: true,
        message: 'La regla de prueba ya existe',
        rule: testRuleExists
      });
    }
    
    // Crear regla de prueba con EMAIL + WHATSAPP
    const testRule = {
      name: testRuleName,
      sensor_id: '13682', // CABASE
      condition: 'slow' as const, // Usamos 'slow' para umbrales personalizados
      threshold: 4500, // 4500 Mbit/s
      channels: ['email', 'whatsapp'], // 📧 + 📱 Ambos canales
      recipients: [
        process.env.ALERT_EMAIL_RECIPIENTS || 'agustin.scutari@it-tel.com.ar'
      ],
      cooldown: 60, // 1 minuto para pruebas
      priority: 'high' as const, // Alta prioridad
      enabled: true
    };
    
    const result = await createAlertRule(testRule);
    
    console.log('✅ Regla de prueba CABASE creada:', testRule);
    
    return NextResponse.json({
      success: true,
      message: 'Regla de prueba creada exitosamente',
      rule: { ...testRule, id: result?.id },
      info: {
        sensor: 'CABASE (13682)',
        condition: 'Tráfico > 4500 Mbit/s',
        notifications: 'Email + WhatsApp',
        cooldown: '60 segundos',
        test_instructions: 'El monitoreo está activo. Si CABASE supera 4500 Mbit/s, recibirás email y WhatsApp.'
      }
    });
    
  } catch (error) {
    console.error('❌ Error creando regla de prueba:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Usa POST para crear la regla de prueba',
    description: 'Crea una alerta cuando CABASE supere 4500 Mbit/s (Email + WhatsApp)'
  });
}
