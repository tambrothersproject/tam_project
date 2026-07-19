const { Pallet } = require('../models');

// GET /api/pallets
// Lista simple de todos los pallets (id, numero, ubicacion, fechaEntrada).
// Se usa para poblar selectores en el frontend (ej. asociar un gasto a un
// pallet específico), a diferencia de /api/metrics/pallets que solo
// regresa pallets con al menos un artículo de Mercancia ya cargado.
exports.listar = async (req, res) => {
  try {
    const pallets = await Pallet.findAll({ order: [['numero', 'ASC']] });
    res.json(pallets);
  } catch (error) {
    res.status(500).json({ error: 'Error al listar pallets', detalle: error.message });
  }
};
