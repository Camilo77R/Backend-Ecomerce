/**
 * 📱 INTEGRACIÓN CON FLUTTER
 * 
 * Este código es para tu app de Flutter
 * Copia el archivo auth_service.dart a tu proyecto Flutter en: lib/services/
 */

// === auth_service.dart ===

import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';

class AuthService {
  // URL de tu backend (cambia localhost por tu IP o dominio)
  static const String baseUrl = 'http://localhost:3000/api/auth';
  // Para dispositivos Android emulador, usa: http://10.0.2.2:3000/api/auth
  // Para dispositivos reales, usa tu IP: http://192.168.x.x:3000/api/auth

  // ========== REGISTRO ==========
  static Future<Map<String, dynamic>> register({
    required String nombre,
    required String email,
    required String password,
    String? gender,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/registrarse'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'nombre': nombre,
          'email': email,
          'password': password,
          if (gender != null) 'gender': gender,
        }),
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 201 && data['success'] == true) {
        // Guardar token y datos del usuario
        await _saveToken(data['token']);
        await _saveUserData(data['usuario']);
        return {
          'success': true,
          'token': data['token'],
          'usuario': data['usuario'],
        };
      } else {
        return {
          'success': false,
          'error': data['error'] ?? 'Error en registro',
        };
      }
    } catch (e) {
      return {
        'success': false,
        'error': 'Error de conexión: $e',
      };
    }
  }

  // ========== LOGIN ==========
  static Future<Map<String, dynamic>> login({
    required String email,
    required String password,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/iniciar-sesion'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'email': email,
          'password': password,
        }),
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 200 && data['success'] == true) {
        // Guardar token y datos del usuario
        await _saveToken(data['token']);
        await _saveUserData(data['usuario']);
        return {
          'success': true,
          'token': data['token'],
          'usuario': data['usuario'],
        };
      } else {
        return {
          'success': false,
          'error': data['error'] ?? 'Credenciales inválidas',
        };
      }
    } catch (e) {
      return {
        'success': false,
        'error': 'Error de conexión: $e',
      };
    }
  }

  // ========== OBTENER PERFIL (protegido) ==========
  static Future<Map<String, dynamic>> getProfile() async {
    try {
      final token = await _getToken();
      if (token == null) {
        return {
          'success': false,
          'error': 'No hay token guardado. Por favor inicia sesión.',
        };
      }

      final response = await http.get(
        Uri.parse('$baseUrl/perfil'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 200) {
        return {
          'success': true,
          'usuario': data['usuario'],
        };
      } else {
        return {
          'success': false,
          'error': data['error'] ?? 'Error al obtener perfil',
        };
      }
    } catch (e) {
      return {
        'success': false,
        'error': 'Error de conexión: $e',
      };
    }
  }

  // ========== ACTUALIZAR PERFIL (protegido) ==========
  static Future<Map<String, dynamic>> updateProfile({
    String? nombre,
    String? email,
    String? gender,
    String? avatarUrl,
  }) async {
    try {
      final token = await _getToken();
      if (token == null) {
        return {
          'success': false,
          'error': 'No hay token guardado. Por favor inicia sesión.',
        };
      }

      final body = <String, dynamic>{};
      if (nombre != null) body['nombre'] = nombre;
      if (email != null) body['email'] = email;
      if (gender != null) body['gender'] = gender;
      if (avatarUrl != null) body['avatar_url'] = avatarUrl;

      final response = await http.put(
        Uri.parse('$baseUrl/perfil'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode(body),
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 200 && data['success'] == true) {
        // ✅ Guardar datos actualizados localmente
        await _saveUserData(data['usuario']);
        return {
          'success': true,
          'usuario': data['usuario'],
        };
      } else {
        return {
          'success': false,
          'error': data['error'] ?? 'Error al actualizar perfil',
        };
      }
    } catch (e) {
      return {
        'success': false,
        'error': 'Error de conexión: $e',
      };
    }
  }

  // ========== ELIMINAR CUENTA (protegido) ==========
  static Future<Map<String, dynamic>> deleteAccount({
    required String password,
  }) async {
    try {
      final token = await _getToken();
      if (token == null) {
        return {
          'success': false,
          'error': 'No hay token guardado. Por favor inicia sesión.',
        };
      }

      final response = await http.delete(
        Uri.parse('$baseUrl/perfil'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({'password': password}),
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 200 && data['success'] == true) {
        // ✅ Eliminar token y datos guardados localmente
        await _clearToken();
        await _clearUserData();
        return {
          'success': true,
          'message': data['message'],
        };
      } else {
        return {
          'success': false,
          'error': data['error'] ?? 'Error al eliminar cuenta',
        };
      }
    } catch (e) {
      return {
        'success': false,
        'error': 'Error de conexión: $e',
      };
    }
  }

  // ========== CERRAR SESIÓN ==========
  static Future<void> logout() async {
    await _clearToken();
    await _clearUserData();
  }

  // ========== UTILIDADES: Guardar/Obtener Token y Usuario ==========
  static Future<void> _saveToken(String token) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('auth_token', token);
  }

  static Future<String?> _getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('auth_token');
  }

  static Future<void> _clearToken() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('auth_token');
  }

  // Guardar datos del usuario
  static Future<void> _saveUserData(Map<String, dynamic> usuario) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('user_data', jsonEncode(usuario));
  }

  // Obtener datos del usuario guardados localmente
  static Future<Map<String, dynamic>?> getUserDataLocal() async {
    final prefs = await SharedPreferences.getInstance();
    final userDataJson = prefs.getString('user_data');
    if (userDataJson == null) return null;
    return jsonDecode(userDataJson);
  }

  // Limpiar datos del usuario
  static Future<void> _clearUserData() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('user_data');
  }

  // Verificar si hay sesión activa
  static Future<bool> isLoggedIn() async {
    final token = await _getToken();
    return token != null;
  }
}
