const express = require('express');
const router = express.Router();

const metricsController = require('../controllers/metrics.controller');
const auth = require('../middlewares/auth.middleware');

router.get('/ventas-por-dia', auth, metricsController.ventasPorDia);
router.get('/pallets', auth, metricsController.resumenPallets);
router.get('/pallets/:numero/productos', auth, metricsController.productosDePallet);
router.get('/resumen', auth, metricsController.resumen);
router.get('/gastos-por-tipo', auth, metricsController.gastosPorTipo);
router.get('/balance-general', auth, metricsController.balanceGeneral);
router.get('/retiros-socios', auth, metricsController.retirosPorSocio);
router.get('/utilidad-pallets', auth, metricsController.utilidadPorPallet);

module.exports = router;
