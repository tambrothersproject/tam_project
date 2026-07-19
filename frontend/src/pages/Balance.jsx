import { useEffect, useState } from 'react';
import api from '../api/client';

function fmt(n) {
  if (n === null || n === undefined) return '—';
  return '$' + Number(n).toLocaleString('es-MX', { minimumFractionDigits: 2 });
}

const ETIQUETAS_APORTACION = {
  INVERSION_INICIAL: 'Inversión inicial',
  ESTIMULO: 'Estímulo',
  OTRO: 'Otro',
};

export default function Balance() {
  const [balance, setBalance] = useState(null);
  const [aportaciones, setAportaciones] = useState([]);
  const [conteos, setConteos] = useState([]);
  const [error, setError] = useState('');

  const [modalAportacion, setModalAportacion] = useState(false);
  const [aportacionEditando, setAportacionEditando] = useState(null);
  const [modalConteo, setModalConteo] = useState(false);

  async function cargarTodo() {
    setError('');
    try {
      const [resBalance, resAportaciones, resConteos] = await Promise.all([
        api.get('/metrics/balance-general'),
        api.get('/aportaciones'),
        api.get('/conteos-caja'),
      ]);
      setBalance(resBalance.data);
      setAportaciones(resAportaciones.data.aportaciones);
      setConteos(resConteos.data);
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo cargar el balance general');
    }
  }

  useEffect(() => {
    cargarTodo();
  }, []);

  async function eliminarAportacion(a) {
    if (!confirm(`¿Eliminar "${a.descripcion || ETIQUETAS_APORTACION[a.categoria]}" de ${fmt(a.monto)}?`)) return;
    await api.delete(`/aportaciones/${a.id}`);
    cargarTodo();
  }

  async function eliminarConteo(c) {
    if (!confirm(`¿Eliminar el conteo de caja del ${c.fecha} (${fmt(c.montoContado)})?`)) return;
    await api.delete(`/conteos-caja/${c.id}`);
    cargarTodo();
  }

  return (
    <div>
      <h1 className="page-title">Balance general</h1>

      {error && <div className="error-msg">{error}</div>}

      {balance && (
        <>
          <div className="stats">
            <div className="stat-card">
              <div className="stat-label">Inversión inicial</div>
              <div className="stat-value">{fmt(balance.inversionInicial)}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Estímulos</div>
              <div className="stat-value">{fmt(balance.estimulos)}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Ventas</div>
              <div className="stat-value">{fmt(balance.ventas)}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Total ingresos</div>
              <div className="stat-value">{fmt(balance.totalIngresos)}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Costos (todos los gastos)</div>
              <div className="stat-value" style={{ color: 'var(--danger)' }}>{fmt(balance.costos)}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Actual teórico</div>
              <div className="stat-value">{fmt(balance.actualTeorico)}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Actual real</div>
              <div className="stat-value">{fmt(balance.actualReal)}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Diferencia</div>
              <div
                className="stat-value"
                style={{ color: balance.diferencia === null ? undefined : balance.diferencia === 0 ? 'var(--success)' : 'var(--danger)' }}
              >
                {fmt(balance.diferencia)}
              </div>
            </div>
          </div>

          {balance.actualReal === null && (
            <div className="empty-state" style={{ padding: '12px 0', textAlign: 'left' }}>
              Todavía no registras ningún conteo de caja — "Actual real" y "Diferencia" quedan vacíos hasta que agregues uno.
            </div>
          )}

          {balance.ultimoConteo && (
            <p className="muted" style={{ fontSize: 12, margin: '-8px 0 20px' }}>
              Último conteo: {balance.ultimoConteo.fecha}
              {balance.ultimoConteo.comentario ? ` — ${balance.ultimoConteo.comentario}` : ''}
            </p>
          )}
        </>
      )}

      <div className="topbar" style={{ marginTop: 8 }}>
        <button onClick={() => setModalConteo(true)}>+ Registrar conteo de caja</button>
        <button className="ghost" onClick={() => { setAportacionEditando(null); setModalAportacion(true); }}>
          + Registrar inversión / estímulo
        </button>
      </div>

      <h3 style={{ fontSize: 14, fontWeight: 600, margin: '20px 0 12px' }}>Inversión inicial y estímulos</h3>
      {aportaciones.length === 0 ? (
        <div className="empty-state">Todavía no registras inversión inicial ni estímulos.</div>
      ) : (
        <table style={{ marginBottom: 28 }}>
          <thead>
            <tr>
              <th>Categoría</th>
              <th>Aportante</th>
              <th>Descripción</th>
              <th>Fecha</th>
              <th className="num">Monto</th>
              <th className="num">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {aportaciones.map((a) => (
              <tr key={a.id}>
                <td>{ETIQUETAS_APORTACION[a.categoria] || a.categoria}</td>
                <td className="muted">{a.aportante || '—'}</td>
                <td className="muted">{a.descripcion || '—'}</td>
                <td className="muted">{a.fecha}</td>
                <td className="num">{fmt(a.monto)}</td>
                <td className="num">
                  <div className="actions">
                    <button className="action-btn" onClick={() => { setAportacionEditando(a); setModalAportacion(true); }}>Editar</button>
                    <button className="action-btn" onClick={() => eliminarAportacion(a)}>Eliminar</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h3 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 12px' }}>Historial de conteos de caja</h3>
      {conteos.length === 0 ? (
        <div className="empty-state">Todavía no hay conteos registrados.</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Comentario</th>
              <th className="num">Monto contado</th>
              <th className="num">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {conteos.map((c) => (
              <tr key={c.id}>
                <td className="muted">{c.fecha}</td>
                <td className="muted">{c.comentario || '—'}</td>
                <td className="num">{fmt(c.montoContado)}</td>
                <td className="num">
                  <button className="action-btn" onClick={() => eliminarConteo(c)}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {modalAportacion && (
        <ModalAportacion
          aportacion={aportacionEditando}
          onClose={() => setModalAportacion(false)}
          onGuardado={() => { setModalAportacion(false); cargarTodo(); }}
        />
      )}

      {modalConteo && (
        <ModalConteo
          onClose={() => setModalConteo(false)}
          onGuardado={() => { setModalConteo(false); cargarTodo(); }}
        />
      )}
    </div>
  );
}

function ModalAportacion({ aportacion, onClose, onGuardado }) {
  const editando = Boolean(aportacion);
  const [form, setForm] = useState({
    categoria: aportacion?.categoria || 'INVERSION_INICIAL',
    aportante: aportacion?.aportante || '',
    descripcion: aportacion?.descripcion || '',
    monto: aportacion?.monto ?? '',
    fecha: aportacion?.fecha || new Date().toISOString().slice(0, 10),
  });
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  function set(campo, valor) {
    setForm((f) => ({ ...f, [campo]: valor }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setGuardando(true);
    try {
      const payload = {
        categoria: form.categoria,
        aportante: form.aportante || null,
        descripcion: form.descripcion || null,
        monto: Number(form.monto),
        fecha: form.fecha,
      };
      if (editando) {
        await api.put(`/aportaciones/${aportacion.id}`, payload);
      } else {
        await api.post('/aportaciones', payload);
      }
      onGuardado();
    } catch (err) {
      const detalles = err.response?.data?.detalles;
      setError(detalles ? detalles.map((d) => d.mensaje).join(', ') : err.response?.data?.error || 'No se pudo guardar');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{editando ? 'Editar aportación' : 'Registrar inversión / estímulo'}</h3>
          <button className="ghost" onClick={onClose}>Cerrar</button>
        </div>
        <form onSubmit={onSubmit}>
          <div className="field">
            <label>Categoría</label>
            <select value={form.categoria} onChange={(e) => set('categoria', e.target.value)}>
              <option value="INVERSION_INICIAL">Inversión inicial</option>
              <option value="ESTIMULO">Estímulo</option>
              <option value="OTRO">Otro</option>
            </select>
          </div>
          <div className="field">
            <label>Aportante (opcional)</label>
            <input type="text" placeholder="Ej. Mamá, ahorros propios..." value={form.aportante} onChange={(e) => set('aportante', e.target.value)} />
          </div>
          <div className="field">
            <label>Descripción (opcional)</label>
            <input type="text" placeholder="Ej. Compra del primer pallet" value={form.descripcion} onChange={(e) => set('descripcion', e.target.value)} />
          </div>
          <div className="field">
            <label>Monto</label>
            <input type="number" step="0.01" min="0.01" value={form.monto} onChange={(e) => set('monto', e.target.value)} required />
          </div>
          <div className="field">
            <label>Fecha</label>
            <input type="date" value={form.fecha} onChange={(e) => set('fecha', e.target.value)} required />
          </div>
          {error && <div className="error-msg">{error}</div>}
          <button type="submit" disabled={guardando} style={{ width: '100%' }}>
            {guardando ? 'Guardando...' : editando ? 'Guardar cambios' : 'Guardar'}
          </button>
        </form>
      </div>
    </div>
  );
}

function ModalConteo({ onClose, onGuardado }) {
  const [montoContado, setMontoContado] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [comentario, setComentario] = useState('');
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setGuardando(true);
    try {
      await api.post('/conteos-caja', { montoContado: Number(montoContado), fecha, comentario: comentario || null });
      onGuardado();
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo registrar el conteo');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Registrar conteo de caja</h3>
          <button className="ghost" onClick={onClose}>Cerrar</button>
        </div>
        <form onSubmit={onSubmit}>
          <div className="field">
            <label>Monto contado (efectivo real)</label>
            <input type="number" step="0.01" min="0" value={montoContado} onChange={(e) => setMontoContado(e.target.value)} required autoFocus />
          </div>
          <div className="field">
            <label>Fecha</label>
            <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} required />
          </div>
          <div className="field">
            <label>Comentario (opcional)</label>
            <input type="text" value={comentario} onChange={(e) => setComentario(e.target.value)} />
          </div>
          {error && <div className="error-msg">{error}</div>}
          <button type="submit" disabled={guardando} style={{ width: '100%' }}>
            {guardando ? 'Guardando...' : 'Guardar conteo'}
          </button>
        </form>
      </div>
    </div>
  );
}
