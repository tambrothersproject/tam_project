const express = require('express');
const router = express.Router();

const conteoController = require('../controllers/conteoCaja.controller');
const validate = require('../middlewares/validate.middleware');
const auth = require('../middlewares/auth.middleware');
const { crearConteoValidator } = require('../validators/balance.validator');

router.get('/', auth, conteoController.listar);
router.post('/', auth, crearConteoValidator, validate, conteoController.crear);
router.delete('/:id', auth, conteoController.eliminar);

module.exports = router;
