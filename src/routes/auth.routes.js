const express = require('express');
const router = express.Router();

const authController = require('../controllers/auth.controller');
const validate = require('../middlewares/validate.middleware');
const auth = require('../middlewares/auth.middleware');
const { loginValidator, cambiarMiPasswordValidator } = require('../validators/auth.validator');

// Único endpoint público de autenticación. Ya no existe /register: las
// cuentas nuevas solo las crea un admin desde /api/usuarios.
router.post('/login', loginValidator, validate, authController.login);

// Cualquier usuario autenticado puede cambiar su propia contraseña.
router.put('/mi-password', auth, cambiarMiPasswordValidator, validate, authController.cambiarMiPassword);

module.exports = router;
