import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Mercancia from './pages/Mercancia';
import Gastos from './pages/Gastos';
import Balance from './pages/Balance';
import Usuarios from './pages/Usuarios';
import MetricasLayout from './pages/metricas/MetricasLayout';
import MetricasDashboard from './pages/metricas/MetricasDashboard';
import MetricasVentas from './pages/metricas/MetricasVentas';
import MetricasPallets from './pages/metricas/MetricasPallets';
import MetricasGastos from './pages/metricas/MetricasGastos';
import MetricasRetiros from './pages/metricas/MetricasRetiros';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route element={<Layout />}>
            <Route path="/mercancia" element={<Mercancia />} />
            <Route path="/gastos" element={<Gastos />} />
            <Route path="/balance" element={<Balance />} />
            <Route path="/usuarios" element={<Usuarios />} />

            <Route path="/metricas" element={<MetricasLayout />}>
              <Route index element={<MetricasDashboard />} />
              <Route path="ventas" element={<MetricasVentas />} />
              <Route path="pallets" element={<MetricasPallets />} />
              <Route path="gastos" element={<MetricasGastos />} />
              <Route path="retiros" element={<MetricasRetiros />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/mercancia" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
