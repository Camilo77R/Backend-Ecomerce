/**  
 * 🗺️ Menú del Restaurante de Productos  
 *   
 * Este archivo es como el menú que dice:  
 * - "Para ver productos, llama al Chef getProducts"  
 * - "Para crear productos, llama al Chef createProduct"  
 * - etc.  
 *   
 * 📚 Conceptos clave:  
 * - Router Express: Organiza las rutas por tema  
 * - Middleware: Funciones que se ejecutan antes que el controller  
 * - Route Parameters: Variables en la URL (como :id)  
 */  
  
import express from 'express';  
import ProductController from '../controllers/productController.js';  
import { authenticateToken } from '../utils/auth.js';  
  
// 🍽️ Crear el menú de productos  
const router = express.Router();  
  
/**  
 * 📋 Ruta: "Mostrar Catálogo"  
 *   
 * 🤔 ¿Qué hace? Lista todos los productos  
 * 🔓 ¿Por qué pública? Para que cualquiera pueda ver los productos  
 * 📍 URL: GET /api/products  
 *   
 * 📊 Flujo:  
 * Cliente → GET /api/products → Middleware (ninguno) → ProductController.getProducts → Respuesta  
 */  
router.get('/', ProductController.getProducts);  
  
/**  
 * 🍳 Ruta: "Crear Nuevo Producto"  
 *   
 * 🤔 ¿Qué hace? Agrega un producto nuevo  
 * 🔒 ¿Por qué privada? Solo usuarios autenticados pueden crear  
 * 📍 URL: POST /api/products  
 *   
 * 🛡️ Flujo de seguridad:  
 * Cliente → POST /api/products → authenticateToken → ProductController.createProduct → Respuesta  
 */  
router.post('/', ProductController.createProduct);

/**  
 * ✏️ Ruta: "Actualizar Producto"  
 *   
 * 🤔 ¿Qué hace? Modifica un producto existente  
 * 🔒 ¿Por qué privada? Solo usuarios autenticados pueden modificar  
 * 📍 URL: PUT /api/products/:id  
 *   
 * 🎯 :id es un parámetro que captura el ID del producto  
 */  
router.put('/:id',  ProductController.updateProduct);  
  
/**  
 * 🗑️ Ruta: "Eliminar Producto"  
 *   
 * 🤔 ¿Qué hace? Borra un producto permanentemente  
 * 🔒 ¿Por qué privada? Solo usuarios autenticados pueden eliminar  
 * 📍 URL: DELETE /api/products/:id  
 */  
router.delete('/:id', ProductController.deleteProduct);  
  
// 📤 Exportar el menú completo  
export default router;