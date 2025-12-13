// utils/auth.js
import jwt from 'jsonwebtoken';

/**
 * Middleware para validar JWT
 * Verifica que el token sea válido antes de acceder a rutas protegidas
 */
export const authenticateToken = (req, res, next) => {
  try {
    // Leer token desde el header Authorization: Bearer <token>
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Token no proporcionado" });
    }

    const token = authHeader.split(" ")[1];

    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Agregar info del usuario al request
    req.user = decoded;

    next(); // continuar hacia la ruta protegida
  } catch (error) {
    return res.status(401).json({
      error: "Token inválido o expirado",
      detalles: error.message
    });
  }
};

// Exportación por defecto (compatibilidad con código antiguo)
export default authenticateToken;
