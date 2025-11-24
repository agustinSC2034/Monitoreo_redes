# 🔧 Instrucciones para Crear Regla de Umbral Mínimo

## ⚠️ El código ya está deployleado, falta crear la regla en Supabase

### Paso 1: Actualizar constraint de la base de datos

Ve a **Supabase → SQL Editor** y ejecuta:

```sql
-- Eliminar constraint antiguo
ALTER TABLE alert_rules DROP CONSTRAINT IF EXISTS alert_rules_condition_check;

-- Agregar nuevo constraint con 'traffic_low'
ALTER TABLE alert_rules ADD CONSTRAINT alert_rules_condition_check
CHECK (condition IN ('down', 'warning', 'unusual', 'slow', 'traffic_low', 'traffic_spike', 'traffic_drop'));
```

### Paso 2: Crear la regla

Ejecuta en el mismo SQL Editor:

```sql
INSERT INTO alert_rules 
  (name, sensor_id, condition, threshold, priority, channels, recipients, cooldown, enabled) 
VALUES 
  ('CABASE < 200 Mbit/s (Umbral Mínimo)', 
   '13682', 
   'traffic_low', 
   200, 
   'medium', 
   ARRAY['email', 'telegram']::text[], 
   ARRAY['agustin.scutari@it-tel.com.ar', 'ja@it-tel.com.ar', 'md@it-tel.com.ar']::text[], 
   300, 
   true)
RETURNING *;
```

### Paso 3: Verificar

```sql
SELECT * FROM alert_rules WHERE condition = 'traffic_low';
```

Deberías ver 1 registro con:
- Nombre: CABASE < 200 Mbit/s (Umbral Mínimo)
- Sensor: 13682
- Umbral: 200
- Estado: enabled = true

---

## ✅ Una vez hecho esto:

La próxima ejecución de GitHub Actions (cada 5 minutos) comenzará a monitorear el umbral mínimo de CABASE.

Si el tráfico cae por debajo de 200 Mbit/s (y el sensor NO está DOWN), recibirás una alerta por email y Telegram.
