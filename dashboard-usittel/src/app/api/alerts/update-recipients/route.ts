/**
 * 🔄 API Route: Actualizar destinatarios de alertas
 * 
 * POST /api/alerts/update-recipients
 * Body: {
 *   "emails": ["email1@domain.com", "email2@domain.com"],
 *   "whatsapp": ["+5491124682247", "+5491187654321", "+5491198765432"]
 * }
 * 
 * Actualiza TODAS las reglas de alerta para incluir los nuevos destinatarios
 */

import { NextRequest, NextResponse } from 'next/server';

import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'monitoring.db');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { emails = [], whatsapp = [] } = body;
    
    if (emails.length === 0 && whatsapp.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Debes proporcionar al menos un email o número de WhatsApp'
        },
        { status: 400 }
      );
    }
    
    const db = new Database(DB_PATH);
    
    // Obtener todas las reglas activas
    const rules = db.prepare('SELECT * FROM alert_rules WHERE active = 1').all();
    
    if (rules.length === 0) {
      db.close();
      return NextResponse.json(
        {
          success: false,
          error: 'No hay reglas de alerta activas para actualizar'
        },
        { status: 404 }
      );
    }
    
    // Preparar canales y destinatarios
    const channels: string[] = [];
    const allRecipients: string[] = [];
    
    if (emails.length > 0) {
      channels.push('email');
      allRecipients.push(...emails);
    }
    
    if (whatsapp.length > 0) {
      channels.push('whatsapp');
      allRecipients.push(...whatsapp);
    }
    
    // Actualizar todas las reglas
    const updateStmt = db.prepare(`
      UPDATE alert_rules 
      SET 
        channels = ?,
        recipients = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    
    const updatedRules = [];
    
    for (const rule of rules as any[]) {
      updateStmt.run(
        JSON.stringify(channels),
        JSON.stringify(allRecipients),
        rule.id
      );
      
      updatedRules.push({
        id: rule.id,
        name: rule.name,
        channels,
        recipients: allRecipients
      });
    }
    
    db.close();
    
    return NextResponse.json({
      success: true,
      message: `${updatedRules.length} reglas actualizadas correctamente`,
      data: {
        channels,
        emails,
        whatsapp,
        updatedRules
      }
    });
    
  } catch (error) {
    console.error('❌ Error actualizando destinatarios:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error al actualizar destinatarios',
        message: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}

// GET para ver configuración actual
export async function GET() {
  try {
    const db = new Database(DB_PATH);
    const rules = db.prepare('SELECT id, name, channels, recipients, active FROM alert_rules').all();
    db.close();
    
    return NextResponse.json({
      success: true,
      data: rules.map((rule: any) => ({
        ...rule,
        channels: JSON.parse(rule.channels),
        recipients: JSON.parse(rule.recipients)
      }))
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo reglas:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error al obtener reglas'
      },
      { status: 500 }
    );
  }
}
