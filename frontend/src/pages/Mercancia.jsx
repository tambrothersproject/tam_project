import { useEffect, useState } from 'react';
import api from '../api/client';

const ESTADOS = [
  { value: '', label: 'Todos' },
  { value: 'DISPONIBLE', label: 'Disponibles' },
  { value: 'VENDIDO', label: 'Vendidos' },
];

const OPCIONES_POR_PAGINA = [10, 30, 50, 100];

function fmt(n) {
  if (n === null || n === undefined || n === '') return '—';
  return '$' + Number(n).toLocaleString('es-MX', { minimumFractionDigits: 2 });
}

export default function Mercancia() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [pagina, setPagina] = useState(1);
  const [itemsPorPagina, setItemsPorPagina] = useState(30);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [busquedaDebounced, setBusquedaDebounced] = useState('');
  const [estadoActivo, setEstadoActivo] = useState('');

  const [modalCrear, setModalCrear] = useState(false);
  const [itemAVender, setItemAVender] = useState(null);

  // Espera 350ms sin que el usuario escriba antes de pegarle a la API —
  // si no, cada tecla dispararía un request contra toda la tabla.
  useEffect(() => {
    const t = setTimeout(() => setBusquedaDebounced(busqueda), 350);
    return () => clearTimeout(t);
  }, [busqueda]);

  // Cualquier cambio de filtro, búsqueda o tamaño de página regresa a la
  // página 1 — si no, podrías quedarte "varado" en una página que ya no
  // existe para el nuevo filtro/tamaño.
  useEffect(() => {
    setPagina(1);
  }, [estadoActivo, busquedaDebounced, itemsPorPagina]);

  async function cargar() {
    setCargando(true);
    setError('');
    try {
      const params = { page: pagina, limit: itemsPorPagina };
      if (estadoActivo) params.estado = estadoActivo;
      if (busquedaDebounced) params.q = busquedaDebounced;
      const { data } = await api.get('/mercancias', { params });
      setItems(data.items);
      setTotal(data.total);
      setTotalPaginas(data.totalPages);
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo cargar la mercancía');
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estadoActivo, busquedaDebounced, itemsPorPagina, pagina]);

  return (
    <div>
      <h1 className="page-title">Mercancía</h1>

      <div className="topbar">
        <input
          type="text"
          placeholder="Buscar producto..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          style={{ flex: 1, minWidth: 200 }}
        />
        <button onClick={() => setModalCrear(true)}>+ Nuevo artículo</button>
      </div>

      <div className="chip-row">
        {ESTADOS.map((e) => (
          <div
            key={e.value}
            className={'chip' + (estadoActivo === e.value ? ' active' : '')}
            onClick={() => setEstadoActivo(e.value)}
          >
            {e.label}
          </div>
        ))}
      </div>

      {error && <div className="error-msg">{error}</div>}

      {cargando ? (
        <div className="empty-state">Cargando...</div>
      ) : items.length === 0 ? (
        <div className="empty-state">No hay artículos que coincidan con la búsqueda.</div>
      ) : (
        <>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Pallet</th>
                  <th className="num">Precio mercado</th>
                  <th className="num">Precio sugerido</th>
                  <th className="num">Precio venta</th>
                  <th>Estado</th>
                  <th>Fecha venta</th>
                  <th className="num">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it) => (
                  <tr key={it.id}>
                    <td>{it.producto}</td>
                    <td className="muted">{it.pallet?.numero ?? '—'}</td>
                    <td className="num">{fmt(it.precioMercado)}</td>
                    <td className="num">{fmt(it.precioSugerido)}</td>
                    <td className="num">{fmt(it.precioVenta)}</td>
                    <td>
                      <span className={'badge ' + (it.estado === 'DISPONIBLE' ? 'disponible' : 'vendido')}>
                        {it.estado === 'DISPONIBLE' ? 'Disponible' : 'Vendido'}
                      </span>
                    </td>
                    <td className="muted">{it.fechaVenta || '—'}</td>
                    <td className="num">
                      <div className="actions">
                        {it.estado === 'DISPONIBLE' ? (
                          <button className="action-btn" onClick={() => setItemAVender(it)}>Vender</button>
                        ) : (
                          <button className="action-btn" onClick={() => deshacerVenta(it, cargar)}>Deshacer</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="topbar" style={{ marginTop: 16, justifyContent: 'space-between' }}>
            <span className="muted" style={{ fontSize: 12 }}>
              {total} artículo(s) · página {pagina} de {totalPaginas}
            </span>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <label className="muted" style={{ fontSize: 12, marginBottom: 0 }}>Por página</label>
              <select
                value={itemsPorPagina}
                onChange={(e) => setItemsPorPagina(Number(e.target.value))}
                style={{ width: 80 }}
              >
                {OPCIONES_POR_PAGINA.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
              <button className="ghost" disabled={pagina <= 1} onClick={() => setPagina((p) => p - 1)}>
                ← Anterior
              </button>
              <button className="ghost" disabled={pagina >= totalPaginas} onClick={() => setPagina((p) => p + 1)}>
                Siguiente →
              </button>
            </div>
          </div>
        </>
      )}

      {modalCrear && (
        <ModalCrear onClose={() => setModalCrear(false)} onCreado={() => { setModalCrear(false); cargar(); }} />
      )}

      {itemAVender && (
        <ModalVender
          item={itemAVender}
          onClose={() => setItemAVender(null)}
          onVendido={() => { setItemAVender(null); cargar(); }}
        />
      )}
    </div>
  );
}

async function deshacerVenta(item, recargar) {
  if (!confirm(`¿Revertir la venta de "${item.producto}"?`)) return;
  await api.post(`/mercancias/${item.id}/deshacer-venta`);
  recargar();
}

function ModalCrear({ onClose, onCreado }) {
  const [form, setForm] = useState({ producto: '', precioMercado: '', precioSugerido: '', numeroPallet: '' });
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
      await api.post('/mercancias', {
        producto: form.producto,
        precioMercado: form.precioMercado ? Number(form.precioMercado) : null,
        precioSugerido: form.precioSugerido ? Number(form.precioSugerido) : null,
        numeroPallet: Number(form.numeroPallet),
      });
      onCreado();
    } catch (err) {
      const detalles = err.response?.data?.detalles;
      setError(detalles ? detalles.map((d) => d.mensaje).join(', ') : err.response?.data?.error || 'No se pudo crear el artículo');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Nuevo artículo</h3>
          <button className="ghost" onClick={onClose}>Cerrar</button>
        </div>
        <form onSubmit={onSubmit}>
          <div className="field">
            <label>Producto</label>
            <input type="text" value={form.producto} onChange={(e) => set('producto', e.target.value)} required />
          </div>
          <div className="field">
            <label>Precio mercado (opcional)</label>
            <input type="number" step="0.01" min="0" value={form.precioMercado} onChange={(e) => set('precioMercado', e.target.value)} />
          </div>
          <div className="field">
            <label>Precio sugerido (opcional)</label>
            <input type="number" step="0.01" min="0" value={form.precioSugerido} onChange={(e) => set('precioSugerido', e.target.value)} />
          </div>
          <div className="field">
            <label>No. de pallet</label>
            <input type="number" min="0" value={form.numeroPallet} onChange={(e) => set('numeroPallet', e.target.value)} required />
            <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '6px 0 0' }}>
              Si el pallet no existe todavía, se crea automáticamente.
            </p>
          </div>
          {error && <div className="error-msg">{error}</div>}
          <button type="submit" disabled={guardando} style={{ width: '100%' }}>
            {guardando ? 'Guardando...' : 'Guardar artículo'}
          </button>
        </form>
      </div>
    </div>
  );
}

function ModalVender({ item, onClose, onVendido }) {
  const [precioVenta, setPrecioVenta] = useState('');
  const [fechaVenta, setFechaVenta] = useState(new Date().toISOString().slice(0, 10));
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setGuardando(true);
    try {
      await api.post(`/mercancias/${item.id}/vender`, {
        precioVenta: Number(precioVenta),
        fechaVenta,
      });
      onVendido();
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo registrar la venta');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Vender "{item.producto}"</h3>
          <button className="ghost" onClick={onClose}>Cerrar</button>
        </div>
        <form onSubmit={onSubmit}>
          <div className="field">
            <label>Precio de venta</label>
            <input type="number" step="0.01" min="0.01" value={precioVenta} onChange={(e) => setPrecioVenta(e.target.value)} required autoFocus />
          </div>
          <div className="field">
            <label>Fecha de venta</label>
            <input type="date" value={fechaVenta} onChange={(e) => setFechaVenta(e.target.value)} required />
          </div>
          {error && <div className="error-msg">{error}</div>}
          <button type="submit" disabled={guardando} style={{ width: '100%' }}>
            {guardando ? 'Guardando...' : 'Confirmar venta'}
          </button>
        </form>
      </div>
    </div>
  );
}
