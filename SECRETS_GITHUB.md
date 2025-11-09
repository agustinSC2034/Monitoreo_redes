# 🔐 Secrets para GitHub Actions - Copiar y Pegar

Click en "Nuevo secreto de repositorio" (botón verde) y agrega cada uno:

---

## 1. PRTG_BASE_URL
```
http://38.253.65.250:8080
```

---

## 2. PRTG_USERNAME
```
nocittel
```

---

## 3. PRTG_PASSHASH
```
413758319
```

---

## 4. NEXT_PUBLIC_SUPABASE_URL
```
https://tuskasjifhkednqxvgxm.supabase.co
```

---

## 5. NEXT_PUBLIC_SUPABASE_ANON_KEY
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1c2thc2ppZmhrZWRucXh2Z3htIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1MDU0MDgsImV4cCI6MjA3ODA4MTQwOH0.VcuNIpjtCoApRtPTvs6QArXkxUbAGOt9pTnIxFLImMY
```

---

## 6. SMTP_HOST
```
smtp.gmail.com
```

---

## 7. SMTP_PORT
```
587
```

---

## 8. SMTP_SECURE
```
false
```

---

## 9. SMTP_USER
```
agustinsc2034@gmail.com
```

---

## 10. SMTP_PASS
```
qoojvckoygomrrjj
```

---

## 11. SMTP_FROM
```
alertas-ittel@gmail.com
```

---

## 12. ALERT_EMAIL_RECIPIENTS
```
agustin.scutari@it-tel.com.ar
```

---

## 13. TWILIO_ACCOUNT_SID
```
AC667aaabe1521e4fec8b862d6dbcdc505
```

---

## 14. TWILIO_AUTH_TOKEN
```
58635e754e8941b1d682482bec851ed5
```

---

## 15. TWILIO_WHATSAPP_FROM
```
whatsapp:+14155238886
```

---

## 16. ALERT_WHATSAPP_RECIPIENTS
```
+5491124682247
```

---

## ✅ Checklist

Una vez agregados todos (son 16 secrets), deberías ver algo así:

- [x] ALERT_EMAIL_RECIPIENTS
- [x] ALERT_WHATSAPP_RECIPIENTS
- [x] NEXT_PUBLIC_SUPABASE_ANON_KEY
- [x] NEXT_PUBLIC_SUPABASE_URL
- [x] PRTG_BASE_URL
- [x] PRTG_PASSHASH
- [x] PRTG_USERNAME
- [x] SMTP_FROM
- [x] SMTP_HOST
- [x] SMTP_PASS
- [x] SMTP_PORT
- [x] SMTP_SECURE
- [x] SMTP_USER
- [x] TWILIO_ACCOUNT_SID
- [x] TWILIO_AUTH_TOKEN
- [x] TWILIO_WHATSAPP_FROM

---

## 🎯 Después de agregar los 16 secrets:

1. Ve a: https://github.com/agustinSC2034/Monitoreo_redes/actions
2. Click en "Monitoreo PRTG Automático" (el workflow)
3. Click en "Run workflow" → Run workflow (botón verde)
4. Espera 1 minuto
5. Refresh la página
6. Click en la ejecución para ver los logs

Si todo está bien configurado, verás:
```
✅ Monitoreo completado exitosamente
```

Y deberías recibir emails/whatsapp si hay algún sensor con problemas.
