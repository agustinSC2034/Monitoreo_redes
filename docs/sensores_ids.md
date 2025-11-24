# 🎯 IDs de Sensores PRTG - Tandil

## Sensores Críticos (WANs)

| ID    | Nombre               | Interfaz | Dispositivo            |
|-------|----------------------|----------|------------------------|
| 13682 | **(063) CABASE**     | GE0/0/63 | ITTEL-RDB-1-TDL (rdb1) |
| 13683 | **(064) WAN-TECO**   | GE0/0/64 | ITTEL-RDB-1-TDL (rdb1) |
| 13684 | **(065) WAN-IPLANxARSAT** | GE0/0/65 | ITTEL-RDB-1-TDL (rdb1) |
| 13726 | **WAN-to-RDB**       | -        | ITTEL-RDB-1-TDL (rdb1) |
| 13676 | **(017) ARSAT_CNO1** | GE0/0/17 | ITTEL-RDB-1-TDL (rdb1) |

## Otros Sensores de Interés

### Enlaces Adicionales
- **13685** - (066) WAN-USINA
- **13688** - (069) WAN-RURALINK-TIP
- **13690** - (070) WAN-RURALINK-CABASE
- **13691** - (071) WAN-DTV

### Sensores de Ping
- **2205** - Ping 7 - IPLANxARSAT
- **2208** - Ping 8 - IPLANxTECO

### Switches Críticos
- **2142** - PING 1 - ITTEL-SDD-1-TDL (Switch Distribución)
- **2150** - PING 3 - ITTEL-RDB-1-TDL (Router Borde)
- **2158** - PING 4 - ITTEL-FWL-1-TDL (Firewall)
- **2128** - PING 2 - ITTEL-RDA-1-TDL (Router Acceso)

## 📝 Notas

- **RDB** = Router de Borde (donde están los enlaces WAN)
- **SDD** = Switch de Distribución
- **RDA** = Router de Acceso
- **FWL** = Firewall
- **Total sensores monitoreados en Tandil**: 6 (13682, 13684, 13683, 2137, 13673, 13726)

## 🔍 Cómo obtener más IDs

Para ver todos los sensores disponibles:

```powershell
Invoke-WebRequest -Uri "http://38.253.65.250:8080/api/table.json?content=sensors&columns=objid,sensor,device&username=nocittel&passhash=413758319" | Select-Object -ExpandProperty Content | ConvertFrom-Json | Select-Object -ExpandProperty sensors | Format-Table -AutoSize
```

## ✅ Sensores Configurados en el Dashboard

Los sensores que se muestran actualmente en `/api/status`:

```javascript
const sensorIds = [
  13682, // CABASE
  13683, // TECO
  13684, // IPLANxARSAT
  13676  // ARSAT_CNO1
];
```

---

**Última actualización:** 22/10/2025  
**Fuente:** PRTG Tandil (http://38.253.65.250:8080)
