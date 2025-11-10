/**
 * 🧪 Script de prueba - Conexión a PRTG LARANET
 * 
 * Verifica que podemos conectarnos al servidor PRTG de La Matanza
 * y obtener datos de sensores.
 */

const fs = require('fs');
const path = require('path');

// Leer .env.local manualmente
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local');
  const envContent = fs.readFileSync(envPath, 'utf8');
  const env = {};
  
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();
      env[key] = value;
    }
  });
  
  return env;
}

const env = loadEnv();

async function testLaranetConnection() {
  console.log('🧪 Probando conexión a PRTG LARANET...\n');
  
  const baseUrl = env.PRTG_LARANET_BASE_URL;
  const username = env.PRTG_LARANET_USERNAME;
  const passhash = env.PRTG_LARANET_PASSHASH;
  const password = env.PRTG_LARANET_PASSWORD;
  
  console.log('📋 Configuración:');
  console.log(`   URL: ${baseUrl}`);
  console.log(`   Usuario: ${username}`);
  console.log(`   Passhash: ${passhash ? passhash.substring(0, 8) + '...' : 'NO CONFIGURADO'}`);
  console.log('');
  
  if (!baseUrl || !username || !passhash) {
    console.error('❌ Faltan variables de entorno');
    process.exit(1);
  }
  
  // Probar obtener un sensor específico (ID 191: lan3000-WAN)
  const sensorId = 191;
  
  console.log('🔍 Probando con PASSHASH...');
  let url = `${baseUrl}/api/getsensordetails.json?id=${sensorId}&username=${username}&passhash=${passhash}`;
  
  console.log(`   URL: ${baseUrl}/api/getsensordetails.json?id=${sensorId}&username=***&passhash=***`);
  console.log('');
  
  try {
    let response = await fetch(url);
    
    console.log(`📡 Respuesta HTTP: ${response.status} ${response.statusText}`);
    
    // Si falla con passhash, intentar con password
    if (response.status === 401) {
      console.log('\n⚠️ Falló con passhash, probando con PASSWORD...');
      url = `${baseUrl}/api/getsensordetails.json?id=${sensorId}&username=${username}&password=${password}`;
      console.log(`   URL: ${baseUrl}/api/getsensordetails.json?id=${sensorId}&username=***&password=***`);
      response = await fetch(url);
      console.log(`📡 Respuesta HTTP: ${response.status} ${response.statusText}`);
    }
    
    if (!response.ok) {
      const text = await response.text();
      console.error('❌ Error en la respuesta:');
      console.error(text.substring(0, 500));
      process.exit(1);
    }
    
    const data = await response.json();
    
    console.log('\n✅ Conexión exitosa!');
    console.log('\n📊 Datos del sensor:');
    console.log(`   ID: ${data.sensordata?.objid || 'N/A'}`);
    console.log(`   Nombre: ${data.sensordata?.name || 'N/A'}`);
    console.log(`   Device: ${data.sensordata?.parentdevicename || 'N/A'}`);
    console.log(`   Status: ${data.sensordata?.status || 'N/A'}`);
    console.log(`   Último valor: ${data.sensordata?.lastvalue || 'N/A'}`);
    console.log(`   Último check: ${data.sensordata?.lastcheck || 'N/A'}`);
    
    console.log('\n📦 Objeto completo (primeros 1000 caracteres):');
    console.log(JSON.stringify(data, null, 2).substring(0, 1000) + '...');
    
    console.log('\n✅ Test completado exitosamente');
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Error al conectarse:');
    console.error(error.message);
    console.error('\n💡 Verifica que:');
    console.error('   - El servidor esté accesible desde tu red');
    console.error('   - Las credenciales sean correctas');
    console.error('   - El puerto 8995 esté abierto');
    process.exit(1);
  }
}

testLaranetConnection();
