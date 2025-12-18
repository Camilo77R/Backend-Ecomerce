-- 📊 Tabla: users
-- Almacena la información de todos los usuarios del sistema

CREATE TABLE users (
  -- Identificador único (UUID generado automáticamente por Supabase Auth)
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Información personal
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  gender VARCHAR(50),  -- 'male', 'female', 'other', etc.
  avatar_url VARCHAR(255),
  
  -- Contraseña (gestionada por Supabase Auth, pero se puede duplicar si necesitas)
  password VARCHAR(255),
  
  -- Información adicional (expandible según necesites)
  telefono VARCHAR(20),
  direccion TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Índices para mejorar búsquedas
  INDEX idx_users_email (email),
  INDEX idx_users_created_at (created_at)
);

-- 🔔 Trigger: Actualizar updated_at automáticamente
-- (Supabase tiene un add-on para esto, o puedes usar una función trigger)

-- 🔐 Políticas de seguridad (Row Level Security)
-- Los usuarios solo pueden ver su propio perfil

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios autenticados pueden ver su propio perfil
CREATE POLICY "Users can view own profile"
  ON users
  FOR SELECT
  USING (auth.uid() = id);

-- Política: Los usuarios autenticados pueden actualizar su propio perfil
CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  USING (auth.uid() = id);

-- Política: Los usuarios autenticados pueden eliminar su propia cuenta
CREATE POLICY "Users can delete own account"
  ON users
  FOR DELETE
  USING (auth.uid() = id);

-- Política: Solo admins pueden ver todos los usuarios (opcional)
-- CREATE POLICY "Admins can view all users"
--   ON users
--   FOR SELECT
--   USING (
--     EXISTS (
--       SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
--     )
--   );
