const express = require('express');
const router = express.Router();

const ventaController = require('../controllers/venta.controller');
const validate = require('../middlewares/validate.middleware');
const auth = require('../middlewares/auth.middleware');
const { crearVentaValidator } = require('../validators/venta.validator');

router.post('/', auth, crearVentaValidator, validate, ventaController.registrarVenta);
router.get('/', auth, ventaController.listar);

module.exports = router;