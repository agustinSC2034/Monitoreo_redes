# 🚀 Guía de Deploy: Supabase + Vercel

**Fecha:** 5 de noviembre de 2025  
**Proyecto:** Dashboard USITTEL - Monitoreo de Red

---

## 📋 PASO 1: Configurar Supabase

### 1.1. Crear Proyecto en Supabase

1. **Ir a:** https://supabase.com/
2. **Iniciar sesión** con GitHub
3. **Crear nuevo proyecto:**
   - Name: `usittel-monitoring`
   - Database Password: **(genera una segura y guárdala)**
   - Region: `South America (São Paulo)` (más cercano a Argentina)
   - Pricing Plan: **Free** (500 MB storage, 50,000 monthly active users)

4. **Esperar 2-3 minutos** mientras Supabase crea la base de datos

### 1.2. Ejecutar Migraciones SQL

1. En el dashboard de Supabase, ir a: **SQL Editor**
2. Abrir el archivo: `dashboard-usittel/supabase/migrations/001_initial_schema.sql`
3. **Copiar todo el contenido** del archivo
4. **Pegar en SQL Editor** de Supabase
5. **Click en "Run"** (botón abajo a la derecha)
6. Deberías ver: `Success. No rows returned`

### 1.3. Obtener Credenciales

1. En Supabase, ir a: **Settings** → **API**
2. Copiar:
   - **Project URL** (ej: `https://abcdefghijk.supabase.co`)
   - **anon public key** (empieza con `eyJ...`)

3. Agregar al archivo `.env.local`:
   ```bash
   SUPABASE_URL=https://tu-proyecto.supabase.co
   SUPABASE_ANON_KEY=eyJ...tu-clave-aqui
   ```

---

## 📦 PASO 2: Instalar Dependencias

Ejecutar en PowerShell dentro del proyecto:

```powershell
cd dashboard-usittel
npm install @supabase/supabase-js
```

---

## 🔄 PASO 3: Reemplazar SQLite por Supabase

### 3.1. Hacer backup del db.ts actual

```powershell
# Dentro de dashboard-usittel/src/lib/
mv db.ts db-sqlite.ts.bak
```

### 3.2. Renombrar el nuevo archivo

```powershell
mv db-supabase.ts db.ts
```

### 3.3. Verificar importaciones

Todos los archivos que usan `db.ts` seguirán funcionando porque mantuvimos la misma interfaz:
- ✅ `src/lib/alertMonitor.ts`
- ✅ `src/app/api/status/route.ts`
- ✅ `src/app/api/alerts/rules/route.ts`
- ✅ `src/app/api/sensors/stats/route.ts`
- ✅ Etc.

---

## 🧪 PASO 4: Probar Localmente

### 4.1. Iniciar servidor de desarrollo

```powershell
npm run dev
```

### 4.2. Probar APIs

**Abrir en el navegador:**

1. **Estado de sensores:**
   ```
   http://localhost:3000/api/status
   ```

2. **Inicializar reglas:**
   ```
   http://localhost:3000/api/alerts/init
   ```

3. **Ver reglas creadas:**
   ```
   http://localhost:3000/api/alerts/rules
   ```

### 4.3. Verificar en Supabase

1. En Supabase, ir a: **Table Editor**
2. Deberías ver las tablas:
   - `sensor_history` (con datos de sensores)
   - `alert_rules` (con las 6 reglas iniciales)
   - `alert_history`
   - `status_changes`
   - `system_logs`

---

## 🚀 PASO 5: Deploy en Vercel

### 5.1. Preparar Git

```powershell
# En la raíz del proyecto Monitoreo_redes
git add .
git commit -m "Migración a Supabase + preparado para Vercel"
git push origin main
```

### 5.2. Conectar con Vercel

**Opción A: Desde el sitio web (Recomendado)**

1. **Ir a:** https://vercel.com/
2. **Login** con tu cuenta de GitHub
3. **Click en:** "Add New..." → "Project"
4. **Import** el repositorio `agustinSC2034/Monitoreo_redes`
5. **Configure Project:**
   - Framework Preset: `Next.js` (detectado automáticamente)
   - Root Directory: `dashboard-usittel`
   - Build Command: `npm run build`
   - Output Directory: `.next`

6. **Environment Variables** - Agregar TODAS estas:

```bash
# PRTG - Tandil
PRTG_BASE_URL=http://38.253.65.250:8080
PRTG_USERNAME=nocittel
PRTG_PASSWORD=1ttel20203T#
PRTG_PASSHASH=413758319

# PRTG - Matanza (opcional por ahora)
PRTG_LARANET_BASE_URL=http://stats.reditel.com.ar:8995
PRTG_LARANET_USERNAME=nocittel
PRTG_LARANET_PASSWORD=
PRTG_LARANET_PASSHASH=

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=agustin.scutari@it-tel.com.ar
SMTP_PASS=tu_app_password_gmail
SMTP_FROM=agustin.scutari@it-tel.com.ar

# WhatsApp
TWILIO_ACCOUNT_SID=AC66bab7dc90b94dc0a7d19ae6e94a5f09
TWILIO_AUTH_TOKEN=tu_auth_token_twilio
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886

# Supabase
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=eyJ...

# General
NEXT_PUBLIC_APP_NAME=ITTEL Monitoreo de Red
NODE_ENV=production
DEFAULT_EMAIL_RECIPIENTS=agustin.scutari@it-tel.com.ar
DEFAULT_WHATSAPP_RECIPIENTS=whatsapp:+5492901578605
```

7. **Click en "Deploy"**

8. **Esperar 2-3 minutos** mientras Vercel hace el build

9. **Ver el resultado:**
   - Vercel te dará una URL como: `https://monitoreo-redes-xxx.vercel.app`

**Opción B: Desde CLI**

```powershell
# Instalar Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
cd dashboard-usittel
vercel

# Seguir las instrucciones en pantalla
# Responder:
# - Set up and deploy? Yes
# - Which scope? Tu cuenta personal
# - Link to existing project? No
# - Project name? dashboard-usittel
# - Root directory? ./
# - Override settings? No
```

---

## ✅ PASO 6: Verificar que Todo Funciona

### 6.1. Probar el Dashboard

Abrir la URL de Vercel en el navegador:
```
https://tu-proyecto.vercel.app
```

Deberías ver:
- ✅ Dashboard cargando
- ✅ Sensores mostrando datos
- ✅ Mapa interactivo
- ✅ Gráficos históricos

### 6.2. Probar las APIs

```bash
# Estado
https://tu-proyecto.vercel.app/api/status

# Reglas de alertas
https://tu-proyecto.vercel.app/api/alerts/rules

# Historial
https://tu-proyecto.vercel.app/api/alerts/history
```

### 6.3. Verificar Alertas

1. Esperar a que un sensor cambie de estado
2. O forzar una alerta de prueba:
   ```
   https://tu-proyecto.vercel.app/api/alerts/test-email
   ```

3. Revisar email y WhatsApp

---

## 🔧 PASO 7: Configurar Dominio Personalizado (Opcional)

1. En Vercel Dashboard, ir a: **Settings** → **Domains**
2. Agregar tu dominio: `dashboard.usittel.com.ar`
3. Configurar DNS según instrucciones:
   - Tipo: `CNAME`
   - Name: `dashboard`
   - Value: `cname.vercel-dns.com`

---

## 📊 PASO 8: Monitorear Logs

### En Vercel:
1. Ir a: **Deployments** → (último deployment)
2. Click en "View Function Logs"
3. Ver logs en tiempo real

### En Supabase:
1. Ir a: **Logs**
2. Ver queries ejecutadas
3. Monitorear performance

---

## 🐛 Solución de Problemas

### Error: "SUPABASE_URL no definida"
**Solución:** Verificar que las variables de entorno estén configuradas en Vercel

### Error: "relation does not exist"
**Solución:** Ejecutar nuevamente el script SQL en Supabase

### Error: "Invalid API key"
**Solución:** Verificar que la SUPABASE_ANON_KEY sea correcta (no la service_role key)

### El dashboard carga pero no muestra datos
**Solución:** 
1. Verificar que PRTG_BASE_URL esté accesible desde Vercel
2. Si PRTG está en red privada, considerar usar VPN o proxy

### Alertas no se envían
**Solución:**
1. Verificar credenciales de SMTP y Twilio
2. Ver logs en Vercel para detalles del error

---

## 📈 Próximos Pasos

### 1. Configurar Alertas Automáticas
- Ir a Vercel → **Settings** → **Cron Jobs**
- Agregar job cada 2 minutos para consultar sensores
- URL: `/api/status`

### 2. Optimizar Performance
- Habilitar caché de Next.js
- Configurar ISR (Incremental Static Regeneration)

### 3. Seguridad
- Considerar autenticación con NextAuth.js
- Habilitar RLS (Row Level Security) en Supabase

---

## 📞 Recursos

- **Supabase Docs:** https://supabase.com/docs
- **Vercel Docs:** https://vercel.com/docs
- **Next.js Docs:** https://nextjs.org/docs
- **Soporte ITTEL:** agustin.scutari@it-tel.com.ar

---

**Creado:** 5 de noviembre de 2025  
**Estado:** 🚀 Listo para deploy

