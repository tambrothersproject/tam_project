const { ConteoCaja } = require('../models');

// GET /api/conteos-caja
exports.listar = async (req, res) => {
  try {
    const conteos = await ConteoCaja.findAll({ order: [['fecha', 'DESC'], ['id', 'DESC']] });
    res.json(conteos);
  } catch (error) {
    res.status(500).json({ error: 'Error al listar conteos de caja', detalle: error.message });
  }
};

// POST /api/conteos-caja
exports.crear = async (req, res) => {
  try {
    const { montoContado, fecha, comentario } = req.body;
    const conteo = await ConteoCaja.create({
      montoContado,
      fecha: fecha || new Date(),
      comentario: comentario || null,
    });
    res.status(201).json(conteo);
  } catch (error) {
    res.status(500).json({ error: 'Error al registrar el conteo', detalle: error.message });
  }
};

// DELETE /api/conteos-caja/:id
exports.eliminar = async (req, res) => {
  try {
    const conteo = await ConteoCaja.findByPk(req.params.id);
    if (!conteo) return res.status(404).json({ error: 'Conteo no encontrado' });

    await conteo.destroy();
    res.json({ mensaje: 'Conteo eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar el conteo', detalle: error.message });
  }
};
