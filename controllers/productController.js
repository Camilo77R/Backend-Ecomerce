/**  
 * 🎯 Chef Especialista en Productos  
 *   
 * Este controller es como un chef que solo sabe preparar platillos de productos.  
 * Cada método es una receta diferente: listar, crear, actualizar, eliminar.  
 *   
 * 📚 Conceptos clave:  
 * - Single Responsibility: Solo maneja lógica de productos  
 * - Async/Await: Maneja operaciones asíncronas de forma elegante  
 * - Desestructuración: Extrae datos del request de forma limpia  
 */  
  
import supabase from '../services/supabase.js';  
  
class ProductController {  
  /**  
   * 📋 Receta: "Mostrar Catálogo Completo"  
   *   
   * 🤔 ¿Qué hace? Trae todos los productos de la base de datos  
   * 🔍 ¿Por qué ordenar por fecha? Los más recientes primero  
   * 🛡️ ¿Por qué try/catch? Para manejar errores inesperados  
   *   
   * @param {Object} req - Request HTTP (petición del cliente)  
   * @param {Object} res - Response HTTP (respuesta al cliente)  
   */  
  static async getProducts(req, res) {  
    try {  
      // 🔍 Consulta a Supabase: "trae todo de productos, ordenado por fecha"  
      const { data, error } = await supabase  
        .from('products')  
        .select('*')  
        .order('created_at', { ascending: false });  
  
      // 🚨 Si hay error, lo registramos y respondemos con error 500  
      if (error) {  
        console.error('🔥 Error fetching products:', error);  
        return res.status(500).json({   
          success: false,   
          error: 'Error al obtener productos',  
          details: error.message   
        });  
      }  
  
      // ✅ Éxito: respondemos con los datos  
      res.json({   
        success: true,   
        data: data || [],  
        count: data?.length || 0,  
        message: `Se encontraron ${data?.length || 0} productos`  
      });  
    } catch (error) {  
      // 🚨 Error inesperado (ej: caída de conexión)  
      console.error('💥 Unexpected error in getProducts:', error);  
      res.status(500).json({   
        success: false,   
        error: 'Error interno del servidor'   
      });  
    }  
  }  
  
  /**  
   * 🍳 Receta: "Crear Nuevo Producto"  
   *   
   * 🤔 ¿Qué hace? Agrega un producto nuevo a la base de datos  
   * 🔍 ¿Por qué validar? Para evitar datos basura o maliciosos  
   * 🛡️ ¿Por qué sanitizar? Para limpiar los datos antes de guardar  
   *   
   * 📝 Flujo de validación:  
   * 1. Extraer datos del request  
   * 2. Validar cada campo  
   * 3. Sanitizar (limpiar) los datos  
   * 4. Insertar en base de datos  
   * 5. Responder con el producto creado  
   */  
  static async createProduct(req, res) {  
    try {  
      // 📦 Extraer datos del cuerpo de la petición  
      const { name, price, image_url, quantity = 1 } = req.body;  
  
      // 🛡️ VALIDACIONES - Como un guardia que revisa invitados  
  
      // Validación del nombre: debe existir y ser texto válido  
      if (!name || typeof name !== 'string' || name.trim().length === 0) {  
        return res.status(400).json({   
          success: false,   
          error: 'El nombre del producto es requerido y debe ser válido',  
          code: 'INVALID_NAME'  
        });  
      }  
  
      // Validación del precio: debe ser número positivo  
      if (!price || typeof price !== 'number' || price <= 0) {  
        return res.status(400).json({   
          success: false,   
          error: 'El precio debe ser un número mayor a 0',  
          code: 'INVALID_PRICE'  
        });  
      }  
  
      // Validación de la URL (opcional): si existe, debe ser texto  
      if (image_url && typeof image_url !== 'string') {  
        return res.status(400).json({   
          success: false,   
          error: 'La URL de la imagen debe ser una cadena de texto válida',  
          code: 'INVALID_IMAGE_URL'  
        });  
      }  
  
      // 🧹 SANITIZACIÓN - Como limpiar ingredientes antes de cocinar  
      const productData = {  
        name: name.trim(), // Elimina espacios extra  
        price: parseFloat(price.toFixed(2)), // 2 decimales exactos  
        image_url: image_url || null, // null si no se proporciona  
        quantity: parseInt(quantity) || 1, // asegurar número entero  
        created_at: new Date().toISOString() // timestamp actual  
      };  
  
      // 💾 INSERTAR EN BASE DE DATOS  
      const { data, error } = await supabase  
        .from('products')  
        .insert([productData])  
        .select()  
        .single(); // .single() para obtener un solo objeto  
  
      // 🚨 Manejo de errores de base de datos  
      if (error) {  
        console.error('🔥 Error creating product:', error);  
        return res.status(500).json({   
          success: false,   
          error: 'Error al crear el producto',  
          details: error.message   
        });  
      }  
  
      // ✅ Éxito: responder con 201 (Created) y el producto  
      res.status(201).json({   
        success: true,   
        data: data,  
        message: '✅ Producto creado exitosamente',  
        timestamp: new Date().toISOString()  
      });  
    } catch (error) {  
      // 🚨 Error inesperado  
      console.error('💥 Unexpected error in createProduct:', error);  
      res.status(500).json({   
        success: false,   
        error: 'Error interno del servidor'   
      });  
    }  
  }  
  
  /**  
   * ✏️ Receta: "Actualizar Producto Existente"  
   *   
   * 🤔 ¿Qué hace? Modifica un producto que ya existe  
   * 🔍 ¿Por qué verificar existencia? Para no actualizar fantasmas  
   * 🛡️ ¿Por qué actualización parcial? Para cambiar solo lo necesario  
   */  
  static async updateProduct(req, res) {  
    try {  
      // 🎯 Extraer ID de los parámetros de la URL  
      const { id } = req.params;  
      const { name, price, image_url, quantity } = req.body;  
  
      // 🛡️ Validar que el ID exista  
      if (!id) {  
        return res.status(400).json({   
          success: false,   
          error: 'ID del producto es requerido',  
          code: 'MISSING_ID'  
        });  
      }  
  
      // 🛡️ Validar que al menos haya algo para actualizar  
      if (!name && !price && !image_url && !quantity) {  
        return res.status(400).json({   
          success: false,   
          error: 'Debe proporcionar al menos un campo para actualizar',  
          code: 'NOTHING_TO_UPDATE'  
        });  
      }  
  
      // 🏗️ Construir objeto de actualización dinámico  
      const updateData = { updated_at: new Date().toISOString() };  
  
      // Solo agregar campos que se proporcionaron  
      if (name !== undefined) {  
        if (!name || typeof name !== 'string' || name.trim().length === 0) {  
          return res.status(400).json({   
            success: false,   
            error: 'El nombre del producto debe ser válido',  
            code: 'INVALID_NAME'  
          });  
        }  
        updateData.name = name.trim();  
      }  
  
      if (price !== undefined) {  
        if (!price || typeof price !== 'number' || price <= 0) {  
          return res.status(400).json({   
            success: false,   
            error: 'El precio debe ser un número mayor a 0',  
            code: 'INVALID_PRICE'  
          });  
        }  
        updateData.price = parseFloat(price.toFixed(2));  
      }  
  
      if (image_url !== undefined) {  
        if (image_url && typeof image_url !== 'string') {  
          return res.status(400).json({   
            success: false,   
            error: 'La URL de la imagen debe ser válida',  
            code: 'INVALID_IMAGE_URL'  
          });  
        }  
        updateData.image_url = image_url || null;  
      }  
  
      if (quantity !== undefined) {  
        updateData.quantity = parseInt(quantity) || 1;  
      }  
  
      console.log('🔄 Actualizando producto ID:', id);
      console.log('📦 Datos a actualizar:', updateData);
  
      // 💾 ACTUALIZAR EN BASE DE DATOS - PASO 1: HACER EL UPDATE
      const { error: updateError } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', id);
  
      // 🚨 Manejo de errores del UPDATE
      if (updateError) {
        console.error('🔥 Error updating product:', updateError);
        return res.status(500).json({
          success: false,
          error: 'Error al actualizar el producto',
          details: updateError.message,
          hint: updateError.hint || 'Verificar la consulta'
        });
      }
  
      console.log('✅ UPDATE exitoso, obteniendo producto actualizado...');
  
      // 📥 OBTENER PRODUCTO ACTUALIZADO - PASO 2: HACER SELECT
      const { data, error: selectError } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();
  
      // 🚨 Manejo de errores del SELECT
      if (selectError) {
        console.error('⚠️ Error fetching updated product:', selectError);
        // El UPDATE funcionó, pero no pudimos obtener el producto actualizado
        return res.json({
          success: true,
          message: '✅ Producto actualizado exitosamente',
          warning: 'No se pudo obtener el producto actualizado',
          timestamp: new Date().toISOString()
        });
      }
  
      // 🚨 Verificar si el producto existe
      if (!data) {
        return res.status(404).json({
          success: false,
          error: 'Producto no encontrado',
          code: 'PRODUCT_NOT_FOUND'
        });
      }
  
      console.log('🎉 Producto actualizado correctamente:', data.name);
  
      // ✅ Éxito
      res.json({
        success: true,
        data: data,
        message: '✅ Producto actualizado exitosamente',
        timestamp: new Date().toISOString()
      });
  
    } catch (error) {
      console.error('💥 Unexpected error in updateProduct:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
      });
    }
  }  
  
  /**  
   * 🗑️ Receta: "Eliminar Producto"  
   *   
   * 🤔 ¿Qué hace? Borra permanentemente un producto  
   * 🔍 ¿Por qué verificar primero? Para confirmar que existe  
   * 🛡️ ¿Por qué soft delete? En producción es mejor marcar como inactivo  
   */  
  static async deleteProduct(req, res) {  
    try {  
      // 🎯 Extraer ID  
      const { id } = req.params;  
  
      // 🛡️ Validar ID  
      if (!id) {  
        return res.status(400).json({   
          success: false,   
          error: 'ID del producto es requerido',  
          code: 'MISSING_ID'  
        });  
      }  
  
      // 🔍 Primero verificar si el producto existe  
      const { data: existingProduct, error: fetchError } = await supabase  
        .from('products')  
        .select('id, name')  
        .eq('id', id)  
        .single();  
  
      if (fetchError) {  
        console.error('🔥 Error checking product existence:', fetchError);  
        return res.status(500).json({   
          success: false,   
          error: 'Error al verificar el producto',  
          details: fetchError.message   
        });  
      }  
  
      if (!existingProduct) {  
        return res.status(404).json({   
          success: false,   
          error: 'Producto no encontrado',  
          code: 'PRODUCT_NOT_FOUND'  
        });  
      }  
  
      // 🗑️ Eliminar el producto  
      const { error } = await supabase  
        .from('products')  
        .delete()  
        .eq('id', id);  
  
      if (error) {  
        console.error('🔥 Error deleting product:', error);  
        return res.status(500).json({   
          success: false,   
          error: 'Error al eliminar el producto',  
          details: error.message   
        });  
      }  
  
      // ✅ Éxito con mensaje personalizado  
      res.json({   
        success: true,   
        message: `✅ Producto "${existingProduct.name}" eliminado exitosamente`,  
        deletedProductId: id,  
        timestamp: new Date().toISOString()  
      });  
    } catch (error) {  
      console.error('💥 Unexpected error in deleteProduct:', error);  
      res.status(500).json({   
        success: false,   
        error: 'Error interno del servidor'   
      });  
    }  
  }  
}  
  
// 📤 Exportar el chef especialista  
export default ProductController;