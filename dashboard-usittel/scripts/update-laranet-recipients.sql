/**
 * Script directo SQL para actualizar destinatarios de reglas LARANET
 * Ejecutar esto en Supabase SQL Editor
 */

-- Actualizar destinatarios de las 8 reglas LARANET (IDs 14-21)
-- Solo para sensores: 5187, 4736, 4737, 5159, 3942, 6689, 4665, 4642

UPDATE alert_rules
SET recipients = '["agustin.scutari@it-tel.com.ar","md@it-tel.com.ar","ja@it-tel.com.ar"]'
WHERE sensor_id IN ('5187', '4736', '4737', '5159', '3942', '6689', '4665', '4642');

-- Verificar el cambio
SELECT id, name, sensor_id, recipients 
FROM alert_rules 
WHERE sensor_id IN ('5187', '4736', '4737', '5159', '3942', '6689', '4665', '4642')
ORDER BY id;
