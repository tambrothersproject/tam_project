const { body, param, query } = require('express-validator');

exports.crearMercanciaValidator = [
  body('producto').notEmpty().withMessage('El nombre del producto es obligatorio').isString(),
  body('precioMercado').optional({ nullable: true }).isFloat({ min: 0 }).withMessage('precioMercado debe ser un número válido'),
  body('precioSugerido').optional({ nullable: true }).isFloat({ min: 0 }).withMessage('precioSugerido debe ser un número válido'),
  body('numeroPallet').notEmpty().withMessage('numeroPallet es obligatorio').isInt({ min: 0 }).withMessage('numeroPallet debe ser un entero válido'),
];

exports.actualizarMercanciaValidator = [
  param('id').isInt().withMessage('id inválido'),
  body('producto').optional().isString(),
  body('precioMercado').optional({ nullable: true }).isFloat({ min: 0 }),
  body('precioSugerido').optional({ nullable: true }).isFloat({ min: 0 }),
  body('numeroPallet').optional().isInt({ min: 0 }).withMessage('numeroPallet debe ser un entero válido'),
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
