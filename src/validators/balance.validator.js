const { body, param } = require('express-validator');

const CATEGORIAS_APORTACION = ['INVERSION_INICIAL', 'ESTIMULO', 'OTRO'];

exports.crearAportacionValidator = [
  body('categoria').isIn(CATEGORIAS_APORTACION).withMessage(`categoria debe ser una de: ${CATEGORIAS_APORTACION.join(', ')}`),
  body('aportante').optional({ nullable: true }).isString(),
  body('descripcion').optional({ nullable: true }).isString(),
  body('monto').notEmpty().withMessage('monto es obligatorio').isFloat({ gt: 0 }).withMessage('monto debe ser mayor a 0'),
  body('fecha').optional().isISO8601().withMessage('fecha debe tener formato de fecha válido'),
];

exports.actualizarAportacionValidator = [
  param('id').isInt().withMessage('id inválido'),
  body('categoria').optional().isIn(CATEGORIAS_APORTACION),
  body('aportante').optional({ nullable: true }).isString(),
  body('descripcion').optional({ nullable: true }).isString(),
  body('monto').optional().isFloat({ gt: 0 }),
  body('fecha').optional().isISO8601(),
];

exports.crearConteoValidator = [
  body('montoContado').notEmpty().withMessage('montoContado es obligatorio').isFloat({ min: 0 }).withMessage('montoContado debe ser un número válido'),
  body('fecha').optional().isISO8601().withMessage('fecha debe tener formato de fecha válido'),
  body('comentario').optional({ nullable: true }).isString(),
];

exports.CATEGORIAS_APORTACION = CATEGORIAS_APORTACION;
