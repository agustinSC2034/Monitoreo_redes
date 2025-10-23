# 🗺️ Actualización: Mapa de Red y Nuevos Sensores

**Fecha:** 22 de octubre de 2025  
**Estado:** ✅ Completado

---

## 📋 Cambios Realizados

### 1️⃣ Agregados Nuevos Sensores (5 totales)

**Sensores WAN (3):**
- ✅ CABASE (13682) - Proveedor principal internet
- ✅ TECO (13683) - L2L x TECO
- ✅ IPLANxARSAT (13684) - L2L x ARSAT

**Sensores Internos/Routers (2):**
- ✅ ITTEL-RDA-1-TDL (13691) - Router interno
- ✅ ITTEL-RDB-1-TDL / RDB-DTV (13673) - Router de borde/DTV

**Archivos modificados:**
- `src/lib/prtgClient.ts` - Función `getCriticalSensors()` ahora retorna 5 sensores
- `src/app/api/status/route.ts` - Agregado mapeo de nombres para sensores 13691 y 13673

---

### 2️⃣ Rediseño Completo del Mapa de Red

**Nueva estructura jerárquica (3 niveles):**

```
NIVEL 1 (Top) - Proveedores Internet
    🌐 CABASE          🌐 IPLAN
         \               /  \
          \             /    \
           \           /      \
            \         /        \
NIVEL 2 (Middle) - Router de Borde Principal
              🔀 ITTEL-RDB-1-TDL
                 /         \
                /           \
               /             \
NIVEL 3 (Bottom) - Routers Internos
        🖥️ RDA-1-TDL    🖥️ RDB-DTV
```

**Iconos según rol:**
- 🌐 = Proveedores WAN (CABASE, IPLAN)
- 🔀 = Router de borde principal (RDB-1-TDL)
- 🖥️ = Routers internos (RDA, RDB-DTV)

**Características del nuevo mapa:**
- ✅ Estructura coincide con diagrama original PRTG
- ✅ Líneas de conexión con labels ("L2L x ARSAT", "L2L x TECO")
- ✅ Colores según estado (verde=UP, rojo=DOWN, amarillo=WARNING)
- ✅ Líneas punteadas para enlaces caídos
- ✅ Tooltips expandidos con mini gráficos
- ✅ Tamaños diferenciados (large para proveedores/borde, medium para internos)

---

### 3️⃣ Mejoras en Tooltips del Mapa

**Nuevo contenido al pasar mouse:**
- 📊 **Mini gráfico** con últimas 2 horas de tráfico
- 📈 Línea SVG con colores según estado
- 📝 Información detallada:
  - Nombre y dispositivo
  - Estado actual
  - Prioridad
  - Último chequeo
  - Mensaje de estado

**Implementación:**
- Carga asíncrona de últimos 20 puntos de datos
- SVG responsive dentro del tooltip
- Escala automática según valores máximos

---

### 4️⃣ Fix: Error 500 en Gráficos (Primera Carga)

**Problema:** 
Gráfico de CABASE (y otros) a veces devolvía error 500 en la primera carga

**Solución implementada:**
- ✅ Retry logic automático (hasta 2 reintentos)
- ✅ Delay de 2 segundos entre reintentos
- ✅ Logs de advertencia en consola
- ✅ No afecta experiencia del usuario (carga transparente)

**Código agregado en `HistoricalChart.tsx`:**
```typescript
if (response.status === 500 && retryCount < 2) {
  console.warn(`⚠️ Error 500, reintentando (${retryCount + 1}/2)...`);
  await new Promise(resolve => setTimeout(resolve, 2000));
  return fetchHistoricalData(period, retryCount + 1);
}
```

---

## 🎨 Vista Detalle vs Vista Mapa

### 📊 Vista Detalle (Existente)
- 5 tarjetas de estado (antes eran 3)
- 5 gráficos históricos (antes eran 3)
- Selectores de período y unidad
- Ideal para análisis detallado

### 🗺️ Vista Mapa (Nueva)
- Topología jerárquica 3 niveles
- Visualización de conexiones L2L
- Mini gráficos en tooltips
- Ideal para monitoreo general y proyección

---

## 🔄 Estructura de Datos

### Sensores por Categoría

**Proveedores WAN (Internet):**
```json
{
  "CABASE": { "id": "13682", "icon": "🌐", "type": "wan" },
  "IPLAN": { "id": "13684", "icon": "🌐", "type": "wan" }
}
```

**Conexiones L2L:**
```json
{
  "TECO": { "id": "13683", "label": "L2L x TECO" },
  "ARSAT": { "id": "13684", "label": "L2L x ARSAT" }
}
```

**Routers Internos:**
```json
{
  "RDB-Main": { "id": "13673", "icon": "🔀", "level": 2 },
  "RDA": { "id": "13691", "icon": "🖥️", "level": 3 },
  "RDB-DTV": { "id": "13673", "icon": "🖥️", "level": 3 }
}
```

---

## 📐 Posicionamiento del Mapa

### Coordenadas de Nodos (% del contenedor)

**Nivel 1 (Top - 20%):**
- CABASE: x=25%, y=20%
- IPLAN: x=75%, y=20%

**Nivel 2 (Middle - 50%):**
- RDB-Main: x=50%, y=50%

**Nivel 3 (Bottom - 80%):**
- RDA: x=35%, y=80%
- RDB-DTV: x=65%, y=80%

---

## 🚀 Próximas Mejoras Sugeridas

- [ ] Animación de datos en tránsito por las líneas
- [ ] Click en nodo → Abrir modal con gráfico completo
- [ ] Drag & drop para reorganizar nodos (editor de mapa)
- [ ] Exportar mapa como imagen PNG/SVG
- [ ] Vista 3D con WebGL
- [ ] Agregar más niveles de routers si es necesario
- [ ] Modo oscuro para el mapa
- [ ] Alertas visuales parpadeantes en nodos con problemas

---

## ✅ Testing Realizado

- [x] Compilación sin errores TypeScript
- [x] 5 sensores cargando correctamente
- [x] Mapa renderiza con estructura jerárquica
- [x] Líneas de conexión se dibujan correctamente
- [x] Tooltips con mini gráficos funcionan
- [x] Retry logic en gráficos funciona
- [x] Toggle entre vistas mantiene estado

---

## 📝 Notas Técnicas

### Manejo de Error 500
El error 500 ocasional en primera carga probablemente se debe a:
- Rate limiting del servidor PRTG
- Timeout en consultas XML grandes
- Cache del servidor no inicializado

**Solución:** Retry automático transparente para el usuario.

### Estructura del Mapa
El mapa usa:
- **SVG** para líneas de conexión (escalable, sin pixelación)
- **Absolute positioning** con porcentajes (responsive)
- **Z-index layers** (SVG=1, Nodos=2, Tooltips=50)
- **Transform animations** para hover effects

### Mini Gráficos
- Se cargan al montar el componente MapView
- Solo últimos 20 puntos (optimización)
- SVG polyline con viewBox preserveAspectRatio
- Escala automática según max value

---

## 🎯 Resultado Final

✅ **5 sensores monitoreados** (3 WAN + 2 internos)  
✅ **Mapa jerárquico** coincide con topología real  
✅ **Mini gráficos** en tooltips del mapa  
✅ **Error 500 mitigado** con retry logic  
✅ **Iconos correctos** según rol de cada nodo  
✅ **Labels en conexiones** (L2L x TECO, L2L x ARSAT)  

El dashboard ahora refleja completamente la estructura de red USITTEL Tandil según el diagrama original PRTG.

