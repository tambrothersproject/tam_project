const { body, param, query } = require('express-validator');

exports.crearMercanciaValidator = [
  body('producto').notEmpty().withMessage('El nombre del producto es obligatorio').isString(),
  body('precioMercado').optional().isFloat({ min: 0 }).withMessage('precioMercado debe ser un número válido'),
  body('precioSugerido').optional().isFloat({ min: 0 }).withMessage('precioSugerido debe ser un número válido'),
  body('idPallet').notEmpty().withMessage('idPallet es obligatorio').isInt().withMessage('idPallet debe ser un entero válido'),
  body('estado').optional().isIn(['DISPONIBLE', 'VENDIDO']).withMessage('estado debe ser DISPONIBLE o VENDIDO'),
];

exports.actualizarMercanciaValidator = [
  param('id').isInt().withMessage('id inválido'),
  body('producto').optional().isString(),
  body('precioMercado').optional().isFloat({ min: 0 }),
  body('precioSugerido').optional().isFloat({ min: 0 }),
  body('idPallet').optional().isInt().withMessage('idPallet debe ser un entero válido'),
];

exports.idMercanciaValidator = [
  param('id').isInt().withMessage('id inválido'),
];

exports.venderMercanciaValidator = [
  param('id').isInt().withMessage('id inválido'),
  body('precioVenta').notEmpty().withMessage('precioVenta es obligatorio').isFloat({ gt: 0 }).withMessage('precioVenta debe ser mayor a 0'),
  body('fechaVenta').optional().isISO8601().withMessage('fechaVenta debe tener formato de fecha válido'),
];

exports.listarMercanciaValidator = [
  query('estado').optional().isIn(['DISPONIBLE', 'VENDIDO']).withMessage('estado debe ser DISPONIBLE o VENDIDO'),
  query('idPallet').optional().isInt().withMessage('idPallet debe ser un entero válido'),
];
