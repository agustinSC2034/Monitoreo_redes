# 🏥 Sistema de Monitoreo de Salud de Servidores PRTG

## 📋 Descripción

Sistema automático que detecta cuando un servidor PRTG (Tandil o La Matanza) está caído o no responde, y envía alertas por **Email y Telegram**.

---

## ✨ Características

### **Detección Automática:**
- ✅ Detecta fallos de conexión al servidor PRTG
- ✅ Diferencia entre PRTG de TANDIL y PRTG de LA MATANZA
- ✅ Envía alertas específicas para cada servidor
- ✅ Alerta cuando se recupera la conexión

### **Protección contra Spam:**
- 🕐 **Cooldown de 30 minutos** entre alertas del mismo PRTG
- 📊 Umbral de 1 fallo consecutivo antes de alertar
- 🔄 Reseteo automático cuando el servidor se recupera

### **Canales de Notificación:**
- 📧 **Email** (prioridad CRÍTICA)
- 📱 **Telegram** (notificación instantánea)

---

## 🎯 ¿Cuándo se dispara?

### **Alerta de PRTG Caído:**
Se envía cuando GitHub Actions intenta consultar sensores y:
- ❌ No puede conectarse al servidor
- ❌ Timeout de conexión
- ❌ Error HTTP (500, 503, etc.)
- ❌ Error de red (ECONNREFUSED, ETIMEDOUT)

### **Alerta de PRTG Recuperado:**
Se envía cuando:
- ✅ El servidor vuelve a responder correctamente
- ✅ Se pueden consultar sensores exitosamente

---

## 📧 Formato de Alertas

### **Email - PRTG Caído:**
```
Asunto: 🔴 ALERTA CRÍTICA: Servidor PRTG USITTEL TANDIL Caído

USITTEL TANDIL

🔴 SERVIDOR PRTG NO RESPONDE

UBICACIÓN: USITTEL TANDIL
URL: http://38.253.65.250:8080
ESTADO: No se puede conectar al servidor
ERROR: fetch failed
FECHA/HORA: 24/11/2025, 15:30:00

⚠️ IMPACTO:
- No se pueden consultar sensores de Tandil
- Sistema de monitoreo automático afectado
- GitHub Actions reportará fallos hasta que se recupere

ACCIÓN REQUERIDA:
1. Verificar conectividad del servidor PRTG
2. Revisar si el servicio PRTG está corriendo
3. Verificar firewall y permisos de red
```

### **Email - PRTG Recuperado:**
```
Asunto: ✅ RECUPERADO: Servidor PRTG USITTEL TANDIL

USITTEL TANDIL

✅ SERVIDOR PRTG RECUPERADO

UBICACIÓN: USITTEL TANDIL
URL: http://38.253.65.250:8080
ESTADO: Conexión restablecida
FECHA/HORA: 24/11/2025, 15:45:00

✅ ESTADO ACTUAL:
- Servidor PRTG respondiendo correctamente
- Monitoreo automático restablecido
- GitHub Actions funcionando normalmente
```

---

## 🔧 Configuración

### **Archivos Modificados:**

1. **`src/lib/prtgHealthMonitor.ts`** (NUEVO)
   - Lógica de detección de fallos
   - Sistema de cooldown
   - Envío de alertas

2. **`src/app/api/cron/check-alerts/route.ts`** (MODIFICADO)
   - Integración del monitor de salud
   - Detección de errores de conexión
   - Registro de fallos/éxitos

3. **`src/app/api/prtg-health/route.ts`** (NUEVO)
   - Endpoint para consultar estado de salud
   - Debugging y monitoreo

### **Variables Configurables:**

```typescript
// En prtgHealthMonitor.ts

const FAILURE_THRESHOLD = 1;          // Fallos antes de alertar
const ALERT_COOLDOWN = 1800;          // 30 minutos entre alertas
const RECOVERY_ALERT_ENABLED = true;  // Alertar cuando se recupera

const ALERT_RECIPIENTS = [
  'agustin.scutari@it-tel.com.ar',
  'ja@it-tel.com.ar',
  'md@it-tel.com.ar'
];
```

---

## 🚀 Funcionamiento

### **Flujo de Detección:**

```
┌─────────────────────────────────────────┐
│ GitHub Actions (cada 5 minutos)        │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│ Intenta conectar al PRTG               │
└────────────┬────────────────────────────┘
             │
        ┌────┴────┐
        │         │
        ▼         ▼
    ✅ Éxito   ❌ Error
        │         │
        │         ▼
        │    ┌─────────────────┐
        │    │ ¿1er fallo?     │
        │    └────┬────────────┘
        │         │
        │         ▼
        │    🚨 Alerta PRTG Caído
        │         │
        │         ▼
        │    ┌─────────────────┐
        │    │ Marcar como DOWN│
        │    └─────────────────┘
        │
        ▼
   ┌──────────────┐
   │ ¿Estaba DOWN?│
   └────┬─────────┘
        │
        ▼ SÍ
   ✅ Alerta Recuperado
        │
        ▼
   Resetear estado
```

---

## 🧪 Pruebas

### **Simular PRTG Caído:**

Para probar que las alertas funcionan, puedes:

1. **Opción A - Cambiar URL temporal:**
   ```typescript
   // En .env.local
   PRTG_BASE_URL=http://localhost:9999  // URL que no existe
   ```

2. **Opción B - Firewall temporal:**
   ```powershell
   # Bloquear IP del PRTG temporalmente
   New-NetFirewallRule -DisplayName "Block PRTG Test" -Direction Outbound -RemoteAddress 38.253.65.250 -Action Block
   ```

3. **Esperar siguiente ejecución de GitHub Actions** (5 minutos)

4. **Deberías recibir:**
   - Email con asunto "🔴 ALERTA CRÍTICA: Servidor PRTG..."
   - Mensaje en Telegram

5. **Restaurar conexión** y esperar 5 minutos más

6. **Deberías recibir:**
   - Email con asunto "✅ RECUPERADO: Servidor PRTG..."
   - Mensaje en Telegram

### **Ver Estado Actual:**

```bash
# Consultar estado de salud de los PRTGs
curl https://monitoreo-redes.vercel.app/api/prtg-health
```

**Respuesta esperada:**
```json
{
  "success": true,
  "timestamp": "2025-11-24T18:30:00.000Z",
  "servers": {
    "tandil": {
      "isDown": false,
      "consecutiveFailures": 0,
      "lastCheckTime": "2025-11-24T18:25:00.000Z",
      "lastAlertTime": "never"
    },
    "matanza": {
      "isDown": false,
      "consecutiveFailures": 0,
      "lastCheckTime": "2025-11-24T18:25:00.000Z",
      "lastAlertTime": "never"
    }
  }
}
```

---

## 📊 Logs

### **Logs en GitHub Actions:**

**Cuando está operativo:**
```
🏥 [PRTG-HEALTH] PRTG TANDIL operativo (6/6 sensores consultados)
```

**Cuando falla:**
```
❌ [CRON] Error con sensor 13682: fetch failed
🏥 [PRTG-HEALTH] Detectado fallo de conexión al PRTG TANDIL
🚨 [PRTG-HEALTH] Enviando alerta de PRTG caído: USITTEL TANDIL
✅ [PRTG-HEALTH] Email de alerta enviado
✅ [PRTG-HEALTH] Alerta de Telegram enviada
```

**Cuando se recupera:**
```
✅ [PRTG-HEALTH] PRTG TANDIL recuperado
✅ [PRTG-HEALTH] Email de recuperación enviado
✅ [PRTG-HEALTH] Alerta de recuperación por Telegram enviada
```

---

## ⚙️ Configuración Avanzada

### **Ajustar Cooldown:**
```typescript
// Cambiar de 30 minutos a 1 hora
const ALERT_COOLDOWN = 3600;
```

### **Desactivar Alertas de Recuperación:**
```typescript
const RECOVERY_ALERT_ENABLED = false;
```

### **Cambiar Umbral de Fallos:**
```typescript
// Requerir 2 fallos consecutivos antes de alertar
const FAILURE_THRESHOLD = 2;
```

---

## 🔍 Tipos de Errores Detectados

El sistema detecta automáticamente:

- ✅ `fetch failed` - Error de red general
- ✅ `ECONNREFUSED` - Servidor rechaza conexión
- ✅ `ETIMEDOUT` - Timeout de conexión
- ✅ `Network request failed` - Fallo de red
- ✅ `Error HTTP: 500` - Error interno del servidor
- ✅ `Error HTTP: 503` - Servicio no disponible

---

## 📝 Notas Importantes

1. **No interfiere con alertas de sensores**
   - Las alertas de PRTG caído son independientes
   - Las alertas de sensores siguen funcionando normalmente
   - Ambos sistemas trabajan en paralelo

2. **Estado en memoria**
   - El estado se mantiene durante la vida del proceso de Vercel
   - Si Vercel reinicia el proceso, el estado se resetea
   - Esto es normal y no afecta el funcionamiento

3. **Cooldown persistente**
   - El cooldown se respeta mientras el proceso esté vivo
   - Evita spam de alertas cada 5 minutos

4. **Prioridad de alertas**
   - PRTG caído: Prioridad CRÍTICA
   - PRTG recuperado: Prioridad ALTA

---

## 🆘 Troubleshooting

### **No recibo alertas de PRTG caído:**

1. Verificar que el PRTG realmente esté caído
2. Ver logs de GitHub Actions para confirmar errores
3. Consultar `/api/prtg-health` para ver estado
4. Verificar variables de entorno de email y Telegram

### **Recibo muchas alertas:**

1. Revisar logs para ver si hay fallos intermitentes
2. Aumentar `ALERT_COOLDOWN` a 1 hora (3600)
3. Verificar estabilidad de red/firewall

### **No se detecta cuando el PRTG cae:**

1. Verificar que el error está en la lista de detección
2. Agregar más patrones de error si es necesario
3. Ver logs de GitHub Actions para identificar el mensaje de error exacto

---

**Fecha de implementación:** 24 de noviembre de 2025  
**Versión:** 1.0.0  
**Estado:** ✅ Activo en producción
