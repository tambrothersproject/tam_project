const express = require('express');
const router = express.Router();

const palletController = require('../controllers/pallet.controller');
const auth = require('../middlewares/auth.middleware');

router.get('/', auth, palletController.listar);

module.exports = router;
