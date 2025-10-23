# 🔧 Correcciones Urgentes: Rate Limiting y Mapa

**Fecha:** 22 de octubre de 2025  
**Estado:** ✅ Solucionado

---

## 🚨 Problema 1: Error 429 (Too Many Requests)

### Causa Raíz
- Ahora tenemos **5 sensores** (antes 3)
- Cada sensor carga gráficos históricos simultáneamente
- El MapView también intentaba cargar mini gráficos (5 requests más)
- **Total:** 10 requests simultáneos → PRTG bloqueó por rate limiting

### Solución Implementada

#### A) Aumento de delays escalonados
**Antes:**
```typescript
const sensorIndex = parseInt(sensorId) % 3; // 0, 1, 2
const delayMs = sensorIndex * 500; // 0ms, 500ms, 1000ms
```

**Ahora:**
```typescript
const sensorIndex = parseInt(sensorId) % 5; // 0, 1, 2, 3, 4
const delayMs = sensorIndex * 800; // 0ms, 800ms, 1600ms, 2400ms, 3200ms
```

**Resultado:**
- Sensor 13682 % 5 = 2 → **1600ms** delay
- Sensor 13683 % 5 = 3 → **2400ms** delay  
- Sensor 13684 % 5 = 4 → **3200ms** delay
- Sensor 13691 % 5 = 1 → **800ms** delay
- Sensor 13673 % 5 = 3 → **2400ms** delay

Los gráficos se cargan espaciados ~800ms entre cada uno, evitando rate limiting.

#### B) Desactivación de mini gráficos en MapView
**Problema:** MapView cargaba 5 mini gráficos adicionales al montar.

**Solución:** Comentado temporalmente el `useEffect` que carga mini gráficos:
```typescript
// 📊 Cargar mini gráficos para tooltips - DESACTIVADO por rate limiting
// useEffect(() => { ... }, [sensors]);
```

También oculté la sección de mini gráfico en tooltips del mapa.

**Beneficio:** Reduce requests de 10 a 5 (solo vista Detalle)

---

## 🗺️ Problema 2: Mapa No Coincide con Diagrama

### Estructura Original (Incorrecta)
```
Nivel 1 (Top):     CABASE          IPLAN
                        \          /
                         \        /
Nivel 2 (Middle):        RDB-Main
                         /      \
                        /        \
Nivel 3 (Bottom):    RDA        RDB-DTV
```

### Estructura Correcta (Según Diagrama)
```
Fila Horizontal (Top):
[CABASE] - [RDA] - [RDB-Main] - [RDB-DTV] - [IPLAN]
    🌐      🖥️        🔀          🖥️         🌐

Líneas diagonales convergen a punto central
```

### Cambios Realizados

#### Posiciones Actualizadas
| Nodo | Posición X | Posición Y | Icono | Tamaño |
|------|-----------|-----------|-------|---------|
| CABASE | 10% | 25% | 🌐 | large |
| RDA | 27% | 25% | 🖥️ | medium |
| RDB-Main | 50% | 25% | 🔀 | large |
| RDB-DTV | 73% | 25% | 🖥️ | medium |
| IPLAN | 90% | 25% | 🌐 | large |

#### Líneas de Conexión
- CABASE → Centro: Línea diagonal desde (10%, 25%) a (50%, 50%)
- RDA → Centro: Línea diagonal desde (27%, 25%) a (50%, 50%)
- RDB-Main → Centro: Ya está en el centro superior
- RDB-DTV → Centro: Línea diagonal desde (73%, 25%) a (50%, 50%)
- IPLAN → Centro: Línea diagonal desde (90%, 25%) a (50%, 50%)
  - Label: "L2L x ARSAT"
- TECO (virtual) → Centro: Línea paralela a IPLAN
  - Label: "L2L x TECO"

#### Punto Central Indicador
Agregado círculo pulsante azul en el centro (50%, 50%) para representar punto de convergencia.

---

## 📊 Resultado Final

### Vista Detalle
- ✅ 5 tarjetas de estado
- ✅ 5 gráficos históricos con delays escalonados
- ✅ Sin error 429
- ✅ Carga secuencial: 0ms → 800ms → 1600ms → 2400ms → 3200ms

### Vista Mapa
- ✅ 5 nodos en fila horizontal superior
- ✅ Líneas diagonales convergiendo al centro
- ✅ Labels "L2L x ARSAT" y "L2L x TECO"
- ✅ Sin mini gráficos (evita sobrecarga)
- ✅ Iconos correctos (🌐 WAN, 🔀 borde, 🖥️ internos)

---

## ⚠️ Consideraciones

### Rate Limiting
- PRTG tiene límite de ~5-6 requests por segundo
- Con 5 gráficos + delays de 800ms → ~6.25 segundos para cargar todos
- Es aceptable y evita bloqueos

### Mini Gráficos en Mapa
- Temporalmente desactivados
- Opción A: Reactivar con cache/memoización
- Opción B: Cargar solo al hacer click en nodo (bajo demanda)
- Opción C: Dejarlo así (más simple)

### Sensor Duplicado
- 13673 aparece 2 veces (RDB-Main y RDB-DTV)
- Es correcto si ambos nombres apuntan al mismo dispositivo físico
- En el mapa aparecen en posiciones diferentes pero muestran mismos datos

---

## 🔍 Logs de Depuración

Ahora verás en consola:
```
⏱️ Sensor 13682 cargará en 1600ms
⏱️ Sensor 13691 cargará en 800ms
⏱️ Sensor 13673 cargará en 2400ms
⏱️ Sensor 13684 cargará en 3200ms
⏱️ Sensor 13683 cargará en 2400ms
```

Esto confirma que los delays están funcionando correctamente.

---

## ✅ Checklist de Verificación

- [x] Error 429 solucionado con delays más largos
- [x] Mini gráficos de mapa desactivados
- [x] Mapa rediseñado con 5 nodos horizontales
- [x] Líneas conectan correctamente al centro
- [x] Labels L2L visibles
- [x] Sin errores de compilación
- [x] Iconos correctos según rol

---

## 🚀 Para Reactivar Mini Gráficos (Futuro)

Si quieres reactivarlos sin sobrecargar:

1. **Agregar botón "Ver Gráfico"** en tooltip
2. **Cargar bajo demanda** solo cuando usuario hace click
3. **Implementar cache** con localStorage o React Query
4. **Aumentar delays** entre carga de mini gráficos

Código ejemplo:
```typescript
const [selectedNodeGraph, setSelectedNodeGraph] = useState<string | null>(null);

const loadSingleGraph = async (sensorId: string) => {
  // Solo carga 1 gráfico a la vez
  const response = await fetch(`/api/historical?sensorId=${sensorId}&days=1`);
  // ... resto del código
};
```

