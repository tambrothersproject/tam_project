const { Mercancia, Pallet } = require('../models');

// GET /api/mercancias?estado=DISPONIBLE&idPallet=1
// Reemplaza tus hojas de Excel "Ventas" (estado=VENDIDO) e "Inventario" (estado=DISPONIBLE).
exports.listar = async (req, res) => {
  try {
    const { estado, idPallet } = req.query;
    const where = {};
    if (estado) where.estado = estado;
    if (idPallet) where.idPallet = idPallet;

    const mercancias = await Mercancia.findAll({
      where,
      include: [{ model: Pallet, as: 'pallet' }],
      order: [['id', 'ASC']],
    });

    res.json(mercancias);
  } catch (error) {
    res.status(500).json({ error: 'Error al listar mercancía', detalle: error.message });
  }
};

// GET /api/mercancias/ventas
exports.listarVentas = async (req, res) => {
  req.query.estado = 'VENDIDO';
  return exports.listar(req, res);
};

// GET /api/mercancias/inventario
exports.listarInventario = async (req, res) => {
  req.query.estado = 'DISPONIBLE';
  return exports.listar(req, res);
};

// GET /api/mercancias/:id
exports.obtenerPorId = async (req, res) => {
  try {
    const mercancia = await Mercancia.findByPk(req.params.id, {
      include: [{ model: Pallet, as: 'pallet' }],
    });
    if (!mercancia) return res.status(404).json({ error: 'Artículo no encontrado' });
    res.json(mercancia);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener el artículo', detalle: error.message });
  }
};

// POST /api/mercancias
// Crea un artículo nuevo, disponible por defecto (aún no vendido).
exports.crear = async (req, res) => {
  try {
    const { producto, precioMercado, precioSugerido, idPallet, estado } = req.body;

    const pallet = await Pallet.findByPk(idPallet);
    if (!pallet) {
      return res.status(404).json({ error: 'El pallet indicado no existe' });
    }

    const mercancia = await Mercancia.create({
      producto,
      precioMercado,
      precioSugerido,
      idPallet,
      estado: estado || 'DISPONIBLE',
    });

    res.status(201).json(mercancia);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear el artículo', detalle: error.message });
  }
};

// PUT /api/mercancias/:id
// Actualiza datos generales del artículo (no cambia estado/venta, para eso usa /vender).
exports.actualizar = async (req, res) => {
  try {
    const mercancia = await Mercancia.findByPk(req.params.id);
    if (!mercancia) return res.status(404).json({ error: 'Artículo no encontrado' });

    if (req.body.idPallet) {
      const pallet = await Pallet.findByPk(req.body.idPallet);
      if (!pallet) return res.status(404).json({ error: 'El pallet indicado no existe' });
    }

    const { producto, precioMercado, precioSugerido, idPallet } = req.body;
    await mercancia.update({ producto, precioMercado, precioSugerido, idPallet });

    res.json(mercancia);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar el artículo', detalle: error.message });
  }
};

// POST /api/mercancias/:id/vender
// Marca un artículo disponible como vendido, con su precio final y fecha.
exports.vender = async (req, res) => {
  try {
    const mercancia = await Mercancia.findByPk(req.params.id);
    if (!mercancia) return res.status(404).json({ error: 'Artículo no encontrado' });

    if (mercancia.estado === 'VENDIDO') {
      return res.status(409).json({ error: 'Este artículo ya fue vendido' });
    }

    const { precioVenta, fechaVenta } = req.body;

    await mercancia.update({
      estado: 'VENDIDO',
      precioVenta,
      fechaVenta: fechaVenta || new Date(),
    });

    res.json({ mensaje: 'Venta registrada correctamente', mercancia });
  } catch (error) {
    res.status(500).json({ error: 'Error al registrar la venta', detalle: error.message });
  }
};

// POST /api/mercancias/:id/deshacer-venta
// Revierte una venta por error de captura, regresando el artículo a disponible.
exports.deshacerVenta = async (req, res) => {
  try {
    const mercancia = await Mercancia.findByPk(req.params.id);
    if (!mercancia) return res.status(404).json({ error: 'Artículo no encontrado' });

    await mercancia.update({ estado: 'DISPONIBLE', precioVenta: null, fechaVenta: null });

    res.json({ mensaje: 'Venta revertida correctamente', mercancia });
  } catch (error) {
    res.status(500).json({ error: 'Error al revertir la venta', detalle: error.message });
  }
};

// DELETE /api/mercancias/:id
exports.eliminar = async (req, res) => {
  try {
    const mercancia = await Mercancia.findByPk(req.params.id);
    if (!mercancia) return res.status(404).json({ error: 'Artículo no encontrado' });

    await mercancia.destroy();
    res.json({ mensaje: 'Artículo eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar el artículo', detalle: error.message });
  }
};
