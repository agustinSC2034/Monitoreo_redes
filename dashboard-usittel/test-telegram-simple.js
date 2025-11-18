/**
 * Test simple de Telegram
 */

const TelegramBot = require('node-telegram-bot-api');

const botToken = '8227880581:AAFpxMZSGVVvoeJLAPvLFAp6CdOQOHawHRg';
const chatId = '-1003354964179';

async function testTelegram() {
  console.log('🧪 Probando conexión con Telegram...\n');
  console.log(`   BOT_TOKEN: ${botToken.substring(0, 20)}...`);
  console.log(`   CHAT_ID: ${chatId}\n`);

  try {
    const bot = new TelegramBot(botToken, { polling: false });

    const testMessage = `🧪 *PRUEBA DE CONEXIÓN*

✅ El bot de Telegram está configurado correctamente desde este chat.

📊 *Detalles:*
• Chat ID: ${chatId}
• Fecha: ${new Date().toLocaleString('es-AR')}

_Sistema de Monitoreo ITTEL_`;

    console.log('📤 Enviando mensaje de prueba...');
    await bot.sendMessage(chatId, testMessage, {
      parse_mode: 'Markdown',
      disable_web_page_preview: true,
    });

    console.log('✅ Mensaje enviado exitosamente!\n');
    console.log('📱 Revisa tu Telegram para ver el mensaje de prueba.\n');

  } catch (error) {
    console.error('❌ Error al conectar con Telegram:', error.message);
  }
}

testTelegram().catch(console.error);
