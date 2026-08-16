import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import SessionLoading from "../../components/routing/SessionLoading.jsx";
import AdminRoute from "../../components/routing/AdminRoute.jsx";
import AppLayout from "../../components/layout/AppLayout.jsx";
import AuthPages from "../../pages/auth/authPages.jsx";
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
import NotFoundPage from "../../pages/not-found/NotFoundPage.jsx";
import { getAccessTokenExpiration } from "../../lib/auth/access-token.js";
import { refreshSession } from "../../redux/actions/auth/post/auth.actions.js";

function SessionBootstrap({ children }) {
  const dispatch = useDispatch();
  const refreshRequestedRef = useRef(false);
  const initialized = useSelector((state) => state.auth.initialized);
  const accessToken = useSelector((state) => state.auth.accessToken);

  useEffect(() => {
    if (!initialized && !refreshRequestedRef.current) {
      refreshRequestedRef.current = true;
      dispatch(refreshSession());
    }
  }, [dispatch, initialized]);

  useEffect(() => {
    if (!accessToken) return undefined;

    const expiresAt = getAccessTokenExpiration(accessToken);
    if (!expiresAt) return undefined;

    const refreshIn = Math.max(1000, expiresAt - Date.now() - 60_000);
    const timeoutId = window.setTimeout(() => {
      dispatch(refreshSession());
    }, refreshIn);

    return () => window.clearTimeout(timeoutId);
  }, [accessToken, dispatch]);

  if (!initialized) return <SessionLoading />;

  return children;
}

function ProtectedRoute() {
  const accessToken = useSelector((state) => state.auth.accessToken);
  return accessToken ? <Outlet /> : <Navigate to="/auth" replace />;
}

function AuthRoute() {
  const accessToken = useSelector((state) => state.auth.accessToken);
  return accessToken ? <Navigate to="/dashboard" replace /> : <AuthPages />;
}

function RouteFocus() {
  const location = useLocation();

  useEffect(() => {
    const mainContent = document.getElementById("main-content");
    mainContent?.focus({ preventScroll: true });
  }, [location.pathname]);

  return null;
}

function AppRouter() {
  return (
    <BrowserRouter>
      <RouteFocus />
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
              <Route element={<AdminRoute />}>
                <Route path="admin/sync" element={<SyncJobsPage />} />
                <Route path="admin/users" element={<UsersPage />} />
              </Route>
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/auth" replace />} />
        </Routes>
      </SessionBootstrap>
    </BrowserRouter>
  );
}

export default AppRouter;
