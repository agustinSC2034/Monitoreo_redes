/**
 * 🧪 API para probar envío REAL de email
 * 
 * POST /api/alerts/test-real-email
 * Body: { recipient: "email@example.com" }
 */

import { sendAlertEmail, sendTestEmail, verifyEmailConfig } from '@/lib/emailService';

import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const recipient = body.recipient || process.env.ALERT_EMAIL_RECIPIENTS;
    
    if (!recipient) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'No se especificó destinatario. Configura ALERT_EMAIL_RECIPIENTS en .env.local' 
        },
        { status: 400 }
      );
    }
    
    console.log('🧪 Probando envío de email a:', recipient);
    
    // Primero verificar configuración
    const isConfigValid = await verifyEmailConfig();
    if (!isConfigValid) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Configuración de email inválida. Verifica las variables SMTP_* en .env.local',
          hint: 'Para Gmail, necesitas una App Password: https://myaccount.google.com/apppasswords'
        },
        { status: 500 }
      );
    }
    
    // Enviar email de prueba
    const success = await sendTestEmail(recipient);
    
    if (success) {
      return NextResponse.json({
        success: true,
        message: `Email de prueba enviado exitosamente a ${recipient}`,
        recipient,
        smtp: {
          host: process.env.SMTP_HOST,
          port: process.env.SMTP_PORT,
          user: process.env.SMTP_USER,
          from: process.env.SMTP_FROM
        }
      });
    } else {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Error al enviar email. Revisa los logs del servidor.' 
        },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error('❌ Error en test de email:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: String(error),
        message: 'Error inesperado al probar email'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/alerts/test-real-email
 * Verificar configuración sin enviar email
 */
export async function GET() {
  try {
    const isConfigValid = await verifyEmailConfig();
    
    return NextResponse.json({
      configured: isConfigValid,
      config: {
        host: process.env.SMTP_HOST || 'NOT_SET',
        port: process.env.SMTP_PORT || 'NOT_SET',
        user: process.env.SMTP_USER ? '✅ SET' : '❌ NOT_SET',
        pass: process.env.SMTP_PASS ? '✅ SET' : '❌ NOT_SET',
        from: process.env.SMTP_FROM || process.env.SMTP_USER || 'NOT_SET',
        recipients: process.env.ALERT_EMAIL_RECIPIENTS || 'NOT_SET'
      },
      message: isConfigValid 
        ? '✅ Configuración válida, listo para enviar emails'
        : '❌ Configuración incompleta o inválida'
    });
    
  } catch (error) {
    console.error('❌ Error verificando configuración:', error);
    return NextResponse.json(
      { 
        configured: false,
        error: String(error)
      },
      { status: 500 }
    );
  }
}
