/**
 * 🔧 API simple para actualizar destinatarios de la regla 6
 * 
 * GET /api/debug/fix-rule-6
 */

import { NextResponse } from 'next/server';
import { getDB } from '@/lib/db-supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = getDB();
    
    // Obtener regla actual
    const { data: before, error: errorBefore } = await db
      .from('alert_rules')
      .select('*')
      .eq('id', 6)
      .single();
    
    if (errorBefore) {
      return NextResponse.json({
        success: false,
        error: 'Error obteniendo regla',
        details: errorBefore
      }, { status: 500 });
    }
    
    // Actualizar recipients
    const newRecipients = [
      'agustin.scutari@it-tel.com.ar',
      '+5491124682247'
    ];
    
    const { error: errorUpdate } = await db
      .from('alert_rules')
      .update({ recipients: JSON.stringify(newRecipients) })
      .eq('id', 6);
    
    if (errorUpdate) {
      return NextResponse.json({
        success: false,
        error: 'Error actualizando regla',
        details: errorUpdate
      }, { status: 500 });
    }
    
    // Obtener regla actualizada
    const { data: after, error: errorAfter } = await db
      .from('alert_rules')
      .select('*')
      .eq('id', 6)
      .single();
    
    if (errorAfter) {
      return NextResponse.json({
        success: false,
        error: 'Error verificando actualización',
        details: errorAfter
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Regla 6 actualizada exitosamente',
      before: {
        ...before,
        recipients: JSON.parse(before.recipients as string)
      },
      after: {
        ...after,
        recipients: JSON.parse(after.recipients as string)
      }
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}
