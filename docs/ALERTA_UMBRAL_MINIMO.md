# ⚠️ Sistema de Alerta de Umbral Mínimo

## 📋 Descripción

Nueva funcionalidad que detecta cuando el tráfico de un enlace cae por debajo de un umbral mínimo configurado, indicando posibles problemas de rendimiento o saturación.

---

## 🎯 Configuración Actual

### **CABASE (13682)**
- **Umbral mínimo**: 200 Mbit/s
- **Condición**: `traffic_low`
- **Prioridad**: MEDIA
- **Canales**: Email + Telegram
- **Cooldown**: 300 segundos (5 minutos)

---

## 🔴 Prioridad de Alertas

**IMPORTANTE**: La alerta de **DOWN tiene prioridad absoluta** sobre la alerta de umbral mínimo.

### Escenario 1: Sensor UP con tráfico bajo
```
Estado: UP (status_raw = 3)
Tráfico: 150 Mbit/s
Resultado: ✅ ALERTA DE UMBRAL MÍNIMO
Mensaje: "Sensor CABASE registra tráfico menor a 200 Mbit/s"
```

### Escenario 2: Sensor DOWN
```
Estado: DOWN (status_raw = 5)
Tráfico: 0 Mbit/s o cualquier valor
Resultado: ❌ NO ALERTA UMBRAL MÍNIMO
Resultado: ✅ ALERTA DE CAÍDA (DOWN)
Mensaje: "Enlace Caído - CABASE"
```

---

## 🧠 Lógica de Implementación

```typescript
case 'traffic_low':
  // 🔴 PRIORIDAD: No alertar si el sensor está DOWN
  const isDown = sensor.status_raw === 5 || 
                 sensor.status.toLowerCase().includes('down');
  
  if (isDown) {
    console.log(`⏸️ Sensor DOWN - Saltando alerta de umbral mínimo`);
    return false; // Prioridad a alerta DOWN
  }
  
  // Verificar si el tráfico está por debajo del umbral
  if (rule.threshold && sensor.lastvalue) {
    const trafficValue = parseTrafficValue(sensor.lastvalue);
    if (trafficValue !== null) {
      return trafficValue < rule.threshold; // < para mínimo
    }
  }
  return false;
```

---

## 📧 Formato de Notificación

### Email/Telegram:
```
USITTEL TANDIL

SENSOR: (063) CABASE
TIPO: Umbral minimo de trafico
Umbral minimo: 200.00 Mbit/s
Valor actual: 150.45 Mbit/s
FECHA/HORA: 24/11/2025, 15:30:00

URL: https://monitoreo-redes.vercel.app/
```

---

## 🚀 Instalación

### **Paso 1: Código ya actualizado**
El código de soporte ya está implementado en:
- `src/lib/db.ts` - Interface `AlertRule` con tipo `'traffic_low'`
- `src/lib/alertMonitor.ts` - Lógica de evaluación y formateo

### **Paso 2: Crear la regla en Supabase**
```powershell
cd dashboard-usittel
node scripts/add-cabase-min-threshold.js
```

Este script:
1. Verifica si ya existe una regla de umbral mínimo para CABASE
2. Crea la regla con los siguientes parámetros:
   - Sensor: 13682 (CABASE)
   - Condición: `traffic_low`
   - Umbral: 200 Mbit/s
   - Canales: Email + Telegram
   - Destinatarios: agustin, ja, md @ it-tel.com.ar
   - Cooldown: 300 segundos

### **Paso 3: Verificar la regla**
```powershell
# Ver todas las reglas activas
node scripts/check-alert-rules.js

# O consultar directamente en Supabase
SELECT * FROM alert_rules WHERE condition = 'traffic_low';
```

---

## 🧪 Pruebas

### **Escenario de Prueba 1: Tráfico bajo**
```powershell
# Simular sensor UP con tráfico bajo
# En la consola de Supabase o script de prueba:
UPDATE sensor_history 
SET lastvalue = '150.000 kbit/s', status_raw = 3 
WHERE sensor_id = '13682';

# Esperar siguiente ejecución de GitHub Actions (5 min)
# Resultado esperado: Alerta de umbral mínimo
```

### **Escenario de Prueba 2: Sensor DOWN**
```powershell
# Simular sensor DOWN
UPDATE sensor_history 
SET status_raw = 5, status = 'Down' 
WHERE sensor_id = '13682';

# Esperar siguiente ejecución de GitHub Actions
# Resultado esperado: Solo alerta DOWN, no umbral mínimo
```

---

## ⚙️ Configuración Avanzada

### **Ajustar umbral:**
```sql
UPDATE alert_rules 
SET threshold = 250 
WHERE sensor_id = '13682' AND condition = 'traffic_low';
```

### **Ajustar cooldown:**
```sql
UPDATE alert_rules 
SET cooldown = 600  -- 10 minutos
WHERE sensor_id = '13682' AND condition = 'traffic_low';
```

### **Desactivar temporalmente:**
```sql
UPDATE alert_rules 
SET enabled = false 
WHERE sensor_id = '13682' AND condition = 'traffic_low';
```

---

## 📊 Monitoreo

### **Ver historial de alertas de umbral mínimo:**
```sql
SELECT 
  ah.*,
  ar.name as rule_name,
  ar.threshold
FROM alert_history ah
JOIN alert_rules ar ON ah.rule_id = ar.id
WHERE ar.condition = 'traffic_low'
ORDER BY ah.timestamp DESC
LIMIT 20;
```

### **Estadísticas:**
```sql
SELECT 
  COUNT(*) as total_alertas,
  DATE(timestamp) as fecha
FROM alert_history
WHERE rule_id = (
  SELECT id FROM alert_rules 
  WHERE sensor_id = '13682' AND condition = 'traffic_low'
)
GROUP BY DATE(timestamp)
ORDER BY fecha DESC;
```

---

## 🔍 Debugging

### **Logs en GitHub Actions:**
Buscar en los logs:
```
📊 Tráfico actual: 150.45 Mbit/s | Umbral mínimo: 200.00 Mbit/s
🚨 Condición detectada: CABASE < 200 Mbit/s (Umbral Mínimo)
```

### **Logs si sensor está DOWN:**
```
⏸️ [13682] Sensor DOWN - Saltando alerta de umbral mínimo (prioridad a DOWN)
```

---

## ❓ FAQ

### **¿Por qué 200 Mbit/s?**
Es un valor conservador que indica posibles problemas sin generar falsos positivos. CABASE normalmente opera entre 3000-8000 Mbit/s.

### **¿Qué pasa si el tráfico fluctúa mucho?**
El cooldown de 5 minutos evita spam de alertas. Solo recibirás una alerta cada 5 minutos mientras persista la condición.

### **¿Puedo agregar esta alerta a otros sensores?**
Sí, pero considera los patrones de tráfico normales de cada enlace antes de configurar el umbral.

### **¿Se puede tener umbral máximo y mínimo en el mismo sensor?**
Sí, CABASE tiene ambos:
- Umbral máximo: > 8500 Mbit/s (`slow`)
- Umbral mínimo: < 200 Mbit/s (`traffic_low`)

---

## 🚨 Troubleshooting

### **No recibo alertas de umbral mínimo:**
1. Verificar que la regla esté activa: `enabled = true`
2. Verificar cooldown: ¿Ya alertó en los últimos 5 minutos?
3. Verificar estado del sensor: ¿Está DOWN? (tiene prioridad)
4. Verificar sistema de sesiones: ¿GitHub Actions está corriendo?
5. Ver logs de GitHub Actions para errores

### **Recibo muchas alertas:**
1. Aumentar cooldown de 300s a 600s o más
2. Ajustar umbral mínimo (bajar de 200 a 150 Mbit/s)
3. Verificar si el tráfico bajo es normal para ese horario

---

**Fecha de implementación:** 24 de noviembre de 2025  
**Versión:** 1.0.0  
**Estado:** ✅ Activo en producción
