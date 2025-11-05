/**
 * 🧪 API para Crear Alerta de Prueba con Umbral
 * 
 * Endpoint: POST /api/alerts/test-threshold
 * 
 * Crea una regla de prueba: CABASE > 5000 Mbit/s
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAlertRule, getAlertRules } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    // Verificar si ya existe la regla
    const existingRules = getAlertRules(false);
    const testRuleExists = existingRules.find(r => r.name === 'PRUEBA: CABASE Umbral Alto');
    
    if (testRuleExists) {
      return NextResponse.json({
        success: true,
        message: 'La regla de prueba ya existe',
        rule: testRuleExists
      });
    }
    
    // Crear regla de prueba
    const testRule = {
      name: 'PRUEBA: CABASE Umbral Alto',
      sensor_id: '13682', // CABASE
      condition: 'slow' as const, // Usaremos 'slow' para umbrales personalizados
      threshold: 5000, // 5000 Mbit/s = 5 Gbit/s
      channels: ['email'],
      recipients: [process.env.ALERT_EMAIL_RECIPIENTS || 'agustin.scutari@it-tel.com.ar'],
      cooldown: 60, // 1 minuto (para pruebas, después aumentar)
      priority: 'medium' as const,
      active: true
    };
    
    const result = createAlertRule(testRule);
    
    console.log('✅ Regla de prueba creada:', testRule);
    
    return NextResponse.json({
      success: true,
      message: 'Regla de prueba creada exitosamente',
      rule: { ...testRule, id: result.lastInsertRowid },
      info: {
        sensor: 'CABASE (13682)',
        condition: 'Tráfico > 5000 Mbit/s',
        notification: 'Email',
        cooldown: '60 segundos'
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
    message: 'Usa POST para crear una regla de prueba',
    description: 'Crea una alerta cuando CABASE supere 5000 Mbit/s'
  });
}
