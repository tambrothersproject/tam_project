import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import api from '../../api/client';
import { fmt, COLOR_ACCENT, COLOR_BORDER, COLOR_TEXT, TooltipOscuro } from './chartUtils';

const UMBRAL_TABLA_LARGA = 60;

const AGRUPACIONES = [
  { value: 'dia', label: 'Día' },
  { value: 'semana', label: 'Semana' },
  { value: 'mes', label: 'Mes' },
];

export default function MetricasVentas() {
  const { desde, hasta } = useOutletContext();
  const [agrupacion, setAgrupacion] = useState('dia');
  const [datos, setDatos] = useState([]);
  const [error, setError] = useState('');
  const [mostrarTablaCompleta, setMostrarTablaCompleta] = useState(false);

  const [diaSeleccionado, setDiaSeleccionado] = useState(null);
  const [detalleDia, setDetalleDia] = useState(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);

  useEffect(() => {
    const params = { agrupacion };
    if (desde) params.desde = desde;
    if (hasta) params.hasta = hasta;

    setError('');
    setMostrarTablaCompleta(false);
    api
      .get('/metrics/ventas-por-dia', { params })
      .then(({ data }) => setDatos(data))
      .catch((err) => setError(err.response?.data?.error || 'No se pudieron cargar las ventas'));
  }, [desde, hasta, agrupacion]);

  async function verDetalleDia(fecha) {
    if (agrupacion !== 'dia') return;
    setDiaSeleccionado(fecha);
    setCargandoDetalle(true);
    try {
      const { data } = await api.get(`/metrics/ventas-dia/${fecha}`);
      setDetalleDia(data);
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo cargar el detalle del día');
      setDiaSeleccionado(null);
    } finally {
      setCargandoDetalle(false);
    }
  }

  const tablaLarga = agrupacion === 'dia' && datos.length > UMBRAL_TABLA_LARGA;
  const filasAMostrar = tablaLarga && !mostrarTablaCompleta ? [] : datos;

  return (
    <div>
      <div className="chip-row">
        {AGRUPACIONES.map((g) => (
          <div key={g.value} className={'chip' + (agrupacion === g.value ? ' active' : '')} onClick={() => setAgrupacion(g.value)}>
            {g.label}
          </div>
        ))}
      </div>

      {error && <div className="error-msg">{error}</div>}

      {datos.length === 0 ? (
        <div className="empty-state">No hay ventas en el rango seleccionado.</div>
      ) : (
        <>
          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer>
              <BarChart data={datos} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid stroke={COLOR_BORDER} vertical={false} />
                <XAxis dataKey="fecha" stroke={COLOR_TEXT} fontSize={11} />
                <YAxis stroke={COLOR_TEXT} fontSize={12} width={70} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<TooltipOscuro formatter={fmt} />} />
                <Bar
                  dataKey="totalVenta"
                  name="Total vendido"
                  fill={COLOR_ACCENT}
                  radius={[3, 3, 0, 0]}
                  cursor={agrupacion === 'dia' ? 'pointer' : 'default'}
                  onClick={(d) => verDetalleDia(d.fecha)}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {agrupacion === 'dia' && (
            <p className="muted" style={{ fontSize: 11, margin: '6px 0 16px' }}>
              Haz clic en una barra o en una fila de la tabla para ver los artículos vendidos ese día.
              {datos.length > 45 && ' Con tantos días, prueba agrupar por semana o mes para verlo más claro.'}
            </p>
          )}

          {tablaLarga && !mostrarTablaCompleta ? (
            <div className="empty-state" style={{ textAlign: 'left', padding: '16px 0' }}>
              Este rango tiene {datos.length} días con ventas — se ocultó la tabla para no hacer la
              página muy pesada. Prueba agrupar por semana o mes, acorta el rango de fechas, o
              {' '}
              <button className="ghost" onClick={() => setMostrarTablaCompleta(true)} style={{ marginLeft: 4 }}>
                ver la tabla completa de todas formas
              </button>
            </div>
          ) : (
            <div className={tablaLarga ? 'table-scroll' : ''}>
              <table>
                <thead>
                  <tr>
                    <th>{agrupacion === 'mes' ? 'Mes' : agrupacion === 'semana' ? 'Semana de' : 'Fecha'}</th>
                    <th className="num">Artículos vendidos</th>
                    <th className="num">Total vendido</th>
                    {agrupacion === 'dia' && <th className="num">Detalle</th>}
                  </tr>
                </thead>
                <tbody>
                  {filasAMostrar.map((v) => (
                    <tr
                      key={v.fecha}
                      className={agrupacion === 'dia' ? 'clickable-row' : ''}
                      onClick={() => agrupacion === 'dia' && verDetalleDia(v.fecha)}
                    >
                      <td>{v.fecha}</td>
                      <td className="num">{v.articulosVendidos}</td>
                      <td className="num">{fmt(v.totalVenta)}</td>
                      {agrupacion === 'dia' && (
                        <td className="num">
                          <button className="action-btn" onClick={(e) => { e.stopPropagation(); verDetalleDia(v.fecha); }}>
                            Ver artículos
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {diaSeleccionado && (
        <div className="modal-overlay" onClick={() => setDiaSeleccionado(null)}>
          <div className="modal" style={{ width: 460 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Ventas del {diaSeleccionado}</h3>
              <button className="ghost" onClick={() => setDiaSeleccionado(null)}>Cerrar</button>
            </div>
            {cargandoDetalle ? (
              <div className="empty-state">Cargando...</div>
            ) : detalleDia ? (
              <>
                <p className="muted" style={{ fontSize: 12, margin: '0 0 12px' }}>
                  {detalleDia.cantidad} artículo(s) · {fmt(detalleDia.total)} en total
                </p>
                <div className="table-scroll" style={{ maxHeight: 320 }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Producto</th>
                        <th>Pallet</th>
                        <th className="num">Precio venta</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detalleDia.articulos.map((a) => (
                        <tr key={a.id}>
                          <td>{a.producto}</td>
                          <td className="muted">{a.pallet?.numero ?? '—'}</td>
                          <td className="num">{fmt(a.precioVenta)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
