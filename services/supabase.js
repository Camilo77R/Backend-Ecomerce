/**  
 * 🔌 Conector Mágico a Supabase  
 *   
 * Este archivo es como un enchufe mágico que conecta  
 * nuestra aplicación con la base de datos de Supabase.  
 *   
 * 📚 Conceptos clave:  
 * - Default export: Exportación principal del módulo  
 * - Environment variables: Variables de configuración seguras  
 * - Singleton pattern: Una sola conexión para toda la app  
 */  

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';  

// Cargar variables de entorno
dotenv.config();

/**  
 * 🏭 Crear la conexión a Supabase  
 *   
 * 🔍 ¿Por qué process.env? Para mantener credenciales seguras  
 * 🛡️ ¿Por qué no hardcodear? Para no exponer secrets en el código  
 * 📦 ¿Qué devuelve? Un cliente listo para usar  
 */  
const supabase = createClient(  
  process.env.SUPABASE_URL,  
  process.env.SUPABASE_ANON_KEY  
);  
  
// 📤 Exportar la conexión por defecto  
export default supabase;