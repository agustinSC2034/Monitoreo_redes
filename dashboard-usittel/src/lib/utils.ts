/**
 * 🛠️ Utilidades - Funciones auxiliares
 * 
 * Funciones reutilizables en toda la aplicación
 */

/**
 * 📅 Formatear fecha para PRTG
 * 
 * PRTG espera fechas en formato: YYYY-MM-DD-HH-MM-SS
 * Ejemplo: 2025-10-22-14-30-00
 * 
 * @param date - Objeto Date de JavaScript
 * @returns String en formato PRTG
 */
export function formatDateForPRTG(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  const sec = String(date.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day}-${hour}-${min}-${sec}`;
}

/**
 * 📊 Obtener rango de fechas para históricos
 * 
 * Calcula automáticamente las fechas de inicio y fin
 * basándose en "cuántos días atrás" quieres consultar
 * 
 * @param days - Número de días hacia atrás (ej: 1 = últimas 24 horas)
 * @returns Objeto con startDate y endDate en formato PRTG
 */
export function getDateRange(days: number = 1) {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return {
    startDate: formatDateForPRTG(startDate),
    endDate: formatDateForPRTG(endDate),
    startDateObj: startDate,
    endDateObj: endDate
  };
}

/**
 * 🎨 Obtener color según estado del sensor
 * 
 * Estados PRTG:
 * - 1: Unknown (gris)
 * - 2: Scanning (azul)
 * - 3: Up (verde)
 * - 4: Warning (amarillo)
 * - 5: Down (rojo)
 * - 7: Paused (azul claro)
 * 
 * @param status - Número o texto del estado
 * @returns Color hex o nombre de clase Tailwind
 */
export function getStatusColor(status: string | number): string {
  const statusNum = typeof status === 'string' ? parseInt(status) : status;
  
  switch (statusNum) {
    case 3:
      return 'green'; // Up
    case 4:
      return 'yellow'; // Warning
    case 5:
      return 'red'; // Down
    case 13:
      return 'orange'; // Down Acknowledged
    case 7:
    case 8:
    case 9:
      return 'blue'; // Paused
    default:
      return 'gray'; // Unknown
  }
}

/**
 * 🔢 Formatear bytes a formato legible
 * 
 * Ejemplo: 1536000 → "1.5 MB"
 * 
 * @param bytes - Cantidad de bytes
 * @returns String formateado
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * ⏱️ Formatear timestamp a hora legible
 * 
 * Ejemplo: "2025-10-22T14:30:00Z" → "14:30"
 */
export function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString('es-AR', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
}

/**
 * 📅 Formatear timestamp a fecha legible
 * 
 * Ejemplo: "2025-10-22T14:30:00Z" → "22/10/2025"
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-AR');
}

/**
 * 🕐 Formatear timestamp completo
 * 
 * Ejemplo: "2025-10-22T14:30:00Z" → "22/10/2025 14:30"
 */
export function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return `${formatDate(dateString)} ${formatTime(dateString)}`;
}
