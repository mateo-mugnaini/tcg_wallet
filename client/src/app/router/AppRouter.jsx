import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
} from "react-router-dom";
import SessionLoading from "../../components/routing/SessionLoading.jsx";
import AppLayout from "../../components/layout/AppLayout.jsx";
import AuthPage from "../../pages/auth/AuthPage.jsx";
import DashboardPage from "../../pages/dashboard/DashboardPage.jsx";
import CatalogPage from "../../pages/catalog/CatalogPage.jsx";
import CatalogDetailPage from "../../pages/catalog/CatalogDetailPage.jsx";
import CardPricesPage from "../../pages/catalog/CardPricesPage.jsx";
import CollectionPage from "../../pages/collection/CollectionPage.jsx";
import CollectionDetailPage from "../../pages/collection/CollectionDetailPage.jsx";
import GradingCompaniesPage from "../../pages/grading/GradingCompaniesPage.jsx";
import ProfilePage from "../../pages/profile/ProfilePage.jsx";
import SyncJobsPage from "../../pages/admin/SyncJobsPage.jsx";
import UsersPage from "../../pages/admin/UsersPage.jsx";
import { refreshSession } from "../../redux/actions/auth/post/auth.actions.js";

function SessionBootstrap({ children }) {
  const dispatch = useDispatch();
  const initialized = useSelector((state) => state.auth.initialized);

  useEffect(() => {
    if (!initialized) dispatch(refreshSession());
  }, [dispatch, initialized]);

  if (!initialized) return <SessionLoading />;

  return children;
}

function ProtectedRoute() {
  const accessToken = useSelector((state) => state.auth.accessToken);
  return accessToken ? <Outlet /> : <Navigate to="/auth" replace />;
}

function AuthRoute() {
  const accessToken = useSelector((state) => state.auth.accessToken);
  return accessToken ? <Navigate to="/dashboard" replace /> : <AuthPage />;
}

function AppRouter() {
  return (
    <BrowserRouter>
      <SessionBootstrap>
        <Routes>
          <Route path="/auth" element={<AuthRoute />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="catalog" element={<CatalogPage />} />
              <Route path="catalog/tcgs/:tcgId" element={<CatalogDetailPage type="tcg" />} />
              <Route path="catalog/sets/:setId" element={<CatalogDetailPage type="set" />} />
              <Route path="catalog/cards/:cardId" element={<CatalogDetailPage type="card" />} />
              <Route path="catalog/cards/:cardId/prices" element={<CardPricesPage />} />
              <Route path="collection" element={<CollectionPage />} />
              <Route path="collection/:itemId" element={<CollectionDetailPage />} />
              <Route path="grading" element={<GradingCompaniesPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="admin/sync" element={<SyncJobsPage />} />
              <Route path="admin/users" element={<UsersPage />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/auth" replace />} />
        </Routes>
      </SessionBootstrap>
    </BrowserRouter>
  );
}

export default AppRouter;
