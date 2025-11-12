/**
 * Servicio de notificaciones por Telegram
 * Envía alertas a través de Telegram Bot API
 */

import TelegramBot from 'node-telegram-bot-api';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '';

let bot: TelegramBot | null = null;

/**
 * Inicializar bot de Telegram
 */
function initBot() {
  if (!bot && TELEGRAM_BOT_TOKEN) {
    bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: false });
  }
  return bot;
}

interface TelegramAlertOptions {
  sensorName: string;
  status: string;
  message: string;
  location: string;
  priority?: 'high' | 'normal';
}

/**
 * Enviar alerta por Telegram
 */
export async function sendTelegramAlert(options: TelegramAlertOptions): Promise<boolean> {
  try {
    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
      console.error('❌ Telegram no configurado: faltan BOT_TOKEN o CHAT_ID');
      return false;
    }

    const telegramBot = initBot();
    if (!telegramBot) {
      console.error('❌ No se pudo inicializar el bot de Telegram');
      return false;
    }

    // Determinar emoji según el estado
    let emoji = '⚠️';
    let statusText = options.status;
    
    if (options.status.toLowerCase().includes('disponible') || 
        options.status.toLowerCase().includes('up')) {
      emoji = '✅';
      statusText = 'Recuperado';
    } else if (options.status.toLowerCase().includes('falla') || 
               options.status.toLowerCase().includes('down')) {
      emoji = '🔴';
      statusText = 'CAÍDO';
    }

    // Formatear mensaje para Telegram
    const telegramMessage = `
${emoji} *ALERTA DE MONITOREO*

🔸 *Sensor:* ${options.sensorName}
📍 *Ubicación:* ${options.location}
📊 *Estado:* ${statusText}

${options.message}

_Sistema de Monitoreo ITTEL_
`.trim();

    // Enviar mensaje
    await telegramBot.sendMessage(TELEGRAM_CHAT_ID, telegramMessage, {
      parse_mode: 'Markdown',
      disable_web_page_preview: true,
    });

    console.log(`✅ Alerta de Telegram enviada: ${options.sensorName}`);
    return true;

  } catch (error) {
    console.error('❌ Error enviando alerta por Telegram:', error);
    return false;
  }
}

/**
 * Probar conexión con Telegram
 */
export async function testTelegramConnection(): Promise<boolean> {
  try {
    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
      console.error('❌ Telegram no configurado');
      return false;
    }

    const telegramBot = initBot();
    if (!telegramBot) {
      return false;
    }

    await telegramBot.sendMessage(
      TELEGRAM_CHAT_ID,
      '✅ *Conexión exitosa*\n\nEl bot de Telegram está funcionando correctamente.',
      { parse_mode: 'Markdown' }
    );

    console.log('✅ Conexión de Telegram exitosa');
    return true;

  } catch (error) {
    console.error('❌ Error en prueba de Telegram:', error);
    return false;
  }
}
