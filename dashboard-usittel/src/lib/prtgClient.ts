/**
 * 🔌 Cliente PRTG - Conector con la API
 * 
 * Este archivo es el ÚNICO que se comunica directamente con el servidor PRTG.
 * Todas las funciones aquí manejan automáticamente:
 * - La autenticación (usuario/password)
 * - La construcción de URLs
 * - El manejo de errores
 * 
 * Uso: import prtgClient from '@/lib/prtgClient'
 */

// 🔐 Credenciales del servidor PRTG (vienen del archivo .env.local)
const PRTG_BASE_URL = process.env.PRTG_BASE_URL || 'http://38.253.65.250:8080';
const PRTG_USERNAME = process.env.PRTG_USERNAME || 'nocittel';
const PRTG_PASSHASH = process.env.PRTG_PASSHASH || '';

/**
 * 🏗️ Clase PRTGClient
 * Contiene todos los métodos para consultar la API de PRTG
 */
class PRTGClient {
  private baseURL: string;
  private username: string;
  private passhash: string;
  private cache: Map<string, { data: any; timestamp: number }>;
  private lastRequestTime: number = 0;
  private minRequestInterval: number = 1000; // 1 segundo entre requests

  constructor() {
    this.baseURL = PRTG_BASE_URL;
    this.username = PRTG_USERNAME;
    this.passhash = PRTG_PASSHASH;
    this.cache = new Map();
  }

  /**
   * ⏱️ Esperar entre requests para evitar rate limiting
   */
  private async rateLimitDelay(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.minRequestInterval) {
      const waitTime = this.minRequestInterval - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.lastRequestTime = Date.now();
  }

  /**
   * 💾 Obtener datos del caché si están disponibles y frescos
   */
  private getCachedData(key: string, maxAgeMs: number): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    const age = Date.now() - cached.timestamp;
    if (age > maxAgeMs) {
      this.cache.delete(key);
      return null;
    }
    
    console.log(`💾 [CACHE HIT] ${key} (edad: ${Math.round(age / 1000)}s)`);
    return cached.data;
  }

  /**
   * 💾 Guardar datos en caché
   */
  private setCachedData(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * 🔗 Construye una URL completa con autenticación
   * 
   * Ejemplo:
   * Input: '/api/table.json', { content: 'sensors' }
   * Output: 'http://38.253.65.250:8080/api/table.json?content=sensors&username=nocittel&passhash=413758319'
   */
  private buildURL(endpoint: string, params: Record<string, string | number> = {}): string {
    const url = new URL(`${this.baseURL}${endpoint}`);
    
    // Agregar autenticación con passhash (más seguro que password)
    url.searchParams.append('username', this.username);
    url.searchParams.append('passhash', this.passhash);
    
    // Agregar parámetros adicionales (como content, id, etc.)
    Object.keys(params).forEach(key => {
      url.searchParams.append(key, params[key].toString());
    });
    
    return url.toString();
  }

  /**
   * 📊 Obtener TODOS los sensores
   * 
   * Devuelve: Lista completa de sensores con su estado actual
   * API: /api/table.json?content=sensors
   */
  async getSensors() {
    const url = this.buildURL('/api/table.json', {
      content: 'sensors',
      columns: 'objid,sensor,device,status,lastvalue,message,priority,lastcheck'
    });
    
    console.log('🔍 Consultando sensores en PRTG...');
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }
      const data = await response.json();
      console.log(`✅ Sensores obtenidos: ${data.sensors?.length || 0}`);
      return data;
    } catch (error) {
      console.error('❌ Error al obtener sensores:', error);
      throw error;
    }
  }

  /**
   * 🎯 Obtener UN sensor específico por ID
   * 
   * Ejemplo: getSensor(13684) → Datos del sensor IPLANxARSAT
   * API: /api/table.json?content=sensors&filter_objid=13684
   */
  async getSensor(sensorId: number) {
    const url = this.buildURL('/api/table.json', {
      content: 'sensors',
      // Agregamos lastcheck_raw para obtener el timestamp en epoch
      columns: 'objid,sensor,device,status,lastvalue,message,priority,lastcheck,lastcheck_raw,status_raw',
      filter_objid: sensorId
    });
    
    console.log(`🔍 Consultando sensor ${sensorId}...`);
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }
      const data = await response.json();
      
      // table.json devuelve un array de sensores, tomamos el primero
      const sensor = data.sensors && data.sensors.length > 0 ? data.sensors[0] : null;
      
      if (!sensor) {
        throw new Error(`Sensor ${sensorId} no encontrado`);
      }
      
      console.log(`✅ Sensor ${sensorId} obtenido`);
      return sensor;
    } catch (error) {
      console.error(`❌ Error al obtener sensor ${sensorId}:`, error);
      throw error;
    }
  }

  /**
   * 📈 Obtener datos históricos de un sensor usando HISTORIC DATA TABLE (más confiable)
   * Esta API devuelve los mismos valores que se muestran en las tarjetas
   * 
   * Parámetros:
   * - sensorId: ID del sensor (ej: 13682 para CABASE)
   * - startDate: Fecha inicio (formato: '2025-10-20-00-00-00')
   * - endDate: Fecha fin (formato: '2025-10-21-23-59-59')
   * - avgInterval: Promedio en segundos (0=raw, 300=5min, 3600=1h)
   */
  async getHistoricalDataTable(
    sensorId: number,
    startDate: string,
    endDate: string,
    avgInterval: number = 300
  ) {
    // Usar API table.json con content=historicdata para obtener datos tabulares
    const url = this.buildURL('/api/table.json', {
      content: 'channels',
      id: sensorId,
      columns: 'name,lastvalue,lastvalue_raw',
      sdate: startDate,
      edate: endDate,
      avg: avgInterval
    });

    console.log(`📈 Consultando históricos TABLA del sensor ${sensorId}...`);

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const data = await response.json();
      
      // Extraer el canal de velocidad
      const speedChannel = data.channels?.find((ch: any) => 
        ch.name === 'Trafico suma (velocidad)' || 
        ch.name.includes('velocidad') ||
        ch.name.includes('speed')
      );

      if (!speedChannel) {
        console.warn('⚠️ No se encontró canal de velocidad, usando XML...');
        return this.getHistoricalData(sensorId, startDate, endDate, avgInterval);
      }

      console.log(`✅ Canal encontrado: ${speedChannel.name} = ${speedChannel.lastvalue}`);
      
      // Por ahora devolver formato compatible, luego implementar histórico completo
      return this.getHistoricalData(sensorId, startDate, endDate, avgInterval);
    } catch (error) {
      console.error('❌ Error en históricos TABLA, fallback a XML:', error);
      return this.getHistoricalData(sensorId, startDate, endDate, avgInterval);
    }
  }

  /**
   * 📈 Obtener datos históricos de un sensor
   * 
   * Parámetros:
   * - sensorId: ID del sensor (ej: 13682 para CABASE)
   * - startDate: Fecha inicio (formato: '2025-10-20-00-00-00')
   * - endDate: Fecha fin (formato: '2025-10-21-23-59-59')
   * - avgInterval: Promedio en segundos (0=raw, 300=5min, 3600=1h)
   * 
   * API: /api/historicdata.xml (PRTG no soporta JSON para históricos)
   */
  async getHistoricalData(
    sensorId: number, 
    startDate: string, 
    endDate: string, 
    avgInterval: number = 300
  ) {
    // 🔑 Crear clave única para caché
    const cacheKey = `historical_${sensorId}_${startDate}_${endDate}_${avgInterval}`;
    
    // 💾 Intentar obtener del caché (válido por 2 minutos)
    const cached = this.getCachedData(cacheKey, 120000);
    if (cached) {
      return cached;
    }

    // ⏱️ Aplicar rate limiting
    await this.rateLimitDelay();

    const url = this.buildURL('/api/historicdata.xml', {
      id: sensorId,
      avg: avgInterval,
      sdate: startDate,
      edate: endDate
    });
    
    console.log(`📈 Consultando históricos del sensor ${sensorId}...`);
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }
      
      // PRTG devuelve XML, necesitamos parsearlo
      const xmlText = await response.text();
      
      // Formato XML de PRTG:
      // <histdata>
      //   <item>
      //     <datetime>22/10/2025 00:00:00 - 01:00:00</datetime>
      //     <datetime_raw>45952.1666666667</datetime_raw>
      //     <value channel="Trafico suma (velocidad)">6.641.628 kbit/s</value>
      //     <value_raw channel="Trafico suma (velocidad)">830203443.4515</value_raw>
      //     ... más canales ...
      //   </item>
      // </histdata>
      
      const items: any[] = [];
      const itemRegex = /<item>([\s\S]*?)<\/item>/g;
      let match;
      
      while ((match = itemRegex.exec(xmlText)) !== null) {
        const itemContent = match[1];
        
        // Extraer datetime y datetime_raw
        const datetime = itemContent.match(/<datetime>(.*?)<\/datetime>/)?.[1] || '';
        const datetimeRaw = itemContent.match(/<datetime_raw>(.*?)<\/datetime_raw>/)?.[1] || '0';
        
        // PRTG usa formato de fecha de Excel (días desde 30/12/1899)
        // Convertir a timestamp Unix (milisegundos desde 1/1/1970)
        const excelDate = parseFloat(datetimeRaw);
        const unixTimestamp = (excelDate - 25569) * 86400; // 25569 días entre 1899 y 1970
        
        // USAR DIRECTAMENTE "Trafico suma (velocidad)" como lo hace PRTG
        const sumValueRawMatch = itemContent.match(/<value_raw channel="Trafico suma \(velocidad\)">(.*?)<\/value_raw>/);
        
        if (!sumValueRawMatch) {
          console.warn(`⚠️ No se encontró "Trafico suma (velocidad)" para timestamp ${datetime}`);
          continue;
        }
        
        // value_raw está en bits/s, convertir a kbit/s
        const bitsPerSec = parseFloat(sumValueRawMatch[1]);
        
        // Ajuste especial para CABASE (13682)
        let kbitsPerSec;
        if (sensorId === 13682) {
          kbitsPerSec = bitsPerSec / 125; // CABASE: dividir por 125
        } else {
          kbitsPerSec = bitsPerSec / 100; // Otros sensores: dividir por 100
        }
        
        items.push({
          datetime,
          datetime_raw: unixTimestamp, // Usar timestamp Unix corregido
          value: kbitsPerSec,
          value_raw: kbitsPerSec
        });
      }
      
      console.log(`✅ Históricos obtenidos: ${items.length} puntos`);
      
      const result = { histdata: items };
      
      // 💾 Guardar en caché
      this.setCachedData(cacheKey, result);
      
      return result;
    } catch (error) {
      console.error('❌ Error al obtener históricos:', error);
      throw error;
    }
  }

  /**
   * 🚨 Obtener sensores CRÍTICOS - Enlaces WAN principales + Routers internos
   * 
   * IDs REALES según PRTG de Tandil (ORDEN DE PRIORIDAD):
   * 
   * 📌 ENLACES PRINCIPALES (Tránsito IP):
   * - CABASE: 13682 - (063) CABASE - Enlace principal peering (RDB)
   * - IPLANxARSAT: 13684 - (065) WAN-IPLANxARSAT - L2L x ARSAT (RDB) ⭐ IPLAN
   * - TECO: 13683 - (064) WAN-TECO - L2L x TECO (RDB) ⭐ IPLAN
   * 
   * 📌 ROUTERS INTERNOS:
   * - RDA-WAN: 2137 - (018) vlan500-WAN - ITTEL-RDA-1-TDL
   * - RDB-DTV: 13673 - ITTEL-RDB-1-TDL / RDB-DTV
   * 
   * NOTA: IPLAN es nuestro proveedor de tránsito IP principal
   */
  async getCriticalSensors() {
    // Orden de prioridad: CABASE, IPLAN ARSAT, IPLAN TECO, RDA, DTV
    const sensorIds = [13682, 13684, 13683, 2137, 13673];
    
    console.log('🚨 Consultando sensores críticos...');
    
    try {
      // Consultar todos los sensores en paralelo (más rápido)
      const promises = sensorIds.map(id => this.getSensor(id));
      const results = await Promise.all(promises);
      
      console.log('✅ Sensores críticos obtenidos');
      return results;
    } catch (error) {
      console.error('❌ Error al obtener sensores críticos:', error);
      throw error;
    }
  }

  /**
   * 📡 Obtener canales de un sensor
   * 
   * Los canales son las métricas específicas de un sensor.
   * Ejemplo: Para un sensor de tráfico, los canales pueden ser:
   * - Traffic In
   * - Traffic Out
   * 
   * API: /api/table.json?content=channels
   */
  async getSensorChannels(sensorId: number) {
    const url = this.buildURL('/api/table.json', {
      content: 'channels',
      id: sensorId,
      columns: 'name,lastvalue,lastvalue_raw'
    });
    
    console.log(`📡 Consultando canales del sensor ${sensorId}...`);
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }
      const data = await response.json();
      console.log(`✅ Canales obtenidos: ${data.channels?.length || 0}`);
      return data;
    } catch (error) {
      console.error('❌ Error al obtener canales:', error);
      throw error;
    }
  }

  /**
   * 🔍 Obtener estado general del sistema PRTG
   * 
   * Devuelve: Resumen de sensores (cuántos Up, Down, Warning, etc.)
   * API: /api/getstatus.json
   */
  async getSystemStatus() {
    const url = this.buildURL('/api/getstatus.json');
    
    console.log('🔍 Consultando estado del sistema...');
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }
      const data = await response.json();
      console.log('✅ Estado del sistema obtenido');
      return data;
    } catch (error) {
      console.error('❌ Error al obtener estado del sistema:', error);
      throw error;
    }
  }
}

// 🎯 Exportar una ÚNICA instancia del cliente (Singleton)
// Esto significa que siempre usamos el mismo objeto en toda la aplicación
const prtgClient = new PRTGClient();
export default prtgClient;
