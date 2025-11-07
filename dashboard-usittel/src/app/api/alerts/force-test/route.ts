/**
 * 🧪 API para FORZAR envío de alerta de prueba
 * 
 * Endpoint: GET /api/alerts/force-test
 * 
 * Envía una alerta de prueba por EMAIL y WHATSAPP inmediatamente
 * Sin importar el estado real del sensor
 */

import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/emailService';
import { sendWhatsApp } from '@/lib/whatsappService';

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
      
      await sendEmail({
        to: emailRecipient,
        subject: '🧪 PRUEBA: Alerta de Monitoreo PRTG',
        text: `
ALERTA DE PRUEBA - Sistema de Monitoreo PRTG

Esto es una prueba del sistema de alertas.

Sensor: CABASE (13682)
Estado: PRUEBA
Valor simulado: 5000 Mbit/s
Umbral: 4500 Mbit/s

Si recibes este email, el sistema de alertas por correo está funcionando correctamente en Vercel.

---
Enviado desde: Vercel Production
Fecha: ${new Date().toLocaleString('es-AR')}
        `,
        html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #f9f9f9; padding: 20px; border: 1px solid #ddd; }
    .alert-box { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 15px 0; }
    .info { background: white; padding: 15px; margin: 15px 0; border-radius: 4px; }
    .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
    .emoji { font-size: 24px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="emoji">🧪</div>
      <h1>PRUEBA: Sistema de Alertas PRTG</h1>
    </div>
    <div class="content">
      <div class="alert-box">
        <h2>⚠️ Alerta de Prueba</h2>
        <p>Este es un mensaje de prueba del sistema de monitoreo.</p>
      </div>
      
      <div class="info">
        <p><strong>Sensor:</strong> CABASE (13682)</p>
        <p><strong>Estado:</strong> PRUEBA</p>
        <p><strong>Valor simulado:</strong> 5000 Mbit/s</p>
        <p><strong>Umbral configurado:</strong> 4500 Mbit/s</p>
        <p><strong>Fecha:</strong> ${new Date().toLocaleString('es-AR')}</p>
      </div>
      
      <p>✅ Si recibes este email, el sistema de alertas por correo está <strong>funcionando correctamente</strong> en Vercel.</p>
      
      <div class="footer">
        <p>Enviado desde Vercel Production</p>
        <p>Sistema de Monitoreo PRTG - IT-TEL</p>
      </div>
    </div>
  </div>
</body>
</html>
        `
      });
      
      results.email.sent = true;
      console.log('✅ [TEST] Email enviado exitosamente');
      
    } catch (emailError) {
      results.email.error = emailError instanceof Error ? emailError.message : 'Error desconocido';
      console.error('❌ [TEST] Error enviando email:', emailError);
    }
    
    // 📱 Probar WHATSAPP
    try {
      const whatsappRecipient = process.env.ALERT_WHATSAPP_RECIPIENTS || '+5492494515181';
      
      await sendWhatsApp(
        whatsappRecipient,
        `🧪 *PRUEBA: Alerta PRTG*

Sensor: *CABASE (13682)*
Estado: PRUEBA
Valor simulado: *5000 Mbit/s*
Umbral: 4500 Mbit/s

✅ Si recibes este mensaje, WhatsApp funciona correctamente en Vercel.

_${new Date().toLocaleString('es-AR')}_`
      );
      
      results.whatsapp.sent = true;
      console.log('✅ [TEST] WhatsApp enviado exitosamente');
      
    } catch (whatsappError) {
      results.whatsapp.error = whatsappError instanceof Error ? whatsappError.message : 'Error desconocido';
      console.error('❌ [TEST] Error enviando WhatsApp:', whatsappError);
    }
    
    // Resumen
    const allSuccess = results.email.sent && results.whatsapp.sent;
    const someSuccess = results.email.sent || results.whatsapp.sent;
    
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
