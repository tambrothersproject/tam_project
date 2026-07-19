const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ where: { username } });
    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const passwordValida = await bcrypt.compare(password, user.password);
    if (!passwordValida) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      mensaje: 'Login exitoso',
      token,
      usuario: { id: user.id, name: user.name, username: user.username, isAdmin: user.isAdmin },
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al iniciar sesión', detalle: error.message });
  }
};

// PUT /api/auth/mi-password
// Cualquier usuario autenticado puede cambiar SU PROPIA contraseña,
// verificando primero la contraseña actual.
exports.cambiarMiPassword = async (req, res) => {
  try {
    const { passwordActual, passwordNueva } = req.body;

    const user = await User.findByPk(req.userId);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    const passwordValida = await bcrypt.compare(passwordActual, user.password);
    if (!passwordValida) {
      return res.status(401).json({ error: 'La contraseña actual no es correcta' });
    }

    const hashed = await bcrypt.hash(passwordNueva, 10);
    await user.update({ password: hashed });

    res.json({ mensaje: 'Contraseña actualizada correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al cambiar la contraseña', detalle: error.message });
  }
};
