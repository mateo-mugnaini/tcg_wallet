import styles from "../../App.module.css";

function AppHeader() {
  return (
    <nav className={styles.navigation} aria-label="Navegación principal">
      <a className={styles.brand} href="/" aria-label="TCG Wallet inicio">
        <span className={styles.brandMark}>T</span>
        <span>TCG Wallet</span>
      </a>
      <span className={styles.status}>
        <span className={styles.statusDot} aria-hidden="true" />
        Frontend listo
      </span>
    </nav>
  );
}

export default AppHeader;
