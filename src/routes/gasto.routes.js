const express = require('express');
const router = express.Router();

const gastoController = require('../controllers/gasto.controller');
const validate = require('../middlewares/validate.middleware');
const auth = require('../middlewares/auth.middleware');
const { crearGastoValidator, actualizarGastoValidator, listarGastoValidator } = require('../validators/gasto.validator');

router.get('/', auth, listarGastoValidator, validate, gastoController.listar);
router.post('/', auth, crearGastoValidator, validate, gastoController.crear);
router.put('/:id', auth, actualizarGastoValidator, validate, gastoController.actualizar);
router.delete('/:id', auth, gastoController.eliminar);

module.exports = router;
