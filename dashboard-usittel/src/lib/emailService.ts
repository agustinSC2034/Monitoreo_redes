/**
 * 📧 Servicio de Envío de Emails
 * 
 * Maneja el envío de notificaciones por email usando NodeMailer
 */

import type { Transporter } from 'nodemailer';
import nodemailer from 'nodemailer';

// Configuración desde variables de entorno
const SMTP_CONFIG = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true', // true para 465, false para otros puertos
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || ''
  }
};

const FROM_EMAIL = process.env.SMTP_FROM || process.env.SMTP_USER || 'alertas@usittel.com';

let transporter: Transporter | null = null;

/**
 * 🔌 Obtener/crear transporter de NodeMailer
 */
function getTransporter(): Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport(SMTP_CONFIG);
    console.log('✅ Transporter de email configurado');
  }
  return transporter;
}

/**
 * 📧 Enviar email de alerta
 */
export async function sendAlertEmail(
  recipients: string[],
  subject: string,
  message: string,
  priority: 'low' | 'medium' | 'high' | 'critical' = 'medium'
): Promise<boolean> {
  
  // Validar que haya configuración
  if (!SMTP_CONFIG.auth.user || !SMTP_CONFIG.auth.pass) {
    console.error('❌ SMTP no configurado. Verifica las variables de entorno SMTP_USER y SMTP_PASS');
    return false;
  }
  
  // Filtrar solo emails válidos
  const validRecipients = recipients.filter(r => r.includes('@'));
  
  if (validRecipients.length === 0) {
    console.warn('⚠️ No hay destinatarios de email válidos');
    return false;
  }
  
  try {
    const transport = getTransporter();
    
    // Preparar email HTML
    const htmlContent = generateEmailHTML(subject, message, priority);
    
    // Configurar prioridad del email
    const priorityHeaders: any = {};
    if (priority === 'critical' || priority === 'high') {
      priorityHeaders['X-Priority'] = '1'; // Alta prioridad
      priorityHeaders['X-MSMail-Priority'] = 'High';
      priorityHeaders['Importance'] = 'high';
    }
    
    // Enviar email
    const info = await transport.sendMail({
      from: `"USITTEL Monitoreo" <${FROM_EMAIL}>`,
      to: validRecipients.join(', '),
      subject: `${getPriorityEmoji(priority)} ${subject}`,
      text: message, // Versión texto plano
      html: htmlContent, // Versión HTML
      headers: priorityHeaders
    });
    
    console.log(`✅ Email enviado exitosamente a: ${validRecipients.join(', ')}`);
    console.log(`   Message ID: ${info.messageId}`);
    
    return true;
    
  } catch (error) {
    console.error('❌ Error enviando email:', error);
    
    // Errores comunes y soluciones
    if (error instanceof Error) {
      if (error.message.includes('Invalid login')) {
        console.error('💡 Solución: Verifica usuario/contraseña en .env.local');
        console.error('   Para Gmail, necesitas una App Password: https://myaccount.google.com/apppasswords');
      } else if (error.message.includes('ECONNREFUSED')) {
        console.error('💡 Solución: Verifica SMTP_HOST y SMTP_PORT en .env.local');
      }
    }
    
    return false;
  }
}

/**
 * 🎨 Generar HTML del email
 */
function generateEmailHTML(subject: string, message: string, priority: string): string {
  const priorityColor = {
    low: '#3b82f6',      // Azul
    medium: '#f59e0b',   // Amarillo
    high: '#f97316',     // Naranja
    critical: '#ef4444'  // Rojo
  }[priority];
  
  const priorityLabel = {
    low: 'BAJA',
    medium: 'MEDIA',
    high: 'ALTA',
    critical: 'CRÍTICA'
  }[priority];
  
  // Convertir saltos de línea a <br>
  const formattedMessage = message.replace(/\n/g, '<br>');
  
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px 20px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: bold;">
                🚨 USITTEL Monitoreo de Red
              </h1>
            </td>
          </tr>
          
          <!-- Priority Badge -->
          <tr>
            <td style="padding: 20px; text-align: center;">
              <div style="display: inline-block; background-color: ${priorityColor}; color: white; padding: 8px 20px; border-radius: 20px; font-weight: bold; font-size: 14px;">
                PRIORIDAD: ${priorityLabel}
              </div>
            </td>
          </tr>
          
          <!-- Subject -->
          <tr>
            <td style="padding: 0 30px 20px 30px;">
              <h2 style="margin: 0; color: #1f2937; font-size: 20px; font-weight: 600;">
                ${subject}
              </h2>
            </td>
          </tr>
          
          <!-- Message Content -->
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <div style="background-color: #f9fafb; border-left: 4px solid ${priorityColor}; padding: 20px; border-radius: 4px; color: #374151; font-size: 14px; line-height: 1.6;">
                ${formattedMessage}
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 12px;">
                Este es un mensaje automático del sistema de monitoreo de USITTEL.
              </p>
              <p style="margin: 0; color: #6b7280; font-size: 12px;">
                Enviado el ${new Date().toLocaleString('es-AR', { 
                  dateStyle: 'full', 
                  timeStyle: 'short' 
                })}
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * 🏷️ Obtener emoji según prioridad
 */
function getPriorityEmoji(priority: string): string {
  const emojis = {
    low: '🔵',
    medium: '🟡',
    high: '🟠',
    critical: '🔴'
  };
  return emojis[priority as keyof typeof emojis] || '⚪';
}

/**
 * 🧪 Verificar configuración de email
 */
export async function verifyEmailConfig(): Promise<boolean> {
  if (!SMTP_CONFIG.auth.user || !SMTP_CONFIG.auth.pass) {
    console.error('❌ Configuración de email incompleta');
    return false;
  }
  
  try {
    const transport = getTransporter();
    await transport.verify();
    console.log('✅ Configuración de email verificada correctamente');
    return true;
  } catch (error) {
    console.error('❌ Error verificando configuración de email:', error);
    return false;
  }
}

/**
 * 📧 Enviar email de prueba
 */
export async function sendTestEmail(recipient: string): Promise<boolean> {
  const subject = 'Prueba de Sistema de Alertas USITTEL';
  const message = `🎉 ¡Prueba exitosa!

Este es un email de prueba del sistema de monitoreo de red de USITTEL.

📊 Información del sistema:
• Servidor: ${SMTP_CONFIG.host}:${SMTP_CONFIG.port}
• Usuario: ${SMTP_CONFIG.auth.user}
• Fecha: ${new Date().toLocaleString('es-AR')}

Si recibiste este email, la configuración es correcta. ✅

El sistema ya está listo para enviar alertas en caso de:
🔴 Caídas de enlaces (DOWN)
🟡 Advertencias (WARNING)
🔵 Anomalías detectadas

¡Todo funcionando correctamente!`;

  return sendAlertEmail([recipient], subject, message, 'low');
}

export default {
  sendAlertEmail,
  verifyEmailConfig,
  sendTestEmail
};
