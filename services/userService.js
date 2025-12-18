/**
 * 👤 User Service
 * 
 * Servicio centralizado para todas las operaciones relacionadas con usuarios
 * Aquí se concentran las lógicas de negocio de usuarios
 */

import supabase from './supabase.js';
import bcrypt from 'bcryptjs';

class UserService {
  /**
   * Obtener perfil completo del usuario
   * @param {string} userId - ID del usuario
   * @returns {Promise<Object>} Datos del usuario (sin contraseña)
   */
  async getUserProfile(userId) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error || !data) {
        throw new Error('Usuario no encontrado');
      }

      // No devolver la contraseña
      delete data.password;
      return data;
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw error;
    }
  }

  /**
   * Actualizar datos del usuario
   * @param {string} userId - ID del usuario
   * @param {Object} updateData - Datos a actualizar
   * @returns {Promise<Object>} Usuario actualizado
   */
  async updateUserProfile(userId, updateData) {
    try {
      // Validar email único si se intenta cambiar
      if (updateData.email) {
        const { data: existingUser } = await supabase
          .from('users')
          .select('id')
          .eq('email', updateData.email)
          .neq('id', userId)
          .single();

        if (existingUser) {
          throw new Error('Email ya está en uso');
        }
      }

      // Agregar timestamp de actualización
      const payload = {
        ...updateData,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('users')
        .update(payload)
        .eq('id', userId)
        .select()
        .single();

      if (error || !data) {
        throw new Error('Error al actualizar perfil');
      }

      delete data.password;
      return data;
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  /**
   * Obtener usuario por email (para validaciones)
   * @param {string} email - Email del usuario
   * @returns {Promise<Object|null>} Usuario encontrado o null
   */
  async getUserByEmail(email) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (error) return null;
      return data;
    } catch (error) {
      console.error('Error getting user by email:', error);
      return null;
    }
  }

  /**
   * Eliminar usuario (soft delete o hard delete)
   * @param {string} userId - ID del usuario
   * @returns {Promise<Object>} Confirmación de eliminación
   */
  async deleteUser(userId) {
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (error) {
        throw new Error('Error al eliminar usuario');
      }

      return {
        success: true,
        message: 'Usuario eliminado exitosamente',
        deletedUserId: userId
      };
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  /**
   * Crear usuario en tabla users (después del signup en Auth)
   * @param {Object} userData - Datos del usuario
   * @returns {Promise<Object>} Usuario creado
   */
  async createUserProfile(userId, userData) {
    try {
      const { name, email, gender, avatar_url } = userData;

      const { data, error } = await supabase
        .from('users')
        .insert([{
          id: userId,
          name,
          email,
          gender: gender || null,
          avatar_url: avatar_url || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      delete data.password;
      return data;
    } catch (error) {
      console.error('Error creating user profile:', error);
      throw error;
    }
  }
}

export default new UserService();
