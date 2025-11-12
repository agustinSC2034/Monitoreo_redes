/**
 * 🧪 Enviar alerta de prueba por Telegram
 * Simula una alerta real de caída de enlace
 */

const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');

// Cargar variables de entorno
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    envVars[match[1].trim()] = match[2].trim();
  }
});

const BOT_TOKEN = envVars.TELEGRAM_BOT_TOKEN;
const CHAT_ID = envVars.TELEGRAM_CHAT_ID;

async function sendTestAlert() {
  console.log('🧪 Enviando alerta de prueba simulada...\n');

  if (!BOT_TOKEN || !CHAT_ID) {
    console.error('❌ Error: Variables de Telegram no configuradas');
    return;
  }

  const bot = new TelegramBot(BOT_TOKEN, { polling: false });

  // Simular alerta de CAÍDA
  const alertDown = `
🔴 *ALERTA DE MONITOREO*

*Sensor:* (012) vlan500-iBGP
*Ubicación:* LARANET LA MATANZA

SENSOR: (012) vlan500-iBGP
CONDICIÓN: Cambio de estado
ESTADO: Disponible ✅ → Falla ❌
DURACIÓN ANTERIOR: 120 min
TIMESTAMP: 11/11/2025, 14:30:15

_Sistema de Monitoreo ITTEL_
`.trim();

  console.log('📤 Enviando alerta de CAÍDA...');
  await bot.sendMessage(CHAT_ID, alertDown, {
    parse_mode: 'Markdown',
    disable_web_page_preview: true,
  });
  console.log('✅ Alerta de caída enviada\n');

  // Esperar 2 segundos
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Simular alerta de RECUPERACIÓN
  const alertRecovery = `
✅ *ALERTA DE MONITOREO*

*Sensor:* (012) vlan500-iBGP
*Ubicación:* LARANET LA MATANZA

SENSOR: (012) vlan500-iBGP
CONDICIÓN: Cambio de estado
ESTADO: Falla ❌ → Disponible ✅
DURACIÓN ANTERIOR: 15 min
TIMESTAMP: 11/11/2025, 14:45:20

_Sistema de Monitoreo ITTEL_
`.trim();

  console.log('📤 Enviando alerta de RECUPERACIÓN...');
  await bot.sendMessage(CHAT_ID, alertRecovery, {
    parse_mode: 'Markdown',
    disable_web_page_preview: true,
  });
  console.log('✅ Alerta de recuperación enviada\n');

  console.log('✨ Prueba completada. Verifica tu Telegram!\n');
}

sendTestAlert().catch(console.error);
