const { User } = require('../models');

// Debe montarse DESPUÉS de auth.middleware.js, que ya deja req.userId listo.
// Se consulta la base de datos en cada request (en vez de confiar en un
// flag guardado en el token) para que si el admin le quita el rol a
// alguien, el cambio aplique de inmediato sin esperar a que ese usuario
// vuelva a iniciar sesión.
module.exports = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.userId, { attributes: ['id', 'isAdmin'] });
    if (!user || !user.isAdmin) {
      return res.status(403).json({ error: 'Esta acción requiere permisos de administrador' });
    }
    next();
  } catch (error) {
    res.status(500).json({ error: 'Error al verificar permisos', detalle: error.message });
  }
};
