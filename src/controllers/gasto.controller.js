const { Op, fn, literal } = require('sequelize');
const { Gasto, Pallet } = require('../models');

// GET /api/gastos?categoria=&desde=&hasta=&tipo=&q=&page=&limit=
// Antes esta consulta traía TODO el historial de gastos y el filtro de
// "tipo" (operativo/no operativo) se aplicaba en el navegador con
// .filter(). Conforme el historial crece mes a mes, eso deja de escalar
// igual que pasaba en Mercancía. Ahora:
//   - "tipo" se resuelve en SQL (afectaUtilidad).
//   - "q" busca en descripcion y socio directamente en la base de datos.
//   - "page"/"limit" paginan el listado que se manda al navegador.
//   - Los totales operativo/no operativo se calculan con una consulta de
//     agregación SEPARADA sobre TODO el rango filtrado (sin paginar),
//     para que sigan siendo el total real del período y no solo el de la
//     página visible.
exports.listar = async (req, res) => {
  try {
    const { categoria, desde, hasta, tipo, q } = req.query;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 30;
    const offset = (page - 1) * limit;

    const where = {};
    if (categoria) where.categoria = categoria;
    if (desde || hasta) {
      where.fecha = {};
      if (desde) where.fecha[Op.gte] = desde;
      if (hasta) where.fecha[Op.lte] = hasta;
    }
    if (tipo) where.afectaUtilidad = tipo === 'OPERATIVO';
    if (q) {
      where[Op.or] = [
        { descripcion: { [Op.iLike]: `%${q}%` } },
        { socio: { [Op.iLike]: `%${q}%` } },
      ];
    }

    const [{ rows, count }, totales] = await Promise.all([
      Gasto.findAndCountAll({
        where,
        include: [{ model: Pallet, as: 'pallet', attributes: ['numero'] }],
        order: [['fecha', 'DESC']],
        limit,
        offset,
      }),
      Gasto.findAll({
        where,
        attributes: [
          [fn('SUM', literal(`CASE WHEN "afectaUtilidad" THEN "monto" ELSE 0 END`)), 'totalOperativo'],
          [fn('SUM', literal(`CASE WHEN "afectaUtilidad" THEN 0 ELSE "monto" END`)), 'totalNoOperativo'],
        ],
        raw: true,
      }),
    ]);

    const totalOperativo = parseFloat(totales[0]?.totalOperativo || 0);
    const totalNoOperativo = parseFloat(totales[0]?.totalNoOperativo || 0);

    res.json({
      gastos: rows,
      total: totalOperativo + totalNoOperativo,
      totalOperativo,
      totalNoOperativo,
      totalRegistros: count,
      page,
      totalPages: Math.max(1, Math.ceil(count / limit)),
    });
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
