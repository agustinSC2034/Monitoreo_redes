# 🚀 Dashboard USITTEL - Monitoreo de Red Tandil

Dashboard en tiempo real para monitorear enlaces de red (IPLAN, ARSAT, TECO, CABASE) usando PRTG API.

## 📋 Stack Tecnológico

- **Framework:** Next.js 15 (App Router)
- **Lenguaje:** TypeScript
- **Estilos:** Tailwind CSS
- **Gráficos:** Recharts
- **Deploy:** Vercel (100% gratis)

## 🏗️ Estructura del Proyecto

```
dashboard-usittel/
├── src/
│   ├── app/                    # Rutas de la aplicación
│   │   ├── api/               # API Routes (Backend serverless)
│   │   │   ├── sensors/       # GET todos los sensores
│   │   │   ├── sensor/        # GET sensor específico
│   │   │   ├── historical/    # GET datos históricos
│   │   │   └── status/        # GET estado general
│   │   ├── page.tsx           # Dashboard principal
│   │   └── layout.tsx         # Layout global
│   ├── components/             # Componentes React
│   └── lib/                    # Utilidades y cliente PRTG
├── public/                     # Archivos estáticos
└── .env.local                  # Variables de entorno (NO subir a Git)
```

## ⚙️ Configuración

1. **Configurar variables de entorno** en `.env.local`:

```bash
PRTG_BASE_URL=http://38.253.65.250:8080
PRTG_USERNAME=tu_usuario
PRTG_PASSHASH=tu_passhash
```

2. **Instalar dependencias:**

```bash
npm install
```

3. **Ejecutar en desarrollo:**

```bash
npm run dev
```

4. **Abrir navegador:**

```
http://localhost:3000
```

## 🚀 Deploy en Vercel

### Opción 1: Desde GitHub (Recomendado)

1. Crear repositorio en GitHub
2. Push del código
3. Conectar en Vercel Dashboard
4. Configurar variables de entorno en Vercel
5. Deploy automático

### Opción 2: Vercel CLI

```bash
npm install -g vercel
vercel login
vercel
```

## 📊 Sensores Monitoreados

| ID  | Nombre  | Descripción |
|-----|---------|-------------|
| 3   | CABASE  | Enlace CABASE |
| 4   | ARSAT   | Enlace ARSAT |
| 6   | TECO    | Enlace TECO |
| 65  | IPLAN   | Enlace IPLAN |

## 📚 Documentación

- **Hoja de ruta:** Ver `../PRTG/planFinal.md`
- **API PRTG:** Ver `../PRTG/info_api.md`

## 🛠️ Comandos Útiles

```bash
# Desarrollo
npm run dev

# Build
npm run build

# Producción local
npm run start

# Lint
npm run lint
```

## 📝 Próximos Pasos

- [ ] Implementar cliente PRTG (`lib/prtgClient.ts`)
- [ ] Crear API Routes
- [ ] Dashboard principal con sensores
- [ ] Gráficos en tiempo real
- [ ] Deploy en Vercel

---

**Proyecto:** USITTEL Tandil  
**Fecha:** Octubre 2025  
**Costo:** $0/mes (Vercel Free Tier)
