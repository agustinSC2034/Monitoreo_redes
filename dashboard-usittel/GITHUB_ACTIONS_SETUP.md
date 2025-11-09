# 🤖 GitHub Actions - Monitoreo Automático 24/7 (GRATIS)

## ✅ Ventajas de esta solución

- 🆓 **Totalmente gratis** en repositorios públicos (ILIMITADO)
- ⏰ **Corre cada 5 minutos** automáticamente
- 🌍 **24/7 sin depender de nadie** - No necesitás tener la página abierta
- 📊 **Logs completos** en GitHub
- 🔒 **Seguro** - Las credenciales están en GitHub Secrets

---

## 📋 Configuración (10 minutos)

### Paso 1: Hacer el repo público (IMPORTANTE)

Para tener ejecuciones ILIMITADAS gratis:

1. Ve a: https://github.com/agustinSC2034/Monitoreo_redes
2. Settings → Danger Zone → Change visibility
3. Click "Change to public"
4. Confirma

**¿Es seguro hacerlo público?**
✅ SÍ - Las credenciales (contraseñas, tokens) NO están en el código, están en "Secrets" de GitHub (encriptados)

**¿Qué se puede ver públicamente?**
- El código del dashboard
- La estructura del proyecto
- Los archivos de configuración (sin credenciales)

**¿Qué NO se puede ver?**
- ❌ Contraseñas de PRTG
- ❌ Tokens de Twilio
- ❌ Credenciales de Supabase
- ❌ Contraseña de Gmail
- ❌ Los logs de GitHub Actions (solo vos los ves)

---

### Paso 2: Configurar GitHub Secrets

Ve a: https://github.com/agustinSC2034/Monitoreo_redes/settings/secrets/actions

Click en **"New repository secret"** y agrega cada uno:

#### PRTG
```
Name: PRTG_BASE_URL
Value: http://38.253.65.250:8080
```

```
Name: PRTG_USERNAME
Value: nocittel
```

```
Name: PRTG_PASSHASH
Value: 413758319
```

#### Supabase
```
Name: NEXT_PUBLIC_SUPABASE_URL
Value: https://tuskasjifhkednqxvgxm.supabase.co
```

```
Name: NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1c2thc2ppZmhrZWRucXh2Z3htIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1MDU0MDgsImV4cCI6MjA3ODA4MTQwOH0.VcuNIpjtCoApRtPTvs6QArXkxUbAGOt9pTnIxFLImMY
```

#### Email (Gmail)
```
Name: SMTP_HOST
Value: smtp.gmail.com
```

```
Name: SMTP_PORT
Value: 587
```

```
Name: SMTP_SECURE
Value: false
```

```
Name: SMTP_USER
Value: agustinsc2034@gmail.com
```

```
Name: SMTP_PASS
Value: qoojvckoygomrrjj
```

```
Name: SMTP_FROM
Value: alertas-ittel@gmail.com
```

```
Name: ALERT_EMAIL_RECIPIENTS
Value: agustin.scutari@it-tel.com.ar
```

#### WhatsApp (Twilio)
```
Name: TWILIO_ACCOUNT_SID
Value: AC667aaabe1521e4fec8b862d6dbcdc505
```

```
Name: TWILIO_AUTH_TOKEN
Value: 58635e754e8941b1d682482bec851ed5
```

```
Name: TWILIO_WHATSAPP_FROM
Value: whatsapp:+14155238886
```

```
Name: ALERT_WHATSAPP_RECIPIENTS
Value: +5491124682247
```

---

### Paso 3: Activar GitHub Actions

1. Ve a: https://github.com/agustinSC2034/Monitoreo_redes/actions
2. Si está deshabilitado, click en "I understand my workflows, go ahead and enable them"
3. Verás el workflow **"Monitoreo PRTG Automático"**

---

### Paso 4: Hacer push del código

Ya tengo todo el código listo, solo falta subirlo:

```bash
git add -A
git commit -m "Add GitHub Actions for 24/7 automatic monitoring"
git push
```

Después de esto, el monitoreo empezará automáticamente.

---

## 🎯 ¿Cómo verificar que funciona?

### Ver las ejecuciones:

https://github.com/agustinSC2034/Monitoreo_redes/actions

Verás algo así:
```
✅ Monitoreo PRTG Automático
   Executed 2 minutes ago · 45s
```

### Ver los logs:

1. Click en cualquier ejecución
2. Click en "check-alerts"
3. Verás la salida completa:
   ```
   🤖 [CRON] Iniciando monitoreo automático...
   📅 Fecha: 8/11/2025 16:35:00
   🎯 Sensores a revisar: 5
   ---
   🔍 Consultando sensor 13682...
      ├─ Nombre: CABASE
      ├─ Estado: Up
      └─ Valor: 4234 Mbit/s
   ...
   ```

---

## ⚡ Ejecución Manual (para probar ahora)

No esperes 5 minutos, probalo ahora:

1. Ve a: https://github.com/agustinSC2034/Monitoreo_redes/actions
2. Click en "Monitoreo PRTG Automático" (el workflow)
3. Click en "Run workflow" → "Run workflow"
4. Espera 30 segundos
5. Refresh y verás la ejecución con logs completos

---

## 📊 Funcionamiento

```
┌─────────────────────────────────────────────────────┐
│         GitHub Actions (Gratis - Ilimitado)         │
│                                                     │
│  Cada 5 minutos ejecuta:                           │
│  1. Consultar sensores PRTG                        │
│  2. Analizar datos (processSensorData)             │
│  3. ¿Hay problema? → Enviar alerta                 │
│  4. Guardar en Supabase                            │
│                                                     │
│  Todo 24/7 sin que nadie tenga nada abierto       │
└─────────────────────────────────────────────────────┘
              ↓                    ↓
         📧 Email            📱 WhatsApp
         
              ↓
       💾 Supabase (historial)
              ↓
       🌐 Dashboard Vercel (lectura)
```

---

## ❓ FAQ

**P: ¿Puedo cambiar el intervalo de 5 minutos?**  
R: Sí, edita `.github/workflows/monitor-prtg.yml` y cambia el cron. Ejemplo:
- Cada 1 minuto: `*/1 * * * *`
- Cada 10 minutos: `*/10 * * * *`

**P: ¿Se pueden agotar los minutos gratis?**  
R: NO si el repo es público. En repos públicos es ILIMITADO.

**P: ¿Funcionará aunque cierre GitHub?**  
R: SÍ. GitHub Actions corre en servidores de GitHub, no en tu PC.

**P: ¿Puedo ver los logs históricos?**  
R: SÍ, GitHub guarda logs de todas las ejecuciones.

**P: ¿Qué pasa si hay un error?**  
R: La ejecución se marca como fallida (❌) y GitHub te puede enviar notificaciones.

**P: ¿Puedo desactivarlo temporalmente?**  
R: SÍ, en Actions → Workflows → Click en los 3 puntos → Disable workflow

---

## 🎯 Próximos Pasos

1. ✅ Hacer el repo público
2. ✅ Agregar todos los secrets en GitHub
3. ✅ Push del código
4. ✅ Probar ejecución manual
5. ✅ Esperar 5 minutos y verificar que corre automáticamente
6. 🎉 **¡Listo! Monitoreo 24/7 funcionando**

---

## 🆚 Comparación Final

| Característica | GitHub Actions | Vercel Cron Pro | PC en Morón |
|---------------|----------------|-----------------|-------------|
| **Precio** | Gratis | $20/mes | Gratis |
| **Confiabilidad** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Intervalo** | 1-5 min | 1 min | Cualquiera |
| **Mantenimiento** | Cero | Cero | Alto |
| **Dependencias** | Ninguna | Ninguna | Luz/Internet |
| **Logs** | Completos | Completos | Manual |

**Ganador: GitHub Actions** 🏆
