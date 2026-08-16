import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { getCardById, getSetById, getTcgById } from "../../redux/actions/catalog/get/catalog.actions.js";
import styles from "../Page.module.css";

function CatalogDetailPage({ type }) {
  const dispatch = useDispatch();
  const params = useParams();
  const catalog = useSelector((state) => state.catalog);
  const id = params[`${type}Id`];
  const selected = catalog[`selected${type[0].toUpperCase()}${type.slice(1)}`];

  useEffect(() => {
    const actions = { tcg: getTcgById, set: getSetById, card: getCardById };
    dispatch(actions[type](id));
  }, [dispatch, id, type]);

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Catálogo / {type}</p>
          <h1 className={styles.title}>{selected?.name || selected?.card_name || "Detalle"}</h1>
        </div>
        {type === "card" && <Link className={styles.link} to={`/catalog/cards/${id}/prices`}>Ver precios</Link>}
      </header>
      <article className={styles.card}>
        <p className={styles.muted}>ID: {id}</p>
        <pre>{JSON.stringify(selected, null, 2)}</pre>
      </article>
    </section>
  );
}

export default CatalogDetailPage;
