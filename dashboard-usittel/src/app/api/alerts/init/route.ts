/**
 * 🎯 API Route: Inicializar Alertas por Defecto
 * 
 * Ruta: POST /api/alerts/init
 * 
 * Crea reglas de alertas básicas para todos los sensores críticos
 */

import { NextResponse } from 'next/server';
import { createAlertRule, getAlertRules, type AlertRule } from '@/lib/db';

// Permitir tanto GET como POST
export async function GET() {
  return initAlerts();
}

export async function POST() {
  return initAlerts();
}

async function initAlerts() {
  try {
    // Verificar si ya hay reglas
    const existingRules = getAlertRules(false);
    
    if (existingRules.length > 0) {
      return NextResponse.json({
        success: false,
        message: 'Ya existen reglas de alertas. Elimínalas primero si quieres reinicializar.',
        count: existingRules.length
      });
    }
    
    // Reglas por defecto para cada sensor crítico
    const defaultRules: Omit<AlertRule, 'id' | 'created_at' | 'updated_at'>[] = [
      {
        name: '🔴 CABASE - Alerta de Caída',
        sensor_id: '13682',
        condition: 'down',
        channels: ['email'],
        recipients: ['noc@usittel.com'], // Cambiar por emails reales
        cooldown: 300, // 5 minutos
        priority: 'critical',
        active: true
      },
      {
        name: '⚠️ CABASE - Alerta de Warning',
        sensor_id: '13682',
        condition: 'warning',
        channels: ['email'],
        recipients: ['noc@usittel.com'],
        cooldown: 600, // 10 minutos
        priority: 'high',
        active: true
      },
      {
        name: '🔴 TECO - Alerta de Caída',
        sensor_id: '13683',
        condition: 'down',
        channels: ['email'],
        recipients: ['noc@usittel.com'],
        cooldown: 300,
        priority: 'high',
        active: true
      },
      {
        name: '🔴 IPLANxARSAT - Alerta de Caída',
        sensor_id: '13684',
        condition: 'down',
        channels: ['email'],
        recipients: ['noc@usittel.com'],
        cooldown: 300,
        priority: 'critical',
        active: true
      },
      {
        name: '🔴 RDA-WAN - Alerta de Caída',
        sensor_id: '2137',
        condition: 'down',
        channels: ['email'],
        recipients: ['noc@usittel.com'],
        cooldown: 300,
        priority: 'critical',
        active: true
      },
      {
        name: '🔴 RDB-DTV - Alerta de Caída',
        sensor_id: '13673',
        condition: 'down',
        channels: ['email'],
        recipients: ['noc@usittel.com'],
        cooldown: 300,
        priority: 'high',
        active: true
      }
    ];
    
    // Crear todas las reglas
    const created = [];
    for (const rule of defaultRules) {
      const result = createAlertRule(rule);
      created.push({
        id: result.lastInsertRowid,
        ...rule
      });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Reglas de alertas inicializadas correctamente',
      data: created,
      count: created.length
    });
    
  } catch (error) {
    console.error('❌ Error inicializando alertas:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error al inicializar alertas',
        message: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
