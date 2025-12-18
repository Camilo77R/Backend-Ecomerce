// routes/auth.js
import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
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
 * - Retorna la información COMPLETA del usuario desde la base de datos
 * - El token se valida automáticamente por el middleware authenticateToken
 * 
 * Flujo:
 * Flutter envía token → Middleware valida → 
 * Backend obtiene datos de BD → Retorna datos completos del usuario
 */
router.get("/perfil", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Obtener datos COMPLETOS del usuario desde la tabla users
    const { data: usuario, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !usuario) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado',
        code: 'USER_NOT_FOUND'
      });
    }

    // No devolver la contraseña
    delete usuario.password;

    res.json({
      success: true,
      mensaje: "Accediste al perfil",
      usuario: usuario,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      code: 'SERVER_ERROR'
    });
  }
});

// Registro
router.post("/registrarse", async (req, res) => {
  try {
    // Aceptar tanto "contraseña" como "password"
    const { email, contraseña, password, nombre, gender } = req.body;
    const passwordFinal = contraseña || password;

    // Validar datos requeridos
    if (!email || !passwordFinal || !nombre) {
      return res.status(400).json({
        success: false,
        error: "Email, contraseña y nombre son obligatorios",
        code: "MISSING_FIELDS"
      });
    }

    // Paso 1: Registrar en Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password: passwordFinal,
    });

    if (error) throw error;

    // Paso 2: Hashear contraseña para guardarla en tabla users
    const hashedPassword = await bcrypt.hash(passwordFinal, 10);

    // Paso 3: Crear perfil en tabla users
    const { error: perfilError } = await supabase
      .from("users")
      .insert([{
        id: data.user.id,
        email,
        name: nombre,
        password: hashedPassword,
        gender: gender || null,
        avatar_url: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }]);

    if (perfilError) throw perfilError;

    // Paso 4: Generar token JWT
    const token = jwt.sign(
      {
        userId: data.user.id,
        email: email,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      success: true,
      mensaje: "Usuario registrado exitosamente",
      token,
      usuario: {
        id: data.user.id,
        email,
        nombre,
        gender
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
      code: "REGISTRATION_ERROR"
    });
  }
});

// Inicio de sesión
router.post("/iniciar-sesion", async (req, res) => {
  try {
    const { email, contraseña, password } = req.body;
    const passwordFinal = contraseña || password;

    // Validar campos requeridos
    if (!email || !passwordFinal) {
      return res.status(400).json({
        success: false,
        error: "Email y contraseña son requeridos",
        code: "MISSING_FIELDS"
      });
    }

    // Autenticar en Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: passwordFinal,
    });

    if (error) throw error;

    // Obtener datos completos del usuario de la tabla users
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (userError) throw userError;

    // Generar token JWT
    const token = jwt.sign(
      {
        userId: data.user.id,
        email: data.user.email,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Eliminar password de la respuesta
    delete userData.password;

    res.json({
      success: true,
      token,
      usuario: userData,
      message: "Sesión iniciada correctamente"
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      error: error.message || "Credenciales inválidas",
      code: "LOGIN_ERROR"
    });
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
    if (nombre) updateData.name = nombre.trim(); // ← Cambiar de 'nombre' a 'name'
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
