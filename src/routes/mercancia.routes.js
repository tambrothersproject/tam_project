const express = require('express');
const router = express.Router();

const mercanciaController = require('../controllers/mercancia.controller');
const validate = require('../middlewares/validate.middleware');
const auth = require('../middlewares/auth.middleware');
const {
  crearMercanciaValidator,
  actualizarMercanciaValidator,
  idMercanciaValidator,
  venderMercanciaValidator,
  listarMercanciaValidator,
} = require('../validators/mercancia.validator');

// Rutas públicas de solo lectura
router.get('/', listarMercanciaValidator, validate, mercanciaController.listar);
router.get('/ventas', mercanciaController.listarVentas);
router.get('/inventario', mercanciaController.listarInventario);
router.get('/:id', idMercanciaValidator, validate, mercanciaController.obtenerPorId);

// Rutas protegidas
router.post('/', auth, crearMercanciaValidator, validate, mercanciaController.crear);
router.put('/:id', auth, actualizarMercanciaValidator, validate, mercanciaController.actualizar);
router.post('/:id/vender', auth, venderMercanciaValidator, validate, mercanciaController.vender);
router.post('/:id/deshacer-venta', auth, idMercanciaValidator, validate, mercanciaController.deshacerVenta);
router.delete('/:id', auth, idMercanciaValidator, validate, mercanciaController.eliminar);

module.exports = router;
