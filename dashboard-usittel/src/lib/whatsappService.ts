/**
 * 📱 Servicio de WhatsApp con Twilio
 * 
 * Este archivo maneja el envío de mensajes de WhatsApp
 * usando la API de Twilio
 */

import twilio from 'twilio';

// Configuración de Twilio desde variables de entorno
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const whatsappFrom = process.env.TWILIO_WHATSAPP_FROM;

// Crear cliente de Twilio
let twilioClient: ReturnType<typeof twilio> | null = null;

/**
 * Inicializar cliente de Twilio
 */
function getTwilioClient() {
  if (!accountSid || !authToken) {
    throw new Error('❌ Credenciales de Twilio no configuradas en .env.local');
  }
  
  if (!twilioClient) {
    twilioClient = twilio(accountSid, authToken);
    console.log('✅ Cliente de Twilio inicializado');
  }
  
  return twilioClient;
}

/**
 * Verificar configuración de WhatsApp
 */
export function verifyWhatsAppConfig(): { 
  configured: boolean; 
  message: string;
  details?: {
    hasAccountSid: boolean;
    hasAuthToken: boolean;
    hasWhatsappFrom: boolean;
  }
} {
  const hasAccountSid = !!accountSid;
  const hasAuthToken = !!authToken;
  const hasWhatsappFrom = !!whatsappFrom;
  
  if (!hasAccountSid || !hasAuthToken || !hasWhatsappFrom) {
    return {
      configured: false,
      message: '❌ WhatsApp no configurado. Faltan credenciales en .env.local',
      details: {
        hasAccountSid,
        hasAuthToken,
        hasWhatsappFrom
      }
    };
  }
  
  return {
    configured: true,
    message: '✅ WhatsApp configurado correctamente'
  };
}

/**
 * Enviar mensaje de WhatsApp
 */
export async function sendWhatsAppMessage(
  to: string,
  message: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    // Verificar configuración
    const config = verifyWhatsAppConfig();
    if (!config.configured) {
      return {
        success: false,
        error: config.message
      };
    }
    
    // Asegurar que el número tenga el prefijo whatsapp:
    const formattedTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
    
    console.log(`📱 [WHATSAPP] Enviando mensaje a: ${formattedTo}`);
    
    // Obtener cliente de Twilio
    const client = getTwilioClient();
    
    // Enviar mensaje
    const result = await client.messages.create({
      from: whatsappFrom!,
      to: formattedTo,
      body: message
    });
    
    console.log(`✅ WhatsApp enviado exitosamente`);
    console.log(`   Message SID: ${result.sid}`);
    console.log(`   Status: ${result.status}`);
    
    return {
      success: true,
      messageId: result.sid
    };
    
  } catch (error) {
    console.error('❌ Error enviando WhatsApp:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}

/**
 * Enviar alerta por WhatsApp
 */
export async function sendWhatsAppAlert(
  recipients: string[],
  alertTitle: string,
  alertMessage: string,
  priority: string = 'MEDIA'
): Promise<{ success: boolean; sent: number; failed: number; errors: string[] }> {
  console.log(`📱 [WHATSAPP] Enviando alerta a ${recipients.length} destinatario(s)`);
  
  let sent = 0;
  let failed = 0;
  const errors: string[] = [];
  
  // Formatear mensaje para WhatsApp (profesional, sin emojis)
  const whatsappMessage = `
*ITTEL MONITOREO*

*${alertTitle}*

${alertMessage}
`.trim();
  
  // Enviar a cada destinatario
  for (const recipient of recipients) {
    const result = await sendWhatsAppMessage(recipient, whatsappMessage);
    
    if (result.success) {
      sent++;
    } else {
      failed++;
      errors.push(`${recipient}: ${result.error}`);
    }
  }
  
  console.log(`📊 Resultado WhatsApp: ${sent} enviados, ${failed} fallidos`);
  
  return {
    success: sent > 0,
    sent,
    failed,
    errors
  };
}

/**
 * Enviar WhatsApp de prueba
 */
export async function sendTestWhatsApp(recipient: string): Promise<{
  success: boolean;
  message: string;
  messageId?: string;
  error?: string;
}> {
  // Ajustar timezone a Argentina (UTC-3)
  const now = new Date();
  const argTime = new Date(now.getTime() - (3 * 60 * 60 * 1000));
  const timeString = argTime.toLocaleString('es-AR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
    timeZone: 'UTC'
  });
  
  const testMessage = `
*ITTEL MONITOREO*
*Prueba de WhatsApp*

Este es un mensaje de prueba del sistema de alertas.

Si recibiste este mensaje, WhatsApp está configurado correctamente.

_Sistema de monitoreo de red - Grupo ITTEL_
_${timeString}_
`.trim();
  
  const result = await sendWhatsAppMessage(recipient, testMessage);
  
  if (result.success) {
    return {
      success: true,
      message: `WhatsApp de prueba enviado exitosamente a ${recipient}`,
      messageId: result.messageId
    };
  } else {
    return {
      success: false,
      message: `Error al enviar WhatsApp de prueba`,
      error: result.error
    };
  }
}
