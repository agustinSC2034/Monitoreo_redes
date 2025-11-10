/**
 * 🧪 API para FORZAR envío de alerta de prueba
 * 
 * Endpoint: GET /api/alerts/force-test
 * 
 * Envía una alerta de prueba por EMAIL y WHATSAPP inmediatamente
 * Sin importar el estado real del sensor
 */

import { NextResponse } from 'next/server';
import { sendTestEmail } from '@/lib/emailService';
import { sendTestWhatsApp } from '@/lib/whatsappService';
import { saveAlertHistory } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const results = {
    email: { sent: false, error: null as string | null },
    whatsapp: { sent: false, error: null as string | null }
  };
  
  try {
    console.log('🧪 [TEST] Iniciando envío de alerta de prueba...');
    
    // 📧 Probar EMAIL
    try {
      const emailRecipient = process.env.ALERT_EMAIL_RECIPIENTS || 'agustin.scutari@it-tel.com.ar';
      
      const emailSent = await sendTestEmail(emailRecipient);
      results.email.sent = emailSent;
      
      if (emailSent) {
        console.log('✅ [TEST] Email enviado exitosamente');
      } else {
        console.error('❌ [TEST] Error: sendTestEmail retornó false');
        results.email.error = 'sendTestEmail retornó false';
      }
      
    } catch (emailError) {
      results.email.error = emailError instanceof Error ? emailError.message : 'Error desconocido';
      console.error('❌ [TEST] Error enviando email:', emailError);
    }
    
    // 📱 Probar WHATSAPP
    try {
      const whatsappRecipient = process.env.ALERT_WHATSAPP_RECIPIENTS || '+5492494515181';
      
      const whatsappResult = await sendTestWhatsApp(whatsappRecipient);
      results.whatsapp.sent = whatsappResult.success;
      
      if (whatsappResult.success) {
        console.log('✅ [TEST] WhatsApp enviado exitosamente');
      } else {
        console.error('❌ [TEST] Error WhatsApp:', whatsappResult.error);
        results.whatsapp.error = whatsappResult.error || 'Error desconocido';
      }
      
    } catch (whatsappError) {
      results.whatsapp.error = whatsappError instanceof Error ? whatsappError.message : 'Error desconocido';
      console.error('❌ [TEST] Error enviando WhatsApp:', whatsappError);
    }
    
    // Resumen
    const allSuccess = results.email.sent && results.whatsapp.sent;
    const someSuccess = results.email.sent || results.whatsapp.sent;
    
    // 💾 Guardar en historial de alertas si al menos uno funcionó
    if (someSuccess) {
      try {
        const channelsSent = [];
        if (results.email.sent) channelsSent.push('email');
        if (results.whatsapp.sent) channelsSent.push('whatsapp');
        
        const recipients = [];
        if (results.email.sent) recipients.push(process.env.ALERT_EMAIL_RECIPIENTS || 'agustin.scutari@it-tel.com.ar');
        if (results.whatsapp.sent) recipients.push(process.env.ALERT_WHATSAPP_RECIPIENTS || '+5492494515181');
        
        await saveAlertHistory({
          rule_id: 0, // ID 0 para alertas de prueba
          sensor_id: 'TEST',
          sensor_name: 'Alerta de Prueba',
          status: 'TEST',
          message: 'Esta es una alerta de prueba del sistema. Email y WhatsApp funcionando correctamente.',
          channels_sent: channelsSent,
          recipients: recipients,
          success: allSuccess,
          error_message: allSuccess ? undefined : `Email: ${results.email.error || 'OK'} | WhatsApp: ${results.whatsapp.error || 'OK'}`
        });
        
        console.log('✅ [TEST] Alerta de prueba guardada en historial');
      } catch (dbError) {
        console.error('❌ [TEST] Error guardando en historial:', dbError);
        // No fallar si no se pudo guardar
      }
    }
    
    return NextResponse.json({
      success: allSuccess,
      partial_success: someSuccess && !allSuccess,
      message: allSuccess 
        ? '✅ Email y WhatsApp enviados exitosamente'
        : someSuccess
          ? '⚠️ Al menos un canal funcionó'
          : '❌ Error enviando ambas notificaciones',
      results,
      instructions: {
        email: results.email.sent 
          ? `Revisa tu email: ${process.env.ALERT_EMAIL_RECIPIENTS || 'agustin.scutari@it-tel.com.ar'}`
          : 'Error enviando email - revisa los logs',
        whatsapp: results.whatsapp.sent
          ? `Revisa WhatsApp: ${process.env.ALERT_WHATSAPP_RECIPIENTS || '+5492494515181'}`
          : 'Error enviando WhatsApp - revisa los logs'
      }
    }, { status: allSuccess ? 200 : 207 }); // 207 = Multi-Status
    
  } catch (error) {
    console.error('❌ [TEST] Error general:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      results
    }, { status: 500 });
  }
}
