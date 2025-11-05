/**
 * 🧪 API de Prueba de Email
 * 
 * Endpoint: POST /api/alerts/test-email
 * 
 * Envía un email de prueba para verificar la configuración
 */

import { NextRequest, NextResponse } from 'next/server';
import { sendTestEmail, verifyEmailConfig } from '@/lib/emailService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { recipient } = body;
    
    // Validar que haya destinatario
    if (!recipient || !recipient.includes('@')) {
      return NextResponse.json({
        success: false,
        error: 'Se requiere un email válido en el campo "recipient"'
      }, { status: 400 });
    }
    
    console.log('🧪 Probando envío de email a:', recipient);
    
    // Verificar configuración
    const configOk = await verifyEmailConfig();
    if (!configOk) {
      return NextResponse.json({
        success: false,
        error: 'Configuración de email incompleta. Verifica las variables de entorno SMTP_USER y SMTP_PASS'
      }, { status: 500 });
    }
    
    // Enviar email de prueba
    const success = await sendTestEmail(recipient);
    
    if (success) {
      return NextResponse.json({
        success: true,
        message: `Email de prueba enviado exitosamente a ${recipient}`,
        recipient
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'Error al enviar email. Revisa los logs del servidor.'
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('❌ Error en test de email:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Usa POST para enviar un email de prueba',
    example: {
      method: 'POST',
      body: {
        recipient: 'tu-email@example.com'
      }
    }
  });
}
