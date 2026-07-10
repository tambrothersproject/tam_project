const { body, param } = require('express-validator');

exports.crearProductoValidator = [
  body('nombre').notEmpty().withMessage('El nombre es obligatorio').isString(),
  body('precioMercado')
    .notEmpty().withMessage('precioMercado es obligatorio')
    .isFloat({ gt: 0 }).withMessage('precioMercado debe ser un número mayor a 0'),
  body('precioSugerido')
    .notEmpty().withMessage('precioSugerido es obligatorio')
    .isFloat({ gt: 0 }).withMessage('precioSugerido debe ser un número mayor a 0'),
  body('estado')
    .optional()
    .isIn(['activo', 'inactivo']).withMessage('estado debe ser "activo" o "inactivo"'),
];

exports.actualizarProductoValidator = [
  param('id').isInt().withMessage('id inválido'),
  body('nombre').optional().isString(),
  body('precioMercado').optional().isFloat({ gt: 0 }),
  body('precioSugerido').optional().isFloat({ gt: 0 }),
  body('estado').optional().isIn(['activo', 'inactivo']),
];

exports.idProductoValidator = [
  param('id').isInt().withMessage('id inválido'),
];