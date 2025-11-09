/**
 * 🔧 API para actualizar destinatarios de UNA regla específica
 * 
 * PUT /api/alerts/rules/[ruleId]
 * Body: {
 *   "recipients": ["email@example.com", "+54911XXXXXXXX"]
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAlertRule, updateAlertRuleRecipients } from '@/lib/db-supabase';

export const dynamic = 'force-dynamic';

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ ruleId: string }> }
) {
  try {
    const { ruleId: ruleIdStr } = await context.params;
    const ruleId = parseInt(ruleIdStr);
    
    if (isNaN(ruleId)) {
      return NextResponse.json({
        success: false,
        error: 'ID de regla inválido'
      }, { status: 400 });
    }
    
    // Verificar que la regla existe
    const existingRule = await getAlertRule(ruleId);
    if (!existingRule) {
      return NextResponse.json({
        success: false,
        error: `Regla ${ruleId} no encontrada`
      }, { status: 404 });
    }
    
    // Obtener nuevos destinatarios
    const body = await request.json();
    const { recipients } = body;
    
    if (!Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Debes proporcionar un array de destinatarios'
      }, { status: 400 });
    }
    
    // Actualizar
    const success = await updateAlertRuleRecipients(ruleId, recipients);
    
    if (!success) {
      return NextResponse.json({
        success: false,
        error: 'Error al actualizar destinatarios'
      }, { status: 500 });
    }
    
    // Obtener regla actualizada
    const updatedRule = await getAlertRule(ruleId);
    
    return NextResponse.json({
      success: true,
      message: `Regla ${ruleId} actualizada exitosamente`,
      data: updatedRule
    });
    
  } catch (error) {
    console.error('❌ Error actualizando regla:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}
