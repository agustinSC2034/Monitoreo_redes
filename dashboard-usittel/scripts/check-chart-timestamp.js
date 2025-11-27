/**
 * 🔍 Verificar timestamp de gráfico para alertas
 */

const https = require('https');

const now = Date.now();
const sensorId = '5159';
const location = 'matanza';
const chartUrl = `https://monitoreo-redes.vercel.app/api/chart-proxy?id=${sensorId}&location=${location}&_=${now}`;

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🕐 SIMULACIÓN DE ALERTA');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log('📅 FECHA/HORA ACTUAL (Argentina):');
console.log('   ' + new Date().toLocaleString('es-AR', { 
  timeZone: 'America/Argentina/Buenos_Aires',
  dateStyle: 'full',
  timeStyle: 'long'
}));
console.log('');

console.log('🔢 TIMESTAMP UNIX:');
console.log('   ' + now);
console.log('');

console.log('📊 URL DEL GRÁFICO:');
console.log('   ' + chartUrl);
console.log('');

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📸 CAPTURA DE IMAGEN');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log('Para TELEGRAM:');
console.log('   • sendPhoto() descarga la imagen AHORA');
console.log('   • La imagen queda adjunta (estática)');
console.log('   • Fecha del gráfico: ' + new Date().toLocaleString('es-AR'));
console.log('');

console.log('Para EMAIL:');
console.log('   • <img src="..."> con el timestamp ' + now);
console.log('   • El navegador recarga la imagen al abrir el email');
console.log('   • ⚠️  NO es estática, se actualiza cada vez');
console.log('');

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🧪 VERIFICACIÓN DE LA IMAGEN');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log('Descargando imagen desde el endpoint...\n');

https.get(chartUrl, (res) => {
  console.log('✅ Respuesta del servidor:');
  console.log('   Status: ' + res.statusCode);
  console.log('   Content-Type: ' + res.headers['content-type']);
  console.log('   Content-Length: ' + (res.headers['content-length'] || 'N/A') + ' bytes');
  console.log('');
  
  if (res.statusCode === 200) {
    console.log('✅ La imagen se capturó correctamente');
    console.log('');
    console.log('📋 RESUMEN:');
    console.log('   • Hora de captura: ' + new Date().toLocaleTimeString('es-AR'));
    console.log('   • Telegram: Adjuntará esta imagen (estática)');
    console.log('   • Email: Link dinámico (se actualiza al abrir)');
    console.log('');
    console.log('💡 CONCLUSIÓN:');
    console.log('   Telegram funciona CORRECTAMENTE con timestamp');
    console.log('   Email NO puede ser estático con <img src="...">');
  } else {
    console.log('❌ Error capturando imagen');
  }
  
  res.resume(); // Consumir la respuesta
}).on('error', (err) => {
  console.error('❌ Error de conexión:', err.message);
});
