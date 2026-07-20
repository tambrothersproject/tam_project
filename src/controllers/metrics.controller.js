const { Op, fn, col, literal } = require('sequelize');
const { Mercancia, Pallet, Gasto, Aportacion, ConteoCaja } = require('../models');

// GET /api/metrics/ventas-por-dia?desde=&hasta=&agrupacion=dia|semana|mes
// Agrupa las ventas (Mercancias con estado VENDIDO) por fecha de venta.
// "agrupacion" permite ver día a día, por semana (lunes de cada semana) o
// por mes — pensado para que la gráfica siga siendo legible aunque pasen
// meses/años y el historial diario crezca mucho.
exports.ventasPorDia = async (req, res) => {
  try {
    const { desde, hasta, agrupacion = 'dia' } = req.query;
    const where = { estado: 'VENDIDO' };
    if (desde || hasta) {
      where.fechaVenta = {};
      if (desde) where.fechaVenta[Op.gte] = desde;
      if (hasta) where.fechaVenta[Op.lte] = hasta;
    }

    const expresionFecha =
      agrupacion === 'mes'
        ? fn('to_char', col('fechaVenta'), 'YYYY-MM')
        : agrupacion === 'semana'
        ? fn('to_char', fn('date_trunc', 'week', col('fechaVenta')), 'YYYY-MM-DD')
        : fn('to_char', col('fechaVenta'), 'YYYY-MM-DD');

    const filas = await Mercancia.findAll({
      where,
      attributes: [
        [expresionFecha, 'fecha'],
        [fn('COUNT', col('id')), 'articulosVendidos'],
        [fn('SUM', col('precioVenta')), 'totalVenta'],
      ],
      group: [expresionFecha],
      order: [[literal('fecha'), 'ASC']],
      raw: true,
    });

    res.json(filas);
  } catch (error) {
    res.status(500).json({ error: 'Error al calcular ventas por día', detalle: error.message });
  }
};

// GET /api/metrics/ventas-dia/:fecha
// Detalle de los artículos vendidos en un día exacto (YYYY-MM-DD). Es el
// "drill-down" al hacer clic en una barra o fila de la vista de Ventas.
// Solo tiene sentido cuando se navega en agrupación "dia"; una semana o
// mes agrupa varias fechas y no hay un único día que consultar.
exports.ventasDeUnDia = async (req, res) => {
  try {
    const { fecha } = req.params;

    const articulos = await Mercancia.findAll({
      where: { estado: 'VENDIDO', fechaVenta: fecha },
      include: [{ model: Pallet, as: 'pallet', attributes: ['numero'] }],
      order: [['precioVenta', 'DESC']],
    });

    const total = articulos.reduce((acc, a) => acc + parseFloat(a.precioVenta || 0), 0);

    res.json({ fecha, cantidad: articulos.length, total, articulos });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener las ventas del día', detalle: error.message });
  }
};

// GET /api/metrics/pallets
// Resumen por pallet: cuántos artículos tiene en total, disponibles y vendidos.
exports.resumenPallets = async (req, res) => {
  try {
    const filas = await Mercancia.findAll({
      attributes: [
        'idPallet',
        [fn('COUNT', col('Mercancia.id')), 'total'],
        [fn('SUM', literal(`CASE WHEN "estado" = 'DISPONIBLE' THEN 1 ELSE 0 END`)), 'disponibles'],
        [fn('SUM', literal(`CASE WHEN "estado" = 'VENDIDO' THEN 1 ELSE 0 END`)), 'vendidos'],
      ],
      include: [{ model: Pallet, as: 'pallet', attributes: ['numero', 'ubicacion'] }],
      group: ['idPallet', 'pallet.id', 'pallet.numero', 'pallet.ubicacion'],
      order: [[{ model: Pallet, as: 'pallet' }, 'numero', 'ASC']],
    });

    res.json(filas);
  } catch (error) {
    res.status(500).json({ error: 'Error al calcular el resumen por pallet', detalle: error.message });
  }
};

// GET /api/metrics/pallets/:numero/productos?estado=
// Lista de productos de un pallet específico (por su número, no su id).
exports.productosDePallet = async (req, res) => {
  try {
    const { numero } = req.params;
    const { estado } = req.query;

    const pallet = await Pallet.findOne({ where: { numero } });
    if (!pallet) return res.status(404).json({ error: 'No existe un pallet con ese número' });

    const where = { idPallet: pallet.id };
    if (estado) where.estado = estado;

    const productos = await Mercancia.findAll({ where, order: [['id', 'ASC']] });

    res.json({ pallet, cantidad: productos.length, productos });
  } catch (error) {
    res.status(500).json({ error: 'Error al listar productos del pallet', detalle: error.message });
  }
};

// GET /api/metrics/resumen?desde=&hasta=
// Ventas totales, gastos OPERATIVOS y utilidad en un rango de fechas.
// Los retiros de socios y cualquier gasto marcado afectaUtilidad=false
// se reportan aparte, no se restan de la utilidad operativa.
exports.resumen = async (req, res) => {
  try {
    const { desde, hasta } = req.query;

    const whereVentas = { estado: 'VENDIDO' };
    const whereGastos = {};
    if (desde || hasta) {
      whereVentas.fechaVenta = {};
      whereGastos.fecha = {};
      if (desde) {
        whereVentas.fechaVenta[Op.gte] = desde;
        whereGastos.fecha[Op.gte] = desde;
      }
      if (hasta) {
        whereVentas.fechaVenta[Op.lte] = hasta;
        whereGastos.fecha[Op.lte] = hasta;
      }
    }

    const [ventas, gastos] = await Promise.all([
      Mercancia.findAll({ where: whereVentas, attributes: ['precioVenta'], raw: true }),
      Gasto.findAll({ where: whereGastos, attributes: ['monto', 'afectaUtilidad', 'categoria'], raw: true }),
    ]);

    const totalVentas = ventas.reduce((acc, v) => acc + parseFloat(v.precioVenta || 0), 0);
    const totalGastosOperativos = gastos
      .filter((g) => g.afectaUtilidad)
      .reduce((acc, g) => acc + parseFloat(g.monto || 0), 0);
    const totalRetirosSocios = gastos
      .filter((g) => g.categoria === 'RETIRO_SOCIOS')
      .reduce((acc, g) => acc + parseFloat(g.monto || 0), 0);
    const totalNoOperativoOtros = gastos
      .filter((g) => !g.afectaUtilidad && g.categoria !== 'RETIRO_SOCIOS')
      .reduce((acc, g) => acc + parseFloat(g.monto || 0), 0);

    const utilidadOperativa = totalVentas - totalGastosOperativos;

    res.json({
      articulosVendidos: ventas.length,
      totalVentas,
      totalGastosOperativos,
      utilidadOperativa,
      totalRetirosSocios,
      totalNoOperativoOtros,
      utilidadDespuesDeRetiros: utilidadOperativa - totalRetirosSocios,
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al calcular el resumen', detalle: error.message });
  }
};

// GET /api/metrics/balance-general
// Replica tu hoja "Balance financiero": inversión inicial + estímulos +
// ventas = ingresos totales; TODOS los gastos (operativos y no operativos,
// porque ambos son salidas reales de caja) = costos; actual teórico =
// ingresos - costos; actual real = tu conteo físico más reciente.
exports.balanceGeneral = async (req, res) => {
  try {
    const [aportaciones, ventas, gastos, ultimoConteo] = await Promise.all([
      Aportacion.findAll({ attributes: ['categoria', 'monto'], raw: true }),
      Mercancia.findAll({ where: { estado: 'VENDIDO' }, attributes: ['precioVenta'], raw: true }),
      Gasto.findAll({ attributes: ['monto'], raw: true }),
      ConteoCaja.findOne({ order: [['fecha', 'DESC'], ['id', 'DESC']] }),
    ]);

    const totalInversionInicial = aportaciones
      .filter((a) => a.categoria === 'INVERSION_INICIAL')
      .reduce((acc, a) => acc + parseFloat(a.monto), 0);
    const totalEstimulos = aportaciones
      .filter((a) => a.categoria === 'ESTIMULO')
      .reduce((acc, a) => acc + parseFloat(a.monto), 0);
    const totalOtrasAportaciones = aportaciones
      .filter((a) => a.categoria === 'OTRO')
      .reduce((acc, a) => acc + parseFloat(a.monto), 0);
    const totalVentas = ventas.reduce((acc, v) => acc + parseFloat(v.precioVenta || 0), 0);

    const totalIngresos = totalInversionInicial + totalEstimulos + totalOtrasAportaciones + totalVentas;
    const totalCostos = gastos.reduce((acc, g) => acc + parseFloat(g.monto), 0);
    const actualTeorico = totalIngresos - totalCostos;

    const actualReal = ultimoConteo ? parseFloat(ultimoConteo.montoContado) : null;
    const diferencia = actualReal !== null ? actualReal - actualTeorico : null;

    res.json({
      inversionInicial: totalInversionInicial,
      estimulos: totalEstimulos,
      otrasAportaciones: totalOtrasAportaciones,
      ventas: totalVentas,
      totalIngresos,
      costos: totalCostos,
      actualTeorico,
      actualReal,
      diferencia,
      ultimoConteo,
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al calcular el balance general', detalle: error.message });
  }
};

// GET /api/metrics/gastos-por-tipo?desde=&hasta=
// Desglosa los gastos por categoría, indicando si cada una es operativa
// (afecta la utilidad) o no (retiros, préstamos personales, etc.)
exports.gastosPorTipo = async (req, res) => {
  try {
    const { desde, hasta } = req.query;
    const where = {};
    if (desde || hasta) {
      where.fecha = {};
      if (desde) where.fecha[Op.gte] = desde;
      if (hasta) where.fecha[Op.lte] = hasta;
    }

    const filas = await Gasto.findAll({
      where,
      attributes: [
        'categoria',
        'afectaUtilidad',
        [fn('SUM', col('monto')), 'total'],
        [fn('COUNT', col('id')), 'cantidad'],
      ],
      group: ['categoria', 'afectaUtilidad'],
      order: [['categoria', 'ASC']],
      raw: true,
    });

    const totalOperativo = filas.filter((f) => f.afectaUtilidad).reduce((acc, f) => acc + parseFloat(f.total), 0);
    const totalNoOperativo = filas.filter((f) => !f.afectaUtilidad).reduce((acc, f) => acc + parseFloat(f.total), 0);

    res.json({ totalOperativo, totalNoOperativo, categorias: filas });
  } catch (error) {
    res.status(500).json({ error: 'Error al calcular gastos por tipo', detalle: error.message });
  }
};

// GET /api/metrics/retiros-socios?desde=&hasta=
// Desglosa los retiros de utilidades por socio, para llevar el reparto claro.
exports.retirosPorSocio = async (req, res) => {
  try {
    const { desde, hasta } = req.query;
    const where = { categoria: 'RETIRO_SOCIOS' };
    if (desde || hasta) {
      where.fecha = {};
      if (desde) where.fecha[Op.gte] = desde;
      if (hasta) where.fecha[Op.lte] = hasta;
    }

    const retiros = await Gasto.findAll({ where, order: [['fecha', 'DESC']] });

    const porSocio = {};
    for (const r of retiros) {
      const clave = r.socio || 'Sin asignar';
      porSocio[clave] = (porSocio[clave] || 0) + parseFloat(r.monto);
    }

    res.json({
      total: retiros.reduce((acc, r) => acc + parseFloat(r.monto), 0),
      porSocio,
      retiros,
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al calcular los retiros por socio', detalle: error.message });
  }
};

// GET /api/metrics/resumen-mensual?desde=&hasta=
// Ventas, gastos operativos y utilidad agrupados por mes — pensado para
// graficar la tendencia del negocio a lo largo del tiempo, a diferencia de
// /resumen que solo da un total acumulado del rango completo.
exports.resumenMensual = async (req, res) => {
  try {
    const { desde, hasta } = req.query;

    const whereVentas = { estado: 'VENDIDO' };
    const whereGastos = { afectaUtilidad: true };
    if (desde || hasta) {
      whereVentas.fechaVenta = {};
      whereGastos.fecha = {};
      if (desde) {
        whereVentas.fechaVenta[Op.gte] = desde;
        whereGastos.fecha[Op.gte] = desde;
      }
      if (hasta) {
        whereVentas.fechaVenta[Op.lte] = hasta;
        whereGastos.fecha[Op.lte] = hasta;
      }
    }

    const [ventasPorMes, gastosPorMes] = await Promise.all([
      Mercancia.findAll({
        where: whereVentas,
        attributes: [
          [fn('to_char', col('fechaVenta'), 'YYYY-MM'), 'mes'],
          [fn('SUM', col('precioVenta')), 'totalVentas'],
        ],
        group: [fn('to_char', col('fechaVenta'), 'YYYY-MM')],
        raw: true,
      }),
      Gasto.findAll({
        where: whereGastos,
        attributes: [
          [fn('to_char', col('fecha'), 'YYYY-MM'), 'mes'],
          [fn('SUM', col('monto')), 'totalGastos'],
        ],
        group: [fn('to_char', col('fecha'), 'YYYY-MM')],
        raw: true,
      }),
    ]);

    // Se combinan ambos por mes; un mes puede tener ventas sin gastos
    // registrados todavía (o viceversa), así que se arma con un mapa en
    // vez de asumir que ambas consultas traen exactamente los mismos meses.
    const mapa = {};
    for (const v of ventasPorMes) {
      mapa[v.mes] = { mes: v.mes, totalVentas: parseFloat(v.totalVentas || 0), totalGastosOperativos: 0 };
    }
    for (const g of gastosPorMes) {
      if (!mapa[g.mes]) mapa[g.mes] = { mes: g.mes, totalVentas: 0, totalGastosOperativos: 0 };
      mapa[g.mes].totalGastosOperativos = parseFloat(g.totalGastos || 0);
    }

    const filas = Object.values(mapa)
      .map((f) => ({ ...f, utilidadOperativa: f.totalVentas - f.totalGastosOperativos }))
      .sort((a, b) => a.mes.localeCompare(b.mes));

    res.json(filas);
  } catch (error) {
    res.status(500).json({ error: 'Error al calcular el resumen mensual', detalle: error.message });
  }
};
// Utilidad real por pallet: ventas del pallet, menos su costo directo
// (gastos con idPallet asignado, típicamente su compra), menos un
// prorrateo de los gastos generales (gasolina, asistencia — gastos que
// no pertenecen a un pallet específico) repartido entre los pallets que
// tuvieron actividad en el periodo.
//
// "Actividad en el periodo" = el pallet vendió algo en el rango de fechas,
// o se le registró un gasto directo (ej. su compra) en el rango. Un
// pallet sin ninguna de las dos cosas no participa del prorrateo — no
// tendría sentido cargarle parte de la gasolina de un viaje en el que no
// se vendió ni compró nada de/para él.
exports.utilidadPorPallet = async (req, res) => {
  try {
    const { desde, hasta } = req.query;

    const whereFechaVenta = {};
    const whereFechaGasto = {};
    if (desde || hasta) {
      if (desde) {
        whereFechaVenta[Op.gte] = desde;
        whereFechaGasto[Op.gte] = desde;
      }
      if (hasta) {
        whereFechaVenta[Op.lte] = hasta;
        whereFechaGasto[Op.lte] = hasta;
      }
    }

    const whereVentas = { estado: 'VENDIDO' };
    if (desde || hasta) whereVentas.fechaVenta = whereFechaVenta;

    const whereGastos = {};
    if (desde || hasta) whereGastos.fecha = whereFechaGasto;

    const [ventas, gastos, pallets] = await Promise.all([
      Mercancia.findAll({ where: whereVentas, attributes: ['idPallet', 'precioVenta'], raw: true }),
      Gasto.findAll({ where: { ...whereGastos, afectaUtilidad: true }, attributes: ['idPallet', 'monto'], raw: true }),
      Pallet.findAll({ attributes: ['id', 'numero'], raw: true }),
    ]);

    const numeroPorId = Object.fromEntries(pallets.map((p) => [p.id, p.numero]));

    // Ventas por pallet
    const ventasPorPallet = {};
    for (const v of ventas) {
      ventasPorPallet[v.idPallet] = (ventasPorPallet[v.idPallet] || 0) + parseFloat(v.precioVenta || 0);
    }

    // Gastos directos por pallet (idPallet no nulo) vs. gastos generales
    // (idPallet nulo — se prorratean).
    const costoDirectoPorPallet = {};
    let gastosGenerales = 0;
    for (const g of gastos) {
      if (g.idPallet) {
        costoDirectoPorPallet[g.idPallet] = (costoDirectoPorPallet[g.idPallet] || 0) + parseFloat(g.monto);
      } else {
        gastosGenerales += parseFloat(g.monto);
      }
    }

    // Pallets con actividad en el periodo: vendieron algo o tuvieron un
    // gasto directo (ej. se compraron) en el rango de fechas.
    const idsActivos = new Set([
      ...Object.keys(ventasPorPallet).map(Number),
      ...Object.keys(costoDirectoPorPallet).map(Number),
    ]);

    const cantidadActivos = idsActivos.size;
    const prorrateoPorPallet = cantidadActivos > 0 ? gastosGenerales / cantidadActivos : 0;

    const filas = [...idsActivos].map((idPallet) => {
      const ventasPallet = ventasPorPallet[idPallet] || 0;
      const costoDirecto = costoDirectoPorPallet[idPallet] || 0;
      const utilidad = ventasPallet - costoDirecto - prorrateoPorPallet;
      return {
        idPallet,
        numero: numeroPorId[idPallet] ?? null,
        ventas: ventasPallet,
        costoDirecto,
        gastosGeneralesProrrateados: prorrateoPorPallet,
        utilidad,
        margen: ventasPallet > 0 ? utilidad / ventasPallet : null,
      };
    });

    filas.sort((a, b) => (a.numero ?? 0) - (b.numero ?? 0));

    res.json({
      pallets: filas,
      gastosGeneralesTotal: gastosGenerales,
      cantidadPalletsActivos: cantidadActivos,
      prorrateoPorPallet,
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al calcular la utilidad por pallet', detalle: error.message });
  }
};
