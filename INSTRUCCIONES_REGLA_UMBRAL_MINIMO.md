# 🔧 Instrucciones DETALLADAS - Crear Regla de Umbral Mínimo en Supabase

## ⚠️ El código ya está deployleado, falta crear la regla en Supabase

---

## 📋 PASO A PASO COMPLETO

### **Paso 1: Abrir Supabase SQL Editor**

1. Ve a: https://supabase.com/dashboard
2. Selecciona tu proyecto: `tuskasjifhkednqxvgxm`
3. En el menú lateral, click en **"SQL Editor"**
4. Verás la pestaña **"private(1)"** con tu esquema actual

**🚨 NO BORRES EL CÓDIGO EXISTENTE** - Solo vamos a agregar comandos nuevos

---

### **Paso 2: Crear una NUEVA query**

1. Click en el botón **"+ New query"** (arriba a la izquierda)
2. Se abrirá una nueva pestaña vacía llamada algo como **"private(2)"**
3. Copia y pega el siguiente SQL en esa pestaña:

```sql
-- ========================================
-- ACTUALIZACIÓN: Agregar soporte para umbral mínimo
-- Fecha: 24 de noviembre de 2025
-- ========================================

-- Paso 1: Actualizar constraint para incluir 'traffic_low'
ALTER TABLE alert_rules DROP CONSTRAINT IF EXISTS alert_rules_condition_check;

ALTER TABLE alert_rules ADD CONSTRAINT alert_rules_condition_check
CHECK (condition IN (
  'down', 
  'warning', 
  'unusual', 
  'slow', 
  'traffic_low',      -- ⭐ NUEVO: umbral mínimo
  'traffic_spike', 
  'traffic_drop'
));

-- Verificar que el constraint se actualizó correctamente
SELECT constraint_name, check_clause 
FROM information_schema.check_constraints 
WHERE constraint_name = 'alert_rules_condition_check';

-- Paso 2: Insertar regla de umbral mínimo para CABASE
INSERT INTO alert_rules 
  (name, sensor_id, condition, threshold, priority, channels, recipients, cooldown, enabled) 
VALUES 
  (
    'CABASE < 200 Mbit/s (Umbral Mínimo)',  -- Nombre descriptivo
    '13682',                                 -- ID del sensor CABASE
    'traffic_low',                           -- ⭐ Nuevo tipo de condición
    200,                                     -- Umbral: 200 Mbit/s
    'medium',                                -- Prioridad media
    '["email", "telegram"]'::jsonb,          -- Canales de notificación
    '["agustin.scutari@it-tel.com.ar", "ja@it-tel.com.ar", "md@it-tel.com.ar"]'::jsonb,  -- Destinatarios
    300,                                     -- Cooldown: 5 minutos
    true                                     -- Activa
  )
RETURNING *;  -- Esto mostrará la regla creada

-- Paso 3: Verificar que la regla se creó correctamente
SELECT 
  id,
  name,
  sensor_id,
  condition,
  threshold,
  priority,
  channels,
  recipients,
  cooldown,
  enabled,
  TO_TIMESTAMP(created_at) as created_at
FROM alert_rules 
WHERE condition = 'traffic_low'
ORDER BY id DESC;
```

---

### **Paso 3: Ejecutar el SQL**

1. Con el código copiado en la nueva query
2. Click en el botón **"RUN"** (o presiona `Ctrl+Enter` / `Cmd+Enter`)
3. Verás 3 resultados en la parte inferior:

**Resultado 1:** Constraint actualizado ✅
```
constraint_name              | check_clause
-----------------------------+------------------
alert_rules_condition_check  | ((condition = ANY(...)))
```

**Resultado 2:** Regla insertada ✅
```
id  | name                              | sensor_id | condition    | threshold | ...
27  | CABASE < 200 Mbit/s (Umbral...)  | 13682     | traffic_low  | 200       | ...
```

**Resultado 3:** Verificación ✅
```
Mostrará la regla recién creada con todos sus datos
```

---

### **Paso 4: Verificación Visual**

Opción A - **Table Editor:**
1. En el menú lateral, click en **"Table Editor"**
2. Selecciona la tabla **"alert_rules"**
3. Busca la última fila (ID más alto)
4. Deberías ver: `CABASE < 200 Mbit/s (Umbral Mínimo)`

Opción B - **SQL Query:**
```sql
-- Ver TODAS las reglas activas
SELECT 
  id,
  name,
  sensor_id,
  condition,
  threshold,
  enabled
FROM alert_rules 
WHERE enabled = true
ORDER BY id;
```

Deberías ver **18 reglas activas** en total.

---

### **Paso 5: Verificar tipos de condición**

Para confirmar que ahora acepta `traffic_low`:

```sql
-- Ver todas las condiciones únicas en uso
SELECT DISTINCT condition 
FROM alert_rules 
ORDER BY condition;
```

Deberías ver:
- `down` (14 reglas)
- `slow` (3 reglas)
- `traffic_low` (1 regla) ⭐ NUEVO

---

## 🎯 ¿Qué hace cada parte?

### **ALTER TABLE (líneas 1-2):**
- Elimina la restricción antigua que NO permitía `traffic_low`
- Crea una nueva que SÍ lo permite

### **INSERT INTO (línea 3):**
- Crea la regla nueva en la tabla `alert_rules`
- ID se asigna automáticamente (probablemente será 27 o similar)

### **RETURNING *:**
- Muestra inmediatamente la regla creada
- Útil para confirmar que todo está correcto

---

## ✅ Resultado Esperado

Después de ejecutar el SQL, deberías tener:

```
📊 Estado de alert_rules:
- 14 reglas de tipo "down"
- 3 reglas de tipo "slow" (umbrales máximos)
- 1 regla de tipo "traffic_low" (umbral mínimo) ⭐ NUEVO
---
Total: 18 reglas activas
```

---

## 🚀 ¿Y después?

### **GitHub Actions ya está configurado:**
- Cada 5 minutos consulta todos los sensores
- Evalúa TODAS las reglas activas (incluyendo la nueva)
- Si CABASE tiene tráfico < 200 Mbit/s (y NO está DOWN):
  - ✉️ Envía email a: agustin, ja, md @ it-tel.com.ar
  - 📱 Envía mensaje por Telegram
  - 💾 Guarda en `alert_history`

### **Para ver las alertas después:**
```sql
-- Ver historial de alertas de umbral mínimo
SELECT 
  ah.id,
  ah.sensor_name,
  ah.message,
  ah.success,
  TO_TIMESTAMP(ah.timestamp) as fecha,
  ar.name as regla
FROM alert_history ah
JOIN alert_rules ar ON ah.rule_id = ar.id
WHERE ar.condition = 'traffic_low'
ORDER BY ah.timestamp DESC
LIMIT 10;
```

---

## ❓ FAQ

**P: ¿Tengo que borrar la query private(1)?**
R: NO, déjala. Solo crea una nueva query para este código.

**P: ¿Qué pasa si ya ejecuté el INSERT y quiero hacerlo de nuevo?**
R: Te dará error de regla duplicada. Primero borra la existente:
```sql
DELETE FROM alert_rules WHERE condition = 'traffic_low' AND sensor_id = '13682';
```

**P: ¿Cómo sé si funcionó?**
R: Ejecuta: `SELECT COUNT(*) FROM alert_rules WHERE enabled = true;`
Deberías ver: **18**

**P: ¿Cuándo veré la primera alerta?**
R: En el siguiente ciclo de GitHub Actions (cada 5 minutos) SI el tráfico de CABASE está < 200 Mbit/s

---

## 🆘 Si algo sale mal

### Error: "violates check constraint"
→ El constraint no se actualizó. Ejecuta de nuevo solo las líneas del ALTER TABLE.

### Error: "duplicate key value"
→ Ya existe la regla. Ve a Table Editor → alert_rules y búscala manualmente.

### No veo resultados después de RUN
→ Revisa la pestaña "Results" en la parte inferior del SQL Editor.

---

**¡Listo!** Una vez ejecutes el SQL, todo estará funcionando automáticamente. 🎉
