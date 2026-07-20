const { body, query, param } = require('express-validator');

const CATEGORIAS = ['ASISTENCIA_MERCADO', 'GASOLINA', 'COMPRA_PALLETS', 'OTRO', 'RETIRO_SOCIOS'];

exports.crearGastoValidator = [
  body('categoria').isIn(CATEGORIAS).withMessage(`categoria debe ser una de: ${CATEGORIAS.join(', ')}`),
  body('descripcion').optional().isString(),
  body('monto').notEmpty().withMessage('monto es obligatorio').isFloat({ gt: 0 }).withMessage('monto debe ser mayor a 0'),
  body('fecha').optional().isISO8601().withMessage('fecha debe tener formato de fecha válido'),
  body('socio').optional({ nullable: true }).isString(),
  body('afectaUtilidad').optional().isBoolean().withMessage('afectaUtilidad debe ser verdadero o falso'),
  body('idPallet').optional({ nullable: true }).isInt().withMessage('idPallet debe ser un entero válido'),
];

exports.actualizarGastoValidator = [
  param('id').isInt().withMessage('id inválido'),
  body('categoria').optional().isIn(CATEGORIAS).withMessage(`categoria debe ser una de: ${CATEGORIAS.join(', ')}`),
  body('descripcion').optional({ nullable: true }).isString(),
  body('monto').optional().isFloat({ gt: 0 }).withMessage('monto debe ser mayor a 0'),
  body('fecha').optional().isISO8601(),
  body('socio').optional({ nullable: true }).isString(),
  body('afectaUtilidad').optional().isBoolean().withMessage('afectaUtilidad debe ser verdadero o falso'),
  body('idPallet').optional({ nullable: true }).isInt().withMessage('idPallet debe ser un entero válido'),
];

// GET /api/gastos?categoria=&desde=&hasta=&tipo=&q=&page=&limit=
// "tipo" reemplaza el filtro que antes se hacía en el navegador con
// .filter() sobre afectaUtilidad — ahora se resuelve en SQL.
// "q" busca en descripcion y socio (ILIKE), también en el servidor.
// "page"/"limit" paginan el listado; el total operativo/no operativo se
// sigue calculando sobre TODO el rango filtrado, no solo la página visible.
exports.listarGastoValidator = [
  query('categoria').optional().isIn(CATEGORIAS),
  query('desde').optional().isISO8601(),
  query('hasta').optional().isISO8601(),
  query('tipo').optional().isIn(['OPERATIVO', 'NO_OPERATIVO']).withMessage('tipo debe ser OPERATIVO o NO_OPERATIVO'),
  query('q').optional().isString().trim(),
  query('page').optional().isInt({ min: 1 }).withMessage('page debe ser un entero mayor a 0'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit debe ser un entero entre 1 y 100'),
];

exports.CATEGORIAS = CATEGORIAS;
