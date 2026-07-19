import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Mercancia from './pages/Mercancia';
import Gastos from './pages/Gastos';
import Metricas from './pages/Metricas';
import Balance from './pages/Balance';
import Usuarios from './pages/Usuarios';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route element={<Layout />}>
            <Route path="/mercancia" element={<Mercancia />} />
            <Route path="/gastos" element={<Gastos />} />
            <Route path="/metricas" element={<Metricas />} />
            <Route path="/balance" element={<Balance />} />
            <Route path="/usuarios" element={<Usuarios />} />
          </Route>

          <Route path="*" element={<Navigate to="/mercancia" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
