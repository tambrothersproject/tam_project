import { useEffect, useState } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import api from '../../api/client';
import { fmt, COLOR_ACCENT, COLOR_SUCCESS, COLOR_DANGER, COLOR_BORDER, COLOR_TEXT, TooltipOscuro } from './chartUtils';

const NAV_CARDS = [
  { to: 'ventas', titulo: 'Ventas por día', desc: 'Explora ventas por día, semana o mes, con el detalle de artículos vendidos.' },
  { to: 'pallets', titulo: 'Pallets', desc: 'Inventario por pallet y utilidad neta de cada uno (ventas − costo − gastos prorrateados).' },
  { to: 'gastos', titulo: 'Gastos', desc: 'Desglose de gastos por categoría, operativo vs. no operativo.' },
  { to: 'retiros', titulo: 'Retiros de socios', desc: 'Historial de repartos de utilidades entre los socios.' },
];

export default function MetricasDashboard() {
  const { desde, hasta } = useOutletContext();
  const [resumen, setResumen] = useState(null);
  const [resumenMensual, setResumenMensual] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const params = {};
    if (desde) params.desde = desde;
    if (hasta) params.hasta = hasta;

    setError('');
    Promise.all([
      api.get('/metrics/resumen', { params }),
      api.get('/metrics/resumen-mensual', { params }),
    ])
      .then(([resResumen, resMensual]) => {
        setResumen(resResumen.data);
        setResumenMensual(resMensual.data);
      })
      .catch((err) => setError(err.response?.data?.error || 'No se pudieron cargar las métricas'));
  }, [desde, hasta]);

  return (
    <div>
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

      <h3 style={{ fontSize: 14, fontWeight: 600, margin: '8px 0 12px' }}>Tendencia mensual</h3>
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

      <h3 style={{ fontSize: 14, fontWeight: 600, margin: '28px 0 4px' }}>Ver más detalle</h3>
      <div className="nav-cards">
        {NAV_CARDS.map((c) => (
          <Link key={c.to} to={c.to} className="nav-card">
            <div className="nav-card-title">{c.titulo}</div>
            <div className="nav-card-desc">{c.desc}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
