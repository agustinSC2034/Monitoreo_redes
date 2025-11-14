/**
 * Script para verificar si GitHub Actions se está ejecutando
 */

console.log('🔍 Verificando GitHub Actions...\n');
console.log('Abrí este enlace en tu navegador:');
console.log('https://github.com/agustinSC2034/Monitoreo_redes/actions\n');

console.log('Verificá:');
console.log('1. ¿Hay ejecuciones recientes del workflow "Monitor PRTG Alerts"?');
console.log('2. ¿La última ejecución fue exitosa (verde ✓)?');
console.log('3. ¿Cuál fue la hora de la última ejecución?');
console.log('4. Clickeá en la última ejecución y revisá los logs\n');

console.log('Si NO hay ejecuciones recientes o están fallando:');
console.log('- El workflow puede estar deshabilitado');
console.log('- Puede haber un error en el workflow');
console.log('- Las credenciales pueden estar mal configuradas\n');

console.log('Si las ejecuciones son exitosas pero no llegan alertas:');
console.log('- Vercel puede estar usando un deployment viejo');
console.log('- El código de alertas puede tener un bug');
