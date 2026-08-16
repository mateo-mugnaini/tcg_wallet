import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import PageHeader from "../../components/ui/PageHeader/PageHeader.jsx";
import { getCardById, getSetById, getTcgById } from "../../redux/actions/catalog/get/catalog.actions.js";
import { clearSelections } from "../../redux/slices/catalog.slice.js";
import CardSummary from "./components/CardSummary/CardSummary.jsx";
import styles from "./CatalogDetailPage.module.css";

function CatalogDetailPage({ type }) {
  const dispatch = useDispatch();
  const params = useParams();
  const catalog = useSelector((state) => state.catalog);
  const id = params[`${type}Id`];
  const selectedKey = `selected${type[0].toUpperCase()}${type.slice(1)}`;
  const selected = catalog[selectedKey];

  useEffect(() => {
    const actions = { tcg: getTcgById, set: getSetById, card: getCardById };
    dispatch(clearSelections());
    dispatch(actions[type](id));
  }, [dispatch, id, type]);

  if (catalog.status === "loading" || !selected) {
    return <LoadingDetail type={type} />;
  }

  return (
    <section className={styles.page}>
      <PageHeader
        description={type === "card" ? "Identidad, contexto de catálogo y precios recientes." : "Información del catálogo."}
        eyebrow={`Catálogo / ${type}`}
        title={selected.name || "Detalle"}
      >
        {type === "card" && <Link className={styles.action} to={`/catalog/cards/${id}/prices`}>Ver precios</Link>}
        <Link className={styles.back} to="/catalog">Volver al catálogo</Link>
      </PageHeader>

      {catalog.error && <p className={styles.error} role="alert">{catalog.error.message}</p>}
      {type === "card" ? <CardSummary card={selected} /> : <GenericSummary item={selected} type={type} />}
    </section>
  );
}

function LoadingDetail({ type }) {
  return (
    <section className={styles.page} aria-busy="true">
      <PageHeader eyebrow={`Catálogo / ${type}`} title="Cargando detalle..." />
      <div className={styles.loadingCard}>Consultando información del catálogo...</div>
    </section>
  );
}

function GenericSummary({ item, type }) {
  return (
    <article className={styles.genericCard}>
      <dl>
        <div><dt>Nombre</dt><dd>{item.name}</dd></div>
        {type === "set" && <div><dt>Código</dt><dd>{item.code || item.external_id || "—"}</dd></div>}
        {type === "set" && <div><dt>Fecha de lanzamiento</dt><dd>{item.release_date || "—"}</dd></div>}
        {type === "tcg" && <div><dt>Creado</dt><dd>{item.created_at || "—"}</dd></div>}
        <div><dt>Identificador</dt><dd>{item.id}</dd></div>
      </dl>
    </article>
  );
}

export default CatalogDetailPage;
