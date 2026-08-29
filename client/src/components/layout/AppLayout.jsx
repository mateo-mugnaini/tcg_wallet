import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../../redux/actions/auth/post/auth.actions.js";
import styles from "./AppLayout.module.css";

const navigation = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/catalog", label: "Catálogo" },
  { to: "/collection", label: "Colección" },
  { to: "/opening", label: "Abrir sobres" },
  { to: "/grading", label: "Grading" },
  { to: "/profile", label: "Perfil" },
];

const adminNavigation = [
  { to: "/admin/users", label: "Usuarios" },
  { to: "/admin/sync", label: "Sync jobs" },
];

function AppLayout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const [menuOpen, setMenuOpen] = useState(false);
  const visibleNavigation = user?.role === "admin"
    ? [...navigation, ...adminNavigation]
    : navigation;

  const handleLogout = async () => {
    await dispatch(logout());
    navigate("/auth", { replace: true });
  };

  return (
    <div className={styles.layout}>
      <a className={styles.skipLink} href="#main-content">Saltar al contenido</a>
      <header className={styles.header}>
        <NavLink className={styles.brand} to="/dashboard">
          <span className={styles.brandMark}>T</span>
          <span>TCG Wallet</span>
        </NavLink>

        <button
          aria-controls="main-navigation"
          aria-expanded={menuOpen}
          aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
          className={styles.menuButton}
          onClick={() => setMenuOpen((current) => !current)}
          type="button"
        >
          <span aria-hidden="true">☰</span>
        </button>

        <nav
          aria-label="Navegación de la aplicación"
          className={`${styles.navigation} ${menuOpen ? styles.navigationOpen : ""}`}
          id="main-navigation"
        >
          {visibleNavigation.map((item) => (
            <NavLink
              className={({ isActive }) => (isActive ? styles.activeLink : styles.link)}
              end={item.to === "/dashboard"}
              key={item.to}
              onClick={() => setMenuOpen(false)}
              to={item.to}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className={styles.account}>
          <span className={styles.accountName}>{user?.username || user?.email || "Coleccionista"}</span>
          {user?.role === "admin" && <span className={styles.role}>Admin</span>}
          <button type="button" onClick={handleLogout}>Salir</button>
        </div>
      </header>
      <main className={styles.content} id="main-content" tabIndex="-1">
        <Outlet />
      </main>
    </div>
  );
}

export default AppLayout;
