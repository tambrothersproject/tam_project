import { NavLink, Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LINKS = [
  { to: '/mercancia', label: 'Mercancía' },
  { to: '/gastos', label: 'Gastos' },
  { to: '/metricas', label: 'Métricas' },
  { to: '/balance', label: 'Balance general' },
];

export default function Layout() {
  const { usuario, logout } = useAuth();

  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  const links = usuario.isAdmin ? [...LINKS, { to: '/usuarios', label: 'Usuarios' }] : LINKS;

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="brand">Mercancía</div>
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}
          >
            {link.label}
          </NavLink>
        ))}
        <div className="muted" style={{ padding: '16px 10px 4px', fontSize: 12 }}>
          {usuario.name}
        </div>
        <div className="nav-item" onClick={logout}>
          Cerrar sesión
        </div>
      </aside>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
