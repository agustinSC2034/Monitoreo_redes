# 🚀 Plan Final - Dashboard PRTG con Vercel (100% GRATIS)

**Fecha:** 22/10/2025  
**Proyecto:** Sistema de Monitoreo USITTEL - Tandil  
**Arquitectura:** Next.js en Vercel (Serverless)  
**Costo:** $0/mes  

---

## 🎯 ARQUITECTURA FINAL SELECCIONADA

### Stack Tecnológico: Next.js 14+ en Vercel (Todo en Uno)

```
┌─────────────────────────────────────────────────────────┐
│                   VERCEL (100% GRATIS)                  │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │         FRONTEND (Next.js Pages)               │    │
│  │  - Dashboard principal                         │    │
│  │  - Gráficos interactivos (Recharts)            │    │
│  │  - Componentes React                           │    │
│  │  - Tailwind CSS (estilos)                      │    │
│  └─────────────────┬──────────────────────────────┘    │
│                    │                                     │
│                    ▼                                     │
│  ┌────────────────────────────────────────────────┐    │
│  │    BACKEND (Next.js API Routes - Serverless)   │    │
│  │                                                 │    │
│  │  /api/sensors.js      → Lista sensores         │    │
│  │  /api/sensor/[id].js  → Datos de un sensor     │    │
│  │  /api/historical.js   → Datos históricos       │    │
│  │  /api/status.js       → Estado en tiempo real  │    │
│  └─────────────────┬──────────────────────────────┘    │
│                    │                                     │
└────────────────────┼─────────────────────────────────────┘
                     │
                     │ HTTP GET Requests
                     ▼
        ┌─────────────────────────────────┐
        │      PRTG API (Tu Servidor)     │
        │  http://38.253.65.250:8080      │
        │                                 │
        │  Sensores:                      │
        │  - CABASE (id=3)                │
        │  - ARSAT (id=4)                 │
        │  - TECO (id=6)                  │
        │  - IPLAN (id=65)                │
        └─────────────────────────────────┘
```

---

## 📦 ESTRUCTURA DEL PROYECTO NEXT.JS

```
monitoreo-usittel/
├── pages/
│   ├── index.js                    # 🏠 Dashboard principal
│   ├── sensors/
│   │   └── [id].js                 # 📊 Detalle de sensor individual
│   ├── history.js                  # 📈 Vista de históricos
│   └── api/                        # 🔌 BACKEND (API Routes)
│       ├── sensors.js              # GET todos los sensores
│       ├── sensor/
│       │   └── [id].js             # GET sensor específico
│       ├── historical.js           # GET datos históricos
│       └── status.js               # GET estado general
│
├── components/
│   ├── SensorCard.js               # Tarjeta de sensor
│   ├── LiveGraph.js                # Gráfico en tiempo real
│   ├── HistoricalChart.js          # Gráfico histórico
│   ├── StatusIndicator.js          # Indicador de estado (🟢🟡🔴)
│   ├── NetworkTopology.js          # Diagrama de red
│   └── Layout.js                   # Layout general
│
├── lib/
│   ├── prtgClient.js               # Cliente para PRTG API
│   └── utils.js                    # Funciones auxiliares
│
├── styles/
│   └── globals.css                 # Estilos globales (Tailwind)
│
├── public/
│   └── images/                     # Logos, iconos
│
├── .env.local                      # Variables de entorno
├── next.config.js                  # Configuración Next.js
├── package.json                    # Dependencias
└── README.md
```

---

## 🔌 INTEGRACIÓN CON PRTG API

### 1. Cliente PRTG (`lib/prtgClient.js`)

```javascript
// lib/prtgClient.js
const PRTG_BASE_URL = process.env.PRTG_BASE_URL; // http://38.253.65.250:8080
const PRTG_USERNAME = process.env.PRTG_USERNAME;
const PRTG_PASSHASH = process.env.PRTG_PASSHASH;

class PRTGClient {
  constructor() {
    this.baseURL = PRTG_BASE_URL;
    this.username = PRTG_USERNAME;
    this.passhash = PRTG_PASSHASH;
  }

  // Construye URL con autenticación
  buildURL(endpoint, params = {}) {
    const url = new URL(`${this.baseURL}${endpoint}`);
    url.searchParams.append('username', this.username);
    url.searchParams.append('passhash', this.passhash);
    
    Object.keys(params).forEach(key => {
      url.searchParams.append(key, params[key]);
    });
    
    return url.toString();
  }

  // Obtener todos los sensores
  async getSensors() {
    const url = this.buildURL('/api/table.json', {
      content: 'sensors',
      columns: 'objid,sensor,device,status,lastvalue,message,priority'
    });
    
    const response = await fetch(url);
    if (!response.ok) throw new Error('Error al obtener sensores');
    return await response.json();
  }

  // Obtener sensor específico
  async getSensor(sensorId) {
    const url = this.buildURL('/api/getsensordetails.json', {
      id: sensorId
    });
    
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Error al obtener sensor ${sensorId}`);
    return await response.json();
  }

  // Obtener datos históricos
  async getHistoricalData(sensorId, startDate, endDate, avgInterval = 0) {
    const url = this.buildURL('/api/historicdata.json', {
      id: sensorId,
      avg: avgInterval,  // 0 = raw data, 300 = 5min avg, 3600 = 1h avg
      sdate: startDate,  // Formato: 2025-10-20-00-00-00
      edate: endDate
    });
    
    const response = await fetch(url);
    if (!response.ok) throw new Error('Error al obtener históricos');
    return await response.json();
  }

  // Obtener estado de sensores específicos (IPLAN, ARSAT, etc)
  async getCriticalSensors() {
    const sensorIds = [3, 4, 6, 65]; // CABASE, ARSAT, TECO, IPLAN
    
    const promises = sensorIds.map(id => this.getSensor(id));
    const results = await Promise.all(promises);
    
    return results;
  }

  // Obtener valores actuales de canales de un sensor
  async getSensorChannels(sensorId) {
    const url = this.buildURL('/api/table.json', {
      content: 'channels',
      id: sensorId,
      columns: 'name,lastvalue,lastvalue_raw'
    });
    
    const response = await fetch(url);
    if (!response.ok) throw new Error('Error al obtener canales');
    return await response.json();
  }
}

export default new PRTGClient();
```

---

### 2. API Routes (Backend Serverless)

#### `/pages/api/sensors.js` - Obtener todos los sensores

```javascript
// pages/api/sensors.js
import prtgClient from '@/lib/prtgClient';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const sensors = await prtgClient.getSensors();
    
    res.status(200).json({
      success: true,
      data: sensors,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error en /api/sensors:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error al obtener sensores de PRTG',
      message: error.message
    });
  }
}
```

#### `/pages/api/sensor/[id].js` - Obtener sensor específico

```javascript
// pages/api/sensor/[id].js
import prtgClient from '@/lib/prtgClient';

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const sensor = await prtgClient.getSensor(id);
    const channels = await prtgClient.getSensorChannels(id);
    
    res.status(200).json({
      success: true,
      data: {
        sensor,
        channels
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(`Error en /api/sensor/${id}:`, error);
    res.status(500).json({ 
      success: false,
      error: `Error al obtener sensor ${id}`,
      message: error.message
    });
  }
}
```

#### `/pages/api/historical.js` - Datos históricos

```javascript
// pages/api/historical.js
import prtgClient from '@/lib/prtgClient';

export default async function handler(req, res) {
  const { sensorId, days = 1 } = req.query;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  if (!sensorId) {
    return res.status(400).json({ error: 'Se requiere sensorId' });
  }

  try {
    // Calcular fechas
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const formatDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hour = String(date.getHours()).padStart(2, '0');
      const min = String(date.getMinutes()).padStart(2, '0');
      const sec = String(date.getSeconds()).padStart(2, '0');
      return `${year}-${month}-${day}-${hour}-${min}-${sec}`;
    };

    const data = await prtgClient.getHistoricalData(
      sensorId,
      formatDate(startDate),
      formatDate(endDate),
      300 // 5 minutos de promedio
    );
    
    res.status(200).json({
      success: true,
      data,
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        days: parseInt(days)
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error en /api/historical:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error al obtener datos históricos',
      message: error.message
    });
  }
}
```

#### `/pages/api/status.js` - Estado general de sensores críticos

```javascript
// pages/api/status.js
import prtgClient from '@/lib/prtgClient';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const criticalSensors = await prtgClient.getCriticalSensors();
    
    // Mapear a formato más amigable
    const status = criticalSensors.map(sensor => ({
      id: sensor.sensorid || sensor.objid,
      name: sensor.name,
      status: sensor.statustext || sensor.status,
      lastValue: sensor.lastvalue,
      lastCheck: sensor.lastcheck,
      message: sensor.lastmessage || sensor.message
    }));
    
    res.status(200).json({
      success: true,
      data: status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error en /api/status:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error al obtener estado de sensores críticos',
      message: error.message
    });
  }
}
```

---

### 3. Variables de Entorno (`.env.local`)

```bash
# .env.local
PRTG_BASE_URL=http://38.253.65.250:8080
PRTG_USERNAME=tu_usuario
PRTG_PASSHASH=tu_passhash

# Opcional: Para desarrollo local
NEXT_PUBLIC_APP_NAME=Monitoreo USITTEL
```

**⚠️ IMPORTANTE:** 
- Este archivo NO se sube a GitHub (está en `.gitignore`)
- En Vercel, las variables se configuran en el dashboard

---

## 🎨 COMPONENTES FRONTEND

### Dashboard Principal (`pages/index.js`)

```javascript
// pages/index.js
import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import SensorCard from '@/components/SensorCard';
import LiveGraph from '@/components/LiveGraph';

export default function Dashboard() {
  const [sensors, setSensors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSensors();
    // Actualizar cada 30 segundos
    const interval = setInterval(fetchSensors, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchSensors = async () => {
    try {
      const response = await fetch('/api/status');
      const data = await response.json();
      if (data.success) {
        setSensors(data.data);
      }
    } catch (error) {
      console.error('Error al obtener sensores:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">
          Dashboard - Monitoreo USITTEL Tandil
        </h1>

        {loading ? (
          <p>Cargando...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {sensors.map(sensor => (
              <SensorCard key={sensor.id} sensor={sensor} />
            ))}
          </div>
        )}

        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Tráfico en Tiempo Real</h2>
          <LiveGraph sensorId={65} /> {/* IPLAN */}
        </div>
      </div>
    </Layout>
  );
}
```

### Componente de Tarjeta de Sensor

```javascript
// components/SensorCard.js
import Link from 'next/link';

export default function SensorCard({ sensor }) {
  const getStatusColor = (status) => {
    if (status.includes('Up')) return 'bg-green-500';
    if (status.includes('Warning')) return 'bg-yellow-500';
    if (status.includes('Down')) return 'bg-red-500';
    return 'bg-gray-500';
  };

  return (
    <Link href={`/sensors/${sensor.id}`}>
      <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition cursor-pointer">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">{sensor.name}</h3>
          <div className={`w-3 h-3 rounded-full ${getStatusColor(sensor.status)}`} />
        </div>
        
        <p className="text-2xl font-bold text-gray-800 mb-2">
          {sensor.lastValue}
        </p>
        
        <p className="text-sm text-gray-600">
          {sensor.message}
        </p>
        
        <p className="text-xs text-gray-400 mt-2">
          {new Date(sensor.lastCheck).toLocaleString()}
        </p>
      </div>
    </Link>
  );
}
```

### Componente de Gráfico

```javascript
// components/LiveGraph.js
import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function LiveGraph({ sensorId }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistoricalData();
    const interval = setInterval(fetchHistoricalData, 60000); // Actualizar cada minuto
    return () => clearInterval(interval);
  }, [sensorId]);

  const fetchHistoricalData = async () => {
    try {
      const response = await fetch(`/api/historical?sensorId=${sensorId}&days=1`);
      const result = await response.json();
      
      if (result.success) {
        // Procesar datos para Recharts
        const chartData = result.data.histdata?.map(item => ({
          time: new Date(item.datetime).toLocaleTimeString(),
          value: parseFloat(item.value_raw || item.value)
        })) || [];
        
        setData(chartData);
      }
    } catch (error) {
      console.error('Error al obtener datos históricos:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <p>Cargando gráfico...</p>;

  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="time" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line 
          type="monotone" 
          dataKey="value" 
          stroke="#8884d8" 
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
```

---

## 📦 DEPENDENCIAS (`package.json`)

```json
{
  "name": "monitoreo-usittel",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "recharts": "^2.10.0"
  },
  "devDependencies": {
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.31",
    "tailwindcss": "^3.3.5"
  }
}
```

---

## 🚀 DEPLOY EN VERCEL

### Paso 1: Preparar el Proyecto

```bash
# Crear proyecto Next.js
npx create-next-app@latest monitoreo-usittel

# Instalar dependencias
cd monitoreo-usittel
npm install recharts
```

### Paso 2: Configurar Variables de Entorno en Vercel

1. Ve a tu dashboard de Vercel
2. Selecciona tu proyecto
3. Ve a **Settings** → **Environment Variables**
4. Agrega:
   - `PRTG_BASE_URL` = `http://38.253.65.250:8080`
   - `PRTG_USERNAME` = (tu usuario)
   - `PRTG_PASSHASH` = (tu passhash)

### Paso 3: Deploy

```bash
# Opción A: Desde GitHub (Recomendado)
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/tu-usuario/monitoreo-usittel.git
git push -u origin main

# Luego en Vercel:
# 1. New Project
# 2. Import from GitHub
# 3. Select repository
# 4. Deploy (automático)

# Opción B: Deploy directo con Vercel CLI
npm install -g vercel
vercel login
vercel
```

### Paso 4: Configurar Dominio (Opcional)

En Vercel Dashboard:
1. **Domains** → Add Domain
2. Agregar `dashboard.usittel.com.ar`
3. Configurar DNS según instrucciones de Vercel

---

## ⚡ VENTAJAS DE ESTA ARQUITECTURA

### ✅ 100% Gratis
- Vercel free tier: 100GB bandwidth/mes
- Next.js API Routes: serverless (sin cargo)
- Deploy ilimitados

### ✅ Sin Configuración de Servidor
- No necesitás Docker
- No necesitás VPS
- No necesitás configurar Nginx/SSL

### ✅ Deploy Automático
- Push a GitHub → Deploy automático
- Preview deployments en cada PR
- Rollback con un click

### ✅ Performance
- CDN global (Edge Network)
- SSR (Server-Side Rendering) opcional
- Caché automático

### ✅ Escalabilidad
- Serverless functions escalan automáticamente
- Sin preocupación por tráfico

### ✅ Desarrollo Rápido
- Hot reload en desarrollo
- Fast Refresh
- Zero config

---

## 🔒 SEGURIDAD

### Variables de Entorno
```javascript
// ✅ CORRECTO: Variables en servidor (API Routes)
// pages/api/sensors.js
const PRTG_USERNAME = process.env.PRTG_USERNAME; // Solo servidor

// ❌ INCORRECTO: No exponer credenciales en frontend
// const PRTG_USERNAME = process.env.NEXT_PUBLIC_PRTG_USERNAME;
```

### CORS
- No hay problemas de CORS porque las llamadas a PRTG se hacen desde el servidor (API Routes)
- El navegador nunca llama directamente a PRTG

---

## 📊 LÍMITES DEL FREE TIER DE VERCEL

```
✅ Bandwidth: 100 GB/mes (suficiente para ~10,000 visitas/mes)
✅ Serverless Function Execution: 100 GB-Hrs/mes
✅ Deployments: Ilimitados
✅ Dominios custom: Incluidos
✅ SSL: Automático (Let's Encrypt)
✅ Colaboradores: Ilimitados

⚠️ Si superás los límites:
   - Hobby plan: $20/mes (1TB bandwidth)
```

---

## 📈 PRÓXIMOS PASOS

### Fase 1: MVP (Semana 1)
- [x] Arquitectura definida
- [ ] Crear proyecto Next.js
- [ ] Implementar cliente PRTG
- [ ] Crear API Routes básicas
- [ ] Dashboard con sensores críticos
- [ ] Deploy en Vercel

### Fase 2: Gráficos (Semana 2)
- [ ] Implementar gráficos históricos
- [ ] Gráficos en tiempo real
- [ ] Comparativas entre enlaces
- [ ] Responsive design

### Fase 3: Alertas (Semana 3-4)
- [ ] Sistema de detección de anomalías
- [ ] Notificaciones por email
- [ ] Panel de alertas
- [ ] Configuración de umbrales

---

## 🎯 COMANDOS RÁPIDOS

```bash
# Desarrollo local
npm run dev
# http://localhost:3000

# Build de producción
npm run build

# Deploy a Vercel
vercel

# Ver logs en tiempo real
vercel logs
```

---

**Documento creado:** 22/10/2025  
**Stack:** Next.js 14 + Vercel Serverless  
**Costo:** $0/mes  
**Estado:** ✅ Listo para implementar  
