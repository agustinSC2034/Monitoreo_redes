# ⚡ Quick Start - Deploy a Producción

**Estado Actual:** ✅ Todo listo para deploy  
**Siguiente Paso:** Crear proyecto en Supabase

---

## 🎯 LO QUE YA ESTÁ HECHO

✅ **Código migrado a Supabase**
- ✅ Nuevo archivo `db-supabase.ts` creado
- ✅ Mismo API, solo cambió el backend de SQLite → PostgreSQL
- ✅ Paquete `@supabase/supabase-js` instalado

✅ **Configuración para Vercel**
- ✅ `vercel.json` configurado
- ✅ Cron job cada 2 minutos para `/api/status`
- ✅ `.gitignore` actualizado
- ✅ `.env.local` con estructura para Supabase

✅ **Migraciones SQL**
- ✅ `supabase/migrations/001_initial_schema.sql` listo
- ✅ Todas las 5 tablas definidas
- ✅ Índices optimizados

---

## 🚀 PASOS PARA DEPLOY (15 minutos)

### 1️⃣ Crear Proyecto en Supabase (5 min)

1. Ir a: https://supabase.com/dashboard
2. Click en "New Project"
3. Configurar:
   - **Name:** `usittel-monitoring`
   - **Database Password:** *(genera una segura)*
   - **Region:** `South America (São Paulo)`
   - **Plan:** Free
4. Click "Create new project"
5. **Esperar 2-3 minutos**

### 2️⃣ Ejecutar Migraciones (2 min)

1. En Supabase Dashboard → **SQL Editor**
2. Abrir archivo local: `supabase/migrations/001_initial_schema.sql`
3. Copiar TODO el contenido
4. Pegar en SQL Editor
5. Click "Run" (botón verde abajo)
6. Verificar: `Success. No rows returned`

### 3️⃣ Obtener Credenciales (1 min)

1. Supabase → **Settings** → **API**
2. Copiar:
   - **Project URL** (ej: `https://abc123.supabase.co`)
   - **anon public** key (largo, empieza con `eyJ...`)

3. Actualizar `.env.local`:
   ```bash
   SUPABASE_URL=https://abc123.supabase.co
   SUPABASE_ANON_KEY=eyJh...tu-clave-completa
   ```

### 4️⃣ Activar db-supabase.ts (1 min)

**Opción A: Renombrar archivos (Recomendado)**
```powershell
cd src/lib
mv db.ts db-sqlite-backup.ts
mv db-supabase.ts db.ts
```

**Opción B: Editar manualmente**
- Renombrar `db.ts` → `db-sqlite-backup.ts`
- Renombrar `db-supabase.ts` → `db.ts`

### 5️⃣ Probar Localmente (2 min)

```powershell
npm run dev
```

Abrir en navegador:
- http://localhost:3000 (dashboard)
- http://localhost:3000/api/status (API)
- http://localhost:3000/api/alerts/init (crear reglas)

Verificar en Supabase → Table Editor:
- ✅ Tabla `sensor_history` con datos
- ✅ Tabla `alert_rules` con reglas

### 6️⃣ Deploy en Vercel (5 min)

**Desde el sitio web:**

1. Ir a: https://vercel.com/
2. Login con GitHub
3. "Add New..." → "Project"
4. Import `agustinSC2034/Monitoreo_redes`
5. Configurar:
   - **Root Directory:** `dashboard-usittel`
   - **Framework:** Next.js (detecta auto)
6. **Environment Variables:** Copiar TODAS desde `.env.local`
7. Click "Deploy"
8. **Esperar 2-3 minutos**
9. ✅ Listo! URL: `https://tu-proyecto.vercel.app`

---

## 🔧 Variables de Entorno para Vercel

```bash
# COPIAR TODAS ESTAS (reemplazar valores reales):

PRTG_BASE_URL=http://38.253.65.250:8080
PRTG_USERNAME=nocittel
PRTG_PASSWORD=1ttel20203T#
PRTG_PASSHASH=413758319

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=agustin.scutari@it-tel.com.ar
SMTP_PASS=tu_gmail_app_password
SMTP_FROM=agustin.scutari@it-tel.com.ar

TWILIO_ACCOUNT_SID=AC66bab7dc90b94dc0a7d19ae6e94a5f09
TWILIO_AUTH_TOKEN=tu_twilio_auth_token
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886

SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=eyJ...

NEXT_PUBLIC_APP_NAME=ITTEL Monitoreo de Red
NODE_ENV=production
DEFAULT_EMAIL_RECIPIENTS=agustin.scutari@it-tel.com.ar
DEFAULT_WHATSAPP_RECIPIENTS=whatsapp:+5492901578605
```

---

## ✅ Checklist de Deploy

- [ ] Proyecto Supabase creado
- [ ] SQL migrations ejecutadas
- [ ] Credenciales Supabase agregadas a `.env.local`
- [ ] `db-supabase.ts` renombrado a `db.ts`
- [ ] Probado localmente (`npm run dev`)
- [ ] Commit y push a GitHub
- [ ] Proyecto importado en Vercel
- [ ] Variables de entorno configuradas en Vercel
- [ ] Deploy exitoso
- [ ] Dashboard funciona en producción
- [ ] Alertas funcionando

---

## 🐛 Troubleshooting

### Error: "Module not found: @supabase/supabase-js"
```powershell
npm install @supabase/supabase-js
```

### Error: "SUPABASE_URL is not defined"
- Verificar `.env.local`
- En Vercel: Settings → Environment Variables

### Error: "relation 'sensor_history' does not exist"
- Ejecutar nuevamente el SQL en Supabase SQL Editor

### Dashboard carga pero sin datos
- Verificar que PRTG_BASE_URL esté accesible
- Ver logs en Vercel: Deployments → View Function Logs

---

## 📚 Documentación Completa

Ver: `DEPLOY_GUIDE.md` para guía paso a paso detallada

---

**Última actualización:** 5 de noviembre de 2025  
**Estado:** 🟢 Listo para producción

