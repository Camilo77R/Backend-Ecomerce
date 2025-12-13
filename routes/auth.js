// routes/auth.js
import express from "express";
import jwt from "jsonwebtoken";
import supabase from "../services/supabase.js";
import { authenticateToken } from "../utils/auth.js";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

/**
 * 👤 Ruta: "Ver Perfil del Usuario"
 * 
 * 🔒 Requiere autenticación (token JWT)
 * 📍 URL: GET /api/auth/perfil
 * 
 * ¿Qué hace?
 * - Retorna la información del usuario actualmente autenticado
 * - El token se valida automáticamente por el middleware authenticateToken
 * 
 * Flujo:
 * Flutter envía token → Middleware valida → Retorna datos del usuario
 */
router.get("/perfil", authenticateToken, async (req, res) => {
  res.json({
    mensaje: "Accediste al perfil",
    usuario: req.user,
  });
});

// Registro
router.post("/registrarse", async (req, res) => {
  try {
    const { email, contraseña } = req.body;

    const { data, error } = await supabase.auth.signUp({
      email,
      password: contraseña,
    });

    if (error) throw error;

    const { error: perfilError } = await supabase
      .from("users")
      .insert([{ id: data.user.id, email }]);

    if (perfilError) throw perfilError;

    res.json({ mensaje: "Usuario registrado exitosamente" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Inicio de sesión
router.post("/iniciar-sesion", async (req, res) => {
  try {
    const { email, contraseña } = req.body;

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: contraseña,
    });

    if (error) throw error;

    const token = jwt.sign(
      {
        userId: data.user.id,
        email: data.user.email,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }  // 🕐 Token válido por 7 días
    );

    res.json({ token, usuario: data.user });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * ✏️ Ruta: "Actualizar Perfil del Usuario"
 * 
 * 🔒 Requiere autenticación (token JWT)
 * 📍 URL: PUT /api/auth/perfil
 * 
 * ¿Qué hace?
 * - Permite al usuario actualizar su información personal
 * - Puede cambiar email, nombre, o cualquier dato de perfil
 * - La contraseña se actualiza a través de Supabase Auth
 * 
 * ¿Por qué importante?
 * - El usuario logueado puede modificar sus datos
 * - Se valida que los datos sean válidos antes de guardar
 * - Se usa autenticación para proteger la ruta
 * 
 * Flujo:
 * Flutter envía PUT con token → Middleware valida → 
 * Node actualiza en Supabase → Retorna usuario actualizado
 * 
 * Campos que pueden actualizarse:
 * - email: nuevo email del usuario
 * - nombre: nombre completo o parcial
 * - telefono: número de contacto (opcional)
 * - direccion: dirección de envío (opcional)
 */
router.put("/perfil", authenticateToken, async (req, res) => {
  try {
    // 📦 Extraer datos del body
    const { email, nombre, telefono, direccion } = req.body;
    
    // 🆔 Obtener el ID del usuario desde el token (req.user viene del middleware)
    const userId = req.user.userId;

    // 🛡️ VALIDACIONES - Verificar que al menos hay algo para actualizar
    if (!email && !nombre && !telefono && !direccion) {
      return res.status(400).json({
        success: false,
        error: "Debe proporcionar al menos un campo para actualizar",
        code: "NOTHING_TO_UPDATE"
      });
    }

    // 🛡️ Validar email si se proporciona
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          error: "El email no es válido",
          code: "INVALID_EMAIL"
        });
      }
    }

    // 🛡️ Validar nombre si se proporciona
    if (nombre && (typeof nombre !== 'string' || nombre.trim().length === 0)) {
      return res.status(400).json({
        success: false,
        error: "El nombre debe ser texto válido",
        code: "INVALID_NAME"
      });
    }

    // 🏗️ Construir objeto de actualización dinámico (solo campos que vinieron)
    const updateData = {
      updated_at: new Date().toISOString()
    };

    if (email) updateData.email = email;
    if (nombre) updateData.nombre = nombre.trim();
    if (telefono) updateData.telefono = telefono;
    if (direccion) updateData.direccion = direccion.trim();

    // 💾 Actualizar usuario en la tabla 'users'
    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    // 🚨 Manejar errores de base de datos
    if (error) {
      console.error('🔥 Error updating user profile:', error);
      return res.status(500).json({
        success: false,
        error: 'Error al actualizar el perfil',
        details: error.message,
        code: 'DB_UPDATE_ERROR'
      });
    }

    // 🚨 Verificar si el usuario existía
    if (!data) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado',
        code: 'USER_NOT_FOUND'
      });
    }

    // ✅ Éxito - Retornar usuario actualizado
    res.json({
      success: true,
      message: '✅ Perfil actualizado exitosamente',
      usuario: data,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('💥 Unexpected error updating profile:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      code: 'INTERNAL_SERVER_ERROR'
    });
  }
});

/**
 * 🗑️ Ruta: "Eliminar Cuenta de Usuario"
 * 
 * 🔒 Requiere autenticación (token JWT)
 * 📍 URL: DELETE /api/auth/perfil
 * 
 * ⚠️ CUIDADO: Esta acción es IRREVERSIBLE
 * 
 * ¿Qué hace?
 * - Elimina completamente la cuenta del usuario
 * - Borra el usuario de Supabase Auth
 * - Borra el perfil de la tabla 'usuarios'
 * - El usuario no podrá volver a iniciar sesión
 * 
 * ¿Por qué importante?
 * - El usuario tiene derecho a borrar su cuenta
 * - Es una acción crítica que requiere protección
 * - Debe ser confirmada (Flutter envía contraseña para confirmar)
 * 
 * Flujo:
 * Flutter envía DELETE con token + contraseña → 
 * Node verifica contraseña en Supabase →
 * Node elimina usuario →
 * Retorna confirmación
 * 
 * Nota: Flutter debe solicitar al usuario su contraseña
 * como confirmación antes de eliminar
 */
router.delete("/perfil", authenticateToken, async (req, res) => {
  try {
    // 📦 Extraer contraseña del body (para confirmar que es el usuario real)
    const { contraseña } = req.body;

    // 🆔 Obtener el ID y email del usuario desde el token
    const userId = req.user.userId;
    const email = req.user.email;

    // 🛡️ Validación: la contraseña es requerida
    if (!contraseña) {
      return res.status(400).json({
        success: false,
        error: 'La contraseña es requerida para eliminar la cuenta',
        code: 'MISSING_PASSWORD'
      });
    }

    // 🔐 VERIFICACIÓN DE SEGURIDAD: Confirmar que la contraseña es correcta
    // Intentamos hacer login con los credenciales para verificar
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password: contraseña
    });

    if (authError) {
      return res.status(401).json({
        success: false,
        error: 'Contraseña incorrecta. No se puede eliminar la cuenta.',
        code: 'INVALID_PASSWORD'
      });
    }

    // 🔍 Primero verificar que el usuario existe en la tabla
    const { data: userExists, error: checkError } = await supabase
      .from('users')
      .select('id, email')
      .eq('id', userId)
      .single();

    if (checkError || !userExists) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado en el sistema',
        code: 'USER_NOT_FOUND'
      });
    }

    // 🗑️ PASO 1: Eliminar usuario de la tabla 'users'
    const { error: deleteProfileError } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (deleteProfileError) {
      console.error('🔥 Error deleting user profile:', deleteProfileError);
      return res.status(500).json({
        success: false,
        error: 'Error al eliminar el perfil del usuario',
        details: deleteProfileError.message,
        code: 'PROFILE_DELETE_ERROR'
      });
    }

    // 🗑️ PASO 2: Eliminar usuario de Supabase Auth
    const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(userId);

    if (deleteAuthError) {
      console.error('🔥 Error deleting auth user:', deleteAuthError);
      // Nota: Si falló aquí, el usuario ya fue eliminado de la tabla
      // Podría intentarse revertir, pero por simplicidad alertamos
      return res.status(500).json({
        success: false,
        error: 'Error al eliminar la autenticación del usuario',
        details: deleteAuthError.message,
        code: 'AUTH_DELETE_ERROR'
      });
    }

    // ✅ Éxito - Usuario completamente eliminado
    res.json({
      success: true,
      message: '✅ Cuenta eliminada exitosamente. El usuario ha sido removido del sistema.',
      deletedUserId: userId,
      email: email,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('💥 Unexpected error deleting user:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      code: 'INTERNAL_SERVER_ERROR'
    });
  }
});

export default router;
