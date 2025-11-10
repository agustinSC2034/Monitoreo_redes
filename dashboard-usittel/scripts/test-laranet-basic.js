/**
 * 🧪 Test básico - Listar todos los sensores de LARANET
 */

const fs = require('fs');
const path = require('path');

// Leer .env.local
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

async function testBasicQuery() {
  console.log('🧪 Test básico - Listando sensores de LARANET...\n');
  
  const baseUrl = env.PRTG_LARANET_BASE_URL;
  const username = env.PRTG_LARANET_USERNAME;
  const passhash = env.PRTG_LARANET_PASSHASH;
  
  // API para obtener tabla de sensores (traer TODOS - sin limit)
  const url = `${baseUrl}/api/table.json?content=sensors&columns=objid,sensor,device,status,lastvalue,message&count=500&username=${username}&passhash=${passhash}`;
  
  console.log('📡 Consultando tabla de sensores...');
  console.log(`   URL: ${baseUrl}/api/table.json?content=sensors&...`);
  console.log('');
  
  try {
    const response = await fetch(url);
    
    console.log(`📡 Respuesta HTTP: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const text = await response.text();
      console.error('❌ Error:', text.substring(0, 500));
      process.exit(1);
    }
    
    const data = await response.json();
    
    console.log('✅ Conexión exitosa!\n');
    console.log(`📊 Total de sensores encontrados: ${data.sensors?.length || 0}\n`);
    
    if (data.sensors && data.sensors.length > 0) {
      console.log('🔍 Primeros 10 sensores:');
      console.log('─'.repeat(80));
      
      data.sensors.slice(0, 10).forEach((sensor, i) => {
        console.log(`${i + 1}. ID: ${sensor.objid} | ${sensor.sensor || 'Sin nombre'}`);
        console.log(`   Device: ${sensor.device || 'N/A'}`);
        console.log(`   Status: ${sensor.status || 'N/A'}`);
        console.log(`   Value: ${sensor.lastvalue || 'N/A'}`);
        console.log('');
      });
      
      console.log('\n💾 Guardando lista completa en temp_laranet_sensors.json...');
      fs.writeFileSync(
        path.join(__dirname, '..', 'temp_laranet_sensors.json'),
        JSON.stringify(data, null, 2)
      );
      console.log('✅ Guardado correctamente');
    }
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testBasicQuery();
