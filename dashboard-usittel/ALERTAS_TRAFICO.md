# 📊 Sistema de Detección de Cambios Drásticos de Tráfico

## ✅ Implementado

### Tipos de Alertas Configuradas

#### 1. **Alertas de Estado** (Clásicas)
- 🔴 **DOWN** - Sensor caído
- 🟡 **WARNING** - Advertencia
- 🔵 **UNUSUAL** - Cualquier estado anormal

#### 2. **Alertas de Umbral** (Límites Fijos)
- 📊 **SLOW** - Tráfico supera un valor fijo
- Ejemplo: CABASE > 5000 Mbit/s

#### 3. **Alertas de Cambios Drásticos** ⭐ NUEVO
- 📈 **TRAFFIC_SPIKE** - Aumento drástico de tráfico
- 📉 **TRAFFIC_DROP** - Caída drástica de tráfico

---

## 🎯 Cómo Funcionan los Cambios Drásticos

### Detección Automática

El sistema compara el tráfico actual con el valor anterior:

```
Cambio % = ((Actual - Anterior) / Anterior) × 100
```

**Ejemplo:**
```
Anterior: 3000 Mbit/s
Actual:   6000 Mbit/s
Cambio:   +100% → 🚨 ALERTA DE AUMENTO
```

### Umbral Configurable

Por defecto: **50%** de cambio

- ✅ Cambio > 50% → Dispara alerta
- ❌ Cambio < 50% → No hace nada

---

## 📋 Reglas Actuales

### CABASE (13682)
1. ✅ Umbral alto: > 5000 Mbit/s (cooldown: 60s)
2. ✅ Aumento drástico: > 50% (cooldown: 300s)
3. ✅ Caída drástica: > 50% (cooldown: 300s)

### IPLANxARSAT (13684)
1. ✅ Aumento drástico: > 50% (cooldown: 300s)
2. ✅ Caída drástica: > 50% (cooldown: 300s)

### TECO (13683)
1. ✅ Aumento drástico: > 50% (cooldown: 300s)
2. ✅ Caída drástica: > 50% (cooldown: 300s)

---

## 🧪 Probar el Sistema

### Crear todas las reglas de tráfico:
```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/alerts/init-traffic-alerts" -Method POST
```

### Ver reglas activas:
```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/alerts/rules" | ConvertFrom-Json
```

### Forzar actualización (detectar cambios):
```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/status"
```

---

## 📧 Formato de Email de Alerta

**Para Umbral Superado:**
```
SENSOR: CABASE
CONDICIÓN: Tráfico > 5000 Mbit/s
VALOR ACTUAL: 7.090.748 kbit/s
TIMESTAMP: 04/11/2025 21:30:00
PRIORIDAD: MEDIUM
```

**Para Cambio Drástico:**
```
SENSOR: CABASE
CONDICIÓN: AUMENTO DRÁSTICO de tráfico
ANTERIOR: 3000 Mbit/s
ACTUAL: 6000 Mbit/s (+100%)
TIMESTAMP: 04/11/2025 21:30:00
PRIORIDAD: MEDIUM
```

---

## ⚙️ Configuración Avanzada

### Cambiar el umbral de % de cambio

Editar la regla en la base de datos:
```sql
UPDATE alert_rules 
SET threshold = 30 
WHERE condition IN ('traffic_spike', 'traffic_drop');
```

O usar la API:
```powershell
$body = @{
  id = 2
  threshold = 30
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:3000/api/alerts/rules" -Method PATCH -Body $body -ContentType "application/json"
```

### Cambiar el cooldown

Por defecto: **300 segundos (5 minutos)**

Para cambiar:
```powershell
$body = @{
  id = 2
  cooldown = 600  # 10 minutos
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:3000/api/alerts/rules" -Method PATCH -Body $body -ContentType "application/json"
```

---

## 🔍 Logs del Sistema

En la consola del servidor verás:

```
📊 Cambio drástico de tráfico en CABASE: AUMENTO de 75.3%
   Anterior: 4000 Mbit/s → Actual: 7012 Mbit/s
🚨 Disparando alerta de cambio de tráfico: CABASE - Aumento Drástico de Tráfico
📧 [EMAIL] Enviando alerta a: agustin.scutari@it-tel.com.ar
✅ Email enviado exitosamente
```

---

## 📈 Casos de Uso

### 1. Detectar Ataques DDoS
- Aumento súbito > 100% = Posible ataque
- Prioridad: CRITICAL
- Cooldown: 60 segundos

### 2. Detectar Cortes Parciales
- Caída > 70% = Problema en enlace
- Prioridad: HIGH
- Cooldown: 180 segundos

### 3. Monitorear Horarios Pico
- Aumentos regulares a ciertas horas
- Revisar logs para patrones
- Ajustar umbrales según necesidad

---

## ✅ Ventajas

1. **Detección Proactiva** - No espera a que el enlace caiga completamente
2. **Configurable** - Ajustar % de cambio según necesidad
3. **Cooldown Inteligente** - Evita spam de emails
4. **Logs Completos** - Todo queda registrado en BD
5. **Múltiples Sensores** - Funciona para todos los enlaces

---

**Creado:** 4 de noviembre de 2025  
**Sistema:** ITTEL Monitoreo de Red  
**Estado:** ✅ Funcionando
