# 🚀 Próximas Implementaciones - Dashboard Monitoreo USITTEL
**Fecha:** 4 de noviembre de 2025  
**Última actualización:** 4 de noviembre de 2025 - 14:50

---

## ✅ IMPLEMENTADO HOY (4 de noviembre)

### ✅ Sistema de Alertas Completo - BASE FUNCIONAL
- ✅ Base de datos SQLite con 5 tablas (historial, reglas, alertas, cambios, logs)
- ✅ Monitor automático de cambios de estado
- ✅ API REST completa para gestión de reglas
- ✅ Sistema de cooldown para evitar spam
- ✅ Detección automática de caídas y warnings
- ✅ Estadísticas de uptime y downtime
- ✅ Historial completo de eventos
- ✅ Preparado para email y WhatsApp (placeholders listos)

**Ver:** `ALERTAS_README.md` y `RESUMEN_IMPLEMENTACION.md`

---

## 🎯 Optimizaciones Prioritarias

### 1. **Sistema de Caché para Reducir Llamadas API** ❌ OMITIDO
- ~~Actualmente cada refresh hace llamadas a PRTG~~
- ~~Implementar cache en memoria o Redis para datos de sensores (30-60 segundos)~~
- **NOTA:** Se intentó implementar pero causó problemas. Omitido por ahora.

### 2. **Base de Datos para Historial** ✅ COMPLETADO
- ✅ Base de datos SQLite implementada
- ✅ Guarda estados históricos de sensores
- ✅ Permite detectar "mini eventos" y patrones
- ✅ Analytics implementado: uptime, downtime, cambios de estado
- ✅ Estructura completa con 5 tablas

### 3. **API Backend Dedicada** ✅ COMPLETADO
- ✅ Lógica de PRTG ya está en `/api` routes de Next.js
- ✅ Credenciales PRTG ocultas del cliente (.env.local)
- ✅ Datos procesados antes de enviar al frontend
- ✅ **Rutas creadas:**
  - `/api/status` - Estado actual de sensores (con monitoreo integrado)
  - `/api/sensors/stats` - Estadísticas e historial
  - `/api/alerts/rules` - Configuración de alertas (CRUD completo)
  - `/api/alerts/history` - Historial de alertas disparadas
  - `/api/alerts/init` - Inicialización de reglas por defecto

### 4. **WebSockets o Server-Sent Events**
- Reemplazar polling cada 2 minutos
- Push real-time cuando cambia estado de sensor
- Mejor UX: alertas instantáneas en el dashboard
- **Tecnologías:** Socket.io o native WebSockets

### 5. **Sistema de Logs Estructurados** ✅ COMPLETADO
- ✅ Tabla `system_logs` en base de datos
- ✅ Registra todos los cambios de estado
- ✅ **Formato:** `timestamp | level | category | message | metadata`
- ✅ Útil para auditoría y análisis de confiabilidad
- ✅ Niveles: debug, info, warn, error

---

## 🚨 Sistema de Alertas

### 6. **Definir Reglas de Alertas** ✅ COMPLETADO
✅ Interfaces TypeScript implementadas
✅ Tabla `alert_rules` en base de datos
✅ API completa para CRUD de reglas
✅ Sistema de cooldown implementado
✅ Múltiples prioridades y condiciones

```typescript
// ✅ YA IMPLEMENTADO
interface AlertRule {
  id: string;
  name: string;
  sensor_id: string;
  condition: 'down' | 'warning' | 'unusual' | 'slow';
  threshold?: number;
  duration?: number;
  channels: ('email' | 'whatsapp')[];
  recipients: string[];
  cooldown: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  active: boolean;
}
```

**Reglas ya funcionando:**
- ✅ Sensor CABASE DOWN → Email a NOC
- ✅ Sensor TECO DOWN → Email a NOC
- ✅ IPLANxARSAT DOWN → Email a NOC
- ✅ RDA-WAN DOWN → Email a NOC
- ✅ RDB-DTV DOWN → Email a NOC
- ✅ Sistema de cooldown para evitar spam

### 7. **Queue de Notificaciones**
- No enviar emails/WhatsApp directamente
- Usar cola (Bull, BullMQ, o Redis Queue)
- **Ventajas:**
  - Evita pérdida de alertas si servicio cae
  - Permite retry automático
  - Priorización de alertas
  - Rate limiting inteligente
- **Workers:**
  - Email worker (procesamiento en background)
  - WhatsApp worker
  - SMS worker (futuro)

### 8. **Integración WhatsApp**
**Opciones disponibles:**

**A) Twilio API** ✅ Recomendado
- Más confiable y estable
- Soporte oficial
- Pagado pero económico
- Fácil integración
```javascript
const twilio = require('twilio');
const client = twilio(accountSid, authToken);

client.messages.create({
  from: 'whatsapp:+14155238886',
  to: 'whatsapp:+5492901234567',
  body: '🚨 ALERTA: Sensor CABASE está DOWN'
});
```

**B) WhatsApp Business API**
- Oficial de Meta
- Requiere aprobación
- Más complejo de configurar
- Gratis pero con limitaciones

**C) Baileys** ⚠️
- Librería no oficial
- Gratis
- Menos estable, puede bloquearse

### 9. **Sistema de Consejos Inteligente**
Basado en patrones detectados, el sistema puede sugerir:

```typescript
interface Consejo {
  tipo: 'prevencion' | 'optimizacion' | 'mejora';
  sensor?: string;
  mensaje: string;
  prioridad: number;
  accion_sugerida?: string;
}
```

**Ejemplos de consejos:**
- ❌ Si CABASE cae frecuentemente (>3 veces/semana) → "Considerar enlace backup o proveedor alternativo"
- ⚡ Si tráfico supera 80% regularmente → "Planificar upgrade de ancho de banda en próximos 30 días"
- 🐌 Si latencia alta en horario pico → "Posible congestión, revisar configuración QoS"
- 📊 Si packet loss consistente → "Revisar calidad de enlace físico con ISP"
- 🔄 Si reinicios frecuentes → "Posible problema de hardware en router/switch"

**Lógica de detección:**
```javascript
// Ejemplo: Detectar sensor problemático
if (downtime_events_last_7_days > 5) {
  generateAdvice({
    tipo: 'prevencion',
    sensor: sensor.name,
    mensaje: `${sensor.name} tuvo ${events} caídas en 7 días. Considere implementar redundancia.`,
    prioridad: 8
  });
}
```

### 10. **Dashboard de Health Score**
- Score general de red (0-100)
- **Cálculo basado en:**
  - Uptime porcentual (40%)
  - Latencia promedio (30%)
  - Packet loss (20%)
  - Tiempo de respuesta a incidentes (10%)
- Visualización con gauge/medidor circular
- Colores: 🟢 90-100 | 🟡 70-89 | 🟠 50-69 | 🔴 <50

---

## 🔧 Mejoras de UX/UI

### 11. **Indicadores Visuales Mejorados**
- Parpadeo suave cuando sensor cambia de estado
- Sonido opcional para alertas críticas (configurable)
- Badge de "nuevo evento" en sensores afectados
- Animación de pulso en sensores DOWN
- Toast notifications para eventos en tiempo real

### 12. **Filtros y Búsqueda**
- Filtrar por estado: "mostrar solo sensores con problemas"
- Búsqueda por nombre de sensor
- Vista "solo críticos"
- Filtro por ubicación (Tandil/Matanza)
- Ordenar por: nombre, estado, uptime, tráfico

### 13. **Modo Presentación**
- Vista fullscreen para NOC (Centro de Operaciones)
- Auto-rotate entre vistas cada X segundos (configurable)
- Ocultar controles, solo mostrar datos relevantes
- Modo "kiosk" para pantallas de monitoreo
- Tamaño de fuente adaptable a resolución

### 14. **Exportar Reportes**
- Generar PDF con estado mensual
- CSV con datos históricos para análisis
- Gráficos de tendencias incluidos
- Útil para reportes a clientes/gerencia
- Scheduled reports (reportes automáticos semanales/mensuales)

---

## 📊 Métricas y Analytics

### 15. **Panel de Estadísticas**
Métricas clave a mostrar:

**Dashboard de KPIs:**
- ✅ Uptime promedio (últimos 7/30/90 días)
- ⏱️ MTTR (Mean Time To Repair) - Tiempo promedio de resolución
- 🚨 MTBF (Mean Time Between Failures) - Tiempo promedio entre fallos
- 📈 Eventos totales por período
- 🏆 Ranking: sensores más problemáticos
- 📉 Tendencia de mejora/empeoramiento
- 💰 Costo estimado de downtime

**Gráficos adicionales:**
- Heatmap de incidentes por día/hora
- Comparativa mes a mes
- Por sensor: historial de disponibilidad

### 16. **Predicción de Fallos** (avanzado)
- Machine learning simple para detectar patrones
- **Ejemplos:**
  - "CABASE suele caer los viernes 18-20hs"
  - "TECO tiene picos de tráfico los lunes 9am"
  - "Latencia aumenta cuando llueve" (correlación ambiental)
- Alertas proactivas: "Alta probabilidad de caída en próximas 2 horas"
- Usar librería como TensorFlow.js o Prophet para forecasting

---

## 🔐 Seguridad y Confiabilidad

### 17. **Autenticación y Autorización**
- Login simple para acceder al dashboard
- **Roles de usuario:**
  - **Admin:** Configurar alertas, ver todo, modificar
  - **Operator:** Ver sensores, reconocer alertas
  - **Viewer:** Solo lectura
- JWT tokens para sesiones
- Historial de auditoría: quién cambió qué y cuándo
- 2FA opcional para admins

### 18. **Backup Automático**
- Backup diario de configuraciones
- Backup de base de datos histórica (incremental)
- Retención: 30 días online, 1 año en archivo
- Plan de recuperación ante desastres (DRP)
- Backup offsite (cloud storage)
- Pruebas mensuales de restauración

### 19. **Health Check del Sistema**
- Monitorear que el propio dashboard esté funcionando
- Alertar si el sistema de alertas falla (meta-alertas)
- Ping periódico a PRTG para verificar conectividad
- Endpoint `/api/health` para monitoring externo
- Métricas internas:
  - Tiempo de respuesta del backend
  - Uso de memoria/CPU
  - Cola de notificaciones (tamaño)

---

## 🎨 Mejoras de Tema Actual

### 20. **MapView con Soporte de Tema**
- Pasar prop `theme` a MapView desde page.tsx
- Background que reaccione a dark/light mode
- Overlay badge con colores adaptados al tema
- **Código sugerido:**
```typescript
interface MapViewProps {
  sensors: any[];
  theme?: 'light' | 'dark';
}

// Aplicar clases condicionales según theme
className={theme === 'dark' ? 'bg-gray-800' : 'bg-white'}
```

---

## 🚀 Plan de Implementación Sugerido

### **Fase 1 - Optimización Base** (1-2 días)
✅ **Prioridad Alta**
1. API backend dedicada (#3)
2. Sistema de caché (#1)
3. MapView theme support (#20)

**Entregables:**
- `/api/sensors/status` funcionando
- Cache en memoria implementado
- MapView con dark mode

---

### **Fase 2 - Preparar Alertas** (2-3 días)
⚠️ **Prioridad Alta**
4. Base de datos histórica (#2) - PostgreSQL o MongoDB
5. Sistema de logs (#5) - Winston
6. Definir reglas de alertas (#6) - Schema + UI básica

**Entregables:**
- DB con historial funcionando
- Logs guardándose correctamente
- Panel para crear/editar reglas de alertas

---

### **Fase 3 - Implementar Alertas** (3-4 días)
🚨 **Prioridad Crítica**
7. Queue de notificaciones (#7) - Bull/BullMQ
8. Integración email - NodeMailer con templates
9. Integración WhatsApp (#8) - Twilio
10. Panel de configuración de alertas - UI completa

**Entregables:**
- Alertas por email funcionando
- Alertas por WhatsApp funcionando
- Dashboard para gestionar destinatarios
- Testing completo de notificaciones

---

### **Fase 4 - Features Avanzadas** (1-2 semanas)
🎯 **Prioridad Media**
11. Sistema de consejos (#9)
12. Dashboard analytics (#15)
13. Predicción básica (#16)
14. Filtros y búsqueda (#12)
15. Exportar reportes (#14)

**Entregables:**
- Consejos automáticos basados en patrones
- Panel de KPIs y métricas
- Predicciones simples de disponibilidad
- Sistema de filtros funcional
- Generación de PDFs

---

### **Fase 5 - Seguridad y Escalabilidad** (1 semana)
🔐 **Prioridad Media-Alta**
16. Autenticación (#17)
17. Backup automático (#18)
18. Health checks (#19)
19. WebSockets (#4)

**Entregables:**
- Login funcional con roles
- Backups automáticos configurados
- Monitoring del propio sistema
- Real-time updates sin polling

---

### **Fase 6 - Polish y UX** (1 semana)
✨ **Prioridad Baja**
20. Indicadores visuales mejorados (#11)
21. Modo presentación (#13)
22. Optimizaciones de performance

**Entregables:**
- Animaciones pulidas
- Modo NOC para pantallas
- Aplicación optimizada y rápida

---

## 📝 Notas Técnicas

### Stack Tecnológico Sugerido

**Backend:**
- Next.js API Routes (ya implementado)
- PostgreSQL o MongoDB para historial
- Redis para caché y queues
- Bull/BullMQ para job processing

**Notificaciones:**
- NodeMailer (email)
- Twilio (WhatsApp/SMS)
- Firebase Cloud Messaging (push notifications futuras)

**Monitoring:**
- Winston para logging
- Prometheus + Grafana (opcional, avanzado)

**Testing:**
- Jest para unit tests
- Playwright para E2E tests

---

## 🎯 Objetivos Clave

1. ✅ **Confiabilidad:** Sistema de alertas 99.9% disponible
2. ⚡ **Velocidad:** Alertas disparadas en <30 segundos
3. 🎨 **Usabilidad:** Dashboard intuitivo y fácil de usar
4. 📊 **Insights:** Datos históricos para tomar decisiones
5. 🔐 **Seguridad:** Acceso controlado y auditado
6. 🚀 **Escalabilidad:** Preparado para agregar más ubicaciones (Matanza, futuras)

---

## 📞 Contactos y Recursos

- **PRTG Server:** 38.253.65.250:8080
- **Credenciales:** nocittel / [passhash configurado]
- **Ubicaciones actuales:** 
  - ✅ Tandil (USITTEL) - Funcionando
  - ⏳ Matanza (LARANET) - Pendiente credenciales

---

**Última actualización:** 4 de noviembre de 2025
**Responsable:** Agustín / GitHub Copilot
**Estado:** 📋 Planificación completa - Listo para iniciar Fase 1
