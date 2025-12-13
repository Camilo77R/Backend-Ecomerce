// routes/auth.js
import express from "express";
import jwt from "jsonwebtoken";
import supabase from "../services/supabase.js";
import validarJWT from "../utils/auth.js";
import dotenv from "dotenv";
import process from "process";

dotenv.config();

const router = express.Router();

// Ruta protegida
router.get("/perfil", validarJWT, async (req, res) => {
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
      .from("usuarios")
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
      { expiresIn: "24h" }
    );

    res.json({ token, usuario: data.user });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
