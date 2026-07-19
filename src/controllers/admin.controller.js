const bcrypt = require('bcrypt');
const { User } = require('../models');

// GET /api/usuarios
exports.listar = async (req, res) => {
  try {
    const usuarios = await User.findAll({
      attributes: ['id', 'name', 'username', 'isAdmin', 'createdAt'],
      order: [['id', 'ASC']],
    });
    res.json(usuarios);
  } catch (error) {
    res.status(500).json({ error: 'Error al listar usuarios', detalle: error.message });
  }
};

// POST /api/usuarios
// Solo el admin crea cuentas — no existe registro público.
exports.crear = async (req, res) => {
  try {
    const { name, username, password, isAdmin } = req.body;

    const existente = await User.findOne({ where: { username } });
    if (existente) {
      return res.status(409).json({ error: 'Ese nombre de usuario ya está en uso' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      username,
      password: hashed,
      isAdmin: Boolean(isAdmin),
    });

    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear el usuario', detalle: error.message });
  }
};

// PUT /api/usuarios/:id
// Edita nombre, username o el flag de admin de cualquier usuario.
exports.actualizar = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    const { name, username, isAdmin } = req.body;

    if (username && username !== user.username) {
      const existente = await User.findOne({ where: { username } });
      if (existente) return res.status(409).json({ error: 'Ese nombre de usuario ya está en uso' });
    }

    // No permitir que el último admin se quite el rol a sí mismo o a otro
    // admin único — evita que la app se quede sin ningún administrador.
    if (isAdmin === false && user.isAdmin) {
      const totalAdmins = await User.count({ where: { isAdmin: true } });
      if (totalAdmins <= 1) {
        return res.status(400).json({ error: 'No puedes quitar el rol de admin al único administrador restante' });
      }
    }

    await user.update({
      ...(name !== undefined && { name }),
      ...(username !== undefined && { username }),
      ...(isAdmin !== undefined && { isAdmin }),
    });

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar el usuario', detalle: error.message });
  }
};

// PUT /api/usuarios/:id/password
// El admin restablece la contraseña de cualquier usuario (incluida la
// suya propia) sin necesidad de conocer la contraseña anterior.
exports.cambiarPassword = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    const { passwordNueva } = req.body;
    const hashed = await bcrypt.hash(passwordNueva, 10);
    await user.update({ password: hashed });

    res.json({ mensaje: 'Contraseña actualizada correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al cambiar la contraseña', detalle: error.message });
  }
};

// DELETE /api/usuarios/:id
exports.eliminar = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    if (Number(req.params.id) === req.userId) {
      return res.status(400).json({ error: 'No puedes eliminar tu propia cuenta mientras tienes la sesión iniciada' });
    }

    if (user.isAdmin) {
      const totalAdmins = await User.count({ where: { isAdmin: true } });
      if (totalAdmins <= 1) {
        return res.status(400).json({ error: 'No puedes eliminar al único administrador' });
      }
    }

    await user.destroy();
    res.json({ mensaje: 'Usuario eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar el usuario', detalle: error.message });
  }
};
