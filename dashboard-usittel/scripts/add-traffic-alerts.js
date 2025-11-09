/**
 * 🚨 Script para agregar alertas de cambios bruscos de tráfico
 */

const https = require('https');

const SUPABASE_URL = 'tuskasjifhkednqxvgxm.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1c2thc2ppZmhrZWRucXh2Z3htIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1MDU0MDgsImV4cCI6MjA3ODA4MTQwOH0.VcuNIpjtCoApRtPTvs6QArXkxUbAGOt9pTnIxFLImMY';

const newRules = [
  {
    name: 'CABASE - Caída brusca >50%',
    sensor_id: '13682',
    condition: 'traffic_drop',
    threshold: 50,
    priority: 'high',
    channels: ['email', 'whatsapp'],
    recipients: ['agustin.scutari@it-tel.com.ar', '+5491124682247'],
    cooldown: 300,
    enabled: true
  },
  {
    name: 'IPLANxARSAT - Aumento brusco >50%',
    sensor_id: '13684',
    condition: 'traffic_spike',
    threshold: 50,
    priority: 'medium',
    channels: ['email', 'whatsapp'],
    recipients: ['agustin.scutari@it-tel.com.ar', '+5491124682247'],
    cooldown: 300,
    enabled: true
  },
  {
    name: 'IPLANxARSAT - Caída brusca >50%',
    sensor_id: '13684',
    condition: 'traffic_drop',
    threshold: 50,
    priority: 'medium',
    channels: ['email', 'whatsapp'],
    recipients: ['agustin.scutari@it-tel.com.ar', '+5491124682247'],
    cooldown: 300,
    enabled: true
  }
];

async function createRule(rule) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(rule);
    
    const options = {
      hostname: SUPABASE_URL,
      path: '/rest/v1/alert_rules',
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        if (res.statusCode === 201) {
          resolve(JSON.parse(body));
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${body}`));
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function main() {
  console.log('🚨 Creando reglas de cambios bruscos de tráfico...\n');
  
  for (const rule of newRules) {
    try {
      const result = await createRule(rule);
      console.log(`✅ Creada: ${rule.name} (ID: ${result[0].id})`);
    } catch (error) {
      console.error(`❌ Error creando ${rule.name}:`, error.message);
    }
  }
  
  console.log('\n✅ Proceso completado');
}

main();
