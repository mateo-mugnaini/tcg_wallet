import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import PageHeader from "../../components/ui/PageHeader/PageHeader.jsx";
import Pagination from "../../components/ui/Pagination/Pagination.jsx";
import { POKEMON_TCG_ID } from "../../app/config/catalog.js";
import { getCardById, getCards, getSetById } from "../../redux/actions/catalog/get/catalog.actions.js";
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
  const routeKey = `${type}:${id}`;
  const [cardsPageState, setCardsPageState] = useState({ key: "", page: 1 });
  const cardsPage = cardsPageState.key === routeKey ? cardsPageState.page : 1;
  const handleCardsPageChange = (page) => setCardsPageState({ key: routeKey, page });

  useEffect(() => {
    const actions = { set: getSetById, card: getCardById };
    dispatch(clearSelections());
    dispatch(actions[type](id));
  }, [dispatch, id, type]);

  useEffect(() => {
    if (type !== "set") return;

    const request = dispatch(getCards({
      query: {
        limit: 100,
        page: cardsPage,
        setId: id,
        sortBy: "card_number",
        sortOrder: "ASC",
        tcgId: POKEMON_TCG_ID,
      },
    }));

    return () => request.abort();
  }, [cardsPage, dispatch, id, type]);

  if (!selected && catalog.status !== "failed") {
    return <LoadingDetail type={type} />;
  }

  if (!selected) {
    return (
      <section className={styles.page}>
        <PageHeader eyebrow={`CatÃ¡logo / ${type}`} title="Detalle no disponible">
          <Link className={styles.back} to="/catalog">Volver al catÃ¡logo</Link>
        </PageHeader>
      </section>
    );
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

      {type === "card" ? <CardSummary card={selected} /> : (
        <>
          <GenericSummary item={selected} type={type} />
          <SetCards
            cards={catalog.cards}
            loading={catalog.resourceStatus.cards === "loading"}
            pagination={catalog.pagination.cards}
            status={catalog.resourceStatus.cards}
            onPageChange={handleCardsPageChange}
          />
        </>
      )}
    </section>
  );
}

function SetCards({ cards, loading, pagination, status, onPageChange }) {
  return (
    <section className={styles.cardsSection}>
      <header className={styles.cardsHeader}>
        <div>
          <p className={styles.eyebrow}>Contenido del set</p>
          <h2>Cartas de este set</h2>
        </div>
        <span className={styles.cardsTotal}>{pagination.total} cartas</span>
      </header>

      {loading && <p className={styles.loadingText}>Cargando cartas del set...</p>}
      {!loading && status === "succeeded" && cards.length === 0 && (
        <p className={styles.loadingText}>Este set todavía no tiene cartas sincronizadas.</p>
      )}
      {!loading && cards.length > 0 && (
        <div className={styles.cardsGrid}>
          {cards.map((card) => (
            <Link className={styles.cardItem} key={card.id} to={`/catalog/cards/${card.id}`}>
              {card.image_url ? (
                <img alt={`Imagen de ${card.name}`} decoding="async" loading="lazy" src={card.image_url} />
              ) : <span className={styles.cardPlaceholder}>TCG</span>}
              <span className={styles.cardContent}>
                <strong>{card.name}</strong>
                <small>{card.card_number || "Sin número"}{card.rarity ? ` · ${card.rarity}` : ""}</small>
              </span>
            </Link>
          ))}
        </div>
      )}

      <Pagination
        disabled={loading}
        onPageChange={onPageChange}
        page={pagination.page}
        totalPages={pagination.totalPages}
      />
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
        <div><dt>Identificador</dt><dd>{item.id}</dd></div>
      </dl>
    </article>
  );
}

export default CatalogDetailPage;
