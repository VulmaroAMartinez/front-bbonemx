/**
 * BB Maintenance - App Router Principal
 * Configuracion de rutas con React Router para toda la aplicacion CMMS.
 * Cada ruta esta protegida por rol usando ProtectedRoute.
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Providers } from '@/components/providers';
import { ProtectedRoute } from '@/components/protected-route';

// Pages
import LoginPage from '@/pages/LoginPage';
import HomePage from '@/pages/HomePage';

// Admin
import AdminDashboardPage from '@/pages/admin/DashboardPage';
import AdminOrdenesPage from '@/pages/admin/OrdenesPage';
import AdminOrdenDetallePage from '@/pages/admin/OrdenDetallePage';
import AdminCrearOTPage from '@/pages/admin/CrearOTPage';
import AdminAsignarPage from '@/pages/admin/AsignarPage';
import AdminHorariosPage from '@/pages/admin/HorariosPage';
import AdminTecnicosPage from '@/pages/admin/TecnicosPage';

// Tecnico
import TecnicoAsignacionesPage from '@/pages/tecnico/AsignacionesPage';
import TecnicoPendientesPage from '@/pages/tecnico/PendientesPage';
import TecnicoHorarioPage from '@/pages/tecnico/HorarioPage';
import TecnicoOrdenPage from '@/pages/tecnico/OrdenTecnicoPage';

// Solicitante
import SolicitanteCrearOTPage from '@/pages/solicitante/CrearOTPage';
import SolicitanteMisOrdenesPage from '@/pages/solicitante/MisOrdenesPage';

// Shared
import OrdenDetallePage from '@/pages/shared/OrdenDetallePage';
import PerfilPage from '@/pages/shared/PerfilPage';

function App() {
  return (
    <BrowserRouter>
      <Providers>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />

          {/* Home redirect */}
          <Route path="/" element={<HomePage />} />

          {/* Admin routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['administrador']}>
                <AdminDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/ordenes"
            element={
              <ProtectedRoute allowedRoles={['administrador']}>
                <AdminOrdenesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/ordenes/:id"
            element={
              <ProtectedRoute allowedRoles={['administrador']}>
                <AdminOrdenDetallePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/crear-ot"
            element={
              <ProtectedRoute allowedRoles={['administrador']}>
                <AdminCrearOTPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/asignar"
            element={
              <ProtectedRoute allowedRoles={['administrador']}>
                <AdminAsignarPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/horarios"
            element={
              <ProtectedRoute allowedRoles={['administrador']}>
                <AdminHorariosPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/tecnicos"
            element={
              <ProtectedRoute allowedRoles={['administrador']}>
                <AdminTecnicosPage />
              </ProtectedRoute>
            }
          />
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />

          {/* Tecnico routes */}
          <Route
            path="/tecnico/asignaciones"
            element={
              <ProtectedRoute allowedRoles={['tecnico']}>
                <TecnicoAsignacionesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tecnico/pendientes"
            element={
              <ProtectedRoute allowedRoles={['tecnico']}>
                <TecnicoPendientesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tecnico/horario"
            element={
              <ProtectedRoute allowedRoles={['tecnico']}>
                <TecnicoHorarioPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tecnico/orden/:id"
            element={
              <ProtectedRoute allowedRoles={['tecnico']}>
                <TecnicoOrdenPage />
              </ProtectedRoute>
            }
          />

          {/* Solicitante routes */}
          <Route
            path="/solicitante/crear-ot"
            element={
              <ProtectedRoute allowedRoles={['solicitante']}>
                <SolicitanteCrearOTPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/solicitante/mis-ordenes"
            element={
              <ProtectedRoute allowedRoles={['solicitante']}>
                <SolicitanteMisOrdenesPage />
              </ProtectedRoute>
            }
          />

          {/* Shared routes (all authenticated) */}
          <Route
            path="/ordenes/:id"
            element={
              <ProtectedRoute allowedRoles={['administrador', 'tecnico', 'solicitante']}>
                <OrdenDetallePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/perfil"
            element={
              <ProtectedRoute allowedRoles={['administrador', 'tecnico', 'solicitante']}>
                <PerfilPage />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Providers>
    </BrowserRouter>
  );
}

export default App;
