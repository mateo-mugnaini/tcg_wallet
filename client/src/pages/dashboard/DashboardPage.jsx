import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getCollectionStats, getCollectionValue } from "../../redux/actions/collection/get/collection.actions.js";
import styles from "../Page.module.css";

function DashboardPage() {
  const dispatch = useDispatch();
  const { stats, value, status, error } = useSelector((state) => state.collection);

  useEffect(() => {
    dispatch(getCollectionStats());
    dispatch(getCollectionValue());
  }, [dispatch]);

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Resumen</p>
          <h1 className={styles.title}>Tu dashboard</h1>
          <p className={styles.description}>La información principal de tu colección en un solo lugar.</p>
        </div>
      </header>
      {error && <p className={styles.error}>{error.message}</p>}
      <div className={styles.grid}>
        <article className={styles.card}>
          <h2>Cartas</h2>
          <strong className={styles.metric}>{stats?.totalItems ?? "—"}</strong>
          <span className={styles.muted}>Items registrados</span>
        </article>
        <article className={styles.card}>
          <h2>Valor estimado</h2>
          <strong className={styles.metric}>{value?.totalValue ?? "—"}</strong>
          <span className={styles.muted}>Valor calculado por el backend</span>
        </article>
        <article className={styles.card}>
          <h2>Estado API</h2>
          <strong className={styles.metric}>{status === "loading" ? "..." : "OK"}</strong>
          <span className={styles.muted}>Consultas de resumen conectadas</span>
        </article>
      </div>
    </section>
  );
}

export default DashboardPage;
