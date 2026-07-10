const { body } = require('express-validator');

exports.crearVentaValidator = [
  body('idProducto').notEmpty().isInt().withMessage('idProducto debe ser un entero válido'),
  body('precioVenta').notEmpty().isFloat({ gt: 0 }).withMessage('precioVenta debe ser mayor a 0'),
  body('cantidad')
    .notEmpty().withMessage('cantidad es obligatoria')
    .isInt({ gt: 0 }).withMessage('cantidad debe ser un entero mayor a 0'),
  body('fechaVenta').optional().isISO8601().withMessage('fechaVenta debe tener formato de fecha válido'),
];