const { body } = require('express-validator');

exports.loginValidator = [
  body('username').notEmpty().withMessage('El usuario es obligatorio'),
  body('password').notEmpty().withMessage('La contraseña es obligatoria'),
];

exports.cambiarMiPasswordValidator = [
  body('passwordActual').notEmpty().withMessage('Debes ingresar tu contraseña actual'),
  body('passwordNueva')
    .isLength({ min: 4 })
    .withMessage('La nueva contraseña debe tener al menos 4 caracteres'),
];
