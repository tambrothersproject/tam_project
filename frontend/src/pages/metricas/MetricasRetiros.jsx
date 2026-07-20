import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import api from '../../api/client';
import { fmt, COLOR_ACCENT, COLOR_BORDER, COLOR_TEXT, TooltipOscuro } from './chartUtils';

export default function MetricasRetiros() {
  const { desde, hasta } = useOutletContext();
  const [retirosSocios, setRetirosSocios] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const params = {};
    if (desde) params.desde = desde;
    if (hasta) params.hasta = hasta;

    setError('');
    api
      .get('/metrics/retiros-socios', { params })
      .then(({ data }) => setRetirosSocios(data))
      .catch((err) => setError(err.response?.data?.error || 'No se pudieron cargar los retiros'));
  }, [desde, hasta]);

  const datosRetiros = retirosSocios ? Object.entries(retirosSocios.porSocio).map(([socio, monto]) => ({ socio, monto })) : [];

  return (
    <div>
      {error && <div className="error-msg">{error}</div>}

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
    </div>
  );
}
