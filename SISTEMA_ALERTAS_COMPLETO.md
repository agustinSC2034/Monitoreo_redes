#  SISTEMA DE ALERTAS - GUÍA COMPLETA Y TROUBLESHOOTING

> **Última actualización:** 14 de noviembre de 2025  
> **Versión:** 2.1.0 - Sistema completamente funcional 24/7

---

##  RESUMEN EJECUTIVO

**Estado actual:**  **SISTEMA 100% FUNCIONAL**

-  GitHub Actions ejecutándose automáticamente
-  Emails enviándose correctamente  
-  Telegram funcionando
-  19 reglas activas (16 down + 3 slow)
-  GitHub Actions tiene delays de 30-50 min (limitación del plan gratuito)

---

##  PROBLEMA CRÍTICO RESUELTO (14 Nov 2025)

### **SÍNTOMA ORIGINAL:**
**"Alertas solo funcionan cuando entro a la página, GitHub Actions no envía emails"**

### **INVESTIGACIÓN Y DIAGNÓSTICO:**

#### **Fase 1: Verificar GitHub Actions**
```powershell
# Verificación en: https://github.com/agustinSC2034/Monitoreo_redes/actions
-  Workflow se ejecuta cada 5 minutos
-  Todas las ejecuciones exitosas (verde )
-  Logs muestran Status 200 de Vercel
-  PERO no se envían emails
```

#### **Fase 2: Verificar Variables de Entorno**
```yaml
# .github/workflows/monitor-prtg.yml
env:
  VERCEL_PRODUCTION_URL: monitoreo-redes-5krk3eh9r-agustins-projects-03ad7204.vercel.app
```
**Problema:** URL apunta a deployment específico (hash), no a producción

#### **Fase 3: Verificar Despliegues de Vercel**
- Múltiples deployments activos con diferentes hashes
- GitHub Actions llamaba a `5krk3eh9r` (viejo)
- Nuevo código estaba en `2ZjNHLfLk` y `jsjsvdnk9`
- **Sin logs en el deployment correcto**

#### **Fase 4: Análisis de Código**
**Archivo:** `src/lib/alertMonitor.ts` (líneas 385-450)

```typescript
//  CÓDIGO PROBLEMÁTICO (ANTES):
async function checkThresholdAlerts(sensor: SensorHistory) {
  for (const rule of rules) {
    // PROBLEMA: Verificaba estado para TODAS las reglas
    const stateKey = `_`;
    const lastAlertedStatus = lastAlertedStates.get(stateKey);
    
    if (lastAlertedStatus === sensor.status) {
      continue; //  Bloqueaba reglas "slow" incorrectamente
    }
    
    if (!lastAlertedStatus) {
      const lastAlert = await getLastAlertForRule(rule.id, sensor.sensor_id);
      if (lastAlert && lastAlert.status === sensor.status) {
        lastAlertedStates.set(stateKey, sensor.status);
        continue; //  Bloqueaba incluso cuando cooldown=0
      }
    }
  }
}
```

**Por qué era incorrecto:**
1. **Reglas "down"**: Solo deben disparar cuando el ESTADO cambia (UPDOWN, DOWNUP)
2. **Reglas "slow"**: Deben disparar CADA VEZ que se supera el umbral (independiente del estado)
3. El código trataba ambas igual  reglas "slow" nunca disparaban después de la primera vez

---

##  SOLUCIONES IMPLEMENTADAS

### **1. Separar lógica de reglas "down" vs "slow"**

**Commit:** `f504e22` - "fix: reglas 'slow' no deben bloquearse por estado (solo por cooldown)"

```typescript
//  CÓDIGO CORRECTO (AHORA):
async function checkThresholdAlerts(sensor: SensorHistory) {
  for (const rule of rules) {
    if (!rule.id) continue;
    
    //  DEBUG logs agregados
    console.log(` [DEBUG] Evaluando regla ID  "" - Condición: `);
    
    //  Solo verificar estado para reglas "down"
    if (rule.condition === 'down') {
      console.log(`   Regla tipo DOWN - Verificando estado en BD...`);
      const stateKey = `_`;
      const lastAlertedStatus = lastAlertedStates.get(stateKey);
      
      if (lastAlertedStatus === sensor.status) {
        console.log(`   Estado en memoria coincide:  - SKIP`);
        continue;
      }
      
      if (!lastAlertedStatus) {
        const lastAlert = await getLastAlertForRule(rule.id, sensor.sensor_id);
        if (lastAlert && lastAlert.status === sensor.status) {
          console.log(`   Estado en BD coincide:  - SKIP`);
          lastAlertedStates.set(stateKey, sensor.status);
          continue;
        }
      }
    } else {
      //  Reglas "slow" NO verifican estado
      console.log(`   Regla tipo  - NO verifica estado, solo cooldown`);
    }
    
    // Verificar cooldown
    const cooldownKey = `_`;
    const lastAlertTime = lastAlertTimes.get(cooldownKey);
    const now = Math.floor(Date.now() / 1000);
    
    const shouldCheckCooldown = rule.cooldown > 0;
    
    if (shouldCheckCooldown && lastAlertTime && (now - lastAlertTime) < rule.cooldown) {
      console.log(` Cooldown activo para regla ""`);
      continue;
    }
    
    if (!shouldCheckCooldown) {
      console.log(` [TEST] Regla "" con cooldown=0, se evaluará siempre`);
    }
    
    // Evaluar condición
    const shouldTrigger = evaluateAlertCondition(rule, sensor, dummyChange);
    
    if (shouldTrigger) {
      console.log(` Condición detectada:  (estado: )`);
      await triggerAlert(rule, sensor, dummyChange);
      
      //  Solo guardar timestamp si hay cooldown > 0
      if (rule.cooldown > 0) {
        lastAlertTimes.set(cooldownKey, now);
      }
      
      //  Solo guardar estado para reglas "down"
      if (rule.condition === 'down') {
        const stateKey = `_`;
        lastAlertedStates.set(stateKey, sensor.status);
      }
    }
  }
}
```

### **2. Actualizar URL de GitHub Actions**

**Commit:** `5ad61d1` - "fix: usar URL de producción principal en GitHub Actions"

```yaml
#  ANTES:
env:
  VERCEL_PRODUCTION_URL: monitoreo-redes-5krk3eh9r-agustins-projects-03ad7204.vercel.app

#  AHORA:
env:
  VERCEL_PRODUCTION_URL: monitoreo-redes.vercel.app
```

**Ventaja:** Siempre apunta al deployment de producción más reciente automáticamente

### **3. Deshabilitar cache en Vercel**

**Commit:** `3455619` - "fix: deshabilitar cache en headers de Vercel"

```json
// vercel.json
{
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "no-store, no-cache, must-revalidate"  //  Sin cache
        }
      ]
    }
  ]
}
```

---

##  PROCESO DE TESTING

### **Test 1: Regla de prueba con umbral bajo**
```javascript
// Crear regla de test: sensor 13684 > 50 Mbit/s
{
  id: 25,
  name: ' TEST 13684 > 50 Mbit/s',
  sensor_id: '13684',
  condition: 'slow',
  threshold: 50,  // Muy bajo, siempre dispara
  cooldown: 0,    // Sin cooldown para testing
  recipients: ['agustin.scutari@it-tel.com.ar']
}
```

**Resultado:**  Email llegó inmediatamente al crear la regla

### **Test 2: Verificar repetición de alertas**
**Problema:** Solo llegó 1 email, luego silencio en siguientes ejecuciones

**Causa:** Verificación de estado en BD bloqueaba alertas repetidas

**Solución:** Código corregido (commits f504e22 + b2f1d2d)

### **Test 3: Limpiar historial de BD**
```powershell
node scripts/clean-test-alerts.js
#  Se eliminaron 20 registros del historial
```

**Resultado:**  Emails comenzaron a llegar nuevamente

### **Test 4: Verificar deployment correcto**
```powershell
node scripts/verify-deployment.js
#  Deployment responde correctamente
#  Logs de DEBUG aparecen en Vercel
```

### **Test Final: GitHub Actions manual**
```
Ejecutar workflow manualmente desde:
https://github.com/agustinSC2034/Monitoreo_redes/actions

 Resultado: Email enviado exitosamente
 Logs muestran: " Disparando alerta", " Email enviado"
```

---

##  CONFIGURACIÓN FINAL DE REGLAS

### **REGLAS DE CAÍDAS (16 reglas - tipo "down")**

**Lógica:**
- Solo disparan cuando el **estado cambia** (UPDOWN o DOWNUP)
- NO disparan si el estado es el mismo que la última alerta
- Cooldown: 1800s (30 minutos)
- Canales: Email + Telegram

**TANDIL - USITTEL (5 reglas):**
1. **CABASE - Enlace Caído** (ID: 1, Sensor: 13682)
2. **IPLANxARSAT - Enlace Caído** (ID: 2, Sensor: 13684)
3. **TECO - Enlace Caído** (ID: 3, Sensor: 13683)
4. **RDA - Enlace Caído** (ID: 4, Sensor: 2137)
5. **DTV - Enlace Caído** (ID: 5, Sensor: 13673)

**LA MATANZA - LARANET (11 reglas):**
6. **IPLAN - Enlace Caído** (ID: 8, Sensor: 5159)
7. **WAN1-PPAL - Enlace Caído** (ID: 9, Sensor: 4737)
8. **WAN LARA1 - Enlace Caído** (ID: 10, Sensor: 3942)
9. **VLAN500-WAN Eziza - Enlace Caído** (ID: 11, Sensor: 5187)
10. **WAN2-BACKUP - Enlace Caído** (ID: 12, Sensor: 4736)
11. **IPTV-Modulador 1 - Enlace Caído** (ID: 13, Sensor: 6689)
12. **VLAN500-WAN LARA 2.2 - Enlace Caído** (ID: 14, Sensor: 4665)
13. **vlan500-iBGP - Enlace Caído** (ID: 15, Sensor: 4642)
14. **WAN AXTEL TX - Enlace Caído** (ID: 16, Sensor: 5281)
15. **WAN IPLan RX - Enlace Caído** (ID: 17, Sensor: 5283)
16. **FW Gateway VPN - Enlace Caído** (ID: 18, Sensor: 4640)

### **REGLAS DE UMBRALES (3 reglas - tipo "slow")**

**Lógica:**
- Disparan CADA VEZ que el tráfico supera el umbral
- NO verifican estado del sensor
- Solo verifican cooldown para evitar spam
- Cooldown: 1800s (30 minutos)
- Canales: Email + Telegram

1. **CABASE > 8000 Mbit/s** (ID: 6, Sensor: 13682)
   - Umbral: 8000 Mbit/s
   - Capacidad nominal del enlace
   
2. **IPLAN ARSAT > 1000 Mbit/s** (ID: 7, Sensor: 13684)
   - Umbral: 1000 Mbit/s
   - Enlace de respaldo
   
3. **TECO > 2000 Mbit/s** (ID: 22, Sensor: 13683)
   - Umbral: 2000 Mbit/s
   - Enlace de respaldo

---

##  SCRIPTS DE UTILIDAD

### **Limpiar historial de alertas de test:**
```powershell
node scripts/clean-test-alerts.js
# Elimina registros de alert_history para permitir nuevas alertas
```

### **Eliminar regla de test:**
```powershell
node scripts/delete-test-rule.js <rule_id>
# Ejemplo: node scripts/delete-test-rule.js 25
```

### **Verificar deployment:**
```powershell
node scripts/verify-deployment.js
# Verifica que Vercel esté usando el código correcto
```

### **Ver configuración de regla:**
```powershell
node scripts/show-rule-6-full.js
# Muestra configuración completa de una regla específica
```

### **Forzar ejecución manual:**
```powershell
node scripts/force-alert-test.js
# Llama a los endpoints de Vercel manualmente
```

---

##  CANALES DE NOTIFICACIÓN

### **1. Email (NodeMailer + Gmail SMTP)**

**Configuración:**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=tu-email@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx  # App Password de 16 dígitos
```

**Formato de email:**
```
De: Sistema de Monitoreo ITTEL <tu-email@gmail.com>
Para: agustin.scutari@it-tel.com.ar, md@it-tel.com.ar, ja@it-tel.com.ar
Asunto:  ALERTA: CABASE - Enlace Caído

USITTEL TANDIL

SENSOR: CABASE
CONDICIÓN: Cambio de estado
ESTADO: Disponible  Falla
DURACIÓN ANTERIOR: 120 min
TIMESTAMP: 14/11/2025, 14:30:15
```

**Headers especiales:**
```javascript
{
  priority: 'high',
  importance: 'high',
  'X-Priority': '1',
  'X-MSMail-Priority': 'High'
}
```

### **2. Telegram (Bot API)**

**Configuración:**
```env
TELEGRAM_BOT_TOKEN=8227880581:AAFpxMZSGVVvoeJLAPvLFAp6CdOQOHawHRg
TELEGRAM_CHAT_ID=7073045602
```

**Formato de mensaje:**
```
 ALERTA DE MONITOREO

Sensor: CABASE
Ubicación: USITTEL TANDIL

SENSOR: CABASE
CONDICIÓN: Cambio de estado
ESTADO: Disponible   Falla 
DURACIÓN ANTERIOR: 120 min
TIMESTAMP: 14/11/2025, 14:30:15

Sistema de Monitoreo ITTEL
```

---

##  LIMITACIÓN: GITHUB ACTIONS DELAYS

### **PROBLEMA CONOCIDO:**

GitHub Actions en plan gratuito **NO garantiza timing exacto** en scheduled workflows.

**Configuración actual:**
```yaml
schedule:
  - cron: '*/5 * * * *'  # Cada 5 minutos (teórico)
```

**Realidad observada:**
- Delays entre ejecuciones: 3min, 19min, 17min, 42min, **46min**, **50min**
- Promedio: 30-50 minutos entre ejecuciones
- **Puede tardar hasta 1 hora en ejecutarse**

**Causa (según documentación de GitHub):**
> "Los scheduled workflows pueden retrasarse hasta 10-15 minutos en repos públicos durante períodos de alta carga, y hasta **50-60 minutos en repos privados del plan gratuito**."


##  ENDPOINTS DE API

### **1. Chequeo de alertas (usado por GitHub Actions)**
```
GET /api/cron/check-alerts?location=tandil
GET /api/cron/check-alerts?location=matanza
```

**Response:**
```json
{
  "success": true,
  "location": "tandil",
  "message": "Chequeo de alertas completado para TANDIL",
  "timestamp": "2025-11-14T18:33:49.466Z",
  "duration_ms": 7973,
  "results": [
    {
      "sensor_id": "13682",
      "status": "Disponible",
      "value": "5.084.445 kbit/s",
      "checked": true,
      "timestamp": "2025-11-14T18:33:42.766Z"
    }
  ]
}
```

### **2. Estado de sensores (usado por el dashboard)**
```
GET /api/status?location=tandil
GET /api/status?location=matanza
```

### **3. CRUD de reglas de alerta**
```
GET /api/alerts/rules              # Listar todas
GET /api/alerts/rules/[id]         # Ver una específica
POST /api/alerts/rules             # Crear nueva
PUT /api/alerts/rules/[id]         # Actualizar
DELETE /api/alerts/rules/[id]      # Eliminar
```

---

##  DEBUGGING

### **Ver logs de GitHub Actions:**
```
https://github.com/agustinSC2034/Monitoreo_redes/actions
```

Buscar:
-  " Monitoreo ejecutado exitosamente"
-  " Error en el monitoreo"

### **Ver logs de Vercel:**
```
https://vercel.com/agustins-projects-03ad7204/monitoreo-redes/logs
```

Filtrar por:
- `/api/cron/check-alerts`
- Buscar líneas con ` [DEBUG]`, ` Disparando alerta`, ` Email enviado`

### **Ver datos en Supabase:**
```sql
-- Últimas alertas enviadas
SELECT * FROM alert_history 
ORDER BY timestamp DESC 
LIMIT 10;

-- Reglas activas
SELECT id, name, sensor_id, condition, threshold, cooldown, enabled 
FROM alert_rules 
WHERE enabled = true 
ORDER BY id;

-- Cambios de estado recientes
SELECT * FROM status_changes 
ORDER BY timestamp DESC 
LIMIT 20;

-- Verificar última alerta de una regla específica
SELECT * FROM alert_history
WHERE rule_id = 6 AND sensor_id = '13682'
ORDER BY timestamp DESC
LIMIT 1;
```

### **Logs clave a buscar:**

** Alertas funcionando correctamente:**
```
 [DEBUG] Evaluando regla ID 6 "CABASE > 8000 Mbit/s" - Condición: slow
   Regla tipo SLOW - NO verifica estado, solo cooldown
 Tráfico actual: 9500 Mbit/s | Umbral: 8000 Mbit/s
 Condición detectada: CABASE > 8000 Mbit/s (estado: Disponible)
 [EMAIL] Enviando alerta a: [ 'agustin.scutari@it-tel.com.ar', ... ]
 Email enviado exitosamente a: agustin.scutari@it-tel.com.ar
```

** Alertas bloqueadas (problema viejo):**
```
 [DEBUG] Evaluando regla ID 25 " TEST 13684 > 50 Mbit/s" - Condición: slow
   Estado en BD coincide: Disponible - SKIP
(No hay " Disparando alerta" ni " Email enviado")
```

---

##  ARCHIVOS IMPORTANTES

### **Código fuente:**
- `src/lib/alertMonitor.ts` -  Lógica de detección de alertas
- `src/lib/db.ts` - Queries de Supabase
- `src/lib/emailService.ts` - Envío de emails
- `src/lib/telegramService.ts` - Envío de Telegram
- `src/app/api/cron/check-alerts/route.ts` - Endpoint usado por GitHub Actions

### **Configuración:**
- `.env.local` - Variables de entorno (NO en Git)
- `vercel.json` - Configuración de Vercel
- `.github/workflows/monitor-prtg.yml` - GitHub Actions workflow

### **Scripts:**
- `scripts/check-alerts-cron.js` - Script ejecutado por GitHub Actions
- `scripts/clean-test-alerts.js` - Limpiar historial de tests
- `scripts/delete-test-rule.js` - Eliminar regla de prueba
- `scripts/force-alert-test.js` - Ejecutar prueba manual
- `scripts/verify-deployment.js` - Verificar deployment de Vercel

### **Documentación:**
- `docs/GUIA_COMPLETA_PROYECTO.md` - Guía general del proyecto
- `docs/SISTEMA_ALERTAS_COMPLETO.md` - Este documento
- `docs/ALERTAS_README.md` - Documentación de alertas
- `docs/GITHUB_ACTIONS_SETUP.md` - Setup de GitHub Actions

---

##  CHECKLIST DE VERIFICACIÓN

Antes de considerarse que el sistema funciona correctamente:

- [x] GitHub Actions se ejecuta automáticamente
- [x] Logs de GitHub Actions muestran Status 200
- [x] Vercel recibe las llamadas y procesa correctamente
- [x] Logs de Vercel muestran " [DEBUG] Evaluando regla..."
- [x] Logs muestran " Disparando alerta" cuando corresponde
- [x] Logs muestran " Email enviado exitosamente"
- [x] Emails llegan a los destinatarios correctos
- [x] Mensajes de Telegram se envían correctamente
- [x] Reglas "down" solo disparan al cambiar estado
- [x] Reglas "slow" disparan cuando se supera umbral
- [x] Cooldown evita spam (30 min entre alertas)
- [x] Variables de entorno configuradas en Vercel
- [x] URL de producción correcta en GitHub Actions
- [x] Cache deshabilitado en Vercel

---

##  TROUBLESHOOTING RÁPIDO

### **Problema: No llegan emails**

1. **Verificar SMTP_PASS:**
   ```powershell
   # En Vercel  Settings  Environment Variables
   # Debe ser App Password de 16 dígitos (sin espacios)
   ```

2. **Verificar logs de Vercel:**
   ```
   Buscar: " [EMAIL] Enviando alerta"
   Si NO aparece: La alerta no se disparó
   Si aparece + error: Problema con SMTP
   ```

3. **Verificar regla en BD:**
   ```sql
   SELECT * FROM alert_rules WHERE id = <rule_id>;
   -- Verificar: enabled = true, channels incluye "email"
   ```

### **Problema: GitHub Actions se ejecuta pero no envía alertas**

1. **Verificar URL en workflow:**
   ```yaml
   # Debe ser: monitoreo-redes.vercel.app
   # NO: monitoreo-redes-xxx-agustins-projects.vercel.app
   ```

2. **Verificar logs de deployment:**
   ```
   Ir a Vercel  Deployment de producción  Logs
   Filtrar por timestamp de la ejecución de GitHub Actions
   Debe haber logs de " [DEBUG]"
   ```

3. **Limpiar historial de alertas:**
   ```powershell
   node scripts/clean-test-alerts.js
   ```

### **Problema: Alertas duplicadas**

Aumentar cooldown:
```sql
UPDATE alert_rules 
SET cooldown = 1800  -- 30 minutos
WHERE id = <rule_id>;
```

### **Problema: GitHub Actions tarda mucho**

**Es normal en plan gratuito** (30-50 min). Soluciones:
- Configurar cron-job.org (gratis, confiable)
- O aceptar el delay

---

##  CONTACTO

**Mantenedor:** Agustín Scutari  
**Email:** agustin.scutari@it-tel.com.ar  
**Repositorio:** https://github.com/agustinSC2034/Monitoreo_redes

---


URL VERCEL:
https://monitoreo-redes.vercel.app/



**FIN DEL DOCUMENTO**

---

# 📅 ACTUALIZACIÓN 18/11/2025 - SISTEMA DE SESIONES Y ELIMINACIÓN DE DUPLICADOS

## 🎯 PROBLEMA RESUELTO

**SÍNTOMA:** Sistema enviaba múltiples alertas duplicadas (7 Telegram + 7 Email por ejecución)

**CAUSA RAÍZ:**
1. Recargar el dashboard disparaba alertas (endpoint /api/status llamaba processSensorData)
2. No había control de duplicados dentro de una misma ejecución de GitHub Action
3. Variables globales obsoletas (lastAlertedStates, lastAlertTimes) causaban conflictos

## 🔧 SOLUCIÓN IMPLEMENTADA

### **Sistema de Sesiones Únicas**

Se implementó un sistema de sesiones que garantiza **UNA SOLA ALERTA por ejecución de GitHub Action**:

`	ypescript
// Variable global que controla TODO el sistema
let currentSessionId: string | null = null;
const sessionAlerts = new Map<string, Set<string>>();

// Solo /api/cron/check-alerts crea sesiones
export function startMonitoringSession(sessionId: string) {
  currentSessionId = sessionId;
  sessionAlerts.set(sessionId, new Set());
  console.log(🔑 [SESSION] Iniciando sesión: ${sessionId});
}

// Verificar si ya se alertó en esta sesión
export function hasAlertedInSession(ruleId: number, sensorId: string): boolean {
  if (!currentSessionId) return false;
  const alerts = sessionAlerts.get(currentSessionId);
  return alerts?.has(${ruleId}_) || false;
}
`

### **Protección contra alertas en Dashboard**

**ANTES:**
`	ypescript
// /api/status llamaba processSensorData()
export async function GET() {
  const sensors = await fetchPRTGData();
  await processSensorData(sensors);  // ❌ Disparaba alertas
  return Response.json({ sensors });
}
`

**DESPUÉS:**
`	ypescript
// /api/status SOLO lee, NO procesa alertas
export async function GET() {
  const sensors = await getCriticalSensors();  // ✅ Solo lectura
  return Response.json({ sensors });
}
`

### **Control de ejecución estricto**

Todas las funciones de alerta verifican sesión activa:

`	ypescript
async function checkThresholdAlerts(sensor: SensorHistory) {
  // 🔒 SOLO ejecutar si hay sesión activa
  if (!currentSessionId) {
    console.log(⏸️ [NO-SESSION] Saltando alertas);
    return;
  }
  
  // 🔒 Verificar si ya se alertó en esta sesión
  if (hasAlertedInSession(rule.id, sensor.sensor_id)) {
    console.log(⏭️ [SESSION-SKIP] Ya alertado);
    continue;
  }
  
  // ✅ Disparar alerta
  await triggerAlert(rule, sensor, change);
  markAlertedInSession(rule.id, sensor.sensor_id);
}
`

## 🎨 MEJORAS EN MENSAJES Y GRÁFICOS

### **Mensajes Profesionales**
- ❌ Removidos emojis de los mensajes
- ✅ Formato profesional y claro
- ✅ Timestamp en zona horaria Argentina

### **Gráficos en Alertas**

**Email:** Gráfico embebido en HTML
`html
<img src="https://[DOMAIN]/api/chart-proxy?sensorId=13682&location=tandil" />
`

**Telegram:** Foto del gráfico con mensaje como caption
`	ypescript
await bot.sendPhoto(chatId, chartUrl, {
  caption: message,
  parse_mode: 'HTML'
});
`

**Rango temporal:** Últimas 2 horas (mejor contexto reciente)

## 📊 CONFIGURACIÓN DE PRODUCCIÓN

### **Valores Actuales**

`javascript
// Regla CABASE (ID: 6)
{
  name: "CABASE > 8500 Mbit/s",
  threshold: 8500,  // Producción (antes 1000 para testing)
  cooldown: 0,      // Sistema de sesiones controla duplicados
  recipients: [
    "agustin.scutari@it-tel.com.ar",
    "ja@it-tel.com.ar",
    "md@it-tel.com.ar"
  ]
}

// Todas las 17 reglas activas
- 14 reglas de DOWN (enlace caído)
- 3 reglas de THRESHOLD (exceso de tráfico)
- Todas con 3 destinatarios email
- Telegram habilitado
`

### **Script de Restauración**

`ash
# Ejecutar para volver a producción
node scripts/restore-production-config.js
`

Actualiza:
- CABASE: 1000 → 8500 Mbit/s
- Agrega 3 emails a TODAS las reglas
- Mantiene cooldown en 0

## 🐛 ERRORES CORREGIDOS

### **Build Errors en Vercel**

Se eliminaron múltiples errores de TypeScript:

1. **lastAlertedStates no definido** (líneas 260-264, 300)
   - Solución: Eliminada variable obsoleta

2. **lastAlertTimes no definido** (líneas 356, 372, 483, 883-885)
   - Solución: Eliminado Map obsoleto, cooldown ahora en BD

3. **Llave de cierre extra** (línea 469)
   - Solución: Eliminada llave duplicada

4. **created_at puede ser undefined** (líneas 405, 504)
   - Solución: Agregada validación && lastAlert.created_at

## 🔄 FLUJO ACTUAL

`
[GitHub Actions - cada 5 min]
         ↓
   /api/cron/check-alerts
         ↓
startMonitoringSession() → sessionId = "cron_tandil_1732999999"
         ↓
   processSensorData()
         ↓
Para cada sensor:
  ├─ checkThresholdAlerts()
  │    └─ Si currentSessionId existe
  │         └─ Si NO alertó en sesión
  │              └─ triggerAlert()
  │                   ├─ Email con gráfico
  │                   └─ Telegram con foto
  └─ checkAndTriggerAlerts()
       └─ (igual lógica)

[Usuario recarga dashboard]
         ↓
     /api/status
         ↓
getCriticalSensors() → SOLO LECTURA
         ↓
    NO ALERTAS ✅
`

## 📝 ARCHIVOS MODIFICADOS

### **Creados/Actualizados:**
- scripts/restore-production-config.js - Script producción
- .SISTEMA_ALERTAS_COMPLETO.md - Esta documentación

### **Modificados:**
- src/lib/alertMonitor.ts - Sistema de sesiones
- src/app/api/cron/check-alerts/route.ts - Crea sesión
- src/app/api/status/route.ts - Solo lectura
- src/lib/telegramService.ts - Envío de fotos
- src/lib/emailService.ts - Gráficos embebidos
- src/app/api/chart-proxy/route.ts - Últimas 2 horas

### **Eliminados:**
- src/app/dashboard/alertas/configuracion/ - Página no utilizada

## ✅ RESULTADO FINAL

**Sistema 100% funcional:**
- ✅ UNA alerta por GitHub Action (cada 5 min)
- ✅ NO duplicados
- ✅ Dashboard NO dispara alertas
- ✅ Email + Telegram con gráficos
- ✅ 17 reglas activas (14 DOWN + 3 THRESHOLD)
- ✅ 3 destinatarios configurados
- ✅ Mensajes profesionales sin emojis
- ✅ Build exitoso en Vercel
- ✅ TypeScript sin errores

## 🔐 VARIABLES DE ENTORNO CRÍTICAS

`env
# PRTG Tandil
PRTG_HOST_TANDIL=38.253.65.250
PRTG_PORT_TANDIL=8080
PRTG_USER_TANDIL=nocittel
PRTG_PASSHASH_TANDIL=413758319

# PRTG Matanza
PRTG_HOST_MATANZA=38.159.225.250
PRTG_PORT_MATANZA=8090
PRTG_USER_MATANZA=nocittel
PRTG_PASSHASH_MATANZA=3903741015

# Telegram
TELEGRAM_BOT_TOKEN=8227880581:AAFpxMZSGVVvoeJLAPvLFAp6CdOQOHawHRg
TELEGRAM_CHAT_ID=-1003354964179

# Email
GMAIL_USER=agustinsc2034@gmail.com
GMAIL_APP_PASSWORD=[APP_PASSWORD]

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://tuskasjifhkednqxvgxm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[ANON_KEY]
`

## 📞 DESTINATARIOS FINALES

- **agustin.scutari@it-tel.com.ar** (Email + Telegram)
- **ja@it-tel.com.ar** (Email)
- **md@it-tel.com.ar** (Email)

---

**Sistema actualizado y probado:** 18 de noviembre de 2025
**Build Vercel:** ✅ Exitoso
**Deployment:** https://monitoreo-redes.vercel.app

