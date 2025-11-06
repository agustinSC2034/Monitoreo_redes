/**
 * 📱 API Route: Test WhatsApp
 * 
 * POST /api/alerts/test-whatsapp
 * Body: { "recipient": "+5492995551234" }
 */

import { NextRequest, NextResponse } from 'next/server';
import { sendTestWhatsApp, verifyWhatsAppConfig } from '@/lib/whatsappService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { recipient } = body;
    
    if (!recipient) {
      return NextResponse.json(
        {
          success: false,
          error: 'Se requiere el parámetro "recipient"'
        },
        { status: 400 }
      );
    }
    
    // Verificar configuración
    const config = verifyWhatsAppConfig();
    if (!config.configured) {
      return NextResponse.json(
        {
          success: false,
          error: config.message,
          details: config.details
        },
        { status: 500 }
      );
    }
    
    // Enviar WhatsApp de prueba
    const result = await sendTestWhatsApp(recipient);
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
        messageId: result.messageId,
        recipient
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.message,
          details: result.error
        },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error('❌ Error en test-whatsapp:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error al enviar WhatsApp de prueba',
        message: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  // GET para verificar configuración
  const config = verifyWhatsAppConfig();
  
  return NextResponse.json({
    ...config,
    info: 'Usa POST con {"recipient": "+5492995551234"} para enviar un test'
  });
}
