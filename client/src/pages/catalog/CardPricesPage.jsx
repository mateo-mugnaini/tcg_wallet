import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { getGradedPrices, getPrices } from "../../redux/actions/prices/get/prices.actions.js";
import styles from "../Page.module.css";

function CardPricesPage() {
  const { cardId } = useParams();
  const dispatch = useDispatch();
  const { normal, graded, status, error } = useSelector((state) => state.prices);

  useEffect(() => {
    dispatch(getPrices({ cardId }));
    dispatch(getGradedPrices({ cardId }));
  }, [cardId, dispatch]);

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Precios</p>
          <h1 className={styles.title}>Historial de la carta</h1>
          <p className={styles.description}>Precios normales y graded para la carta {cardId}.</p>
        </div>
        <Link className={styles.link} to={`/catalog/cards/${cardId}`}>Volver a carta</Link>
      </header>
      {error && <p className={styles.error}>{error.message}</p>}
      <div className={styles.twoColumns}>
        <article className={styles.card}>
          <h2>Precio normal</h2>
          <strong className={styles.metric}>{normal.latest?.price ?? "—"}</strong>
          <span className={styles.muted}>{normal.list.length} registros · {status}</span>
        </article>
        <article className={styles.card}>
          <h2>Precio graded</h2>
          <strong className={styles.metric}>{graded.latest?.price ?? "—"}</strong>
          <span className={styles.muted}>{graded.list.length} registros · {status}</span>
        </article>
      </div>
    </section>
  );
}

export default CardPricesPage;
