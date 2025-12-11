const supabase = require('../services/supabase');
const jwt = require('jsonwebtoken');

// Registro
exports.registrar = async (req, res) => {
  try {
    const { email, contraseña } = req.body;

    const { data, error } = await supabase.auth.signUp({
      email,
      password: contraseña
    });

    if (error) throw error;

    await supabase.from("usuarios").insert([
      { id: data.user.id, email }
    ]);

    res.json({ mensaje: "Usuario registrado" });

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Iniciar sesión
exports.login = async (req, res) => {
  try {
    const { email, contraseña } = req.body;

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: contraseña
    });

    if (error) throw error;

    const token = jwt.sign(
      { id: data.user.id, email: data.user.email },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({ token, user: data.user });

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
