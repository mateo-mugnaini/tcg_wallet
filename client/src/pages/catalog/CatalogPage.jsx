import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import PageHeader from "../../components/ui/PageHeader/PageHeader.jsx";
import Pagination from "../../components/ui/Pagination/Pagination.jsx";
import { getCards, getSets, getTcgs } from "../../redux/actions/catalog/get/catalog.actions.js";
import { debugLog } from "../../lib/debug/logger.js";
import styles from "./CatalogPage.module.css";

const initialTcgQuery = { page: 1, limit: 10, sortBy: "name", sortOrder: "ASC" };
const initialSetQuery = { page: 1, limit: 10, sortBy: "name", sortOrder: "ASC" };
const initialCardQuery = { page: 1, limit: 12, sortBy: "name", sortOrder: "ASC" };

function CatalogPage() {
  const dispatch = useDispatch();
  const {
    tcgs,
    sets,
    cards,
    pagination,
    resourceStatus,
  } = useSelector((state) => state.catalog);
  const [tcgQuery, setTcgQuery] = useState(initialTcgQuery);
  const [setQuery, setSetQuery] = useState(initialSetQuery);
  const [cardQuery, setCardQuery] = useState(initialCardQuery);
  const [tcgDraft, setTcgDraft] = useState(initialTcgQuery);
  const [setDraft, setSetDraft] = useState(initialSetQuery);
  const [cardDraft, setCardDraft] = useState(initialCardQuery);

  useEffect(() => {
    dispatch(getTcgs({ query: tcgQuery }));
  }, [dispatch, tcgQuery]);

  useEffect(() => {
    dispatch(getSets({ query: setQuery }));
  }, [dispatch, setQuery]);

  useEffect(() => {
    dispatch(getCards({ query: cardQuery }));
  }, [dispatch, cardQuery]);

  useEffect(() => {
    debugLog("catalog_resources_state", {
      statuses: resourceStatus,
      counts: {
        tcgs: tcgs.length,
        sets: sets.length,
        cards: cards.length,
      },
      pagination,
    });
  }, [cards.length, pagination, resourceStatus, sets.length, tcgs.length]);

  const submitQuery = (event, setQueryState, draft) => {
    event.preventDefault();
    setQueryState({ ...draft, page: 1 });
  };

  const resetQuery = (setQueryState, setDraft, initialQuery) => {
    setDraft(initialQuery);
    setQueryState(initialQuery);
  };

  return (
    <section className={styles.page}>
      <PageHeader
        description="Explora TCGs, sets y cartas consultados desde el catálogo real."
        eyebrow="Catálogo"
        title="Explora tus TCG"
      />

      <CatalogSection
        filters={(
          <form className={styles.filters} onSubmit={(event) => submitQuery(event, setTcgQuery, tcgDraft)}>
            <label>
              Buscar TCG
              <input
                maxLength={100}
                onChange={(event) => setTcgDraft((current) => ({ ...current, search: event.target.value }))}
                placeholder="Pokémon, Magic..."
                value={tcgDraft.search || ""}
              />
            </label>
            <SelectField
              label="Ordenar por"
              onChange={(event) => setTcgDraft((current) => ({ ...current, sortBy: event.target.value }))}
              options={[["name", "Nombre"], ["created_at", "Más recientes"]]}
              value={tcgDraft.sortBy}
            />
            <SelectField
              label="Dirección"
              onChange={(event) => setTcgDraft((current) => ({ ...current, sortOrder: event.target.value }))}
              options={[["ASC", "Ascendente"], ["DESC", "Descendente"]]}
              value={tcgDraft.sortOrder}
            />
            <FilterActions onReset={() => resetQuery(setTcgQuery, setTcgDraft, initialTcgQuery)} />
          </form>
        )}
        loading={resourceStatus.tcgs === "loading"}
        pagination={pagination.tcgs}
        onPageChange={(page) => setTcgQuery((current) => ({ ...current, page }))}
        title="TCGs"
      >
        <div className={styles.itemGrid}>
          {tcgs.map((tcg) => (
            <Link className={styles.itemCard} key={tcg.id} to={`/catalog/tcgs/${tcg.id}`}>
              <strong>{tcg.name}</strong>
              <span>Ver catálogo</span>
            </Link>
          ))}
        </div>
        {resourceStatus.tcgs === "succeeded" && tcgs.length === 0 && <EmptyMessage text="No hay TCGs para mostrar." />}
      </CatalogSection>

      <CatalogSection
        filters={(
          <form className={styles.filters} onSubmit={(event) => submitQuery(event, setSetQuery, setDraft)}>
            <label>
              Buscar set
              <input
                maxLength={100}
                onChange={(event) => setSetDraft((current) => ({ ...current, search: event.target.value }))}
                placeholder="Base Set, Neo Genesis..."
                value={setDraft.search || ""}
              />
            </label>
            <SelectField
              label="TCG"
              onChange={(event) => setSetDraft((current) => ({ ...current, tcgId: event.target.value || undefined }))}
              options={[["", "Todos los TCGs"], ...tcgs.map((tcg) => [tcg.id, tcg.name])]}
              value={setDraft.tcgId || ""}
            />
            <SelectField
              label="Ordenar por"
              onChange={(event) => setSetDraft((current) => ({ ...current, sortBy: event.target.value }))}
              options={[["name", "Nombre"], ["release_date", "Lanzamiento"], ["created_at", "Más recientes"]]}
              value={setDraft.sortBy}
            />
            <FilterActions onReset={() => resetQuery(setSetQuery, setSetDraft, initialSetQuery)} />
          </form>
        )}
        loading={resourceStatus.sets === "loading"}
        pagination={pagination.sets}
        onPageChange={(page) => setSetQuery((current) => ({ ...current, page }))}
        title="Sets"
      >
        <div className={styles.itemGrid}>
          {sets.map((set) => (
            <Link className={styles.itemCard} key={set.id} to={`/catalog/sets/${set.id}`}>
              <strong>{set.name}</strong>
              <span>{set.code || set.external_id || "Sin código"}</span>
            </Link>
          ))}
        </div>
        {resourceStatus.sets === "succeeded" && sets.length === 0 && <EmptyMessage text="No hay sets para mostrar." />}
      </CatalogSection>

      <CatalogSection
        filters={(
          <form className={styles.filters} onSubmit={(event) => submitQuery(event, setCardQuery, cardDraft)}>
            <label>
              Buscar carta
              <input
                maxLength={100}
                onChange={(event) => setCardDraft((current) => ({ ...current, search: event.target.value }))}
                placeholder="Charizard, Pikachu..."
                value={cardDraft.search || ""}
              />
            </label>
            <SelectField
              label="TCG"
              onChange={(event) => setCardDraft((current) => ({ ...current, tcgId: event.target.value || undefined, setId: undefined }))}
              options={[["", "Todos los TCGs"], ...tcgs.map((tcg) => [tcg.id, tcg.name])]}
              value={cardDraft.tcgId || ""}
            />
            <SelectField
              label="Set"
              onChange={(event) => setCardDraft((current) => ({ ...current, setId: event.target.value || undefined }))}
              options={[["", "Todos los sets"], ...sets.map((set) => [set.id, set.name])]}
              value={cardDraft.setId || ""}
            />
            <label>
              Rareza
              <input
                maxLength={100}
                onChange={(event) => setCardDraft((current) => ({ ...current, rarity: event.target.value }))}
                placeholder="Rareza"
                value={cardDraft.rarity || ""}
              />
            </label>
            <SelectField
              label="Ordenar por"
              onChange={(event) => setCardDraft((current) => ({ ...current, sortBy: event.target.value }))}
              options={[["name", "Nombre"], ["card_number", "Número"], ["rarity", "Rareza"], ["created_at", "Más recientes"]]}
              value={cardDraft.sortBy}
            />
            <SelectField
              label="Dirección"
              onChange={(event) => setCardDraft((current) => ({ ...current, sortOrder: event.target.value }))}
              options={[["ASC", "Ascendente"], ["DESC", "Descendente"]]}
              value={cardDraft.sortOrder}
            />
            <FilterActions onReset={() => resetQuery(setCardQuery, setCardDraft, initialCardQuery)} />
          </form>
        )}
        loading={resourceStatus.cards === "loading"}
        pagination={pagination.cards}
        onPageChange={(page) => setCardQuery((current) => ({ ...current, page }))}
        title="Cartas"
      >
        <div className={styles.cardGrid}>
          {cards.map((card) => (
            <Link className={styles.cardItem} key={card.id} to={`/catalog/cards/${card.id}`}>
              {card.image_url ? (
                <img
                  alt={`Imagen de ${card.name}`}
                  decoding="async"
                  loading="lazy"
                  src={card.image_url}
                />
              ) : <span className={styles.cardPlaceholder}>TCG</span>}
              <span className={styles.cardContent}>
                <strong>{card.name}</strong>
                <small>{card.card_number || "Sin número"}{card.rarity ? ` · ${card.rarity}` : ""}</small>
              </span>
            </Link>
          ))}
        </div>
        {resourceStatus.cards === "succeeded" && cards.length === 0 && <EmptyMessage text="No hay cartas para mostrar." />}
      </CatalogSection>
    </section>
  );
}

function CatalogSection({ title, filters, children, loading, pagination, onPageChange }) {
  return (
    <article className={styles.section}>
      <header className={styles.sectionHeader}>
        <div>
          <h2>{title}</h2>
          {loading && <span className={styles.loading}>Cargando...</span>}
        </div>
        <span className={styles.total}>{pagination.total} resultados</span>
      </header>
      {filters}
      {children}
      <Pagination
        disabled={loading}
        onPageChange={onPageChange}
        page={pagination.page}
        totalPages={pagination.totalPages}
      />
    </article>
  );
}

function SelectField({ label, options, value, onChange }) {
  return (
    <label>
      {label}
      <select onChange={onChange} value={value || ""}>
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue || optionLabel} value={optionValue}>{optionLabel}</option>
        ))}
      </select>
    </label>
  );
}

function FilterActions({ onReset }) {
  return (
    <div className={styles.filterActions}>
      <button className={styles.applyButton} type="submit">Aplicar</button>
      <button className={styles.resetButton} onClick={onReset} type="button">Limpiar</button>
    </div>
  );
}

function EmptyMessage({ text }) {
  return <p className={styles.empty}>{text}</p>;
}

export default CatalogPage;
