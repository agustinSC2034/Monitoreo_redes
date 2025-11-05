/**
 * 🧪 Script de Prueba - Envío de Email
 * 
 * Ejecutar: node scripts/test-email.js
 */

const recipient = process.argv[2] || 'agustin.scutari@it-tel.com.ar';

console.log('🧪 Probando envío de email...');
console.log('📧 Destinatario:', recipient);
console.log('');

fetch('http://localhost:3000/api/alerts/test-email', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ recipient })
})
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      console.log('✅ Email enviado exitosamente!');
      console.log('📨 Revisa tu bandeja de entrada:', recipient);
    } else {
      console.error('❌ Error:', data.error);
    }
  })
  .catch(error => {
    console.error('❌ Error en la petición:', error.message);
    console.log('');
    console.log('💡 Asegúrate de que el servidor esté corriendo: npm run dev');
  });
