import { useEffect, useState } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function Usuarios() {
  const { usuario } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(true);

  const [modalCrear, setModalCrear] = useState(false);
  const [modalEditar, setModalEditar] = useState(null);
  const [modalPassword, setModalPassword] = useState(null);
  const [modalMiPassword, setModalMiPassword] = useState(false);

  async function cargar() {
    setCargando(true);
    setError('');
    try {
      const { data } = await api.get('/usuarios');
      setUsuarios(data);
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudieron cargar los usuarios');
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  async function eliminar(u) {
    if (!confirm(`¿Eliminar al usuario "${u.username}"? Esta acción no se puede deshacer.`)) return;
    try {
      await api.delete(`/usuarios/${u.id}`);
      cargar();
    } catch (err) {
      alert(err.response?.data?.error || 'No se pudo eliminar el usuario');
    }
  }

  return (
    <div>
      <h1 className="page-title">Usuarios</h1>

      <div className="topbar">
        <button onClick={() => setModalCrear(true)}>+ Nuevo usuario</button>
        <button className="ghost" onClick={() => setModalMiPassword(true)}>Cambiar mi contraseña</button>
      </div>

      {error && <div className="error-msg">{error}</div>}

      {cargando ? (
        <div className="empty-state">Cargando...</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Usuario</th>
              <th>Rol</th>
              <th className="num">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u) => (
              <tr key={u.id}>
                <td>{u.name}</td>
                <td className="muted">{u.username}</td>
                <td>
                  <span className={'badge ' + (u.isAdmin ? 'vendido' : 'disponible')}>
                    {u.isAdmin ? 'Administrador' : 'Usuario'}
                  </span>
                  {u.id === usuario.id && <span className="muted" style={{ marginLeft: 8, fontSize: 12 }}>(tú)</span>}
                </td>
                <td className="num">
                  <div className="actions">
                    <button className="action-btn" onClick={() => setModalEditar(u)}>Editar</button>
                    <button className="action-btn" onClick={() => setModalPassword(u)}>Restablecer contraseña</button>
                    {u.id !== usuario.id && (
                      <button className="action-btn" onClick={() => eliminar(u)}>Eliminar</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {modalCrear && (
        <ModalCrearUsuario onClose={() => setModalCrear(false)} onCreado={() => { setModalCrear(false); cargar(); }} />
      )}

      {modalEditar && (
        <ModalEditarUsuario usuario={modalEditar} onClose={() => setModalEditar(null)} onGuardado={() => { setModalEditar(null); cargar(); }} />
      )}

      {modalPassword && (
        <ModalRestablecerPassword usuario={modalPassword} onClose={() => setModalPassword(null)} onGuardado={() => setModalPassword(null)} />
      )}

      {modalMiPassword && (
        <ModalMiPassword onClose={() => setModalMiPassword(false)} onGuardado={() => setModalMiPassword(false)} />
      )}
    </div>
  );
}

function ModalCrearUsuario({ onClose, onCreado }) {
  const [form, setForm] = useState({ name: '', username: '', password: '', isAdmin: false });
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
      await api.post('/usuarios', form);
      onCreado();
    } catch (err) {
      const detalles = err.response?.data?.detalles;
      setError(detalles ? detalles.map((d) => d.mensaje).join(', ') : err.response?.data?.error || 'No se pudo crear el usuario');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Nuevo usuario</h3>
          <button className="ghost" onClick={onClose}>Cerrar</button>
        </div>
        <form onSubmit={onSubmit}>
          <div className="field">
            <label>Nombre</label>
            <input type="text" value={form.name} onChange={(e) => set('name', e.target.value)} required autoFocus />
          </div>
          <div className="field">
            <label>Usuario (para iniciar sesión)</label>
            <input type="text" value={form.username} onChange={(e) => set('username', e.target.value)} required />
          </div>
          <div className="field">
            <label>Contraseña</label>
            <input type="password" value={form.password} onChange={(e) => set('password', e.target.value)} required minLength={4} />
          </div>
          <div className="field" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" id="isAdmin" style={{ width: 'auto' }} checked={form.isAdmin} onChange={(e) => set('isAdmin', e.target.checked)} />
            <label htmlFor="isAdmin" style={{ margin: 0 }}>Dar permisos de administrador</label>
          </div>
          {error && <div className="error-msg">{error}</div>}
          <button type="submit" disabled={guardando} style={{ width: '100%' }}>
            {guardando ? 'Guardando...' : 'Crear usuario'}
          </button>
        </form>
      </div>
    </div>
  );
}

function ModalEditarUsuario({ usuario, onClose, onGuardado }) {
  const [form, setForm] = useState({ name: usuario.name, username: usuario.username, isAdmin: usuario.isAdmin });
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
      await api.put(`/usuarios/${usuario.id}`, form);
      onGuardado();
    } catch (err) {
      const detalles = err.response?.data?.detalles;
      setError(detalles ? detalles.map((d) => d.mensaje).join(', ') : err.response?.data?.error || 'No se pudo actualizar el usuario');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Editar "{usuario.username}"</h3>
          <button className="ghost" onClick={onClose}>Cerrar</button>
        </div>
        <form onSubmit={onSubmit}>
          <div className="field">
            <label>Nombre</label>
            <input type="text" value={form.name} onChange={(e) => set('name', e.target.value)} required autoFocus />
          </div>
          <div className="field">
            <label>Usuario</label>
            <input type="text" value={form.username} onChange={(e) => set('username', e.target.value)} required />
          </div>
          <div className="field" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" id="isAdminEdit" style={{ width: 'auto' }} checked={form.isAdmin} onChange={(e) => set('isAdmin', e.target.checked)} />
            <label htmlFor="isAdminEdit" style={{ margin: 0 }}>Permisos de administrador</label>
          </div>
          {error && <div className="error-msg">{error}</div>}
          <button type="submit" disabled={guardando} style={{ width: '100%' }}>
            {guardando ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </form>
      </div>
    </div>
  );
}

function ModalRestablecerPassword({ usuario, onClose, onGuardado }) {
  const [passwordNueva, setPasswordNueva] = useState('');
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setGuardando(true);
    try {
      await api.put(`/usuarios/${usuario.id}/password`, { passwordNueva });
      alert('Contraseña actualizada correctamente.');
      onGuardado();
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo cambiar la contraseña');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Restablecer contraseña de "{usuario.username}"</h3>
          <button className="ghost" onClick={onClose}>Cerrar</button>
        </div>
        <form onSubmit={onSubmit}>
          <div className="field">
            <label>Nueva contraseña</label>
            <input type="password" value={passwordNueva} onChange={(e) => setPasswordNueva(e.target.value)} required minLength={4} autoFocus />
          </div>
          {error && <div className="error-msg">{error}</div>}
          <button type="submit" disabled={guardando} style={{ width: '100%' }}>
            {guardando ? 'Guardando...' : 'Restablecer contraseña'}
          </button>
        </form>
      </div>
    </div>
  );
}

function ModalMiPassword({ onClose, onGuardado }) {
  const { cambiarMiPassword } = useAuth();
  const [passwordActual, setPasswordActual] = useState('');
  const [passwordNueva, setPasswordNueva] = useState('');
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setGuardando(true);
    try {
      await cambiarMiPassword(passwordActual, passwordNueva);
      alert('Tu contraseña se actualizó correctamente.');
      onGuardado();
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo cambiar la contraseña');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Cambiar mi contraseña</h3>
          <button className="ghost" onClick={onClose}>Cerrar</button>
        </div>
        <form onSubmit={onSubmit}>
          <div className="field">
            <label>Contraseña actual</label>
            <input type="password" value={passwordActual} onChange={(e) => setPasswordActual(e.target.value)} required autoFocus />
          </div>
          <div className="field">
            <label>Nueva contraseña</label>
            <input type="password" value={passwordNueva} onChange={(e) => setPasswordNueva(e.target.value)} required minLength={4} />
          </div>
          {error && <div className="error-msg">{error}</div>}
          <button type="submit" disabled={guardando} style={{ width: '100%' }}>
            {guardando ? 'Guardando...' : 'Cambiar contraseña'}
          </button>
        </form>
      </div>
    </div>
  );
}
