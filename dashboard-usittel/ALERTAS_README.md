# 🚨 Sistema de Alertas - Dashboard USITTEL

## ✅ ¿Qué está implementado?

### 1. Base de Datos SQLite
- ✅ Historial completo de estados de sensores
- ✅ Reglas de alertas configurables
- ✅ Historial de alertas disparadas
- ✅ Registro de cambios de estado
- ✅ Logs del sistema

### 2. Detección Automática
- ✅ Monitoreo continuo de cambios de estado
- ✅ Detección de caídas (DOWN)
- ✅ Detección de warnings
- ✅ Sistema de cooldown para evitar spam

### 3. API REST Completa
- ✅ `GET /api/alerts/rules` - Listar reglas
- ✅ `POST /api/alerts/rules` - Crear regla
- ✅ `PATCH /api/alerts/rules` - Actualizar regla
- ✅ `DELETE /api/alerts/rules?id=X` - Eliminar regla
- ✅ `GET /api/alerts/history` - Historial de alertas
- ✅ `POST /api/alerts/init` - Inicializar reglas por defecto
- ✅ `GET /api/sensors/stats` - Estadísticas de sensores

---

## 🚀 Cómo Usar

### Paso 1: Inicializar Reglas por Defecto

Ejecuta en el navegador o con curl:

```bash
curl -X POST http://localhost:3000/api/alerts/init
```

Esto crea reglas básicas para todos los sensores críticos.

### Paso 2: Verificar que las Reglas Están Activas

```bash
curl http://localhost:3000/api/alerts/rules
```

Deberías ver 6 reglas creadas (una para cada sensor).

### Paso 3: El Sistema Ya Está Monitoreando

Cada vez que se consulta `/api/status`, el sistema:
1. ✅ Guarda el estado actual en la BD
2. ✅ Detecta si hubo cambio de estado
3. ✅ Dispara alertas si corresponde (respetando cooldown)
4. ✅ Registra todo en los logs

---

## 📊 Consultar Estadísticas

### Uptime de un Sensor (últimos 7 días)
```bash
curl "http://localhost:3000/api/sensors/stats?sensor_id=13682&action=uptime&days=7"
```

### Eventos de Caída
```bash
curl "http://localhost:3000/api/sensors/stats?sensor_id=13682&action=downtime&days=7"
```

### Historial Completo
```bash
curl "http://localhost:3000/api/sensors/stats?sensor_id=13682&action=history&limit=50"
```

### Cambios de Estado
```bash
curl "http://localhost:3000/api/sensors/stats?sensor_id=13682&action=changes"
```

---

## 🔧 Crear una Regla Personalizada

```bash
curl -X POST http://localhost:3000/api/alerts/rules \
  -H "Content-Type: application/json" \
  -d '{
    "name": "CABASE - Alerta WhatsApp Crítica",
    "sensor_id": "13682",
    "condition": "down",
    "channels": ["email", "whatsapp"],
    "recipients": ["admin@usittel.com", "+5492901234567"],
    "cooldown": 180,
    "priority": "critical",
    "active": true
  }'
```

### Parámetros de una Regla

| Campo | Tipo | Descripción | Valores |
|-------|------|-------------|---------|
| `name` | string | Nombre descriptivo | Cualquier texto |
| `sensor_id` | string | ID del sensor (ej: "13682") | IDs de PRTG |
| `condition` | string | Cuándo disparar | `down`, `warning`, `unusual` |
| `channels` | array | Por dónde enviar | `email`, `whatsapp` |
| `recipients` | array | Destinatarios | Emails o números |
| `cooldown` | number | Segundos entre alertas | 60, 300, 600, etc |
| `priority` | string | Nivel de urgencia | `low`, `medium`, `high`, `critical` |
| `active` | boolean | Si está activa | `true` o `false` |

---

## 🎯 Próximos Pasos

### ⏳ Pendiente de Implementación

1. **Envío Real de Emails**
   - Integrar NodeMailer
   - Configurar SMTP
   - Templates HTML bonitos

2. **Envío Real de WhatsApp**
   - Integrar Twilio API
   - Configurar credenciales
   - Formato de mensajes

3. **UI para Gestión de Alertas**
   - Panel en el dashboard
   - Formularios para crear/editar reglas
   - Vista de historial de alertas

4. **Sistema de Colas (Redis/Bull)**
   - Para procesar alertas en background
   - Retry automático si falla
   - Priorización inteligente

---

## 🗂️ Estructura de Archivos

```
src/
├── lib/
│   ├── db.ts                    # ✅ Base de datos SQLite
│   ├── alertMonitor.ts          # ✅ Detector de cambios y alertas
│   └── prtgClient.ts            # ✅ Cliente PRTG
│
└── app/api/
    ├── status/route.ts          # ✅ Actualizado con monitoreo
    ├── alerts/
    │   ├── rules/route.ts       # ✅ CRUD de reglas
    │   ├── history/route.ts     # ✅ Historial
    │   └── init/route.ts        # ✅ Inicialización
    └── sensors/
        └── stats/route.ts       # ✅ Estadísticas
```

---

## 📝 Base de Datos

La base de datos se crea automáticamente en:
```
dashboard-usittel/data/monitoring.db
```

### Tablas Creadas

1. **sensor_history** - Historial de estados
2. **alert_rules** - Reglas configuradas
3. **alert_history** - Alertas disparadas
4. **status_changes** - Cambios de estado detectados
5. **system_logs** - Logs internos del sistema

---

## 🧪 Testing

### Probar Detección de Cambio de Estado

1. Abre el dashboard: http://localhost:3000
2. Espera a que se actualice (cada 2 minutos)
3. Si un sensor cambia de estado, verás en la consola del servidor:
   ```
   🔄 Cambio de estado detectado: CABASE | Up → Down
   🚨 Disparando alerta: CABASE - Alerta de Caída
   📧 [EMAIL] Enviando alerta a: noc@usittel.com
   ```

### Ver Logs en Consola

El sistema imprime:
- 📊 Estados procesados
- 🔄 Cambios detectados
- 🚨 Alertas disparadas
- ❌ Errores si ocurren

---

## ⚙️ Configuración Avanzada

### Cooldown (Tiempo entre Alertas)

Para evitar spam, cada regla tiene un cooldown (en segundos):
- **60s** - Para alertas muy urgentes (no recomendado)
- **300s (5 min)** - Alertas críticas ✅ Recomendado
- **600s (10 min)** - Alertas normales
- **1800s (30 min)** - Alertas de baja prioridad

### Prioridades

| Prioridad | Uso | Cooldown Sugerido |
|-----------|-----|-------------------|
| `critical` | Enlaces principales caídos | 300s (5 min) |
| `high` | Enlaces secundarios caídos | 600s (10 min) |
| `medium` | Warnings, problemas menores | 900s (15 min) |
| `low` | Informativos | 1800s (30 min) |

---

## 📧 Configurar Emails (Próximo)

Agregar a `.env.local`:
```bash
# Email SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noc@usittel.com
SMTP_PASS=tu_password_aqui
SMTP_FROM=alertas@usittel.com
```

---

## 📱 Configurar WhatsApp (Próximo)

Agregar a `.env.local`:
```bash
# Twilio WhatsApp
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxx
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
```

Crear cuenta en Twilio: https://www.twilio.com/try-twilio

---

## 🎉 ¡Sistema de Alertas Funcionando!

El núcleo del sistema está completo y funcionando:
- ✅ Base de datos persistente
- ✅ Detección automática de cambios
- ✅ API completa para gestión
- ✅ Sistema de cooldown
- ✅ Logs y estadísticas

**Próximos pasos críticos:**
1. Integrar NodeMailer para emails reales
2. Integrar Twilio para WhatsApp
3. Crear UI para gestión de reglas

---

**Fecha:** 4 de noviembre de 2025  
**Estado:** 🟢 Sistema Base Implementado  
**Listo para:** Integración de canales de notificación
