import { useEffect, useState } from 'react';
import api from '../api/client';

const CATEGORIAS = [
  { value: 'ASISTENCIA_MERCADO', label: 'Asistencia en el mercado' },
  { value: 'GASOLINA', label: 'Gasolina' },
  { value: 'COMPRA_PALLETS', label: 'Compra de pallets' },
  { value: 'RETIRO_SOCIOS', label: 'Retiro de socio (reparto de utilidades)' },
  { value: 'OTRO', label: 'Otro' },
];

function etiqueta(categoria) {
  return CATEGORIAS.find((c) => c.value === categoria)?.label || categoria;
}

function fmt(n) {
  return '$' + Number(n).toLocaleString('es-MX', { minimumFractionDigits: 2 });
}

export default function Gastos() {
  const [gastos, setGastos] = useState([]);
  const [totales, setTotales] = useState({ total: 0, totalOperativo: 0, totalNoOperativo: 0 });
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [gastoEditando, setGastoEditando] = useState(null);
  const [categoriaFiltro, setCategoriaFiltro] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState('');

  async function cargar() {
    setCargando(true);
    setError('');
    try {
      const params = {};
      if (categoriaFiltro) params.categoria = categoriaFiltro;
      const { data } = await api.get('/gastos', { params });
      setGastos(data.gastos);
      setTotales({ total: data.total, totalOperativo: data.totalOperativo, totalNoOperativo: data.totalNoOperativo });
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudieron cargar los gastos');
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoriaFiltro]);

  async function eliminar(gasto) {
    if (!confirm(`¿Eliminar el gasto "${etiqueta(gasto.categoria)}" de ${fmt(gasto.monto)}?`)) return;
    await api.delete(`/gastos/${gasto.id}`);
    cargar();
  }

  const visibles = gastos.filter((g) => {
    if (tipoFiltro === 'OPERATIVO') return g.afectaUtilidad;
    if (tipoFiltro === 'NO_OPERATIVO') return !g.afectaUtilidad;
    return true;
  });

  return (
    <div>
      <h1 className="page-title">Gastos</h1>

      <div className="topbar">
        <select value={categoriaFiltro} onChange={(e) => setCategoriaFiltro(e.target.value)} style={{ width: 220 }}>
          <option value="">Todas las categorías</option>
          {CATEGORIAS.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
        <select value={tipoFiltro} onChange={(e) => setTipoFiltro(e.target.value)} style={{ width: 180 }}>
          <option value="">Todos los tipos</option>
          <option value="OPERATIVO">Operativo</option>
          <option value="NO_OPERATIVO">No operativo</option>
        </select>
        <button onClick={() => { setGastoEditando(null); setModalAbierto(true); }}>+ Registrar gasto</button>
      </div>

      <div className="stats" style={{ maxWidth: 460 }}>
        <div className="stat-card">
          <div className="stat-label">Gastos operativos</div>
          <div className="stat-value">{fmt(totales.totalOperativo)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Retiros / no operativos</div>
          <div className="stat-value">{fmt(totales.totalNoOperativo)}</div>
        </div>
      </div>

      {error && <div className="error-msg">{error}</div>}

      {cargando ? (
        <div className="empty-state">Cargando...</div>
      ) : visibles.length === 0 ? (
        <div className="empty-state">No hay gastos que coincidan con el filtro.</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Categoría</th>
              <th>Tipo</th>
              <th>Descripción</th>
              <th>Pallet</th>
              <th>Socio</th>
              <th>Fecha</th>
              <th className="num">Monto</th>
              <th className="num">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {visibles.map((g) => (
              <tr key={g.id}>
                <td>{etiqueta(g.categoria)}</td>
                <td>
                  <span className={'badge ' + (g.afectaUtilidad ? 'vendido' : 'disponible')}>
                    {g.afectaUtilidad ? 'Operativo' : 'No operativo'}
                  </span>
                </td>
                <td className="muted">{g.descripcion || '—'}</td>
                <td className="muted">{g.pallet?.numero ?? '—'}</td>
                <td className="muted">{g.socio || '—'}</td>
                <td className="muted">{g.fecha}</td>
                <td className="num">{fmt(g.monto)}</td>
                <td className="num">
                  <div className="actions">
                    <button className="action-btn" onClick={() => { setGastoEditando(g); setModalAbierto(true); }}>Editar</button>
                    <button className="action-btn" onClick={() => eliminar(g)}>Eliminar</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {modalAbierto && (
        <ModalGasto
          gasto={gastoEditando}
          onClose={() => setModalAbierto(false)}
          onGuardado={() => { setModalAbierto(false); cargar(); }}
        />
      )}
    </div>
  );
}

function ModalGasto({ gasto, onClose, onGuardado }) {
  const editando = Boolean(gasto);
  const [form, setForm] = useState({
    categoria: gasto?.categoria || 'ASISTENCIA_MERCADO',
    descripcion: gasto?.descripcion || '',
    monto: gasto?.monto ?? '',
    fecha: gasto?.fecha || new Date().toISOString().slice(0, 10),
    socio: gasto?.socio || '',
    afectaUtilidad: gasto ? gasto.afectaUtilidad : true,
    idPallet: gasto?.idPallet ? String(gasto.idPallet) : '',
  });
  const [pallets, setPallets] = useState([]);
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    api.get('/pallets').then(({ data }) => setPallets(data)).catch(() => {});
  }, []);

  function set(campo, valor) {
    setForm((f) => ({ ...f, [campo]: valor }));
  }

  function onCategoriaChange(categoria) {
    setForm((f) => ({
      ...f,
      categoria,
      // Al cambiar de categoría, proponemos el valor por default de afectaUtilidad
      // (el usuario lo puede corregir con el checkbox de abajo si hace falta).
      afectaUtilidad: categoria !== 'RETIRO_SOCIOS',
    }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setGuardando(true);
    try {
      const payload = {
        categoria: form.categoria,
        descripcion: form.descripcion || null,
        monto: Number(form.monto),
        fecha: form.fecha,
        socio: form.categoria === 'RETIRO_SOCIOS' ? form.socio : null,
        afectaUtilidad: form.afectaUtilidad,
        idPallet: form.idPallet ? Number(form.idPallet) : null,
      };

      if (editando) {
        await api.put(`/gastos/${gasto.id}`, payload);
      } else {
        await api.post('/gastos', payload);
      }
      onGuardado();
    } catch (err) {
      const detalles = err.response?.data?.detalles;
      setError(detalles ? detalles.map((d) => d.mensaje).join(', ') : err.response?.data?.error || 'No se pudo guardar el gasto');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{editando ? 'Editar gasto' : 'Registrar gasto'}</h3>
          <button className="ghost" onClick={onClose}>Cerrar</button>
        </div>
        <form onSubmit={onSubmit}>
          <div className="field">
            <label>Categoría</label>
            <select value={form.categoria} onChange={(e) => onCategoriaChange(e.target.value)}>
              {CATEGORIAS.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          {form.categoria === 'RETIRO_SOCIOS' && (
            <div className="field">
              <label>Socio</label>
              <input type="text" placeholder="Nombre del socio" value={form.socio} onChange={(e) => set('socio', e.target.value)} required />
            </div>
          )}
          <div className="field">
            <label>
              {form.categoria === 'COMPRA_PALLETS' ? 'Pallet comprado' : 'Ligar a un pallet (opcional)'}
            </label>
            <select
              value={form.idPallet}
              onChange={(e) => set('idPallet', e.target.value)}
              required={form.categoria === 'COMPRA_PALLETS'}
            >
              <option value="">
                {form.categoria === 'COMPRA_PALLETS' ? 'Selecciona el pallet...' : 'Sin ligar a un pallet'}
              </option>
              {pallets.map((p) => (
                <option key={p.id} value={p.id}>Pallet {p.numero}</option>
              ))}
            </select>
            {form.categoria === 'COMPRA_PALLETS' && (
              <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '6px 0 0' }}>
                Ligar la compra a su pallet permite calcular la utilidad real de cada uno en Métricas.
              </p>
            )}
          </div>
          <div className="field">
            <label>Descripción (opcional)</label>
            <input type="text" value={form.descripcion} onChange={(e) => set('descripcion', e.target.value)} />
          </div>
          <div className="field">
            <label>Monto</label>
            <input type="number" step="0.01" min="0.01" value={form.monto} onChange={(e) => set('monto', e.target.value)} required />
          </div>
          <div className="field">
            <label>Fecha</label>
            <input type="date" value={form.fecha} onChange={(e) => set('fecha', e.target.value)} required />
          </div>
          <div className="field" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="checkbox"
              id="afectaUtilidad"
              style={{ width: 'auto' }}
              checked={form.afectaUtilidad}
              onChange={(e) => set('afectaUtilidad', e.target.checked)}
            />
            <label htmlFor="afectaUtilidad" style={{ marginBottom: 0 }}>
              Este gasto es operativo (afecta la utilidad)
            </label>
          </div>
          {error && <div className="error-msg">{error}</div>}
          <button type="submit" disabled={guardando} style={{ width: '100%' }}>
            {guardando ? 'Guardando...' : editando ? 'Guardar cambios' : 'Guardar gasto'}
          </button>
        </form>
      </div>
    </div>
  );
}
