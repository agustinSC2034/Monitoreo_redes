Para que envie a los 3

Paso 1: Los otros 2 números deben unirse al Sandbox
Cada persona debe:

Enviar un mensaje de WhatsApp a: +1 (415) 523-8886
Con el texto exacto: join mental-recall
Recibirán confirmación de Twilio

# Ver configuración actual
Invoke-RestMethod -Uri "http://localhost:3000/api/alerts/update-recipients" -Method GET

# Actualizar con los 3 números + emails
$body = @{
    emails = @("agustin.scutari@it-tel.com.ar", "otro@ejemplo.com")
    whatsapp = @("+5491124682247", "+549XXXXXXXXX", "+549YYYYYYYYY")
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/alerts/update-recipients" -Method POST -Body $body -ContentType "application/json"