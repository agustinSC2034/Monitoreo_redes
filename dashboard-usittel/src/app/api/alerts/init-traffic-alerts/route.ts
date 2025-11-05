/**
 * 🚨 API para Crear Alertas de Cambios Drásticos de Tráfico
 * 
 * Endpoint: POST /api/alerts/init-traffic-alerts
 * 
 * Crea reglas para detectar aumentos o caídas drásticas de tráfico
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAlertRule, getAlertRules } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const existingRules = getAlertRules(false);
    const createdRules = [];
    
    // Sensores críticos para monitorear cambios de tráfico
    const sensors = [
      { id: '13682', name: 'CABASE' },
      { id: '13684', name: 'IPLANxARSAT' },
      { id: '13683', name: 'TECO' }
    ];
    
    const recipients = [process.env.ALERT_EMAIL_RECIPIENTS || 'agustin.scutari@it-tel.com.ar'];
    
    for (const sensor of sensors) {
      // Regla para AUMENTOS drásticos (>50%)
      const spikeRuleName = `${sensor.name} - Aumento Drástico de Tráfico`;
      if (!existingRules.find(r => r.name === spikeRuleName)) {
        const spikeRule = {
          name: spikeRuleName,
          sensor_id: sensor.id,
          condition: 'traffic_spike' as const,
          threshold: 50, // 50% de aumento
          channels: ['email'],
          recipients,
          cooldown: 300, // 5 minutos
          priority: 'medium' as const,
          active: true
        };
        
        createAlertRule(spikeRule);
        createdRules.push(spikeRule);
        console.log(`✅ Regla creada: ${spikeRuleName}`);
      }
      
      // Regla para CAÍDAS drásticas (>50%)
      const dropRuleName = `${sensor.name} - Caída Drástica de Tráfico`;
      if (!existingRules.find(r => r.name === dropRuleName)) {
        const dropRule = {
          name: dropRuleName,
          sensor_id: sensor.id,
          condition: 'traffic_drop' as const,
          threshold: 50, // 50% de caída
          channels: ['email'],
          recipients,
          cooldown: 300, // 5 minutos
          priority: 'high' as const,
          active: true
        };
        
        createAlertRule(dropRule);
        createdRules.push(dropRule);
        console.log(`✅ Regla creada: ${dropRuleName}`);
      }
    }
    
    if (createdRules.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Las reglas de tráfico ya existen',
        count: 0
      });
    }
    
    return NextResponse.json({
      success: true,
      message: `${createdRules.length} reglas de tráfico creadas exitosamente`,
      rules: createdRules,
      info: {
        description: 'Detecta cambios > 50% en tráfico',
        sensors: sensors.map(s => s.name).join(', '),
        types: ['Aumentos drásticos', 'Caídas drásticas'],
        cooldown: '5 minutos'
      }
    });
    
  } catch (error) {
    console.error('❌ Error creando reglas de tráfico:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Usa POST para crear reglas de cambios drásticos de tráfico',
    description: 'Detecta aumentos o caídas > 50% en el tráfico de enlaces críticos'
  });
}
