import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../../redux/actions/auth/post/auth.actions.js";
import styles from "./AppLayout.module.css";

const navigation = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/catalog", label: "Catálogo" },
  { to: "/collection", label: "Colección" },
  { to: "/grading", label: "Grading" },
  { to: "/profile", label: "Perfil" },
];

function AppLayout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);

  const handleLogout = async () => {
    await dispatch(logout());
    navigate("/auth", { replace: true });
  };

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <NavLink className={styles.brand} to="/dashboard">
          <span className={styles.brandMark}>T</span>
          <span>TCG Wallet</span>
        </NavLink>

        <nav className={styles.navigation} aria-label="Navegación de la aplicación">
          {navigation.map((item) => (
            <NavLink
              className={({ isActive }) => (isActive ? styles.activeLink : styles.link)}
              end={item.to === "/dashboard"}
              key={item.to}
              to={item.to}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className={styles.account}>
          <span>{user?.username || user?.email || "Coleccionista"}</span>
          <button type="button" onClick={handleLogout}>Salir</button>
        </div>
      </header>
      <main className={styles.content}>
        <Outlet />
      </main>
    </div>
  );
}

export default AppLayout;
