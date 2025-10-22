# Plan de Implementación - Sistema de Monitoreo GRUPO ITTEL

## Contexto
Monitorear la red de Tandil (USITTEL) con PRTG y crear sistema de alertas automáticas para detectar:
- Caídas bruscas de tráfico
- Enlaces saturados (al tope)
- Fluctuaciones anómalas
- Problemas en enlaces: IPLAN, ARSAT, TECO, CABASE

**PRTG Tandil:** http://38.253.65.250:8080/
**Credenciales disponibles en:** datos_tandil.md

---

## ARQUITECTURA PROPUESTA

### OPCIÓN A: Solo Alertas (Rápido - 1-2 semanas)
```
PRTG API → Script Python → Detector de Anomalías → Email/WhatsApp
```

**Ventajas:**
- Implementación rápida
- Bajo mantenimiento
- No requiere servidor web

**Desventajas:**
- Usa la UI de PRTG (limitada)
- Sin visualización personalizada

---

### OPCIÓN B: Dashboard Personalizado + Alertas (Completo - 3-4 semanas)
```
PRTG API → Backend Python/Node → Base de Datos → Frontend Web → Alertas
                                                      ↓
                                              Gráficos Modernos
```

**Ventajas:**
- ✅ Visualización espectacular y moderna
- ✅ Personalización total de gráficos
- ✅ Dashboard unificado para todas las locaciones
- ✅ Histórico propio de datos
- ✅ Acceso desde cualquier dispositivo
- ✅ Alertas integradas en la misma plataforma

**Desventajas:**
- Requiere más tiempo de desarrollo
- Necesita hosting (puede ser en servidor propio)

---

## ✅ SELECCIONADA: **OPCIÓN B (Dashboard Personalizado)**

### Stack Tecnológico Propuesto - OPCIÓN VERCEL (Gratis)

#### Frontend + Backend (Todo en Next.js en Vercel)
- **Next.js 14+** (React framework)
- **Componentes:**
  - Pages (rutas del dashboard)
  - API Routes (backend serverless, reemplaza FastAPI/Express)
  - Componentes React para UI
  
**Librerías:**
  - `recharts` o `chart.js` - Gráficos interactivos
  - `axios` o `fetch` - Consultas HTTP
  - `swr` o `react-query` - Cache y actualización de datos
  - `tailwindcss` - Estilos modernos

#### API Routes (Backend Serverless en Vercel)
```javascript
// pages/api/prtg/sensors.js - Obtener sensores
// pages/api/prtg/historical.js - Datos históricos
// pages/api/prtg/status.js - Estado en tiempo real
```

#### Base de Datos (Opcional - Si necesitás histórico propio)
- **Vercel Postgres** (gratis, integrado) o
- **Sin base de datos** (usar solo datos de PRTG API)

#### Notificaciones (Fase 2)
- **Email:** Resend API (gratis hasta 3000 emails/mes) o SMTP
- **WhatsApp:** Twilio API (de pago)

#### Hosting y Deploy
- **Vercel** (gratis)
  - Frontend: Static + SSR
  - Backend: Serverless Functions
  - CDN: Global (automático)
  - SSL: Automático
  - Deploy: Git push → auto deploy

---

### Stack Tecnológico Alternativo - OPCIÓN DOCKER

#### Backend (Recolección de Datos)
- **Python 3.11+** con FastAPI
- **Librerías:**
  - `requests` - Para consultar API de PRTG
  - `pandas` - Análisis de datos
  - `numpy` - Cálculos estadísticos
  - `apscheduler` - Tareas programadas

#### Base de Datos
- **PostgreSQL** o **InfluxDB** (mejor para time-series)
- Almacenar histórico de métricas para análisis

#### Frontend (Dashboard)
- **React + Next.js** o **Vue.js**
- **Librerías de gráficos:**
  - Chart.js / Recharts (gráficos simples)
  - Apache ECharts (gráficos avanzados)
  - D3.js (visualizaciones custom)

#### Notificaciones
- **Email:** SMTP o SendGrid/Mailgun
- **WhatsApp:** Twilio API o WhatsApp Business API
- **Push Notifications:** Firebase (opcional)

#### Hosting
- **Servidor propio** (Linux con Docker)

---

## ARQUITECTURA DETALLADA

```
┌─────────────────────────────────────────────────────────┐
│                    PRTG TANDIL                          │
│              http://38.253.65.250:8080                  │
│                                                          │
│  Sensores:                                              │
│  - CABASE (0=3)                                         │
│  - IPLAN (0=65)                                         │
│  - ARSAT (0=4)                                          │
│  - TECO (0=6)                                           │
└────────────────┬────────────────────────────────────────┘
                 │
                 │ HTTP API Requests (cada 2-5 min)
                 ▼
┌─────────────────────────────────────────────────────────┐
│              BACKEND COLLECTOR (Python)                 │
│                                                          │
│  • Consulta /api/table.xml?content=sensors              │
│  • Obtiene valores de tráfico, estado, latencia         │
│  • Detecta anomalías con algoritmos:                    │
│    - Desviación estándar (fluctuaciones)                │
│    - Umbrales configurables (saturación)                │
│    - Cambios bruscos (caídas)                           │
│  • Guarda datos históricos en DB                        │
│                                                          │
└────────┬────────────────────────────┬───────────────────┘
         │                            │
         │ Guarda métricas            │ Si detecta anomalía
         ▼                            ▼
┌──────────────────┐        ┌─────────────────────────────┐
│   BASE DE DATOS  │        │   SISTEMA DE ALERTAS        │
│                  │        │                             │
│  InfluxDB/       │        │  • Email via SMTP           │
│  PostgreSQL      │        │  • WhatsApp via Twilio      │
│                  │        │  • Webhook a Slack/Discord  │
│  • Histórico     │        │                             │
│  • Métricas      │        │  Templates:                 │
│  • Eventos       │        │  "⚠️ ALERTA: Enlace IPLAN   │
│                  │        │   saturado al 95%"          │
└────────┬─────────┘        └─────────────────────────────┘
         │
         │ API REST
         ▼
┌─────────────────────────────────────────────────────────┐
│           FRONTEND - DASHBOARD WEB                      │
│                                                          │
│  URL: dashboard.usittel.com.ar (o IP interna)          │
│                                                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │  🔴 ESTADO GENERAL DE LA RED                    │   │
│  │  ✅ IPLAN: Normal (450 Mbps / 500 Mbps)         │   │
│  │  ⚠️  ARSAT: Advertencia (485 Mbps / 500 Mbps)   │   │
│  │  ✅ TECO: Normal                                 │   │
│  │  ✅ CABASE: Normal                               │   │
│  └─────────────────────────────────────────────────┘   │
│                                                          │
│  ┌──────────────────┐  ┌──────────────────┐           │
│  │  📊 Gráfico       │  │  📈 Histórico    │           │
│  │  Tiempo Real     │  │  Últimas 24hs    │           │
│  │  (actualiza c/   │  │                  │           │
│  │   30 segundos)   │  │                  │           │
│  └──────────────────┘  └──────────────────┘           │
│                                                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │  🔔 ALERTAS RECIENTES                           │   │
│  │  • 14:35 - Enlace ARSAT fluctuando              │   │
│  │  • 12:20 - IPLAN saturado (resuelto)            │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

## FASE 1: MVP - Sistema de Alertas Básico (Semana 1-2)

### Objetivos:
✅ Monitoreo automático funcionando
✅ Alertas por email operativas
✅ Detección básica de anomalías

### Componentes:

#### 1. Script Recolector (`monitor.py`)
```python
# Responsabilidades:
# - Conectar a API de PRTG cada 5 minutos
# - Obtener estado de sensores críticos
# - Detectar anomalías
# - Guardar log de eventos
# - Disparar alertas
```

#### 2. Detector de Anomalías (`anomaly_detector.py`)
```python
# Algoritmos:
# - Umbral fijo: > 90% = Saturación
# - Cambio brusco: -30% en 5 min = Caída
# - Desviación estándar: 3σ = Fluctuación anómala
```

#### 3. Sistema de Notificaciones (`notifier.py`)
```python
# Canales:
# - Email (prioritario)
# - WhatsApp (opcional, requiere Twilio)
# - Log a archivo
```

### Estructura de archivos:
```
monitoreo_redes/
├── config/
│   └── config.yaml          # Configuración (umbrales, emails)
├── src/
│   ├── monitor.py           # Script principal
│   ├── prtg_client.py       # Cliente API PRTG
│   ├── anomaly_detector.py  # Detección de anomalías
│   ├── notifier.py          # Sistema de alertas
│   └── utils.py             # Utilidades
├── logs/
│   └── monitoring.log       # Logs del sistema
├── requirements.txt         # Dependencias Python
└── README.md
```

---

## FASE 2: Dashboard Web Personalizado (Semana 3-4)

### Objetivos:
✅ Interfaz web moderna y responsive
✅ Gráficos en tiempo real
✅ Visualización del estado de todos los enlaces
✅ Histórico de métricas

### Componentes:

#### Backend API (`/api`)
- **Endpoints:**
  - `GET /api/sensors/current` - Estado actual
  - `GET /api/sensors/{id}/history` - Histórico
  - `GET /api/alerts/recent` - Últimas alertas
  - `GET /api/network/topology` - Topología de red
  - `WS /api/realtime` - WebSocket para tiempo real

#### Frontend Dashboard
```
dashboard/
├── pages/
│   ├── index.tsx            # Vista principal
│   ├── history.tsx          # Histórico
│   └── alerts.tsx           # Gestión de alertas
├── components/
│   ├── SensorCard.tsx       # Tarjeta por sensor
│   ├── LiveGraph.tsx        # Gráfico en tiempo real
│   ├── NetworkTopology.tsx  # Diagrama de red
│   └── AlertPanel.tsx       # Panel de alertas
└── api/
    └── prtg.ts              # Cliente API
```

### Características del Dashboard:

1. **Vista Principal**
   - Estado de cada enlace (IPLAN, ARSAT, TECO, CABASE)
   - Gráficos de tráfico en tiempo real
   - Indicadores de salud (verde/amarillo/rojo)

2. **Gráficos**
   - Línea temporal (últimas 24hs, 7 días, 30 días)
   - Comparativa entre enlaces
   - Heatmap de horarios pico

3. **Alertas**
   - Historial de alertas
   - Configuración de umbrales
   - Silenciar alertas temporalmente

4. **Diseño Visual**
   - Dark mode / Light mode
   - Responsive (móvil, tablet, desktop)
   - Animaciones suaves
   - Colores corporativos de USITTEL

---

## DETECCIÓN DE ANOMALÍAS - Algoritmos

### 1. Saturación (Enlace al Tope)
```python
if current_value > threshold * 0.90:
    alert("Enlace saturado", severity="warning")
if current_value > threshold * 0.95:
    alert("Enlace crítico", severity="critical")
```

### 2. Caída Brusca
```python
if (previous_value - current_value) / previous_value > 0.30:
    alert("Caída del 30%+ detectada", severity="critical")
```

### 3. Fluctuaciones Anómalas
```python
mean = statistics.mean(last_20_values)
std_dev = statistics.stdev(last_20_values)
if abs(current_value - mean) > 3 * std_dev:
    alert("Fluctuación anómala", severity="warning")
```

### 4. Pérdida de Conexión
```python
if sensor_status == "Down":
    alert("Sensor caído", severity="critical")
```

---

## SISTEMA DE NOTIFICACIONES

### Email (Prioritario)
```python
# SMTP o servicio (SendGrid/Mailgun)
Para: equipo-noc@usittel.com.ar
Asunto: ⚠️ ALERTA: Enlace IPLAN saturado
Cuerpo:
  Fecha: 22/10/2025 14:35:20
  Sensor: WAH-IPLAN (ID: 65)
  Valor actual: 485 Mbps / 500 Mbps (97%)
  Estado: WARNING
  Acción recomendada: Revisar tráfico
```

### WhatsApp (Opcional)
```python
# Via Twilio API
Mensaje:
🚨 ALERTA USITTEL
Enlace: IPLAN
Estado: Saturado (97%)
Hora: 14:35
Ver más: dashboard.usittel.com.ar
```

### Configuración de Alertas
```yaml
# config/alerts.yaml
thresholds:
  bandwidth_warning: 0.90  # 90%
  bandwidth_critical: 0.95 # 95%
  drop_percentage: 0.30    # 30%
  
contacts:
  email:
    - noc@usittel.com.ar
    - soporte@usittel.com.ar
  whatsapp:
    - +54911XXXXXXXX
    
quiet_hours:
  enabled: false
  start: "22:00"
  end: "08:00"
```

---

## CRONOGRAMA

### Semana 1-2: MVP Alertas
- [ ] Día 1-2: Setup proyecto, cliente API PRTG
- [ ] Día 3-4: Detector de anomalías básico
- [ ] Día 5-6: Sistema de notificaciones (email)
- [ ] Día 7: Testing y ajustes
- [ ] Día 8-10: Despliegue y monitoreo inicial

### Semana 3-4: Dashboard Web
- [ ] Día 1-3: Backend API (FastAPI + DB)
- [ ] Día 4-7: Frontend base (Next.js + componentes)
- [ ] Día 8-10: Integración gráficos y tiempo real
- [ ] Día 11-12: Testing y refinamiento
- [ ] Día 13-14: Despliegue y documentación

---

## HOSTING Y DEPLOYMENT

### Opción 1: Servidor Propio (Recomendado)
```
Servidor Linux (Ubuntu 22.04)
├── Docker Compose
│   ├── Backend (Python FastAPI)
│   ├── Base de Datos (InfluxDB)
│   ├── Frontend (Next.js)
│   └── Nginx (Reverse Proxy)
```

**Ventajas:**
- Control total
- Sin costos de cloud
- Datos en infraestructura propia

### Opción 2: Cloud Híbrido
- Frontend: Vercel (gratis, CDN global)
- Backend: Railway o Render ($5-20/mes)
- DB: InfluxDB Cloud (free tier hasta 30 días)

---

## 🎯 DECISIÓN TOMADA: OPCIÓN B - Dashboard Completo

**Fecha de decisión:** 22/10/2025

### Plan de Ejecución Confirmado:

1. ✅ **FASE 1 (Prioridad):** Dashboard Web con gráficos estilizados
   - Consumir datos de API de PRTG
   - Renderizar gráficos modernos en tiempo real
   - Deploy en dominio/servidor propio
   
2. ⏳ **FASE 2 (Después):** Sistema de Alertas/Notificaciones
   - Email y/o WhatsApp
   - Detección de anomalías
   - Configuración de umbrales

### Validación Técnica de API PRTG:

**✅ CONFIRMADO:** La API de PRTG soporta TODO lo que necesitamos:

- **Datos en Tiempo Real:** `/api/table.xml?content=sensors&columns=...`
- **Datos Históricos:** `/api/historicdata.xml?id=sensorid&avg=0&sdate=...&edate=...`
- **Estado de Sensores:** `/api/getobjectstatus.htm?id=sensorid&name=columnname`
- **Valores de Canales:** `/api/table.xml?content=channels&id=sensorid`
- **Formato JSON disponible:** `.json` en lugar de `.xml`

**Endpoints que usaremos:**
```
http://38.253.65.250:8080/api/table.json?content=sensors&username=X&passhash=Y
http://38.253.65.250:8080/api/historicdata.json?id=65&avg=300&sdate=...&edate=...
```

---

## PRÓXIMOS PASOS - FASE 1

1. ✅ **API validada** - Soporta todos los datos necesarios
2. 🔨 **Setup del proyecto** - Crear estructura de archivos
3. 🔌 **Backend:** Cliente Python para PRTG API
4. 🎨 **Frontend:** Dashboard React/Next.js con gráficos
5. 🚀 **Deploy:** Configurar hosting (Vercel o servidor propio)

---

## 🏠 OPCIONES DE HOSTING - COMPARATIVA COMPLETA

### ⭐ OPCIÓN 1: Vercel (100% GRATIS) - **RECOMENDADA**

```
┌─────────────────────────────────────────────┐
│         VERCEL (TODO GRATIS)                │
│                                             │
│  Frontend (Next.js Pages/Components)       │
│  Backend (Next.js API Routes - Serverless) │
│         ↓                                   │
│    PRTG API (tu servidor)                  │
└─────────────────────────────────────────────┘
```

**Características:**
```
✅ 100% GRATIS (Free tier muy generoso)
✅ Deploy automático desde GitHub
✅ Frontend + Backend en un solo proyecto
✅ CDN global (super rápido)
✅ HTTPS automático
✅ No necesitás otro servidor
✅ Next.js API Routes actúan como backend serverless
❌ No tiene base de datos incluida (pero podés usar Vercel Postgres gratis)
❌ Límites: 100GB bandwidth/mes (suficiente para empezar)
```

**Stack Técnico:**
- **Frontend:** Next.js 14+ (React)
- **Backend:** Next.js API Routes (`/api/*` endpoints)
- **Gráficos:** Recharts / Chart.js / ECharts
- **Datos:** Consulta directa a PRTG API desde API Routes
- **Base de datos (opcional):** Vercel Postgres (gratis) o sin DB

**Flujo de Datos:**
```
Usuario → Vercel Frontend → Vercel API Route → PRTG API → Respuesta
```

**Ejemplo de API Route (`/api/sensors.js`):**
```javascript
// pages/api/sensors.js
export default async function handler(req, res) {
  const prtgResponse = await fetch(
    'http://38.253.65.250:8080/api/table.json?content=sensors&username=X&passhash=Y'
  );
  const data = await prtgResponse.json();
  res.status(200).json(data);
}
```

**Deploy:**
1. Push código a GitHub
2. Conectar repo con Vercel
3. Deploy automático en 2 minutos
4. URL: `https://tu-proyecto.vercel.app`

---

### 🐳 OPCIÓN 2: Docker en Servidor Propio (GRATIS si tenés servidor)

```
┌─────────────────────────────────────────────┐
│     TU SERVIDOR (Linux/Windows)             │
│                                             │
│  Docker Compose:                            │
│    - Frontend: Next.js (puerto 3000)       │
│    - Backend: FastAPI/Node (puerto 8000)   │
│    - Base de Datos: PostgreSQL (opcional)  │
│    - Nginx: Reverse Proxy (puerto 80/443)  │
│         ↓                                   │
│    PRTG API (mismo servidor o red local)   │
└─────────────────────────────────────────────┘
```

**Características:**
```
✅ Control total
✅ Datos en tu infraestructura
✅ Sin costos si tenés servidor
✅ Acceso a red local de PRTG más rápido
✅ Base de datos incluida (PostgreSQL/InfluxDB)
✅ Sin límites de bandwidth
❌ Requiere mantenimiento del servidor
❌ Requiere configurar dominio y SSL (Let's Encrypt)
❌ Más complejo de deployar inicialmente
```

**Stack Técnico:**
- **Frontend:** Next.js o React
- **Backend:** FastAPI (Python) o Express (Node.js)
- **Base de Datos:** PostgreSQL o InfluxDB
- **Reverse Proxy:** Nginx
- **Orquestación:** Docker Compose

**Estructura `docker-compose.yml`:**
```yaml
version: '3.8'
services:
  frontend:
    image: node:18
    ports: ["3000:3000"]
    
  backend:
    image: python:3.11
    ports: ["8000:8000"]
    
  nginx:
    image: nginx:alpine
    ports: ["80:80", "443:443"]
    
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: monitoring
```

**Deploy:**
1. Clonar repo en servidor
2. `docker-compose up -d`
3. Configurar dominio → IP del servidor
4. SSL con Let's Encrypt

---

### 💡 OPCIÓN 3: Nusthost (Si ya lo tenés pago)

**¿Sirve Nusthost para este proyecto?**

Depende del tipo de hosting que tengas:

```
✅ SI TENÉS: Hosting con Node.js o Python
   → Podés deployar backend + frontend estático
   → Necesitás verificar: ¿Soporta Node.js 18+? ¿Python 3.11+?

❌ SI TENÉS: Hosting PHP/cPanel tradicional
   → No sirve para Next.js ni FastAPI
   → Solo podrías hostear frontend estático (HTML/CSS/JS)
   → Pero necesitarías backend en otro lado (Vercel API Routes)

🤔 OPCIÓN HÍBRIDA:
   Frontend estático en Nusthost + Backend en Vercel API Routes (gratis)
```

**Pregunta clave:** ¿Qué tipo de hosting tenés en Nusthost?
- ¿Hosting compartido (cPanel)?
- ¿VPS con acceso SSH?
- ¿Soporta Node.js o Python?

---

## 📊 COMPARATIVA RÁPIDA

| Característica | Vercel (Gratis) | Docker Propio | Nusthost |
|----------------|-----------------|---------------|----------|
| **Costo** | $0/mes | $0 (si tenés server) | Ya pago |
| **Deploy** | Automático | Manual | Manual |
| **Mantenimiento** | Cero | Medio | Bajo |
| **Escalabilidad** | Alta | Media | Baja |
| **Velocidad** | CDN global | Depende ubicación | Depende plan |
| **Base de datos** | Vercel Postgres (gratis) | Incluida | Depende plan |
| **SSL/HTTPS** | Automático | Let's Encrypt | Incluido |
| **Tiempo setup** | 5 minutos | 1-2 horas | Depende |

---

## 🎯 MI RECOMENDACIÓN FINAL

### Para empezar YA (gratis y rápido): **OPCIÓN 1 - Vercel**

**Por qué:**
1. ✅ Ya tenés cuenta en Vercel
2. ✅ 100% gratis para este proyecto
3. ✅ Deploy en 5 minutos
4. ✅ No necesitás configurar servidores
5. ✅ Next.js API Routes hacen de backend (serverless)
6. ✅ Actualizaciones automáticas desde GitHub

**Después podés migrar a Docker** si necesitás:
- Más control
- Base de datos propia robusta
- Sin límites de bandwidth
- Acceso más rápido a PRTG (red local)

---

## PREGUNTAS PARA DEFINIR

1. ✅ ~~¿Prefieren empezar con MVP o ir directo al Dashboard completo?~~ → **Dashboard completo (Opción B)**
2. **¿Tienen servidor propio disponible o vamos con cloud (Vercel + Railway)?**
3. ¿Qué sensores específicos son MÁS críticos? → Confirmar IDs:
   - CABASE (id=3)
   - IPLAN (id=65)
   - ARSAT (id=4)
   - TECO (id=6)
4. **¿Quieren base de datos para histórico propio o solo mostrar datos de PRTG?**
5. ¿Emails de contacto para alertas? (para Fase 2)

---

## RECURSOS NECESARIOS

### Hardware (si servidor propio)
- Servidor/VM con mínimo:
  - 2 CPU cores
  - 4GB RAM
  - 50GB disco
  - Ubuntu 22.04 LTS

### Servicios Externos (opcionales)
- Twilio para WhatsApp: ~$1-5/mes
- Dominio para dashboard: ~$10-20/año
- Certificado SSL: Gratis (Let's Encrypt)

---

**Documento actualizado:** 22/10/2025  
**Autor:** GitHub Copilot + Aguus  
**Estado:** ✅ **OPCIÓN B SELECCIONADA - En Desarrollo**  
**Decisión:** Dashboard personalizado primero → Alertas después  
**API Validada:** ✅ Compatible con todos los requisitos