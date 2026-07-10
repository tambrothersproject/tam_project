const { sequelize, Venta, Producto, Inventario, Pallet } = require('../models');

exports.registrarVenta = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { idProducto, precioVenta, cantidad, fechaVenta } = req.body;

    const producto = await Producto.findByPk(idProducto, { transaction: t });
    if (!producto) {
      await t.rollback();
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    // Trae los registros de inventario del producto, ordenados FIFO por fecha de entrada del pallet
    const inventarios = await Inventario.findAll({
      where: { idProducto },
      include: [{ model: Pallet, as: 'pallet' }],
      order: [[{ model: Pallet, as: 'pallet' }, 'fechaEntrada', 'ASC']],
      transaction: t,
      lock: t.LOCK.UPDATE, // evita condiciones de carrera con ventas concurrentes
    });

    const stockTotal = inventarios.reduce((acc, inv) => acc + inv.cantidad, 0);

    if (stockTotal < cantidad) {
      await t.rollback();
      return res.status(400).json({
        error: 'Stock insuficiente',
        stockDisponible: stockTotal,
        cantidadSolicitada: cantidad,
      });
    }

    // Descuenta cantidad de los registros de inventario en orden FIFO
    let restante = cantidad;
    for (const inv of inventarios) {
      if (restante <= 0) break;

      const descuento = Math.min(inv.cantidad, restante);
      inv.cantidad -= descuento;
      restante -= descuento;

      await inv.save({ transaction: t });
    }

    const venta = await Venta.create(
      {
        idProducto,
        precioVenta,
        fechaVenta: fechaVenta || new Date(),
      },
      { transaction: t }
    );

    await t.commit();

    res.status(201).json({
      mensaje: 'Venta registrada correctamente',
      venta,
    });
  } catch (error) {
    await t.rollback();
    res.status(500).json({ error: 'Error al registrar la venta', detalle: error.message });
  }
};

exports.listar = async (req, res) => {
  try {
    const ventas = await Venta.findAll({
      include: [{ model: Producto, as: 'producto' }],
      order: [['fechaVenta', 'DESC']],
    });
    res.json(ventas);
  } catch (error) {
    res.status(500).json({ error: 'Error al listar ventas', detalle: error.message });
  }
};