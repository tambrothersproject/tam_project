const express = require('express');
const router = express.Router();

const aportacionController = require('../controllers/aportacion.controller');
const validate = require('../middlewares/validate.middleware');
const auth = require('../middlewares/auth.middleware');
const { crearAportacionValidator, actualizarAportacionValidator } = require('../validators/balance.validator');

router.get('/', auth, aportacionController.listar);
router.post('/', auth, crearAportacionValidator, validate, aportacionController.crear);
router.put('/:id', auth, actualizarAportacionValidator, validate, aportacionController.actualizar);
router.delete('/:id', auth, aportacionController.eliminar);

module.exports = router;
