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
      from: `"ITTEL Monitoreo" <${FROM_EMAIL}>`,
      to: validRecipients.join(', '),
      subject: subject, // Sin emoji ni prioridad
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
 * 🎨 Generar HTML del email (Diseño Minimalista)
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
<body style="margin: 0; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; background-color: #ffffff; color: #1f2937;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto;">
    
    <!-- Header -->
    <tr>
      <td style="border-bottom: 3px solid ${priorityColor}; padding-bottom: 15px; margin-bottom: 20px;">
        <h1 style="margin: 0; font-size: 14px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; color: #000000;">
          ITTEL Monitoreo
        </h1>
      </td>
    </tr>
    
    <!-- Subject -->
    <tr>
      <td style="padding: 20px 0 15px 0;">
        <h2 style="margin: 0; font-size: 16px; font-weight: bold; color: #000000;">
          ${subject}
        </h2>
      </td>
    </tr>
    
    <!-- Message Content -->
    <tr>
      <td style="padding: 0 0 20px 0;">
        <div style="border-left: 3px solid ${priorityColor}; padding-left: 15px; font-size: 13px; line-height: 1.6; color: #374151;">
          ${formattedMessage}
        </div>
      </td>
    </tr>
    
    <!-- Footer -->
    <tr>
      <td style="border-top: 1px solid #e5e7eb; padding-top: 15px; font-size: 11px; color: #9ca3af;">
        <div>Sistema de monitoreo de red - Grupo ITTEL</div>
        <div style="margin-top: 3px;">USITTEL (Tandil) | LARANET (La Matanza)</div>
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
  const subject = 'Prueba de Sistema de Alertas';
  const message = `Configuración verificada correctamente.

SERVIDOR: ${SMTP_CONFIG.host}:${SMTP_CONFIG.port}
USUARIO: ${SMTP_CONFIG.auth.user}
FECHA: ${new Date().toLocaleString('es-AR')}

El sistema está operativo y listo para enviar alertas.

Tipos de alertas configuradas:
- Caídas de enlaces (DOWN)
- Advertencias (WARNING)
- Umbrales personalizados`;

  return sendAlertEmail([recipient], subject, message, 'low');
}

export default {
  sendAlertEmail,
  verifyEmailConfig,
  sendTestEmail
};
