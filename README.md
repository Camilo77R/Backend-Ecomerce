# 🛍️ Backend E-Commerce con Autenticación JWT + Flutter

Backend completo en Express.js con autenticación de usuarios, integración con Supabase y soporte para Flutter.

---

## 🚀 Características

- ✅ Registro e login de usuarios con JWT
- ✅ Contraseñas hasheadas con bcrypt
- ✅ Gestión de perfil (obtener, actualizar, eliminar)
- ✅ Tokens con expiración de 7 días
- ✅ Base de datos PostgreSQL (Supabase)
- ✅ Protección de rutas con middleware
- ✅ Soporte para Flutter con SharedPreferences

---

## 📋 Requisitos

- **Node.js** v14+
- **npm** o **yarn**
- **Cuenta en Supabase** (https://supabase.com)
- **Flutter** (para integrar en app móvil)

---

## ⚙️ Instalación

### 1️⃣ Clonar el repositorio

```bash
git clone <tu-repositorio>
cd Backend-Ecomerce
```

### 2️⃣ Instalar dependencias

```bash
npm install
```

### 3️⃣ Configurar variables de entorno

Crear archivo `.env` en la raíz del proyecto:

```env
# Puerto
PORT=3000

# Supabase
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_KEY=tu-clave-anon-publica

# JWT
JWT_SECRET=tu-secreto-jwt-aleatorio-y-seguro
```

> ℹ️ Obtén `SUPABASE_URL` y `SUPABASE_KEY` desde tu dashboard de Supabase

### 4️⃣ Ejecutar el servidor

```bash
npm start
```

El servidor estará en: `http://localhost:3000`

---

## 🗄️ Base de Datos

### Crear tabla en Supabase

Ejecuta este SQL en Supabase:

```sql
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  email VARCHAR UNIQUE NOT NULL,
  password VARCHAR NOT NULL,
  gender VARCHAR,
  avatar_url VARCHAR,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_created_at ON public.users(created_at);

-- RLS Policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios ven su propio perfil"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Usuarios actualizan su propio perfil"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Usuarios eliminan su propia cuenta"
  ON public.users FOR DELETE
  USING (auth.uid() = id);
```

---

## 📡 Endpoints API

### Autenticación

#### POST `/api/auth/registrarse`
Registrar nuevo usuario

```bash
curl -X POST http://localhost:3000/api/auth/registrarse \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Juan Pérez",
    "email": "juan@example.com",
    "password": "SecurePass123",
    "gender": "masculino"
  }'
```

**Respuesta:**
```json
{
  "success": true,
  "token": "eyJhbGc...",
  "usuario": {
    "id": "uuid",
    "name": "Juan Pérez",
    "email": "juan@example.com",
    "gender": "masculino",
    "created_at": "2025-12-17T..."
  }
}
```

#### POST `/api/auth/iniciar-sesion`
Login de usuario

```bash
curl -X POST http://localhost:3000/api/auth/iniciar-sesion \
  -H "Content-Type: application/json" \
  -d '{
    "email": "juan@example.com",
    "password": "SecurePass123"
  }'
```

#### GET `/api/auth/perfil` (Protegido)
Obtener perfil del usuario

```bash
curl -X GET http://localhost:3000/api/auth/perfil \
  -H "Authorization: Bearer {TOKEN}"
```

#### PUT `/api/auth/perfil` (Protegido)
Actualizar perfil

```bash
curl -X PUT http://localhost:3000/api/auth/perfil \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {TOKEN}" \
  -d '{
    "nombre": "Nuevo Nombre",
    "email": "nuevo@example.com",
    "gender": "femenino"
  }'
```

#### DELETE `/api/auth/perfil` (Protegido)
Eliminar cuenta

```bash
curl -X DELETE http://localhost:3000/api/auth/perfil \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {TOKEN}" \
  -d '{"password": "SecurePass123"}'
```

---

## 📱 Integración con Flutter

### 1. Copiar AuthService

Copiar `FLUTTER_AUTH_SERVICE.dart` a tu proyecto Flutter:

```
tu_app_flutter/
├── lib/
│   ├── services/
│   │   └── auth_service.dart  ← Aquí
│   └── ...
```

### 2. Agregar dependencias

En `pubspec.yaml`:

```yaml
dependencies:
  http: ^1.1.0
  shared_preferences: ^2.2.0
```

Ejecutar:
```bash
flutter pub get
```

### 3. Usar en tu app

```dart
import 'package:tu_app/services/auth_service.dart';

// Registro
final result = await AuthService.register(
  nombre: 'Juan',
  email: 'juan@example.com',
  password: 'Pass123',
  gender: 'masculino',
);

if (result['success']) {
  print('Usuario registrado: ${result['usuario']['email']}');
}

// Login
final loginResult = await AuthService.login(
  email: 'juan@example.com',
  password: 'Pass123',
);

// Obtener perfil (desde cache local)
final userData = await AuthService.getUserDataLocal();
print('Nombre: ${userData?['name']}');

// Actualizar perfil
await AuthService.updateProfile(
  nombre: 'Juan Nuevo',
  email: 'nuevoemail@example.com',
);

// Eliminar cuenta
await AuthService.deleteAccount(password: 'Pass123');

// Logout
await AuthService.logout();
```

### 4. Configurar URL del backend

En `FLUTTER_AUTH_SERVICE.dart`, línea 18:

```dart
// Para emulador Android:
static const String baseUrl = 'http://10.0.2.2:3000/api/auth';

// Para dispositivo real:
static const String baseUrl = 'http://192.168.X.X:3000/api/auth';  // Tu IP local

// Para localhost (web):
static const String baseUrl = 'http://localhost:3000/api/auth';
```

---

## 🔐 Seguridad

- ✅ Contraseñas hasheadas con bcrypt (10 rondas)
- ✅ JWT con expiración de 7 días
- ✅ Middleware de autenticación en rutas protegidas
- ✅ Row Level Security (RLS) en Supabase
- ✅ Validación de entrada en todas las rutas

---

## 📂 Estructura del Proyecto

```
Backend-Ecomerce/
├── routes/
│   ├── auth.js           # Rutas de autenticación
│   └── products.js       # Rutas de productos
├── services/
│   └── supabase.js       # Cliente de Supabase
├── utils/
│   └── auth.js           # Middleware JWT
├── server.js             # Punto de entrada
├── package.json
├── .env                  # Variables de entorno (no subir)
└── .gitignore
```

---

## 🐛 Troubleshooting

### Error: "No se puede conectar a Supabase"
- Verifica que `SUPABASE_URL` y `SUPABASE_KEY` sean correctos
- Asegúrate de que Supabase esté activo

### Error: "Token inválido"
- El token podría haber expirado (7 días)
- Haz login nuevamente

### Flutter no se conecta al backend
- Verifica la URL base en `auth_service.dart`
- En Android emulador usa: `http://10.0.2.2:3000`
- En dispositivo real usa tu IP local: `ipconfig getifaddr en0`

---

## 📝 Notas

- Los tokens se almacenan en `SharedPreferences` (Flutter)
- Los datos de usuario se cachean localmente
- Al logout se limpian token y datos
- Las contraseñas NUNCA se guardan localmente

---

## 🤝 Contribuir

1. Crea una rama: `git checkout -b feature/tu-feature`
2. Commit: `git commit -m "Add: descripción"`
3. Push: `git push origin feature/tu-feature`
4. Pull Request a `develop`

---

## 📄 Licencia

MIT - Libre para usar y modificar

---

## 👨‍💻 Autor

Crear E-commerce | 2025

