/**
 * 🧪 Test manual de alerta - Llama al endpoint de cron directamente
 */

const https = require('https');

console.log('🧪 Test de alerta manual\n');
console.log('📡 Llamando al endpoint de cron en Vercel...\n');

const url = 'https://monitoreo-redes.vercel.app/api/cron/check-alerts?location=tandil&_t=' + Date.now();

https.get(url, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log(`✅ Status: ${res.statusCode}\n`);
    
    try {
      const result = JSON.parse(data);
      console.log('📊 Resultado:');
      console.log(JSON.stringify(result, null, 2));
      
      if (result.results) {
        console.log('\n📋 Sensores chequeados:');
        result.results.forEach(r => {
          if (r.checked) {
            console.log(`   ✅ ${r.name}: ${r.status} - ${r.value}`);
          } else {
            console.log(`   ❌ ${r.sensor_id}: Error`);
          }
        });
      }
      
      console.log('\n🎯 ¡Listo!');
      console.log('\n📧 Revisa tu email: agustin.scutari@it-tel.com.ar');
      console.log('   Si CABASE tiene más de 1000 Mbit/s, deberías recibir:');
      console.log('   - Email con mensaje profesional (sin emojis)');
      console.log('   - Gráfico del sensor embebido');
      console.log('');
      
    } catch (e) {
      console.log('Respuesta:', data);
    }
  });
}).on('error', (error) => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});

