/**
 * 🔍 Diagnóstico de WhatsApp
 * 
 * Endpoint: GET /api/debug/whatsapp
 * 
 * Muestra información detallada sobre la configuración de WhatsApp
 * y hace un test de envío con error completo
 */

import { NextResponse } from 'next/server';
import twilio from 'twilio';

export const dynamic = 'force-dynamic';

export async function GET() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const whatsappFrom = process.env.TWILIO_WHATSAPP_FROM;
  const whatsappTo = process.env.ALERT_WHATSAPP_RECIPIENTS;
  
  const diagnostics = {
    configuration: {
      has_account_sid: !!accountSid,
      account_sid_length: accountSid?.length || 0,
      account_sid_preview: accountSid ? `${accountSid.substring(0, 10)}...` : 'N/A',
      
      has_auth_token: !!authToken,
      auth_token_length: authToken?.length || 0,
      auth_token_preview: authToken ? `${authToken.substring(0, 10)}...` : 'N/A',
      
      has_whatsapp_from: !!whatsappFrom,
      whatsapp_from: whatsappFrom || 'N/A',
      
      has_whatsapp_to: !!whatsappTo,
      whatsapp_to: whatsappTo || 'N/A'
    },
    test_result: {
      success: false,
      error: null as string | null,
      details: null as any
    }
  };
  
  // Intentar enviar mensaje de prueba
  if (accountSid && authToken && whatsappFrom && whatsappTo) {
    try {
      const client = twilio(accountSid, authToken);
      
      const formattedTo = whatsappTo.startsWith('whatsapp:') 
        ? whatsappTo 
        : `whatsapp:${whatsappTo}`;
      
      console.log('🧪 Intentando enviar WhatsApp de prueba...');
      console.log(`   From: ${whatsappFrom}`);
      console.log(`   To: ${formattedTo}`);
      
      const message = await client.messages.create({
        from: whatsappFrom,
        to: formattedTo,
        body: '🧪 TEST: Sistema de monitoreo PRTG\n\nSi recibes este mensaje, WhatsApp está funcionando correctamente.'
      });
      
      diagnostics.test_result = {
        success: true,
        error: null,
        details: {
          message_sid: message.sid,
          status: message.status,
          date_created: message.dateCreated,
          date_sent: message.dateSent,
          error_code: message.errorCode,
          error_message: message.errorMessage
        }
      };
      
    } catch (error: any) {
      console.error('❌ Error en test de WhatsApp:', error);
      
      diagnostics.test_result = {
        success: false,
        error: error.message || 'Error desconocido',
        details: {
          code: error.code,
          status: error.status,
          moreInfo: error.moreInfo,
          details: error.details || error.detail,
          fullError: JSON.stringify(error, null, 2)
        }
      };
    }
  } else {
    diagnostics.test_result.error = 'Faltan credenciales en las variables de entorno';
  }
  
  return NextResponse.json(diagnostics, { status: 200 });
}
