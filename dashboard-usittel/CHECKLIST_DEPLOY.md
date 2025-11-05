# ☑️ Checklist de Deploy - Dashboard USITTEL

**Última actualización:** 5 de noviembre de 2025

---

## 📋 PRE-REQUISITOS

- [ ] Node.js instalado (v18+)
- [ ] Cuenta GitHub activa
- [ ] Git configurado localmente
- [ ] Credenciales de Gmail App Password
- [ ] Credenciales de Twilio
- [ ] Cuenta Vercel (gratis)
- [ ] Cuenta Supabase (gratis)

---

## 🔧 PREPARACIÓN LOCAL

- [x] Paquete `@supabase/supabase-js` instalado
- [x] Archivo `db-supabase.ts` creado
- [x] Schema SQL preparado: `supabase/migrations/001_initial_schema.sql`
- [x] `vercel.json` configurado
- [x] `.env.local` con estructura completa
- [x] Documentación completa creada

---

## 🗄️ CONFIGURACIÓN SUPABASE

- [ ] **Paso 1:** Cuenta Supabase creada
- [ ] **Paso 2:** Proyecto "usittel-monitoring" creado
- [ ] **Paso 3:** Región seleccionada: South America
- [ ] **Paso 4:** Password de BD guardada en lugar seguro
- [ ] **Paso 5:** Proyecto inicializado (esperar 2-3 min)
- [ ] **Paso 6:** SQL Editor abierto
- [ ] **Paso 7:** Schema SQL copiado y ejecutado
- [ ] **Paso 8:** Mensaje "Success" recibido
- [ ] **Paso 9:** Tablas verificadas en Table Editor:
  - [ ] `sensor_history`
  - [ ] `alert_rules`
  - [ ] `alert_history`
  - [ ] `status_changes`
  - [ ] `system_logs`
- [ ] **Paso 10:** Project URL copiada
- [ ] **Paso 11:** anon public key copiada
- [ ] **Paso 12:** Credenciales agregadas a `.env.local`

---

## 🔄 MIGRACIÓN DE BD

- [ ] **Opción A: Script automático ejecutado**
  ```powershell
  .\migrate-to-supabase.ps1
  ```

- [ ] **Opción B: Manual**
  - [ ] `src/lib/db.ts` renombrado a `db-sqlite-backup.ts`
  - [ ] `src/lib/db-supabase.ts` renombrado a `db.ts`

- [ ] **Verificación:**
  - [ ] Archivo `src/lib/db.ts` existe
  - [ ] Primera línea contiene: `import { createClient }`

---

## 🧪 PRUEBAS LOCALES

- [ ] Servidor iniciado: `npm run dev`
- [ ] **Dashboard funciona:**
  - [ ] http://localhost:3000 carga correctamente
  - [ ] Sensores se muestran
  - [ ] Mapa interactivo funciona
  - [ ] Gráficos se renderan

- [ ] **APIs funcionan:**
  - [ ] http://localhost:3000/api/status devuelve JSON
  - [ ] http://localhost:3000/api/alerts/init crea reglas
  - [ ] http://localhost:3000/api/alerts/rules muestra reglas

- [ ] **Supabase recibe datos:**
  - [ ] Table Editor → `sensor_history` tiene registros
  - [ ] Table Editor → `alert_rules` tiene 6 reglas
  - [ ] Timestamps son recientes

- [ ] **Alertas funcionan:**
  - [ ] http://localhost:3000/api/alerts/test-email envía email
  - [ ] http://localhost:3000/api/alerts/test-whatsapp envía WhatsApp
  - [ ] Emails recibidos correctamente
  - [ ] WhatsApp recibidos correctamente

---

## 📤 GIT Y GITHUB

- [ ] Cambios staged: `git add .`
- [ ] Commit creado:
  ```powershell
  git commit -m "Ready for production: Supabase + Vercel"
  ```
- [ ] Push a GitHub:
  ```powershell
  git push origin main
  ```
- [ ] Cambios visibles en GitHub.com
- [ ] `.env.local` NO está en el repositorio (verificar)

---

## 🚀 DEPLOY EN VERCEL

### Conexión
- [ ] https://vercel.com/ abierto
- [ ] Login con GitHub completado
- [ ] Dashboard de Vercel visible

### Importación
- [ ] Click en "Add New..." → "Project"
- [ ] Repositorio `agustinSC2034/Monitoreo_redes` encontrado
- [ ] Click en "Import"

### Configuración
- [ ] **Framework Preset:** Next.js (detectado auto)
- [ ] **Root Directory:** `dashboard-usittel`
- [ ] **Build Command:** `npm run build` (default)
- [ ] **Output Directory:** `.next` (default)

### Variables de Entorno
- [ ] Click en "Environment Variables"
- [ ] **PRTG Tandil:**
  - [ ] `PRTG_BASE_URL`
  - [ ] `PRTG_USERNAME`
  - [ ] `PRTG_PASSWORD`
  - [ ] `PRTG_PASSHASH`
- [ ] **Email:**
  - [ ] `SMTP_HOST`
  - [ ] `SMTP_PORT`
  - [ ] `SMTP_SECURE`
  - [ ] `SMTP_USER`
  - [ ] `SMTP_PASS`
  - [ ] `SMTP_FROM`
- [ ] **WhatsApp:**
  - [ ] `TWILIO_ACCOUNT_SID`
  - [ ] `TWILIO_AUTH_TOKEN`
  - [ ] `TWILIO_WHATSAPP_FROM`
- [ ] **Supabase:**
  - [ ] `SUPABASE_URL`
  - [ ] `SUPABASE_ANON_KEY`
- [ ] **General:**
  - [ ] `NEXT_PUBLIC_APP_NAME`
  - [ ] `NODE_ENV=production`
  - [ ] `DEFAULT_EMAIL_RECIPIENTS`
  - [ ] `DEFAULT_WHATSAPP_RECIPIENTS`

### Build
- [ ] Click en "Deploy"
- [ ] Build iniciado (ver logs en tiempo real)
- [ ] Build completado exitosamente (✓)
- [ ] Tiempo de build: ~2-3 minutos

---

## ✅ VERIFICACIÓN POST-DEPLOY

### Dashboard en Producción
- [ ] URL de Vercel copiada (ej: `https://xxx.vercel.app`)
- [ ] Dashboard carga en producción
- [ ] Sensores muestran datos reales
- [ ] Mapa interactivo funciona
- [ ] Gráficos se renderizan correctamente
- [ ] Dark mode funciona
- [ ] Responsive design OK (probar en móvil)

### APIs en Producción
- [ ] `/api/status` devuelve datos
- [ ] `/api/alerts/rules` muestra reglas
- [ ] `/api/historical` devuelve históricos
- [ ] Tiempos de respuesta < 2 segundos

### Base de Datos
- [ ] Supabase recibe datos desde Vercel
- [ ] `sensor_history` se actualiza
- [ ] Timestamps son correctos (UTC)

### Alertas
- [ ] Email de prueba enviado y recibido
- [ ] WhatsApp de prueba enviado y recibido
- [ ] Logs en Vercel muestran envíos exitosos

### Cron Job
- [ ] Vercel → Settings → Cron Jobs
- [ ] Job configurado: `/api/status` cada 2 min
- [ ] Job ejecutándose (ver logs)

---

## 🎨 POST-DEPLOY (Opcional)

### Dominio Personalizado
- [ ] Vercel → Settings → Domains
- [ ] Dominio agregado: `dashboard.usittel.com.ar`
- [ ] DNS configurado
- [ ] SSL certificado emitido
- [ ] Dominio accesible

### Monitoreo
- [ ] Vercel Analytics habilitado
- [ ] Supabase Reports revisado
- [ ] Uptime configurado (externo)

### Optimización
- [ ] Lighthouse Score > 90
- [ ] Images optimizadas
- [ ] Fonts cargando correctamente

---

## 📊 MÉTRICAS DE ÉXITO

**El deploy fue exitoso si:**
- ✅ Dashboard carga en < 3 segundos
- ✅ Sensores muestran datos en tiempo real
- ✅ Alertas se envían correctamente
- ✅ Base de datos se actualiza
- ✅ No hay errores en logs de Vercel
- ✅ No hay errores en Supabase
- ✅ Emails y WhatsApp funcionan

---

## 🐛 TROUBLESHOOTING

### Build Failed en Vercel
- [ ] Ver "Build Logs" en Vercel
- [ ] Verificar que `package.json` esté correcto
- [ ] Verificar que no haya errores de TypeScript
- [ ] Re-deploy: Deployments → ... → Redeploy

### 500 Internal Server Error
- [ ] Ver "Function Logs" en Vercel
- [ ] Verificar variables de entorno
- [ ] Verificar conexión a Supabase
- [ ] Verificar conexión a PRTG

### Dashboard carga pero sin datos
- [ ] Verificar PRTG_BASE_URL en variables
- [ ] Ver logs: puede ser timeout
- [ ] PRTG debe ser accesible públicamente

### Alertas no se envían
- [ ] Verificar credenciales SMTP
- [ ] Verificar credenciales Twilio
- [ ] Ver logs de errores específicos

---

## 📞 SOPORTE

**Documentación:**
- Ver: `DEPLOY_GUIDE.md` (completa)
- Ver: `QUICKSTART_DEPLOY.md` (rápida)
- Ver: `RESUMEN_DEPLOY.md` (ejecutivo)

**Dashboards:**
- Vercel: https://vercel.com/dashboard
- Supabase: https://supabase.com/dashboard
- Twilio: https://console.twilio.com

**Contacto:**
- Email: agustin.scutari@it-tel.com.ar
- GitHub: @agustinSC2034

---

## 🎉 FINALIZACIÓN

- [ ] ✅ Todo el checklist completado
- [ ] ✅ Dashboard en producción funcionando
- [ ] ✅ Alertas operativas
- [ ] ✅ Equipo notificado
- [ ] ✅ Documentación archivada
- [ ] 🎊 **DEPLOY EXITOSO!**

---

**Fecha de Deploy:** _______________  
**URL Producción:** _______________  
**Responsable:** Agustín Scutari  
**Estado Final:** ⬜ Exitoso | ⬜ Con observaciones | ⬜ Fallido

**Notas adicionales:**
```


```

---

**Creado:** 5 de noviembre de 2025  
**Versión:** 1.0
