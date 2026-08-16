import { lazy, Suspense, useEffect, useRef } from "react";
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
import { getAccessTokenExpiration } from "../../lib/auth/access-token.js";
import { refreshSession } from "../../redux/actions/auth/post/auth.actions.js";

const AuthPages = lazy(() => import("../../pages/auth/authPages.jsx"));
const DashboardPage = lazy(() => import("../../pages/dashboard/DashboardPage.jsx"));
const CatalogPage = lazy(() => import("../../pages/catalog/CatalogPage.jsx"));
const CatalogDetailPage = lazy(() => import("../../pages/catalog/CatalogDetailPage.jsx"));
const CardPricesPage = lazy(() => import("../../pages/catalog/CardPricesPage.jsx"));
const CollectionPage = lazy(() => import("../../pages/collection/CollectionPage.jsx"));
const CollectionDetailPage = lazy(() => import("../../pages/collection/CollectionDetailPage.jsx"));
const GradingCompaniesPage = lazy(() => import("../../pages/grading/GradingCompaniesPage.jsx"));
const ProfilePage = lazy(() => import("../../pages/profile/ProfilePage.jsx"));
const SyncJobsPage = lazy(() => import("../../pages/admin/SyncJobsPage.jsx"));
const UsersPage = lazy(() => import("../../pages/admin/UsersPage.jsx"));
const NotFoundPage = lazy(() => import("../../pages/not-found/NotFoundPage.jsx"));

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
        <Suspense fallback={<SessionLoading />}>
          <Routes>
            <Route path="/auth" element={<AuthRoute />} />
            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="catalog" element={<CatalogPage />} />
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
        </Suspense>
      </SessionBootstrap>
    </BrowserRouter>
  );
}

export default AppRouter;
