import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { getCollectionItemById } from "../../redux/actions/collection/get/collection.actions.js";
import styles from "../Page.module.css";

function CollectionDetailPage() {
  const { itemId } = useParams();
  const dispatch = useDispatch();
  const { selectedItem, error } = useSelector((state) => state.collection);

  useEffect(() => {
    dispatch(getCollectionItemById(itemId));
  }, [dispatch, itemId]);

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <div><p className={styles.eyebrow}>Colección / detalle</p><h1 className={styles.title}>Item de colección</h1></div>
        <Link className={styles.link} to="/collection">Volver</Link>
      </header>
      {error && <p className={styles.error}>{error.message}</p>}
      <article className={styles.card}><pre>{JSON.stringify(selectedItem, null, 2)}</pre></article>
    </section>
  );
}

export default CollectionDetailPage;
