const { Op } = require('sequelize');
const { Gasto, Pallet } = require('../models');

// GET /api/gastos?categoria=&desde=&hasta=
exports.listar = async (req, res) => {
  try {
    const { categoria, desde, hasta } = req.query;
    const where = {};
    if (categoria) where.categoria = categoria;
    if (desde || hasta) {
      where.fecha = {};
      if (desde) where.fecha[Op.gte] = desde;
      if (hasta) where.fecha[Op.lte] = hasta;
    }

    const gastos = await Gasto.findAll({
      where,
      include: [{ model: Pallet, as: 'pallet', attributes: ['numero'] }],
      order: [['fecha', 'DESC']],
    });
    const totalOperativo = gastos
      .filter((g) => g.afectaUtilidad)
      .reduce((acc, g) => acc + parseFloat(g.monto), 0);
    const totalNoOperativo = gastos
      .filter((g) => !g.afectaUtilidad)
      .reduce((acc, g) => acc + parseFloat(g.monto), 0);

    res.json({ total: totalOperativo + totalNoOperativo, totalOperativo, totalNoOperativo, gastos });
  } catch (error) {
    res.status(500).json({ error: 'Error al listar gastos', detalle: error.message });
  }
};

// POST /api/gastos
exports.crear = async (req, res) => {
  try {
    const { categoria, descripcion, monto, fecha, socio, afectaUtilidad, idPallet } = req.body;

    // Si no se especifica, los retiros de socios NO afectan la utilidad
    // operativa por default; todo lo demás sí.
    const afecta = afectaUtilidad !== undefined ? afectaUtilidad : categoria !== 'RETIRO_SOCIOS';

    const gasto = await Gasto.create({
      categoria,
      descripcion,
      monto,
      fecha: fecha || new Date(),
      socio: socio || null,
      afectaUtilidad: afecta,
      idPallet: idPallet || null,
    });
    res.status(201).json(gasto);
  } catch (error) {
    res.status(500).json({ error: 'Error al registrar el gasto', detalle: error.message });
  }
};

// PUT /api/gastos/:id
// Permite reclasificar un gasto ya importado (ej. marcar "Prestamos" como
// no operativo, asignarle el socio a un retiro, o vincularlo a un pallet).
exports.actualizar = async (req, res) => {
  try {
    const gasto = await Gasto.findByPk(req.params.id);
    if (!gasto) return res.status(404).json({ error: 'Gasto no encontrado' });

    const { categoria, descripcion, monto, fecha, socio, afectaUtilidad, idPallet } = req.body;
    await gasto.update({
      ...(categoria !== undefined && { categoria }),
      ...(descripcion !== undefined && { descripcion }),
      ...(monto !== undefined && { monto }),
      ...(fecha !== undefined && { fecha }),
      ...(socio !== undefined && { socio }),
      ...(afectaUtilidad !== undefined && { afectaUtilidad }),
      ...(idPallet !== undefined && { idPallet: idPallet || null }),
    });

    res.json(gasto);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar el gasto', detalle: error.message });
  }
};

// DELETE /api/gastos/:id
exports.eliminar = async (req, res) => {
  try {
    const gasto = await Gasto.findByPk(req.params.id);
    if (!gasto) return res.status(404).json({ error: 'Gasto no encontrado' });

    await gasto.destroy();
    res.json({ mensaje: 'Gasto eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar el gasto', detalle: error.message });
  }
};
