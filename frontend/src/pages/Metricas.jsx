import { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  ComposedChart,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import api from '../api/client';

function fmt(n) {
  return '$' + Number(n || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 });
}

// Paleta tomada de las variables CSS del tema (styles.css). Recharts dibuja
// SVG directo y no siempre resuelve var(--...), así que se repiten los
// valores hex aquí para que las gráficas combinen con el resto de la app.
const COLOR_ACCENT = '#6d8dfa';
const COLOR_SUCCESS = '#4fd1a0';
const COLOR_DANGER = '#f2637a';
const COLOR_MUTED = '#6b7080';
const COLOR_BORDER = '#2a2f3a';
const COLOR_TEXT = '#9a9fac';
const PALETA_CATEGORIAS = ['#6d8dfa', '#4fd1a0', '#f2637a', '#f5c26b', '#a78bfa', '#6b7080'];

const ETIQUETAS_CATEGORIA = {
  ASISTENCIA_MERCADO: 'Asistencia en el mercado',
  GASOLINA: 'Gasolina',
  COMPRA_PALLETS: 'Compra de pallets',
  RETIRO_SOCIOS: 'Retiro de socio',
  OTRO: 'Otro',
};

// Tooltip oscuro consistente con el tema — el tooltip default de recharts
// es blanco y desentona con el resto de la app.
function TooltipOscuro({ active, payload, label, formatter }) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div style={{ background: '#1d212c', border: `1px solid ${COLOR_BORDER}`, borderRadius: 8, padding: '8px 12px', fontSize: 12 }}>
      {label && <div style={{ color: COLOR_TEXT, marginBottom: 4 }}>{label}</div>}
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || '#e8e9ec' }}>
          {p.name}: {formatter ? formatter(p.value) : p.value}
        </div>
      ))}
    </div>
  );
}

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
  const [resumenMensual, setResumenMensual] = useState([]);
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

      const [resResumen, resVentas, resRetiros, resGastosTipo, resUtilidadPallets, resMensual] = await Promise.all([
        api.get('/metrics/resumen', { params }),
        api.get('/metrics/ventas-por-dia', { params }),
        api.get('/metrics/retiros-socios', { params }),
        api.get('/metrics/gastos-por-tipo', { params }),
        api.get('/metrics/utilidad-pallets', { params }),
        api.get('/metrics/resumen-mensual', { params }),
      ]);
      setResumen(resResumen.data);
      setVentasPorDia(resVentas.data);
      setRetirosSocios(resRetiros.data);
      setGastosPorTipo(resGastosTipo.data);
      setUtilidadPallets(resUtilidadPallets.data);
      setResumenMensual(resMensual.data);
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

  const datosUtilidadPallets = (utilidadPallets?.pallets || []).map((p) => ({
    ...p,
    nombre: `Pallet ${p.numero ?? '—'}`,
  }));

  const datosGastosPorTipo = (gastosPorTipo?.categorias || []).reduce((acc, c) => {
    const existente = acc.find((a) => a.categoria === c.categoria);
    const total = parseFloat(c.total);
    if (existente) existente.total += total;
    else acc.push({ categoria: c.categoria, nombre: ETIQUETAS_CATEGORIA[c.categoria] || c.categoria, total });
    return acc;
  }, []);

  const datosRetiros = retirosSocios
    ? Object.entries(retirosSocios.porSocio).map(([socio, monto]) => ({ socio, monto }))
    : [];

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

      <Accordion title="Tendencia mensual (ventas, gastos, utilidad)" defaultOpen>
        {resumenMensual.length === 0 ? (
          <div className="empty-state">No hay datos suficientes para mostrar una tendencia.</div>
        ) : (
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <ComposedChart data={resumenMensual} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid stroke={COLOR_BORDER} vertical={false} />
                <XAxis dataKey="mes" stroke={COLOR_TEXT} fontSize={12} />
                <YAxis stroke={COLOR_TEXT} fontSize={12} width={70} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<TooltipOscuro formatter={fmt} />} />
                <Legend wrapperStyle={{ fontSize: 12, color: COLOR_TEXT }} />
                <Bar dataKey="totalVentas" name="Ventas" fill={COLOR_ACCENT} radius={[4, 4, 0, 0]} />
                <Bar dataKey="totalGastosOperativos" name="Gastos operativos" fill={COLOR_DANGER} radius={[4, 4, 0, 0]} />
                <Line type="monotone" dataKey="utilidadOperativa" name="Utilidad" stroke={COLOR_SUCCESS} strokeWidth={2} dot={{ r: 3 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </Accordion>

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

            <div style={{ width: '100%', height: Math.max(200, datosUtilidadPallets.length * 42) }}>
              <ResponsiveContainer>
                <BarChart data={datosUtilidadPallets} layout="vertical" margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                  <CartesianGrid stroke={COLOR_BORDER} horizontal={false} />
                  <XAxis type="number" stroke={COLOR_TEXT} fontSize={12} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <YAxis type="category" dataKey="nombre" stroke={COLOR_TEXT} fontSize={12} width={80} />
                  <Tooltip content={<TooltipOscuro formatter={fmt} />} />
                  <Bar dataKey="utilidad" name="Utilidad neta" radius={[0, 4, 4, 0]}>
                    {datosUtilidadPallets.map((p, i) => (
                      <Cell key={i} fill={p.utilidad >= 0 ? COLOR_SUCCESS : COLOR_DANGER} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <table style={{ marginTop: 16 }}>
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
                para que esta gráfica y tabla sean exactas.
              </p>
            )}
          </>
        ) : (
          <div className="empty-state">No hay actividad de pallets (ventas o compras) en el rango seleccionado.</div>
        )}
      </Accordion>

      <Accordion title="Gastos por tipo">
        {gastosPorTipo && datosGastosPorTipo.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 20, alignItems: 'center' }}>
            <div style={{ width: '100%', height: 220 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={datosGastosPorTipo} dataKey="total" nameKey="nombre" innerRadius={50} outerRadius={80} paddingAngle={2}>
                    {datosGastosPorTipo.map((_, i) => (
                      <Cell key={i} fill={PALETA_CATEGORIAS[i % PALETA_CATEGORIAS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<TooltipOscuro formatter={fmt} />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

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
                    <td>
                      <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 999, background: PALETA_CATEGORIAS[datosGastosPorTipo.findIndex((d) => d.categoria === c.categoria) % PALETA_CATEGORIAS.length], marginRight: 8 }} />
                      {ETIQUETAS_CATEGORIA[c.categoria] || c.categoria}
                    </td>
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
          </div>
        )}
      </Accordion>

      <Accordion title="Retiros por socio">
        {retirosSocios && datosRetiros.length > 0 ? (
          <>
            <div style={{ width: '100%', height: Math.max(160, datosRetiros.length * 50) }}>
              <ResponsiveContainer>
                <BarChart data={datosRetiros} layout="vertical" margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                  <CartesianGrid stroke={COLOR_BORDER} horizontal={false} />
                  <XAxis type="number" stroke={COLOR_TEXT} fontSize={12} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <YAxis type="category" dataKey="socio" stroke={COLOR_TEXT} fontSize={12} width={90} />
                  <Tooltip content={<TooltipOscuro formatter={fmt} />} />
                  <Bar dataKey="monto" name="Total retirado" fill={COLOR_ACCENT} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <table style={{ maxWidth: 420, marginTop: 16 }}>
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
          </>
        ) : (
          <div className="empty-state">No hay retiros registrados en el rango seleccionado.</div>
        )}
      </Accordion>

      <Accordion title="Ventas por día">
        {ventasPorDia.length === 0 ? (
          <div className="empty-state">No hay ventas en el rango seleccionado.</div>
        ) : (
          <>
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer>
                <ComposedChart data={ventasPorDia} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke={COLOR_BORDER} vertical={false} />
                  <XAxis dataKey="fecha" stroke={COLOR_TEXT} fontSize={11} />
                  <YAxis stroke={COLOR_TEXT} fontSize={12} width={70} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip content={<TooltipOscuro formatter={fmt} />} />
                  <Bar dataKey="totalVenta" name="Total vendido" fill={COLOR_ACCENT} radius={[3, 3, 0, 0]} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <table style={{ marginTop: 16 }}>
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
          </>
        )}
      </Accordion>
    </div>
  );
}
