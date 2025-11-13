/**
 * 🔍 Obtener todos los Chat IDs disponibles
 * Muestra chats personales y grupos donde el bot está agregado
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

async function getChatIds() {
  console.log('🔍 Obteniendo Chat IDs disponibles...\n');

  if (!BOT_TOKEN) {
    console.error('❌ Error: TELEGRAM_BOT_TOKEN no configurado');
    return;
  }

  const bot = new TelegramBot(BOT_TOKEN, { polling: false });

  try {
    // Obtener actualizaciones
    const updates = await bot.getUpdates({ limit: 100 });
    
    console.log(`📊 Se encontraron ${updates.length} actualizaciones\n`);

    if (updates.length === 0) {
      console.log('⚠️  No hay actualizaciones recientes.');
      console.log('\n💡 Para que aparezcan:');
      console.log('   1. Envía un mensaje en tu chat personal con el bot');
      console.log('   2. Envía un mensaje en el grupo donde está el bot');
      console.log('   3. Ejecuta este script nuevamente\n');
      return;
    }

    // Extraer todos los chats únicos
    const chats = new Map();

    updates.forEach((update, index) => {
      const message = update.message || update.edited_message || update.channel_post;
      if (message && message.chat) {
        const chat = message.chat;
        if (!chats.has(chat.id)) {
          chats.set(chat.id, {
            id: chat.id,
            type: chat.type,
            title: chat.title || `${chat.first_name || ''} ${chat.last_name || ''}`.trim(),
            username: chat.username
          });
        }
      }
    });

    console.log('📋 Chats encontrados:\n');
    
    chats.forEach((chat, id) => {
      const typeEmoji = chat.type === 'private' ? '👤' : 
                       chat.type === 'group' ? '👥' : 
                       chat.type === 'supergroup' ? '👥🔒' : '📢';
      
      console.log(`${typeEmoji} ${chat.type.toUpperCase()}`);
      console.log(`   Chat ID: ${chat.id}`);
      console.log(`   Nombre: ${chat.title || 'Chat Personal'}`);
      if (chat.username) console.log(`   Username: @${chat.username}`);
      console.log('');
    });

    // Mostrar instrucciones
    console.log('📝 Instrucciones:\n');
    console.log('1. Si ves un chat de tipo GROUP o SUPERGROUP, ese es tu grupo');
    console.log('2. Copia el Chat ID del grupo (será un número negativo como -1001234567890)');
    console.log('3. Actualiza TELEGRAM_CHAT_ID en .env.local con ese número');
    console.log('4. Si el bot no tiene permisos, ve a Configuración del Grupo → Administradores');
    console.log('   y dale permisos de "Enviar mensajes"\n');

    // Enviar mensaje de prueba a cada chat
    console.log('🧪 ¿Quieres enviar un mensaje de prueba a algún chat? (Y/N)');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

getChatIds().catch(console.error);
