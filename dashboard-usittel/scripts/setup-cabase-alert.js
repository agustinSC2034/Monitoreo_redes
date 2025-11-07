/**
 * Script para crear la alerta de CABASE > 4500 Mbit/s
 * 
 * Ejecutar: node scripts/setup-cabase-alert.js
 */

const BASE_URL = process.env.DEPLOYMENT_URL || 'https://monitoreo-redes-hrckots9v-agustins-projects-03ad7204.vercel.app';

async function setupAlert() {
  console.log('🔧 Configurando alerta de CABASE...\n');
  
  try {
    const response = await fetch(`${BASE_URL}/api/alerts/test-cabase`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Alerta creada exitosamente!\n');
      console.log('Detalles:');
      console.log(JSON.stringify(data, null, 2));
    } else {
      console.error('❌ Error al crear alerta:', data);
    }
    
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
  }
}

setupAlert();
