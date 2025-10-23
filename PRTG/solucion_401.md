# 🔧 Solución al Error 401 (No Autorizado)

## ❌ Problema
```
Error HTTP: 401
```

## 🔍 Causa
PRTG requiere autenticación con `username` + `passhash` (no password directamente)

## ✅ Solución Aplicada

### 1. Obtener el passhash
Ejecutamos:
```powershell
Invoke-WebRequest -Uri "http://38.253.65.250:8080/api/getpasshash.htm?username=nocittel&password=1ttel20203T%23"
```

**Resultado:** `413758319`

### 2. Actualizar `.env.local`
```bash
# ANTES
PRTG_PASSWORD=1ttel20203T#

# DESPUÉS
PRTG_PASSHASH=413758319
```

### 3. Actualizar `prtgClient.ts`
Cambiamos de usar `password` a `passhash`:

```typescript
// ANTES
const PRTG_PASSWORD = process.env.PRTG_PASSWORD || '';
url.searchParams.append('password', this.password);

// DESPUÉS
const PRTG_PASSHASH = process.env.PRTG_PASSHASH || '';
url.searchParams.append('passhash', this.passhash);
```

## 🚀 Próximo Paso

**IMPORTANTE:** Reiniciar el servidor para que tome los cambios:

1. En la terminal donde corre `npm run dev`, presionar `Ctrl+C`
2. Ejecutar de nuevo:
   ```bash
   npm run dev
   ```
3. Probar la API:
   ```
   http://localhost:3000/api/status
   ```

## ✅ Resultado Esperado

Ahora deberías ver:
```json
{
  "success": true,
  "data": [
    {
      "id": "3",
      "name": "CABASE",
      "status": "Up",
      ...
    }
  ]
}
```

## 📝 Nota sobre Passhash

**¿Por qué usar passhash?**
- Más seguro que password en la URL
- Se puede cambiar sin cambiar la contraseña real
- Recomendado por PRTG para APIs

**¿Cómo obtenerlo siempre?**
```
http://servidor-prtg/api/getpasshash.htm?username=X&password=Y
```
