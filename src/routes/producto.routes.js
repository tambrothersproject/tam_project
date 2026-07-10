const express = require('express');
const router = express.Router();

const productoController = require('../controllers/producto.controller');
const validate = require('../middlewares/validate.middleware');
const auth = require('../middlewares/auth.middleware');
const {
  crearProductoValidator,
  actualizarProductoValidator,
  idProductoValidator,
} = require('../validators/producto.validator');

// Rutas públicas
router.get('/', productoController.listar);
router.get('/:id', idProductoValidator, validate, productoController.obtenerPorId);

// Rutas protegidas
router.post('/', auth, crearProductoValidator, validate, productoController.crear);
router.put('/:id', auth, actualizarProductoValidator, validate, productoController.actualizar);
router.delete('/:id', auth, idProductoValidator, validate, productoController.eliminar);

module.exports = router;