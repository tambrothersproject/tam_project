import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';
import api from '../../api/client';
import { fmt, COLOR_SUCCESS, COLOR_DANGER, COLOR_BORDER, COLOR_TEXT, TooltipOscuro } from './chartUtils';

export default function MetricasPallets() {
  const { desde, hasta } = useOutletContext();
  const [pallets, setPallets] = useState([]);
  const [utilidadPallets, setUtilidadPallets] = useState(null);
  const [palletSeleccionado, setPalletSeleccionado] = useState(null);
  const [productosPallet, setProductosPallet] = useState(null);
  const [estadoPallet, setEstadoPallet] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/metrics/pallets').then(({ data }) => setPallets(data)).catch(() => {});
  }, []);

  useEffect(() => {
    const params = {};
    if (desde) params.desde = desde;
    if (hasta) params.hasta = hasta;

    setError('');
    api
      .get('/metrics/utilidad-pallets', { params })
      .then(({ data }) => setUtilidadPallets(data))
      .catch((err) => setError(err.response?.data?.error || 'No se pudo cargar la utilidad por pallet'));
  }, [desde, hasta]);

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

  const datosUtilidadPallets = (utilidadPallets?.pallets || []).map((p) => ({ ...p, nombre: `Pallet ${p.numero ?? '—'}` }));

  return (
    <div>
      {error && <div className="error-msg">{error}</div>}

      <h3 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 12px' }}>Inventario por pallet</h3>
      <div style={{ display: 'grid', gridTemplateColumns: palletSeleccionado === null ? '1fr' : '1fr 1fr', gap: 20, marginBottom: 28 }}>
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
                <div key={e.value} className={'chip' + (estadoPallet === e.value ? ' active' : '')} onClick={() => setEstadoPallet(e.value)}>
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

      <h3 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 12px' }}>Utilidad por pallet</h3>
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
    </div>
  );
}
