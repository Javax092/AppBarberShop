import { lazy } from "react";
import { createBrowserRouter } from "react-router-dom";

import { ProtectedRoute } from "../components/layout/ProtectedRoute.tsx";

const AcessoRestritoPage = lazy(() => import("../pages/AcessoRestritoPage.tsx").then((module) => ({ default: module.AcessoRestritoPage })));
const AdminAgendamentos = lazy(() => import("../pages/admin/AdminAgendamentos.tsx").then((module) => ({ default: module.AdminAgendamentos })));
const AdminBarbeiros = lazy(() => import("../pages/admin/AdminBarbeiros.tsx").then((module) => ({ default: module.AdminBarbeiros })));
const AdminCatalogo = lazy(() => import("../pages/admin/AdminCatalogo.tsx").then((module) => ({ default: module.AdminCatalogo })));
const AdminDashboard = lazy(() => import("../pages/admin/AdminDashboard.tsx").then((module) => ({ default: module.AdminDashboard })));
const AdminLoginPage = lazy(() => import("../pages/admin/AdminLoginPage.tsx").then((module) => ({ default: module.AdminLoginPage })));
const AdminPromocoes = lazy(() => import("../pages/admin/AdminPromocoes.tsx").then((module) => ({ default: module.AdminPromocoes })));
const BarbeiroDashboard = lazy(() => import("../pages/barbeiro/BarbeiroDashboard.tsx").then((module) => ({ default: module.BarbeiroDashboard })));
const BarbeiroLoginPage = lazy(() => import("../pages/barbeiro/BarbeiroLoginPage.tsx").then((module) => ({ default: module.BarbeiroLoginPage })));
const BarbeiroPerfilPage = lazy(() => import("../pages/barbeiro/BarbeiroPerfilPage.tsx").then((module) => ({ default: module.BarbeiroPerfilPage })));
const AgendamentoPage = lazy(() => import("../pages/public/AgendamentoPage.tsx").then((module) => ({ default: module.AgendamentoPage })));
const BarbeirosPage = lazy(() => import("../pages/public/BarbeirosPage.tsx").then((module) => ({ default: module.BarbeirosPage })));
const CatalogoPage = lazy(() => import("../pages/public/CatalogoPage.tsx").then((module) => ({ default: module.CatalogoPage })));
const HomePage = lazy(() => import("../pages/public/HomePage.tsx").then((module) => ({ default: module.HomePage })));

export const router = createBrowserRouter([
  { path: "/", element: <HomePage /> },
  { path: "/acesso-restrito", element: <AcessoRestritoPage /> },
  { path: "/catalogo", element: <CatalogoPage /> },
  { path: "/barbeiros", element: <BarbeirosPage /> },
  { path: "/agendamento", element: <AgendamentoPage /> },
  { path: "/barbeiro/login", element: <BarbeiroLoginPage /> },
  {
    element: <ProtectedRoute role="barber" />,
    children: [
      { path: "/barbeiro", element: <BarbeiroDashboard /> },
      { path: "/barbeiro/perfil", element: <BarbeiroPerfilPage /> }
    ]
  },
  { path: "/admin/login", element: <AdminLoginPage /> },
  {
    element: <ProtectedRoute role="admin" />,
    children: [
      { path: "/admin", element: <AdminDashboard /> },
      { path: "/admin/catalogo", element: <AdminCatalogo /> },
      { path: "/admin/promocoes", element: <AdminPromocoes /> },
      { path: "/admin/barbeiros", element: <AdminBarbeiros /> },
      { path: "/admin/agendamentos", element: <AdminAgendamentos /> }
    ]
  }
]);
