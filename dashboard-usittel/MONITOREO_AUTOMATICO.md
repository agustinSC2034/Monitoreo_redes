# 🚀 Configuración de Monitoreo Automático en Vercel

## ⚠️ PROBLEMA IDENTIFICADO

**Vercel Plan Gratuito NO ejecuta código en background automáticamente.**

Las funciones serverless solo corren cuando reciben una HTTP request. Por eso las alertas solo se ejecutaban cuando alguien abría el dashboard.

---

## ✅ SOLUCIÓN: Servicio de Cron Externo

Usaremos un servicio gratuito que llame a nuestro endpoint cada minuto para ejecutar el monitoreo.

### 🎯 Opción 1: Cron-job.org (RECOMENDADA - 100% Gratis)

1. **Crear cuenta en https://cron-job.org**
   - No requiere tarjeta de crédito
   - 100% gratuito
   - Hasta 50 cron jobs

2. **Crear nuevo Cron Job**
   - Haz click en "Create cronjob"
   - Configuración:
     ```
     Title: Monitoreo PRTG Alertas
     URL: https://monitoreo-redes-9ubo8gl8h-agustins-projects-03ad7204.vercel.app/api/cron/check-alerts
     Schedule: */1 * * * * (cada 1 minuto)
     HTTP Method: GET
     Timeout: 30 seconds
     ```
   - Guardar y activar

3. **Verificar que funciona**
   - El historial mostrará cada ejecución
   - Debe retornar status 200 OK
   - Ver logs en: https://vercel.com/agustins-projects-03ad7204/monitoreo-redes/logs

### 🔐 Seguridad (Opcional pero recomendado)

Para evitar que otros llamen al endpoint, agregar en Vercel:

1. Variables de entorno → Agregar:
   ```
   CRON_SECRET=tu-secreto-aleatorio-largo-123456
   ```

2. En cron-job.org → Headers:
   ```
   Authorization: Bearer tu-secreto-aleatorio-largo-123456
   ```

---

## 🎯 Opción 2: UptimeRobot (Alternativa)

1. **Crear cuenta en https://uptimerobot.com**
   - 50 monitores gratis
   - Intervalo mínimo: 5 minutos (menos frecuente que cron-job.org)

2. **Crear Monitor**
   ```
   Monitor Type: HTTP(s)
   Friendly Name: PRTG Alerts Monitor
   URL: https://monitoreo-redes-9ubo8gl8h-agustins-projects-03ad7204.vercel.app/api/cron/check-alerts
   Monitoring Interval: Every 5 minutes
   ```

---

## 📊 Endpoints Disponibles

### 1. `/api/cron/check-alerts` (Nuevo - Para servicios externos)
- **Método**: GET
- **Propósito**: Ser llamado por cron-job.org cada minuto
- **Respuesta**: JSON con resultados del chequeo
- **Logs**: Aparecen en Vercel con prefijo `[CRON]`

### 2. `/api/alerts/check-now` (Existente - Para dashboard)
- **Método**: GET
- **Propósito**: Ser llamado por el dashboard cuando alguien lo abre
- **Respuesta**: JSON con resultados del chequeo

### 3. `/api/alerts/test-cabase` (Existente)
- **Método**: POST
- **Propósito**: Crear regla de alerta CABASE > 4500 Mbit/s

---

## 🔧 Configurar Alertas

### Crear alerta de CABASE:

**Opción A: Desde el navegador**
```
POST https://monitoreo-redes-9ubo8gl8h-agustins-projects-03ad7204.vercel.app/api/alerts/test-cabase
```

**Opción B: Desde PowerShell**
```powershell
Invoke-WebRequest -Uri "https://monitoreo-redes-9ubo8gl8h-agustins-projects-03ad7204.vercel.app/api/alerts/test-cabase" -Method POST
```

**Opción C: Desde el dashboard**
- Ir a "Alertas" tab
- Crear regla manualmente

---

## 📈 Verificar que funciona

1. **Logs de Vercel**:
   - https://vercel.com/agustins-projects-03ad7204/monitoreo-redes/logs
   - Buscar: `[CRON]` para ver ejecuciones automáticas

2. **Dashboard**:
   - Abrir: https://monitoreo-redes-9ubo8gl8h-agustins-projects-03ad7204.vercel.app
   - Tab "Alertas" → Ver historial de alertas

3. **Base de datos Supabase**:
   - https://supabase.com/dashboard/project/tuskasjifhkednqxvgxm
   - Table Editor → `alert_history`

---

## 🆚 Comparación de Opciones

| Servicio | Intervalo Mínimo | Precio | Complejidad |
|----------|------------------|--------|-------------|
| **cron-job.org** | 1 minuto | Gratis | ⭐ Muy fácil |
| UptimeRobot | 5 minutos | Gratis | ⭐ Fácil |
| Railway.app | Background 24/7 | $5/mes crédito | ⭐⭐ Media |
| Render.com | Background 24/7 | Gratis (con suspensión) | ⭐⭐ Media |
| Vercel Cron Pro | 1 minuto | $20/mes | ⭐ Fácil |

---

## ❓ FAQ

**P: ¿Por qué no funciona automáticamente?**  
R: Vercel gratuito solo ejecuta código cuando recibe requests HTTP. No tiene procesos en background.

**P: ¿Las alertas se guardan en la base de datos?**  
R: Sí, todas las alertas se guardan en Supabase → tabla `alert_history`. Cualquiera puede verlas en el dashboard incluso si no estaba abierto cuando se disparó.

**P: ¿Necesito dejar una PC con el navegador abierto?**  
R: NO. Con cron-job.org configurado, las alertas se ejecutarán automáticamente cada minuto sin que nadie tenga el dashboard abierto.

**P: ¿Puedo usar ambos (cron-job.org + dashboard)?**  
R: Sí, funcionan en paralelo. Cron-job.org garantiza monitoreo 24/7, y el dashboard hace chequeos adicionales cuando alguien lo abre.

**P: ¿Cuántas alertas puedo enviar?**  
R: Depende de los límites de Gmail (500/día) y Twilio (plan gratis limitado). El código tiene cooldowns para no saturar.

---

## 🎯 ACCIÓN INMEDIATA

1. ✅ **Crear cuenta en cron-job.org** (2 minutos)
2. ✅ **Configurar cron job** con la URL del endpoint (2 minutos)
3. ✅ **Activar el job** (1 click)
4. ✅ **Esperar 1 minuto** y verificar logs en Vercel

**Total: 5 minutos para tener monitoreo 24/7 automático** 🚀

---

## 📞 Contacto

Si tienes problemas:
1. Revisar logs en Vercel
2. Verificar que cron-job.org está activo
3. Comprobar que las variables de entorno están configuradas
