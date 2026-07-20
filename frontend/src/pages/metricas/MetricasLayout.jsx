import { NavLink, Outlet, useSearchParams } from 'react-router-dom';
import { PRESETS_FECHA, calcularPreset } from './chartUtils';

const TABS = [
  { to: '.', label: 'Resumen', end: true },
  { to: 'ventas', label: 'Ventas por día' },
  { to: 'pallets', label: 'Pallets' },
  { to: 'gastos', label: 'Gastos' },
  { to: 'retiros', label: 'Retiros de socios' },
];

export default function MetricasLayout() {
  const [searchParams, setSearchParams] = useSearchParams();
  const desde = searchParams.get('desde') || '';
  const hasta = searchParams.get('hasta') || '';

  function setRango(nuevoDesde, nuevoHasta) {
    const next = new URLSearchParams(searchParams);
    if (nuevoDesde) next.set('desde', nuevoDesde); else next.delete('desde');
    if (nuevoHasta) next.set('hasta', nuevoHasta); else next.delete('hasta');
    setSearchParams(next);
  }

  return (
    <div>
      <h1 className="page-title">Métricas</h1>

      <div className="topbar">
        <div className="field" style={{ marginBottom: 0 }}>
          <label>Desde</label>
          <input type="date" value={desde} onChange={(e) => setRango(e.target.value, hasta)} />
        </div>
        <div className="field" style={{ marginBottom: 0 }}>
          <label>Hasta</label>
          <input type="date" value={hasta} onChange={(e) => setRango(desde, e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: 6, alignSelf: 'flex-end', flexWrap: 'wrap' }}>
          {PRESETS_FECHA.map((p) => (
            <button
              key={p.label}
              className="ghost"
              onClick={() => {
                const { desde: d, hasta: h } = calcularPreset(p);
                setRango(d, h);
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="subnav">
        {TABS.map((t) => (
          <NavLink
            key={t.label}
            to={{ pathname: t.to, search: searchParams.toString() ? `?${searchParams.toString()}` : '' }}
            end={t.end}
            className={({ isActive }) => 'subnav-tab' + (isActive ? ' active' : '')}
          >
            {t.label}
          </NavLink>
        ))}
      </div>

      <Outlet context={{ desde, hasta }} />
    </div>
  );
}
