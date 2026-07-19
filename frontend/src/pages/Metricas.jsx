import { useEffect, useState } from 'react';
import api from '../api/client';

function fmt(n) {
  return '$' + Number(n || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 });
}

const ETIQUETAS_CATEGORIA = {
  ASISTENCIA_MERCADO: 'Asistencia en el mercado',
  GASOLINA: 'Gasolina',
  COMPRA_PALLETS: 'Compra de pallets',
  RETIRO_SOCIOS: 'Retiro de socio',
  OTRO: 'Otro',
};

function Accordion({ title, defaultOpen = false, children }) {
  const [abierto, setAbierto] = useState(defaultOpen);
  return (
    <div className="accordion-item">
      <div className="accordion-header" onClick={() => setAbierto((a) => !a)}>
        <span>{title}</span>
        <span className={'accordion-chevron' + (abierto ? ' open' : '')}>▼</span>
      </div>
      {abierto && <div className="accordion-body">{children}</div>}
    </div>
  );
}

export default function Metricas() {
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');

  const [resumen, setResumen] = useState(null);
  const [ventasPorDia, setVentasPorDia] = useState([]);
  const [gastosPorTipo, setGastosPorTipo] = useState(null);
  const [retirosSocios, setRetirosSocios] = useState(null);
  const [utilidadPallets, setUtilidadPallets] = useState(null);
  const [pallets, setPallets] = useState([]);
  const [palletSeleccionado, setPalletSeleccionado] = useState(null);
  const [productosPallet, setProductosPallet] = useState(null);
  const [estadoPallet, setEstadoPallet] = useState('');
  const [error, setError] = useState('');

  async function cargarResumenYVentas() {
    try {
      const params = {};
      if (desde) params.desde = desde;
      if (hasta) params.hasta = hasta;

      const [resResumen, resVentas, resRetiros, resGastosTipo, resUtilidadPallets] = await Promise.all([
        api.get('/metrics/resumen', { params }),
        api.get('/metrics/ventas-por-dia', { params }),
        api.get('/metrics/retiros-socios', { params }),
        api.get('/metrics/gastos-por-tipo', { params }),
        api.get('/metrics/utilidad-pallets', { params }),
      ]);
      setResumen(resResumen.data);
      setVentasPorDia(resVentas.data);
      setRetirosSocios(resRetiros.data);
      setGastosPorTipo(resGastosTipo.data);
      setUtilidadPallets(resUtilidadPallets.data);
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudieron cargar las métricas');
    }
  }

  async function cargarPallets() {
    try {
      const { data } = await api.get('/metrics/pallets');
      setPallets(data);
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo cargar el resumen de pallets');
    }
  }

  useEffect(() => {
    cargarResumenYVentas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [desde, hasta]);

  useEffect(() => {
    cargarPallets();
  }, []);

  async function verPallet(numero) {
    setPalletSeleccionado(numero);
    setEstadoPallet('');
    const { data } = await api.get(`/metrics/pallets/${numero}/productos`);
    setProductosPallet(data);
  }

  useEffect(() => {
    if (palletSeleccionado === null) return;
    api
      .get(`/metrics/pallets/${palletSeleccionado}/productos`, { params: estadoPallet ? { estado: estadoPallet } : {} })
      .then(({ data }) => setProductosPallet(data));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estadoPallet]);

  return (
    <div>
      <h1 className="page-title">Métricas</h1>

      <div className="topbar">
        <div className="field" style={{ marginBottom: 0 }}>
          <label>Desde</label>
          <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
        </div>
        <div className="field" style={{ marginBottom: 0 }}>
          <label>Hasta</label>
          <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
        </div>
        {(desde || hasta) && (
          <button className="ghost" style={{ alignSelf: 'flex-end' }} onClick={() => { setDesde(''); setHasta(''); }}>
            Limpiar filtro
          </button>
        )}
      </div>

      {error && <div className="error-msg">{error}</div>}

      {resumen && (
        <div className="stats">
          <div className="stat-card">
            <div className="stat-label">Artículos vendidos</div>
            <div className="stat-value">{resumen.articulosVendidos}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Total ventas</div>
            <div className="stat-value">{fmt(resumen.totalVentas)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Gastos operativos</div>
            <div className="stat-value">{fmt(resumen.totalGastosOperativos)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Utilidad operativa</div>
            <div className="stat-value" style={{ color: resumen.utilidadOperativa >= 0 ? 'var(--success)' : 'var(--danger)' }}>
              {fmt(resumen.utilidadOperativa)}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Retiros de socios</div>
            <div className="stat-value">{fmt(resumen.totalRetirosSocios)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Utilidad después de retiros</div>
            <div className="stat-value" style={{ color: resumen.utilidadDespuesDeRetiros >= 0 ? 'var(--success)' : 'var(--danger)' }}>
              {fmt(resumen.utilidadDespuesDeRetiros)}
            </div>
          </div>
        </div>
      )}

      <Accordion title="Pallets" defaultOpen>
        <div style={{ display: 'grid', gridTemplateColumns: palletSeleccionado === null ? '1fr' : '1fr 1fr', gap: 20 }}>
          <table>
            <thead>
              <tr>
                <th>Pallet</th>
                <th className="num">Total</th>
                <th className="num">Disponibles</th>
                <th className="num">Vendidos</th>
                <th className="num">Ver</th>
              </tr>
            </thead>
            <tbody>
              {pallets.map((p) => (
                <tr key={p.idPallet}>
                  <td>{p.pallet?.numero}</td>
                  <td className="num">{p.total}</td>
                  <td className="num">{p.disponibles}</td>
                  <td className="num">{p.vendidos}</td>
                  <td className="num">
                    <button className="action-btn" onClick={() => verPallet(p.pallet?.numero)}>
                      Ver productos
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {palletSeleccionado !== null && productosPallet && (
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <strong>Pallet {palletSeleccionado} · {productosPallet.cantidad} artículos</strong>
                <button className="ghost" onClick={() => setPalletSeleccionado(null)}>Cerrar</button>
              </div>
              <div className="chip-row">
                {[
                  { value: '', label: 'Todos' },
                  { value: 'DISPONIBLE', label: 'Disponibles' },
                  { value: 'VENDIDO', label: 'Vendidos' },
                ].map((e) => (
                  <div
                    key={e.value}
                    className={'chip' + (estadoPallet === e.value ? ' active' : '')}
                    onClick={() => setEstadoPallet(e.value)}
                  >
                    {e.label}
                  </div>
                ))}
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Estado</th>
                    <th className="num">Precio venta</th>
                  </tr>
                </thead>
                <tbody>
                  {productosPallet.productos.map((p) => (
                    <tr key={p.id}>
                      <td>{p.producto}</td>
                      <td>
                        <span className={'badge ' + (p.estado === 'DISPONIBLE' ? 'disponible' : 'vendido')}>
                          {p.estado === 'DISPONIBLE' ? 'Disponible' : 'Vendido'}
                        </span>
                      </td>
                      <td className="num">{fmt(p.precioVenta)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Accordion>

      <Accordion title="Utilidad por pallet">
        {utilidadPallets && utilidadPallets.pallets.length > 0 ? (
          <>
            <p className="muted" style={{ fontSize: 12, margin: '0 0 12px' }}>
              Gastos generales (gasolina, asistencia) del periodo: {fmt(utilidadPallets.gastosGeneralesTotal)},
              {' '}prorrateados entre {utilidadPallets.cantidadPalletsActivos} pallet(s) activo(s) →
              {' '}{fmt(utilidadPallets.prorrateoPorPallet)} c/u.
            </p>
            <table>
              <thead>
                <tr>
                  <th>Pallet</th>
                  <th className="num">Ventas</th>
                  <th className="num">Costo de compra</th>
                  <th className="num">Gastos generales (prorrateo)</th>
                  <th className="num">Utilidad neta</th>
                  <th className="num">Margen</th>
                </tr>
              </thead>
              <tbody>
                {utilidadPallets.pallets.map((p) => (
                  <tr key={p.idPallet}>
                    <td>{p.numero ?? '—'}</td>
                    <td className="num">{fmt(p.ventas)}</td>
                    <td className="num">{fmt(p.costoDirecto)}</td>
                    <td className="num">{fmt(p.gastosGeneralesProrrateados)}</td>
                    <td className="num" style={{ color: p.utilidad >= 0 ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>
                      {fmt(p.utilidad)}
                    </td>
                    <td className="num muted">{p.margen === null ? '—' : `${(p.margen * 100).toFixed(0)}%`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {utilidadPallets.pallets.some((p) => p.costoDirecto === 0) && (
              <p className="muted" style={{ fontSize: 11, margin: '10px 0 0' }}>
                Los pallets con costo de compra en $0.00 probablemente tengan su gasto de "Compra de
                pallets" sin ligar todavía — edítalo en Gastos y selecciona el pallet correspondiente
                para que esta tabla sea exacta.
              </p>
            )}
          </>
        ) : (
          <div className="empty-state">No hay actividad de pallets (ventas o compras) en el rango seleccionado.</div>
        )}
      </Accordion>

      <Accordion title="Gastos por tipo">
        {gastosPorTipo && (
          <table style={{ maxWidth: 520 }}>
            <thead>
              <tr>
                <th>Categoría</th>
                <th>Tipo</th>
                <th className="num">Cantidad</th>
                <th className="num">Total</th>
              </tr>
            </thead>
            <tbody>
              {gastosPorTipo.categorias.map((c, i) => (
                <tr key={i}>
                  <td>{ETIQUETAS_CATEGORIA[c.categoria] || c.categoria}</td>
                  <td>
                    <span className={'badge ' + (c.afectaUtilidad ? 'vendido' : 'disponible')}>
                      {c.afectaUtilidad ? 'Operativo' : 'No operativo'}
                    </span>
                  </td>
                  <td className="num">{c.cantidad}</td>
                  <td className="num">{fmt(c.total)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3} style={{ fontWeight: 600 }}>Total operativo</td>
                <td className="num" style={{ fontWeight: 600 }}>{fmt(gastosPorTipo.totalOperativo)}</td>
              </tr>
              <tr>
                <td colSpan={3} style={{ fontWeight: 600 }}>Total no operativo</td>
                <td className="num" style={{ fontWeight: 600 }}>{fmt(gastosPorTipo.totalNoOperativo)}</td>
              </tr>
            </tfoot>
          </table>
        )}
      </Accordion>

      <Accordion title="Retiros por socio">
        {retirosSocios && Object.keys(retirosSocios.porSocio).length > 0 ? (
          <table style={{ maxWidth: 420 }}>
            <thead>
              <tr>
                <th>Socio</th>
                <th className="num">Total retirado</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(retirosSocios.porSocio).map(([socio, monto]) => (
                <tr key={socio}>
                  <td className={socio === 'Sin asignar' ? 'muted' : ''}>{socio}</td>
                  <td className="num">{fmt(monto)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">No hay retiros registrados en el rango seleccionado.</div>
        )}
      </Accordion>

      <Accordion title="Ventas por día">
        {ventasPorDia.length === 0 ? (
          <div className="empty-state">No hay ventas en el rango seleccionado.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th className="num">Artículos vendidos</th>
                <th className="num">Total vendido</th>
              </tr>
            </thead>
            <tbody>
              {ventasPorDia.map((v) => (
                <tr key={v.fecha}>
                  <td>{v.fecha}</td>
                  <td className="num">{v.articulosVendidos}</td>
                  <td className="num">{fmt(v.totalVenta)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Accordion>
    </div>
  );
}
