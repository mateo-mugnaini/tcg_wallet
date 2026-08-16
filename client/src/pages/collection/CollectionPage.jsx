import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { getCollectionItems, getCollectionStats, getCollectionValue } from "../../redux/actions/collection/get/collection.actions.js";
import styles from "../Page.module.css";

function CollectionPage() {
  const dispatch = useDispatch();
  const { items, stats, value, error, status } = useSelector((state) => state.collection);

  useEffect(() => {
    dispatch(getCollectionItems());
    dispatch(getCollectionStats());
    dispatch(getCollectionValue());
  }, [dispatch]);

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Mi colección</p>
          <h1 className={styles.title}>Tus cartas</h1>
          <p className={styles.description}>CRUD, estadísticas y valoración de collection-items.</p>
        </div>
        <span className={styles.muted}>{status === "loading" ? "Cargando..." : "Conectado"}</span>
      </header>
      {error && <p className={styles.error}>{error.message}</p>}
      <div className={styles.grid}>
        <article className={styles.card}><h2>Items</h2><strong className={styles.metric}>{items.length}</strong></article>
        <article className={styles.card}><h2>Total</h2><strong className={styles.metric}>{stats?.totalItems ?? "—"}</strong></article>
        <article className={styles.card}><h2>Valor</h2><strong className={styles.metric}>{value?.totalValue ?? "—"}</strong></article>
      </div>
      <article className={styles.card}>
        <h2>Últimos items</h2>
        <ul className={styles.list}>
          {items.map((item) => <li className={styles.listItem} key={item.id}><span>{item.card?.name || item.card_name || item.id}</span><Link className={styles.link} to={`/collection/${item.id}`}>Ver</Link></li>)}
        </ul>
      </article>
    </section>
  );
}

export default CollectionPage;
