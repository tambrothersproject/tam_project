const express = require('express');
const router = express.Router();

const adminController = require('../controllers/admin.controller');
const validate = require('../middlewares/validate.middleware');
const auth = require('../middlewares/auth.middleware');
const adminOnly = require('../middlewares/adminOnly.middleware');
const {
  crearUsuarioValidator,
  actualizarUsuarioValidator,
  cambiarPasswordValidator,
} = require('../validators/admin.validator');

// Todo este router requiere estar logueado Y ser admin.
router.use(auth, adminOnly);

router.get('/', adminController.listar);
router.post('/', crearUsuarioValidator, validate, adminController.crear);
router.put('/:id', actualizarUsuarioValidator, validate, adminController.actualizar);
router.put('/:id/password', cambiarPasswordValidator, validate, adminController.cambiarPassword);
router.delete('/:id', adminController.eliminar);

module.exports = router;
