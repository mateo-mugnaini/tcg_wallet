import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { getCards, getSets, getTcgs } from "../../redux/actions/catalog/get/catalog.actions.js";
import styles from "../Page.module.css";

function CatalogPage() {
  const dispatch = useDispatch();
  const { tcgs, sets, cards, status, error } = useSelector((state) => state.catalog);

  useEffect(() => {
    dispatch(getTcgs());
    dispatch(getSets({ query: { limit: 12 } }));
    dispatch(getCards({ query: { limit: 12 } }));
  }, [dispatch]);

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Catálogo</p>
          <h1 className={styles.title}>Explora tus TCG</h1>
          <p className={styles.description}>TCGs, sets y cartas consultados desde los endpoints del catálogo.</p>
        </div>
        <span className={styles.muted}>{status === "loading" ? "Cargando..." : "Listo"}</span>
      </header>
      {error && <p className={styles.error}>{error.message}</p>}
      <div className={styles.twoColumns}>
        <article className={styles.card}>
          <h2>TCGs</h2>
          <ul className={styles.list}>
            {tcgs.map((tcg) => <li className={styles.listItem} key={tcg.id}>{tcg.name || tcg.code}</li>)}
          </ul>
        </article>
        <article className={styles.card}>
          <h2>Sets</h2>
          <ul className={styles.list}>
            {sets.map((set) => <li className={styles.listItem} key={set.id}><span>{set.name || set.code}</span><Link className={styles.link} to={`/catalog/sets/${set.id}`}>Ver</Link></li>)}
          </ul>
        </article>
      </div>
      <article className={styles.card}>
        <h2>Cartas recientes</h2>
        <ul className={styles.list}>
          {cards.map((card) => <li className={styles.listItem} key={card.id}><span>{card.name || card.card_name}</span><Link className={styles.link} to={`/catalog/cards/${card.id}`}>Detalle</Link></li>)}
        </ul>
      </article>
    </section>
  );
}

export default CatalogPage;
