# 📘 GUÍA COMPLETA DEL PROYECTO - Sistema de Monitoreo PRTG

> **Para IAs y desarrolladores que necesiten entender y trabajar con este proyecto**

---

## 🎯 ¿QUÉ ES ESTE PROYECTO?

Sistema de monitoreo automático de enlaces de red que consulta servidores **PRTG** cada 5 minutos, detecta problemas (caídas, cambios de estado) y envía alertas por **Email y Telegram**.

**Ubicaciones monitoreadas:**
- 🏢 **TANDIL (USITTEL)**: 6 sensores de enlaces de red
- 🏢 **LA MATANZA (LARANET)**: 8 sensores de enlaces de red

---

## 🏗️ ARQUITECTURA DEL SISTEMA

```
┌─────────────────────────────────────────────────────────────┐
│                   GITHUB ACTIONS (Cron)                     │
│              Ejecuta cada 5 minutos 24/7                    │
│   - Llama a API de Vercel: /api/cron/check-alerts          │
│   - No depende de usuarios conectados                       │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    VERCEL (Hosting)                         │
│          Next.js 15 + TypeScript + App Router               │
│                                                              │
│  📁 dashboard-usittel/                                      │
│    ├── src/app/                (Frontend + API Routes)      │
│    ├── src/lib/                (Lógica de negocio)          │
│    ├── scripts/                (Scripts de mantenimiento)   │
│    └── public/                 (Assets estáticos)           │
│                                                              │
│  🔗 Root Directory: dashboard-usittel                       │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┴──────────────┐
        │                             │
        ▼                             ▼
┌──────────────────┐        ┌──────────────────┐
│   PRTG TANDIL    │        │  PRTG MATANZA    │
│ 38.253.65.250    │        │ stats.reditel    │
│    :8080         │        │    .com.ar:8995  │
│                  │        │                  │
│ Passhash:        │        │ Passhash:        │
│ 413758319        │        │ 3903741015       │
└──────────────────┘        └──────────────────┘
        │                             │
        └──────────────┬──────────────┘
                       ▼
              ┌──────────────────┐
              │   SUPABASE       │
              │  (PostgreSQL)    │
              │                  │
              │  - alert_rules   │
              │  - alert_history │
              │  - sensor_history│
              │  - status_changes│
              │  - system_logs   │
              └──────────────────┘
```

---

## 🔑 CONFIGURACIÓN DE VARIABLES DE ENTORNO

### **Archivo: `.env.local`** (Local)
**Ubicación:** `dashboard-usittel/.env.local`

```bash
# ========== PRTG TANDIL (USITTEL) ==========
PRTG_BASE_URL=http://38.253.65.250:8080
PRTG_USERNAME=usittel
PRTG_PASSHASH=413758319

# ========== PRTG LA MATANZA (LARANET) ==========
PRTG_MATANZA_BASE_URL=http://stats.reditel.com.ar:8995
PRTG_MATANZA_USERNAME=admin
PRTG_MATANZA_PASSHASH=3903741015

# ========== SUPABASE (Base de Datos) ==========
NEXT_PUBLIC_SUPABASE_URL=https://tuskasjifhkednqxvgxm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ========== EMAIL (NodeMailer SMTP) ==========
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-app-password

# ========== TELEGRAM ==========
TELEGRAM_BOT_TOKEN=8227880581:AAFpxMZSGVVvoeJLAPvLFAp6CdOQOHawHRg
TELEGRAM_CHAT_ID=7073045602

# ========== VERCEL ==========
NEXT_PUBLIC_VERCEL_URL=monitoreo-redes-xxx.vercel.app
```

### **Vercel Environment Variables**
Todas las variables de `.env.local` deben estar configuradas en:
```
https://vercel.com/agustins-projects-03ad7204/monitoreo-redes/settings/environment-variables
```

### **GitHub Actions Secrets**
Configurados en el repositorio para el cron job:
```
https://github.com/agustinSC2034/Monitoreo_redes/settings/secrets/actions
```

**Secrets necesarios:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`
- `VERCEL_PRODUCTION_URL`

---

## 📊 BASE DE DATOS SUPABASE

### **Tablas y Esquema:**

#### 1. **alert_rules** (Reglas de alerta)
```sql
CREATE TABLE alert_rules (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  sensor_id TEXT NOT NULL,
  condition TEXT NOT NULL,  -- 'down', 'warning', 'slow', etc.
  threshold INTEGER,
  cooldown INTEGER DEFAULT 300,
  channels TEXT[] DEFAULT ARRAY['email'],
  email_recipients TEXT[],
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 2. **alert_history** (Historial de alertas enviadas)
```sql
CREATE TABLE alert_history (
  id SERIAL PRIMARY KEY,
  rule_id INTEGER REFERENCES alert_rules(id),
  sensor_id TEXT NOT NULL,
  sensor_name TEXT NOT NULL,
  status TEXT NOT NULL,
  message TEXT NOT NULL,
  channels_sent TEXT[],
  recipients TEXT[],
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);
```

#### 3. **sensor_history** (Historial de estados de sensores)
```sql
CREATE TABLE sensor_history (
  id SERIAL PRIMARY KEY,
  sensor_id TEXT NOT NULL,
  sensor_name TEXT NOT NULL,
  status TEXT NOT NULL,
  status_raw INTEGER,
  lastvalue TEXT,
  message TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);
```

#### 4. **status_changes** (Cambios de estado detectados)
```sql
CREATE TABLE status_changes (
  id SERIAL PRIMARY KEY,
  sensor_id TEXT NOT NULL,
  sensor_name TEXT NOT NULL,
  old_status TEXT NOT NULL,
  new_status TEXT NOT NULL,
  duration INTEGER,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🚨 SISTEMA DE ALERTAS

### **Canales de Notificación:**

El sistema envía alertas por **2 canales simultáneamente**:

1. **📧 Email (NodeMailer + Gmail SMTP)**
   - Formato HTML con colores según prioridad
   - Headers de alta prioridad para alertas críticas
   - Destinatarios: agustin.scutari@, md@, ja@ it-tel.com.ar

2. **📱 Telegram (Bot API)**
   - Mensajes instantáneos con formato Markdown
   - Emojis solo en estados críticos (Falla ❌, Disponible ✅)
   - Bot: @tu_bot (configurado con BotFather)
   - Chat ID: 7073045602

### **Tipos de Condiciones:**

1. **`down`** - Sensor caído (status_raw = 5)
   - ✅ **ACTIVO**: Alerta cuando el sensor cae completamente
   - ❌ **DESACTIVADO**: No alerta recuperaciones (DOWN → UP)

2. **`warning`** - Sensor en advertencia (status_raw = 4)
   - ❌ **DESACTIVADO GLOBALMENTE**: No envía alertas

3. **`slow`** - Umbral de tráfico máximo excedido
   - ✅ **ACTIVO**: 3 sensores de Tandil con umbrales máximos configurados
   - CABASE: > 8500 Mbit/s
   - IPLANxARSAT: > umbral configurado
   - TECO: > umbral configurado

4. **`traffic_low`** - Umbral de tráfico mínimo no alcanzado ⭐ NUEVO
   - ✅ **ACTIVO**: 1 sensor de Tandil con umbral mínimo
   - CABASE: < 200 Mbit/s
   - 🔴 **PRIORIDAD**: No alerta si el sensor está DOWN (prioridad a alerta de caída)

5. **`traffic_spike`** / **`traffic_drop`** - Cambios bruscos >50%
   - ❌ **PAUSADO**: Actualmente desactivado para todos los sensores

### **Lógica de Alertas:**

```typescript
// 1. 🔒 SISTEMA DE SESIONES: Solo alertas desde GitHub Actions
if (!currentSessionId) {
  return; // No alertar si no hay sesión activa
}

// 2. Detecta cambio de estado
if (current.status !== lastKnown.status) {
  await saveStatusChange(change);
  
  // 3. Si es caída (UP → DOWN), alerta
  await checkAndTriggerAlerts(sensor, change);
}

// 4. Verifica cooldown (5 minutos)
if (lastAlertTime && (now - lastAlertTime) < 300) {
  skip; // No enviar
}

// 5. 🔒 Verifica si ya alertó en esta sesión (evita duplicados)
if (hasAlertedInSession(ruleId, sensorId)) {
  skip; // Ya alertó en esta ejecución
}

// 6. Verifica umbral de tráfico (si aplica)
await checkThresholdAlerts(current);
```

### **Filtros Especiales:**

#### **TECO (sensor 13683)**
```typescript
// No alertar Warning para TECO (fluctúa por tráfico bajo)
if (sensor.sensor_id === '13683' && rule.condition === 'down') {
  if (sensor.status_raw !== 5) {
    return false; // Solo alertar DOWN real
  }
}
```

### **Destinatarios de Alertas:**
```javascript
const emailRecipients = [
  'agustin.scutari@it-tel.com.ar',
  'md@it-tel.com.ar',
  'ja@it-tel.com.ar'
];
```

---

## 🤖 GITHUB ACTIONS - MONITOREO AUTOMÁTICO

### **Archivo:** `.github/workflows/monitor-prtg.yml`

```yaml
name: Monitoreo PRTG Automático

on:
  schedule:
    - cron: '*/5 * * * *'  # Cada 5 minutos
  workflow_dispatch:        # Manual trigger

jobs:
  check-alerts:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout código
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Ejecutar chequeo de alertas
        working-directory: dashboard-usittel
        run: node scripts/check-alerts-cron.js
```

### **Script:** `scripts/check-alerts-cron.js`

```javascript
// Llama a los endpoints de Vercel para AMBAS ubicaciones
const ENDPOINTS = [
  '/api/cron/check-alerts?location=tandil',
  '/api/cron/check-alerts?location=matanza'
];

// Hace requests HTTPS a Vercel
callVercelEndpoint('tandil');
callVercelEndpoint('matanza');
```

**Ventajas:**
- ✅ No duplica código
- ✅ Usa la misma lógica que el dashboard
- ✅ Corre 24/7 sin depender de usuarios
- ✅ Logs visibles en GitHub Actions
- ✅ Sistema de sesiones evita alertas al recargar el dashboard

---

## 📁 ESTRUCTURA DE ARCHIVOS CLAVE

```
dashboard-usittel/
├── src/
│   ├── app/
│   │   ├── page.tsx                    # Dashboard principal
│   │   ├── layout.tsx                  # Layout global
│   │   ├── api/
│   │   │   ├── status/route.ts         # GET sensores (Tandil/Matanza)
│   │   │   ├── chart-proxy/route.ts    # Proxy para gráficos PRTG
│   │   │   ├── cron/
│   │   │   │   └── check-alerts/route.ts  # ⭐ Endpoint de monitoreo
│   │   │   └── alerts/
│   │   │       └── rules/[ruleId]/route.ts  # CRUD de reglas
│   │   └── dashboard/
│   │       └── alertas/
│   │           ├── page.tsx            # Historial de alertas
│   │           └── configuracion/page.tsx  # Configurar reglas
│   │
│   ├── lib/
│   │   ├── prtgClient.ts              # ⭐ Cliente PRTG (dual-server)
│   │   ├── alertMonitor.ts            # ⭐ Lógica de detección de alertas
│   │   ├── db.ts                      # ⭐ Supabase queries
│   │   ├── emailService.ts            # 📧 NodeMailer para emails
│   │   ├── telegramService.ts         # 📱 Telegram Bot API
│   │   └── whatsappService.ts         # 📲 Twilio (no usado actualmente)
│   │
│   └── components/
│       ├── SensorCard.tsx             # Tarjeta de sensor individual
│       ├── HistoricalChart.tsx        # Gráfico de tráfico
│       ├── MapView.tsx                # Mapa de ubicaciones
│       └── NotificationBell.tsx       # Campana de alertas
│
├── scripts/
│   ├── check-alerts-cron.js           # ⭐ Script de GitHub Actions
│   ├── update-all-recipients.js       # Actualizar destinatarios
│   ├── fix-laranet-rule-names.js      # Sincronizar nombres de reglas
│   └── disable-traffic-threshold-rules.js  # Pausar reglas de umbral
│
├── .env.local                          # ⭐ Variables de entorno (NO en Git)
├── package.json                        # Dependencias
├── next.config.ts                      # Configuración de Next.js
├── vercel.json                         # Configuración de Vercel
└── tsconfig.json                       # TypeScript config
```

### **Archivos NO en Git:**
- `.env.local` (credenciales sensibles)
- `node_modules/`
- `.next/` (build output)
- `.vercel/` (configuración de deploy)

---

## 🚀 CÓMO HACER DEPLOY

### **1. Deploy desde la raíz del repositorio:**

```powershell
cd c:\Users\Aguus\OneDrive\Escritorio\Monitoreo_redes
vercel --prod
```

**IMPORTANTE:** Debido a que configuramos `Root Directory: dashboard-usittel` en Vercel, **siempre debes deployar desde la raíz del monorepo**, no desde `dashboard-usittel/`.

### **2. Configuración de Vercel:**

**Settings → General → Root Directory:**
```
dashboard-usittel
```

**Settings → Build & Development:**
- **Build Command:** `npm run build`
- **Output Directory:** `.next`
- **Install Command:** `npm install`

### **3. Variables de entorno en Vercel:**

Todas las variables de `.env.local` deben estar en:
```
Settings → Environment Variables
```

Aplican a: **Production, Preview, Development**

---

## 📧 CONFIGURACIÓN DE EMAIL

### **Gmail App Password:**

1. Ir a: https://myaccount.google.com/apppasswords
2. Crear "App Password" para "Mail"
3. Copiar la contraseña de 16 caracteres
4. Usar en `SMTP_PASS`

### **Formato de emails:**

```html
<h2>🚨 ALERTA: Cambio de Estado - [SENSOR_NAME]</h2>
<p><strong>Sensor:</strong> [SENSOR_NAME]</p>
<p><strong>Dispositivo:</strong> [DEVICE]</p>
<p><strong>Cambio:</strong> [OLD_STATUS] → [NEW_STATUS]</p>
<p><strong>Fecha:</strong> [TIMESTAMP]</p>
```

---

## 🔍 SENSORES MONITOREADOS

### **TANDIL (USITTEL) - 6 sensores:**

| ID    | Nombre                          | Tipo          | Alertas |
|-------|---------------------------------|---------------|---------||
| 13682 | CABASE                          | WAN Principal | DOWN, Umbral > 8500 Mbit/s, Umbral < 200 Mbit/s |
| 13684 | IPLANxARSAT (L2L x ARSAT)      | WAN Principal | DOWN, Umbral |
| 13683 | TECO (L2L x TECO)              | WAN Principal | DOWN*, Umbral |
| 2137  | ITTEL-RDA-1-TDL (vlan500-WAN)  | Interno       | DOWN |
| 13673 | ITTEL-RDB-1-TDL (RDB-DTV)      | Interno       | DOWN |
| 13726 | WAN-to-RDB                      | WAN           | DOWN |

**TECO (13683)**: Filtro especial - solo alerta DOWN real, ignora Warning por fluctuaciones.  
**CABASE (13682)**: Único sensor con umbral mínimo configurado (200 Mbit/s).

### **LA MATANZA (LARANET) - 8 sensores:**

| ID   | Nombre                               | Tipo          | Alertas |
|------|--------------------------------------|---------------|---------|
| 5159 | 🌐 sfp28-10-WANxIPLAN                | WAN Mayorista | DOWN |
| 4737 | 🌐 sfp28-12-WAN1-PPAL                | WAN Mayorista | DOWN |
| 3942 | sfp-sfpplus1-WAN LARA1-RDA-1-LARA   | WAN           | DOWN |
| 5187 | VLAN500-WAN (Lomas de Eziza)        | WAN           | DOWN |
| 4736 | sfp28-11-WAN2-BACKUP                | WAN Backup    | DOWN |
| 6689 | IPTV-Modulador 1                    | IPTV          | DOWN |
| 4665 | VLAN500-WAN (LARA 2.2)              | WAN           | DOWN |
| 4642 | vlan500-iBGP (LARA 2.1)             | iBGP          | DOWN |

🌐 = Enlace mayorista principal (traen Internet desde afuera)

---

## 🛠️ SCRIPTS DE MANTENIMIENTO

### **Agregar alerta de umbral mínimo para CABASE:**
```powershell
cd dashboard-usittel
node scripts/add-cabase-min-threshold.js
```

### **Actualizar destinatarios de todas las reglas:**
```powershell
cd dashboard-usittel
node scripts/update-all-recipients.js
```

### **Verificar reglas activas:**
```powershell
node scripts/check-alert-rules.js
```

### **Desactivar reglas de umbral:**
```powershell
node scripts/disable-traffic-threshold-rules.js
```

### **Sincronizar nombres de reglas LARANET:**
```powershell
node scripts/fix-laranet-rule-names.js
```

---

## 🐛 DEBUGGING

### **Ver logs de GitHub Actions:**
```
https://github.com/agustinSC2034/Monitoreo_redes/actions
```

### **Ver logs de Vercel:**
```
https://vercel.com/agustins-projects-03ad7204/monitoreo-redes/logs
```

### **Ver datos en Supabase:**
```sql
-- Últimas alertas enviadas
SELECT * FROM alert_history ORDER BY timestamp DESC LIMIT 10;

-- Reglas activas
SELECT * FROM alert_rules WHERE enabled = true;

-- Cambios de estado recientes
SELECT * FROM status_changes ORDER BY timestamp DESC LIMIT 20;
```

### **Logs en consola del navegador:**
- `[DEBUG-TZ]` - Ajuste de timezone
- `[DEBUG-LARANET]` - Formato de hora LARANET
- `[TECO]` - Filtros especiales para TECO
- `🚨` - Alertas disparadas
- `✅` - Recuperaciones detectadas

---

## ⚠️ PROBLEMAS CONOCIDOS Y SOLUCIONES

### **1. Emails de error de Vercel cada 5 minutos**
**Causa:** Root Directory mal configurado
**Solución:** Settings → Build and Deployment → Root Directory: `dashboard-usittel`

### **2. Alertas duplicadas de "Falla → Falla"**
**Causa:** Sistema perdió memoria entre deploys
**Solución:** Implementado - Consulta BD para verificar último estado alertado

### **3. TECO envía muchas alertas de Warning**
**Causa:** Fluctúa entre Warning y Disponible por tráfico bajo
**Solución:** Filtro especial - Solo alerta DOWN real, ignora Warning

### **4. No recibe alerta de recuperación**
**Causa:** Sistema reiniciado después de la caída
**Solución:** Implementado - Consulta `status_changes` en BD para detectar recuperaciones

### **5. Alertas de tráfico fallaron silenciosamente (sensor 13684)**
**Causa:** Campo `channels` guardado como STRING en lugar de ARRAY en BD
**Síntoma:** `success: false`, `channels_sent: []`, sin `error_message`
**Solución:** Implementado - JSON.parse() automático en `getAlertRules()` y `getAlertRuleBySensor()`
**Detalles:** Ver `docs/FIX_ALERTAS_FALLIDAS_13684.md`

### **Hora incorrecta en sensores LARANET**
**Causa:** Ajuste de timezone aplicado a ambas ubicaciones
**Solución:** Ajuste solo para Tandil (UTC→ART), LARANET usa hora local

---

## 📱 INTEGRACIÓN DE TELEGRAM

### **Configuración del Bot**

#### **1. Crear bot con BotFather:**
```bash
# En Telegram, buscar: @BotFather
/newbot
# Nombre: ITTEL Monitoreo Bot
# Username: ittel_monitor_bot

# BotFather te dará:
# BOT_TOKEN: 8227880581:AAFpxMZSGVVvoeJLAPvLFAp6CdOQOHawHRg
```

#### **2. Obtener Chat ID:**
```bash
# Iniciar conversación con el bot:
/start

# Obtener el Chat ID:
curl "https://api.telegram.org/bot<BOT_TOKEN>/getUpdates"

# Resultado:
# "chat": {"id": 7073045602, ...}
```

#### **3. Configurar variables de entorno:**
```bash
# .env.local
TELEGRAM_BOT_TOKEN=8227880581:AAFpxMZSGVVvoeJLAPvLFAp6CdOQOHawHRg
TELEGRAM_CHAT_ID=7073045602

# Vercel Environment Variables
# Agregar las mismas 2 variables en: Settings → Environment Variables
```

### **Implementación Técnica**

#### **Archivo: `src/lib/telegramService.ts`**
```typescript
import TelegramBot from 'node-telegram-bot-api';

export async function sendTelegramAlert(options: {
  sensorName: string;
  status: string;
  message: string;
  location: string;
}): Promise<boolean> {
  const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: false });
  
  // Determinar emoji según estado
  const headerEmoji = options.status.includes('Falla') ? '🔴' : '✅';
  
  // Limpiar mensaje de emojis decorativos
  const cleanMessage = options.message
    .replace(/🔵\s*/g, '')  // Quitar emoji azul
    .replace(/🟢\s*/g, '')  // Quitar emoji verde
    .replace(/→ Falla\b/g, '→ Falla ❌')
    .replace(/→ Disponible\b/g, '→ Disponible ✅');
  
  const telegramMessage = `
${headerEmoji} *ALERTA DE MONITOREO*

*Sensor:* ${options.sensorName}
*Ubicación:* ${options.location}

${cleanMessage}

_Sistema de Monitoreo ITTEL_
`.trim();

  await bot.sendMessage(TELEGRAM_CHAT_ID, telegramMessage, {
    parse_mode: 'Markdown',
    disable_web_page_preview: true,
  });
  
  return true;
}
```

#### **Integración en `alertMonitor.ts`:**
```typescript
// Switch de canales
for (const channel of rule.channels) {
  switch (channel) {
    case 'email':
      await sendEmailAlert(rule, message, isRecovery);
      break;
    
    case 'telegram':
      await sendTelegramAlert({
        sensorName: sensor.sensor_name,
        status: sensor.status,
        message,
        location: sensor.sensor_id.startsWith('4') ? 'LARANET' : 'USITTEL'
      });
      break;
  }
}
```

### **Formato de Mensajes**

#### **Alerta de CAÍDA:**
```
🔴 ALERTA DE MONITOREO

Sensor: (012) vlan500-iBGP
Ubicación: LARANET LA MATANZA

SENSOR: (012) vlan500-iBGP
CONDICIÓN: Cambio de estado
ESTADO: Disponible ✅ → Falla ❌
DURACIÓN ANTERIOR: 120 min
TIMESTAMP: 11/11/2025, 14:30:15

Sistema de Monitoreo ITTEL
```

#### **Alerta de RECUPERACIÓN:**
```
✅ ALERTA DE MONITOREO

Sensor: (012) vlan500-iBGP
Ubicación: LARANET LA MATANZA

SENSOR: (012) vlan500-iBGP
CONDICIÓN: Cambio de estado
ESTADO: Falla ❌ → Disponible ✅
DURACIÓN ANTERIOR: 15 min
TIMESTAMP: 11/11/2025, 14:45:20

Sistema de Monitoreo ITTEL
```

### **Scripts de Prueba**

#### **Probar conexión:**
```bash
node scripts/test-telegram.js
# Envía mensaje de prueba + alerta simulada
```

#### **Agregar Telegram a una regla:**
```bash
node scripts/add-telegram-to-test-rule.js
# Agrega canal "telegram" a sensor 4642
```

#### **Agregar Telegram a todas las reglas:**
```bash
node scripts/add-telegram-to-all-rules.js
# Actualiza las 13 reglas DOWN activas
```

#### **Enviar alerta de prueba realista:**
```bash
node scripts/send-test-telegram-alert.js
# Simula alerta de caída + recuperación
```

### **Configuración en Base de Datos**

```sql
-- Ver reglas con Telegram configurado
SELECT id, name, sensor_id, channels 
FROM alert_rules 
WHERE 'telegram' = ANY(channels);

-- Resultado: 13 reglas (5 USITTEL + 8 LARANET)
-- Todas con channels = ["email", "telegram"]
```

### **Ventajas de Telegram**

✅ **Instantáneo**: Notificaciones push en tiempo real  
✅ **Silencioso**: Sin notificaciones molestas (se puede silenciar el chat)  
✅ **Historial**: Todas las alertas quedan registradas en el chat  
✅ **Multiplataforma**: iOS, Android, Desktop, Web  
✅ **Sin límites**: API gratuita sin restricciones  
✅ **Markdown**: Formato rico con negritas, emojis, etc.

---

## 📝 REGLAS DE NEGOCIO

### **Cooldown:**
- Todas las reglas: **5 minutos** (300 segundos)
- Evita spam de alertas del mismo sensor/regla

### **Detección de cambios de estado:**
- Solo alerta si el estado cambió
- Persiste en BD para sobrevivir reinicios
- Limpia estado al recuperarse (para poder alertar nueva caída)

### **Prioridad de alertas:**
1. 🔴 **DOWN** (caída completa) - Prioridad ALTA - Siempre tiene prioridad sobre otras alertas
2. 📊 **Umbral de tráfico máximo** - Prioridad MEDIA (3 sensores activos)
3. ⚠️ **Umbral de tráfico mínimo** - Prioridad MEDIA (1 sensor activo: CABASE < 200 Mbit/s)
4. ❌ **Recuperación** (DOWN → UP) - DESACTIVADO
5. ❌ **Warning** - DESACTIVADO
6. ❌ **Cambios drásticos** (traffic_spike/drop) - PAUSADO

### **Estados de sensores (PRTG):**
- `status_raw = 3` → UP (verde) ✅
- `status_raw = 4` → WARNING (amarillo) ⚠️
- `status_raw = 5` → DOWN (rojo) 🔴

---

## 🔐 SEGURIDAD

### **Credenciales sensibles:**
- ❌ NUNCA commitear `.env.local`
- ❌ NUNCA exponer passhashes en código
- ✅ Usar variables de entorno en Vercel
- ✅ Usar GitHub Secrets para Actions

### **CORS y Headers:**
```typescript
// next.config.ts
headers: [
  {
    source: '/api/(.*)',
    headers: [
      { key: 'Cache-Control', value: 's-maxage=30, stale-while-revalidate' }
    ]
  }
]
```

---

## 📚 DOCUMENTACIÓN ADICIONAL

Todos los documentos en `docs/`:
- `ALERTAS_README.md` - Sistema de alertas detallado
- `DEPLOY_GUIDE.md` - Guía de deployment
- `FIX_VERCEL_DEPLOY_ERROR.md` - Solución Root Directory
- `CONFIGURAR_EMAIL.md` - Setup de NodeMailer
- `GITHUB_ACTIONS_SETUP.md` - Configuración de cron
- `sensores_ids.md` - IDs de sensores
- `datos_tandil.md` - Info de Tandil
- `sensores_laranet.md` - Info de LARANET

---

## 🎓 CONCEPTOS CLAVE PARA IAs

### **¿Por qué dual-location?**
El sistema monitorea DOS ubicaciones físicas diferentes (Tandil y La Matanza), cada una con su propio servidor PRTG y sensores independientes.

### **¿Por qué GitHub Actions?**
Para que el monitoreo funcione 24/7 sin depender de que alguien tenga el dashboard abierto. Cron ejecuta cada 5 minutos.

### **¿Por qué Supabase?**
PostgreSQL en la nube para persistir datos entre deploys de Vercel (que son stateless).

### **¿Por qué Next.js App Router?**
- Server Components para reducir bundle
- API Routes serverless
- SSR para performance
- TypeScript para type-safety

### **¿Por qué cooldown de 5 minutos?**
Evita spam si un enlace fluctúa rápidamente entre estados.

### **¿Por qué verificar BD además de memoria?**
Porque Vercel es serverless - cada request puede ejecutarse en una instancia diferente. La memoria se pierde, pero la BD persiste.

---

## 🚀 DEPLOYMENT CHECKLIST

Antes de hacer deploy, verificar:

- [ ] Variables de entorno configuradas en Vercel
- [ ] Root Directory = `dashboard-usittel`
- [ ] `.env.local` tiene todas las credenciales
- [ ] GitHub Actions tiene los Secrets configurados
- [ ] Supabase está accesible y con las tablas creadas
- [ ] SMTP_PASS es una App Password válida
- [ ] Hacer commit y push antes del deploy
- [ ] Deploy desde la raíz: `cd Monitoreo_redes && vercel --prod`
- [ ] Verificar que no hay errores en los logs de Vercel
- [ ] Testear endpoint: `/api/status?location=tandil`
- [ ] Verificar que GitHub Actions corre correctamente

---

## 🆘 CONTACTO Y SOPORTE

**Mantenedor:** Agustín Scutari
**Email:** agustin.scutari@it-tel.com.ar
**Repositorio:** https://github.com/agustinSC2034/Monitoreo_redes

---

## 🔒 SISTEMA DE SESIONES (MUY IMPORTANTE)

### **¿Qué es?**
Mecanismo que garantiza que las alertas **SOLO se disparen desde GitHub Actions** y NO cuando se recarga el dashboard.

### **¿Cómo funciona?**
```typescript
// Al iniciar monitoreo desde GitHub Actions
const sessionId = startMonitoringSession(`cron_${location}_${Date.now()}`);

// Antes de disparar cualquier alerta
if (!currentSessionId) {
  return; // ⛔ No alertar - dashboard abierto por usuario
}

// Evitar duplicados en misma ejecución
if (hasAlertedInSession(ruleId, sensorId)) {
  return; // ⛔ Ya alertó en esta sesión
}

markAlertedInSession(ruleId, sensorId);
```

### **¿Por qué es importante?**
- ✅ Evita spam de alertas cada vez que recargas el dashboard
- ✅ Las alertas solo se envían cada 5 minutos (desde GitHub Actions)
- ✅ No duplica alertas en la misma ejecución del cron
- ✅ Permite usar el dashboard sin generar notificaciones

### **Resultado:**
- 🌐 **Dashboard**: Solo consulta y muestra datos (sin alertas)
- 🤖 **GitHub Actions**: Monitorea y dispara alertas cada 5 minutos

---

## 📊 RESUMEN DE REGLAS ACTIVAS

### **Total: 18 reglas activas**

#### **Alertas de Caída (DOWN):**
- 6 reglas de USITTEL (Tandil): sensores 13682, 13684, 13683, 2137, 13673, 13726
- 8 reglas de LARANET (La Matanza): sensores 5187, 4736, 4737, 5159, 3942, 6689, 4665, 4642
- **Total: 14 reglas DOWN**

#### **Alertas de Umbral Máximo (SLOW):**
- CABASE (13682): > 8500 Mbit/s
- IPLANxARSAT (13684): > umbral configurado
- TECO (13683): > umbral configurado
- **Total: 3 reglas UMBRAL MÁXIMO**

#### **Alertas de Umbral Mínimo (TRAFFIC_LOW):** ⭐ NUEVO
- CABASE (13682): < 200 Mbit/s
- 🔴 **Nota**: No se dispara si el sensor está DOWN (prioridad a alerta de caída)
- **Total: 1 regla UMBRAL MÍNIMO**

#### **Canales de Notificación:**
- 📧 Email: Todas las 18 reglas
- 📱 Telegram: Todas las 18 reglas

---

**Última actualización:** 24 de noviembre de 2025  
**Versión del proyecto:** 2.2.0  
**Nuevas funcionalidades:** Sistema de sesiones + 18 reglas activas (14 DOWN + 3 UMBRAL MÁX + 1 UMBRAL MÍN)
