// Utilidades y constantes compartidas por todas las sub-páginas de Métricas.

export function fmt(n) {
  return '$' + Number(n || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 });
}

// Paleta tomada de las variables CSS del tema (styles.css). Recharts dibuja
// SVG directo y no siempre resuelve var(--...), así que se repiten los
// valores hex aquí para que las gráficas combinen con el resto de la app.
export const COLOR_ACCENT = '#6d8dfa';
export const COLOR_SUCCESS = '#4fd1a0';
export const COLOR_DANGER = '#f2637a';
export const COLOR_BORDER = '#2a2f3a';
export const COLOR_TEXT = '#9a9fac';
export const PALETA_CATEGORIAS = ['#6d8dfa', '#4fd1a0', '#f2637a', '#f5c26b', '#a78bfa', '#6b7080'];

export const ETIQUETAS_CATEGORIA = {
  ASISTENCIA_MERCADO: 'Asistencia en el mercado',
  GASOLINA: 'Gasolina',
  COMPRA_PALLETS: 'Compra de pallets',
  RETIRO_SOCIOS: 'Retiro de socio',
  OTRO: 'Otro',
};

// Tooltip oscuro consistente con el tema — el tooltip default de recharts
// es blanco y desentona con el resto de la app.
export function TooltipOscuro({ active, payload, label, formatter }) {
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

// Presets de rango de fecha para no depender de que el usuario escriba
// fechas a mano cada vez, y para evitar cargar "todo el historial" por
// default conforme la tabla de ventas crezca.
export const PRESETS_FECHA = [
  { label: '7 días', dias: 7 },
  { label: '30 días', dias: 30 },
  { label: 'Este mes', tipo: 'mes' },
  { label: 'Todo', tipo: 'todo' },
];

export function calcularPreset(preset) {
  const iso = (d) => d.toISOString().slice(0, 10);
  const hoy = new Date();

  if (preset.tipo === 'todo') return { desde: '', hasta: '' };

  let desde;
  if (preset.tipo === 'mes') {
    desde = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  } else {
    desde = new Date(hoy);
    desde.setDate(desde.getDate() - preset.dias);
  }
  return { desde: iso(desde), hasta: iso(hoy) };
}
