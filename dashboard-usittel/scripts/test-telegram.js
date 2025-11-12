/**
 * 🧪 Script de prueba para alertas de Telegram
 * Verifica que el bot esté configurado correctamente
 */

const { createClient } = require('@supabase/supabase-js');
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

// Configurar variables de entorno
process.env.TELEGRAM_BOT_TOKEN = envVars.TELEGRAM_BOT_TOKEN || '';
process.env.TELEGRAM_CHAT_ID = envVars.TELEGRAM_CHAT_ID || '';

// Importar servicio de Telegram
const TelegramBot = require('node-telegram-bot-api');

async function testTelegram() {
  console.log('🧪 Probando conexión con Telegram...\n');

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    console.error('❌ Error: TELEGRAM_BOT_TOKEN o TELEGRAM_CHAT_ID no configurados en .env.local');
    console.log('\n📝 Asegúrate de tener estas variables en tu archivo .env.local:');
    console.log('   TELEGRAM_BOT_TOKEN=tu_token_aqui');
    console.log('   TELEGRAM_CHAT_ID=tu_chat_id_aqui\n');
    return;
  }

  console.log('✅ Variables de entorno encontradas');
  console.log(`   BOT_TOKEN: ${botToken.substring(0, 20)}...`);
  console.log(`   CHAT_ID: ${chatId}\n`);

  try {
    // Crear bot
    const bot = new TelegramBot(botToken, { polling: false });

    // Mensaje de prueba
    const testMessage = `
🧪 *PRUEBA DE CONEXIÓN*

✅ El bot de Telegram está configurado correctamente.

📊 *Detalles:*
• Chat ID: ${chatId}
• Fecha: ${new Date().toLocaleString('es-AR')}

_Sistema de Monitoreo ITTEL_
`.trim();

    // Enviar mensaje
    console.log('📤 Enviando mensaje de prueba...');
    await bot.sendMessage(chatId, testMessage, {
      parse_mode: 'Markdown',
      disable_web_page_preview: true,
    });

    console.log('✅ Mensaje enviado exitosamente!\n');
    console.log('📱 Revisa tu Telegram para ver el mensaje de prueba.\n');

    // Probar alerta simulada
    console.log('📤 Enviando alerta simulada...');
    const alertMessage = `
🔴 *ALERTA DE MONITOREO*

🔸 *Sensor:* (012) vlan500-iBGP
📍 *Ubicación:* LARANET LA MATANZA
📊 *Estado:* CAÍDO

Cambio de estado detectado:
Disponible → Falla ❌

_Sistema de Monitoreo ITTEL_
`.trim();

    await bot.sendMessage(chatId, alertMessage, {
      parse_mode: 'Markdown',
      disable_web_page_preview: true,
    });

    console.log('✅ Alerta simulada enviada!\n');

  } catch (error) {
    console.error('❌ Error al conectar con Telegram:', error.message);
    
    if (error.message.includes('401')) {
      console.log('\n💡 Error 401: Bot token inválido. Verifica que el token sea correcto.');
    } else if (error.message.includes('400')) {
      console.log('\n💡 Error 400: Chat ID inválido o el bot no tiene acceso a ese chat.');
      console.log('   Asegúrate de haber iniciado una conversación con el bot (/start).');
    }
  }
}

testTelegram().catch(console.error);
