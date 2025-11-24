-- Actualizar constraint de la tabla alert_rules para incluir 'traffic_low'
-- Ejecutar este SQL en la consola SQL de Supabase

-- 1. Eliminar el constraint existente
ALTER TABLE alert_rules DROP CONSTRAINT IF EXISTS alert_rules_condition_check;

-- 2. Agregar el nuevo constraint con 'traffic_low'
ALTER TABLE alert_rules ADD CONSTRAINT alert_rules_condition_check 
CHECK (condition IN ('down', 'warning', 'unusual', 'slow', 'traffic_low', 'traffic_spike', 'traffic_drop'));

-- Verificar
SELECT constraint_name, check_clause 
FROM information_schema.check_constraints 
WHERE constraint_name = 'alert_rules_condition_check';
