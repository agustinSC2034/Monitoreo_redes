# 📧 Configuración de Email para Alertas

## ⚙️ Configurar Gmail (Recomendado para Pruebas)

### Paso 1: Crear App Password en Google

Gmail ya NO permite usar tu contraseña normal por seguridad. Necesitas una "App Password".

1. **Ve a tu cuenta de Google:**
   https://myaccount.google.com/apppasswords

2. **Inicia sesión** con tu cuenta: `agustin.scutari@it-tel.com.ar`

3. **Crea una nueva App Password:**
   - Nombre: "USITTEL Monitoreo"
   - Google te dará un código de 16 caracteres (ej: `abcd efgh ijkl mnop`)

4. **Copia ese código** (sin espacios: `abcdefghijklmnop`)

### Paso 2: Actualizar .env.local

Abre `.env.local` y reemplaza `TU_APP_PASSWORD_AQUI` con el código que copiaste:

```bash
SMTP_USER=agustin.scutari@it-tel.com.ar
SMTP_PASS=abcdefghijklmnop  # ← Pega el código aquí
```

### Paso 3: Reiniciar el Servidor

```bash
# Detener el servidor (Ctrl+C)
# Iniciar nuevamente
npm run dev
```

---

## 🧪 Probar que Funciona

### Opción 1: Desde el Navegador

Abre en tu navegador mientras el servidor corre:
```
http://localhost:3000/api/alerts/test-email
```

Luego envía una petición POST (puedes usar Postman o Thunder Client):
```json
POST http://localhost:3000/api/alerts/test-email
Content-Type: application/json

{
  "recipient": "agustin.scutari@it-tel.com.ar"
}
```

### Opción 2: Desde PowerShell

```powershell
$body = @{
    recipient = "agustin.scutari@it-tel.com.ar"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:3000/api/alerts/test-email" -Method POST -Body $body -ContentType "application/json"
```

### Opción 3: Desde el Script

```bash
node scripts/test-email.js
```

---

## ✅ Si Todo Funciona

Deberías ver en la consola del servidor:
```
✅ Transporter de email configurado
✅ Configuración de email verificada correctamente
✅ Email enviado exitosamente a: agustin.scutari@it-tel.com.ar
   Message ID: <...>
```

Y recibirás un email con:
- ✉️ Asunto: "🔵 Prueba de Sistema de Alertas USITTEL"
- ✅ Contenido bonito en HTML
- 📊 Información del sistema

---

## ❌ Problemas Comunes

### Error: "Invalid login"
**Solución:** 
- Verifica que el SMTP_USER sea correcto
- Verifica que el SMTP_PASS sea la App Password (16 caracteres)
- NO uses tu contraseña normal de Gmail

### Error: "ECONNREFUSED"
**Solución:**
- Verifica que `SMTP_HOST=smtp.gmail.com`
- Verifica que `SMTP_PORT=587`

### No llega el email
**Revisa:**
1. Carpeta de SPAM
2. Que el destinatario sea correcto
3. Logs del servidor (debe decir "Email enviado exitosamente")

---

## 🏢 Usar Email Corporativo (Alternativa)

Si prefieres usar el servidor SMTP de IT-TEL en lugar de Gmail:

```bash
# .env.local
SMTP_HOST=mail.it-tel.com.ar  # ← Consultar con IT
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=agustin.scutari@it-tel.com.ar
SMTP_PASS=tu_contraseña_corporativa
```

---

## 🎯 Próximo Paso

Una vez que los emails funcionen, pasamos a **WhatsApp con Twilio**.

---

**Creado:** 4 de noviembre de 2025  
**Para:** USITTEL - Sistema de Monitoreo de Red
