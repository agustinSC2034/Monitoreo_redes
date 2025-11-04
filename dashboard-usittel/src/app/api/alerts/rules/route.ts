/**
 * 🚨 API Route: Gestión de Reglas de Alertas
 * 
 * Rutas:
 * - GET /api/alerts/rules - Obtener todas las reglas
 * - POST /api/alerts/rules - Crear nueva regla
 * - PATCH /api/alerts/rules - Actualizar regla
 * - DELETE /api/alerts/rules - Eliminar regla
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getAlertRules,
  createAlertRule,
  updateAlertRule,
  deleteAlertRule,
  type AlertRule
} from '@/lib/db';

// GET - Obtener todas las reglas de alertas
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active') !== 'false';
    
    const rules = getAlertRules(activeOnly);
    
    return NextResponse.json({
      success: true,
      data: rules,
      count: rules.length
    });
  } catch (error) {
    console.error('❌ Error obteniendo reglas de alertas:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error al obtener reglas de alertas',
        message: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}

// POST - Crear nueva regla de alerta
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validar datos requeridos
    if (!body.name || !body.sensor_id || !body.condition) {
      return NextResponse.json(
        {
          success: false,
          error: 'Faltan datos requeridos: name, sensor_id, condition'
        },
        { status: 400 }
      );
    }
    
    // Crear regla
    const rule: AlertRule = {
      name: body.name,
      sensor_id: body.sensor_id,
      condition: body.condition,
      threshold: body.threshold,
      duration: body.duration,
      channels: body.channels || ['email'],
      recipients: body.recipients || [],
      cooldown: body.cooldown || 300, // 5 minutos por defecto
      priority: body.priority || 'medium',
      active: body.active !== false
    };
    
    const result = createAlertRule(rule);
    
    return NextResponse.json({
      success: true,
      data: {
        id: result.lastInsertRowid,
        ...rule
      },
      message: 'Regla de alerta creada correctamente'
    });
  } catch (error) {
    console.error('❌ Error creando regla de alerta:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error al crear regla de alerta',
        message: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}

// PATCH - Actualizar regla existente
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Se requiere el ID de la regla'
        },
        { status: 400 }
      );
    }
    
    const result = updateAlertRule(body.id, body);
    
    return NextResponse.json({
      success: true,
      data: result,
      message: 'Regla actualizada correctamente'
    });
  } catch (error) {
    console.error('❌ Error actualizando regla:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error al actualizar regla',
        message: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar regla
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Se requiere el ID de la regla'
        },
        { status: 400 }
      );
    }
    
    const result = deleteAlertRule(parseInt(id));
    
    return NextResponse.json({
      success: true,
      data: result,
      message: 'Regla eliminada correctamente'
    });
  } catch (error) {
    console.error('❌ Error eliminando regla:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error al eliminar regla',
        message: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
