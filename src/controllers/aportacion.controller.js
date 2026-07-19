const { Aportacion } = require('../models');

// GET /api/aportaciones
exports.listar = async (req, res) => {
  try {
    const aportaciones = await Aportacion.findAll({ order: [['fecha', 'DESC']] });
    const total = aportaciones.reduce((acc, a) => acc + parseFloat(a.monto), 0);
    res.json({ total, aportaciones });
  } catch (error) {
    res.status(500).json({ error: 'Error al listar aportaciones', detalle: error.message });
  }
};

// POST /api/aportaciones
exports.crear = async (req, res) => {
  try {
    const { categoria, aportante, descripcion, monto, fecha } = req.body;
    const aportacion = await Aportacion.create({
      categoria,
      aportante: aportante || null,
      descripcion: descripcion || null,
      monto,
      fecha: fecha || new Date(),
    });
    res.status(201).json(aportacion);
  } catch (error) {
    res.status(500).json({ error: 'Error al registrar la aportación', detalle: error.message });
  }
};

// PUT /api/aportaciones/:id
exports.actualizar = async (req, res) => {
  try {
    const aportacion = await Aportacion.findByPk(req.params.id);
    if (!aportacion) return res.status(404).json({ error: 'Aportación no encontrada' });

    const { categoria, aportante, descripcion, monto, fecha } = req.body;
    await aportacion.update({
      ...(categoria !== undefined && { categoria }),
      ...(aportante !== undefined && { aportante }),
      ...(descripcion !== undefined && { descripcion }),
      ...(monto !== undefined && { monto }),
      ...(fecha !== undefined && { fecha }),
    });

    res.json(aportacion);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar la aportación', detalle: error.message });
  }
};

// DELETE /api/aportaciones/:id
exports.eliminar = async (req, res) => {
  try {
    const aportacion = await Aportacion.findByPk(req.params.id);
    if (!aportacion) return res.status(404).json({ error: 'Aportación no encontrada' });

    await aportacion.destroy();
    res.json({ mensaje: 'Aportación eliminada correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar la aportación', detalle: error.message });
  }
};
