const http = require('http');

const url = 'http://38.253.65.250:8080/api/table.json?content=sensors&columns=objid,sensor,device,status&username=nocittel&passhash=413758319';

http.get(url, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    const json = JSON.parse(data);
    console.log(`Total sensores: ${json.sensors.length}\n`);
    
    // Buscar sensores que contengan "RDA" o "080" o "WAI"
    const filtered = json.sensors.filter(s => 
      s.sensor.includes('080') || 
      s.sensor.includes('WAI') || 
      s.device.includes('RDA-1-TDL')
    );
    
    console.log('Sensores encontrados:');
    filtered.forEach(s => {
      console.log(`  ID: ${String(s.objid).padEnd(6)} | ${s.sensor.padEnd(50)} | ${s.device}`);
    });
  });
});
