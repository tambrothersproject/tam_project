import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import api from '../../api/client';
import { fmt, PALETA_CATEGORIAS, ETIQUETAS_CATEGORIA, TooltipOscuro } from './chartUtils';

export default function MetricasGastos() {
  const { desde, hasta } = useOutletContext();
  const [gastosPorTipo, setGastosPorTipo] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const params = {};
    if (desde) params.desde = desde;
    if (hasta) params.hasta = hasta;

    setError('');
    api
      .get('/metrics/gastos-por-tipo', { params })
      .then(({ data }) => setGastosPorTipo(data))
      .catch((err) => setError(err.response?.data?.error || 'No se pudieron cargar los gastos'));
  }, [desde, hasta]);

  const datosGastosPorTipo = (gastosPorTipo?.categorias || []).reduce((acc, c) => {
    const existente = acc.find((a) => a.categoria === c.categoria);
    const total = parseFloat(c.total);
    if (existente) existente.total += total;
    else acc.push({ categoria: c.categoria, nombre: ETIQUETAS_CATEGORIA[c.categoria] || c.categoria, total });
    return acc;
  }, []);

  return (
    <div>
      {error && <div className="error-msg">{error}</div>}

      {gastosPorTipo && datosGastosPorTipo.length > 0 ? (
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
                    <span
                      style={{
                        display: 'inline-block', width: 8, height: 8, borderRadius: 999,
                        background: PALETA_CATEGORIAS[datosGastosPorTipo.findIndex((d) => d.categoria === c.categoria) % PALETA_CATEGORIAS.length],
                        marginRight: 8,
                      }}
                    />
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
      ) : (
        <div className="empty-state">No hay gastos registrados en el rango seleccionado.</div>
      )}
    </div>
  );
}
