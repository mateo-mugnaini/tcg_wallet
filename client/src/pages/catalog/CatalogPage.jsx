import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import PageHeader from "../../components/ui/PageHeader/PageHeader.jsx";
import Pagination from "../../components/ui/Pagination/Pagination.jsx";
import { POKEMON_TCG_ID } from "../../app/config/catalog.js";
import { getCards, getSets } from "../../redux/actions/catalog/get/catalog.actions.js";
import { debugLog } from "../../lib/debug/logger.js";
import styles from "./CatalogPage.module.css";

const initialSetQuery = { tcgId: POKEMON_TCG_ID, page: 1, limit: 10, sortBy: "name", sortOrder: "ASC" };
const initialCardQuery = { tcgId: POKEMON_TCG_ID, page: 1, limit: 12, sortBy: "name", sortOrder: "ASC" };

function CatalogPage() {
  const dispatch = useDispatch();
  const { sets, cards, pagination, resourceStatus } = useSelector((state) => state.catalog);
  const [setQuery, setSetQuery] = useState(initialSetQuery);
  const [cardQuery, setCardQuery] = useState(initialCardQuery);
  const [setDraft, setSetDraft] = useState(initialSetQuery);
  const [cardDraft, setCardDraft] = useState(initialCardQuery);

  useEffect(() => {
    dispatch(getSets({ query: setQuery }));
  }, [dispatch, setQuery]);

  useEffect(() => {
    dispatch(getCards({ query: cardQuery }));
  }, [cardQuery, dispatch]);

  useEffect(() => {
    debugLog("pokemon_catalog_resources_state", {
      counts: { cards: cards.length, sets: sets.length },
      pagination,
      statuses: resourceStatus,
    });
  }, [cards.length, pagination, resourceStatus, sets.length]);

  const submitQuery = (event, setQueryState, draft) => {
    event.preventDefault();
    setQueryState({ ...draft, page: 1, tcgId: POKEMON_TCG_ID });
  };

  const resetQuery = (setQueryState, setDraft, initialQuery) => {
    setDraft(initialQuery);
    setQueryState(initialQuery);
  };

  return (
    <section className={styles.page}>
      <PageHeader
        description="Explora sets y cartas del catálogo oficial de Pokémon TCG."
        eyebrow="Pokémon"
        title="Catálogo Pokémon"
      />

      <CatalogSection
        filters={(
          <form className={styles.filters} onSubmit={(event) => submitQuery(event, setSetQuery, setSetDraft)}>
            <SelectField
              label="Seleccionar set"
              onChange={(event) => setSetDraft((current) => ({ ...current, search: event.target.value || undefined }))}
              options={[["", "Todos los sets"], ...sets.map((set) => [set.name, set.name])]}
              value={setDraft.search || ""}
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
        onPageChange={(page) => setSetQuery((current) => ({ ...current, page, tcgId: POKEMON_TCG_ID }))}
        title="Sets de Pokémon"
      >
        <div className={styles.itemGrid}>
          {sets.map((set) => (
            <Link className={styles.itemCard} key={set.id} to={`/catalog/sets/${set.id}`}>
              <strong>{set.name}</strong>
              <span>{set.code || set.external_id || "Sin código"}</span>
            </Link>
          ))}
        </div>
        {resourceStatus.sets === "succeeded" && sets.length === 0 && <EmptyMessage text="No hay sets de Pokémon para mostrar." />}
      </CatalogSection>

      <CatalogSection
        filters={(
          <form className={styles.filters} onSubmit={(event) => submitQuery(event, setCardQuery, setCardDraft)}>
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
        onPageChange={(page) => setCardQuery((current) => ({ ...current, page, tcgId: POKEMON_TCG_ID }))}
        title="Cartas de Pokémon"
      >
        <div className={styles.cardGrid}>
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
        {resourceStatus.cards === "succeeded" && cards.length === 0 && <EmptyMessage text="No hay cartas de Pokémon para mostrar." />}
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
      <Pagination disabled={loading} onPageChange={onPageChange} page={pagination.page} totalPages={pagination.totalPages} />
    </article>
  );
}

function SelectField({ label, options, value, onChange }) {
  return (
    <label>
      {label}
      <select onChange={onChange} value={value || ""}>
        {options.map(([optionValue, optionLabel]) => <option key={optionValue || optionLabel} value={optionValue}>{optionLabel}</option>)}
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
