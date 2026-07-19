const { body, param } = require('express-validator');

exports.crearUsuarioValidator = [
  body('name').notEmpty().withMessage('El nombre es obligatorio'),
  body('username')
    .notEmpty().withMessage('El usuario es obligatorio')
    .isLength({ min: 3 }).withMessage('El usuario debe tener al menos 3 caracteres')
    .matches(/^[a-zA-Z0-9._-]+$/).withMessage('El usuario solo puede contener letras, números, puntos, guiones y guiones bajos'),
  body('password')
    .isLength({ min: 4 })
    .withMessage('La contraseña debe tener al menos 4 caracteres'),
  body('isAdmin').optional().isBoolean(),
];

exports.actualizarUsuarioValidator = [
  param('id').isInt().withMessage('id inválido'),
  body('name').optional().notEmpty().withMessage('El nombre no puede quedar vacío'),
  body('username')
    .optional()
    .isLength({ min: 3 }).withMessage('El usuario debe tener al menos 3 caracteres')
    .matches(/^[a-zA-Z0-9._-]+$/).withMessage('El usuario solo puede contener letras, números, puntos, guiones y guiones bajos'),
  body('isAdmin').optional().isBoolean(),
];

exports.cambiarPasswordValidator = [
  param('id').isInt().withMessage('id inválido'),
  body('passwordNueva')
    .isLength({ min: 4 })
    .withMessage('La nueva contraseña debe tener al menos 4 caracteres'),
];
