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

// GET /api/mercancias?estado=&idPallet=&q=&page=&limit=
// "q" busca por nombre de producto (ILIKE, sin distinguir mayúsculas/acentos
// exactos) directamente en la base de datos, en vez de traer toda la tabla
// y filtrar en el navegador. "page"/"limit" paginan el resultado; el límite
// tiene un tope de 100 para no permitir accidentalmente traer la tabla
// completa de un solo golpe conforme crezca.
exports.listarMercanciaValidator = [
  query('estado').optional().isIn(['DISPONIBLE', 'VENDIDO']).withMessage('estado debe ser DISPONIBLE o VENDIDO'),
  query('idPallet').optional().isInt().withMessage('idPallet debe ser un entero válido'),
  query('q').optional().isString().trim(),
  query('page').optional().isInt({ min: 1 }).withMessage('page debe ser un entero mayor a 0'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit debe ser un entero entre 1 y 100'),
];
