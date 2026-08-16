import styles from "./SessionLoading.module.css";

function SessionLoading() {
  return (
    <main aria-busy="true" aria-live="polite" className={styles.page}>
      Comprobando sesión...
    </main>
  );
}

export default SessionLoading;
