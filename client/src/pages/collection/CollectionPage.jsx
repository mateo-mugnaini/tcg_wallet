import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import PageHeader from "../../components/ui/PageHeader/PageHeader.jsx";
import Pagination from "../../components/ui/Pagination/Pagination.jsx";
import { POKEMON_TCG_ID } from "../../app/config/catalog.js";
import { CARD_CONDITION_OPTIONS, getConditionLabel } from "../../app/config/card-conditions.js";
import { getAllSets, getCards } from "../../redux/actions/catalog/get/catalog.actions.js";
import { getGradingCompanies } from "../../redux/actions/grading/get/grading.actions.js";
import { getCollectionItems, getCollectionStats, getCollectionValue } from "../../redux/actions/collection/get/collection.actions.js";
import { createCollectionItem } from "../../redux/actions/collection/post/collection.actions.js";
import CollectionItemForm from "./components/CollectionItemForm/CollectionItemForm.jsx";
import ValuationBreakdown from "./components/ValuationBreakdown/ValuationBreakdown.jsx";
import styles from "./CollectionPage.module.css";

const initialQuery = { tcgId: POKEMON_TCG_ID, gradingCompanyId: "", limit: 20, offset: 0, sortBy: "card_name", sortOrder: "ASC" };

function formatCurrency(value, currency = "USD") {
  if (value === null || value === undefined) return "—";
  try {
    return new Intl.NumberFormat("es-ES", { style: "currency", currency, maximumFractionDigits: 2 }).format(value);
  } catch {
    return `${value} ${currency}`;
  }
}

function formatValueCaption(summary) {
  const missing = summary?.itemsMissingPriceCount ?? 0;
  const fallback = summary?.itemsUsingFallbackPriceCount ?? 0;

  return fallback > 0
    ? `${missing} sin precio · ${fallback} estimados con precio base`
    : `${missing} sin precio`;
}

function CollectionPage() {
  const dispatch = useDispatch();
  const collection = useSelector((state) => state.collection);
  const catalog = useSelector((state) => state.catalog);
  const grading = useSelector((state) => state.grading);
  const [query, setQuery] = useState(initialQuery);
  const [draft, setDraft] = useState(initialQuery);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    dispatch(getCollectionItems({ query }));
  }, [dispatch, query]);

  useEffect(() => {
    dispatch(getCollectionStats());
    dispatch(getCollectionValue());
    dispatch(getAllSets({ query: { tcgId: POKEMON_TCG_ID, sortBy: "release_date", sortOrder: "DESC" } }));
    dispatch(getGradingCompanies());
  }, [dispatch]);

  const refreshCollection = () => {
    dispatch(getCollectionItems({ query }));
    dispatch(getCollectionStats());
    dispatch(getCollectionValue());
  };

  const handleFilterSubmit = (event) => {
    event.preventDefault();
    setQuery({ ...draft, offset: 0 });
  };

  const handleCreate = async (data) => {
    await dispatch(createCollectionItem(data)).unwrap();
    setShowForm(false);
    refreshCollection();
  };

  const handleSetChange = useCallback((setId) => {
    if (!setId) return;

    dispatch(getCards({
      query: {
        limit: 100,
        setId,
        sortBy: "card_number",
        sortOrder: "ASC",
      },
    }));
  }, [dispatch]);

  const handleCardSearch = useCallback((setId, search) => {
    if (!setId) return;

    dispatch(getCards({
      query: {
        limit: 100,
        search: search || undefined,
        setId,
        sortBy: "card_number",
        sortOrder: "ASC",
      },
    }));
  }, [dispatch]);

  const summary = collection.stats?.summary;
  const valueSummary = collection.value?.summary;
  const isLoading = collection.status === "loading";

  return (
    <section className={styles.page}>
      <PageHeader
        description="Administra tus cartas, cantidades, condiciones y valoración estimada."
        eyebrow="Mi colección"
        title="Tus cartas Pokémon"
      >
        <button className={styles.addButton} onClick={() => setShowForm((current) => !current)} type="button">
          {showForm ? "Cerrar formulario" : "Agregar carta"}
        </button>
      </PageHeader>


      {showForm && (
        <CollectionItemForm
          cards={catalog.cards}
          sets={catalog.sets}
          companies={grading.companies}
          loading={collection.mutationStatus === "loading"}
          setsLoading={catalog.resourceStatus.sets === "loading"}
          cardsLoading={catalog.resourceStatus.cards === "loading"}
          onCancel={() => setShowForm(false)}
          onCardSearch={handleCardSearch}
          onSetChange={handleSetChange}
          onSubmit={handleCreate}
        />
      )}

      <div className={styles.metrics}>
        <Metric label="Cartas distintas" value={summary?.totalDistinctCards ?? "—"} />
        <Metric label="Unidades" value={summary?.totalQuantity ?? "—"} caption={`${summary?.gradedQuantity ?? 0} gradadas`} />
        <Metric
          accent
          label="Valor estimado"
          value={collection.valueStatus === "loading" ? "Calculando..." : formatCurrency(valueSummary?.totalEstimatedValue, valueSummary?.currency)}
          caption={formatValueCaption(valueSummary)}
        />
      </div>

      {collection.value && (
        <div className={styles.breakdowns}>
          <ValuationBreakdown formatCurrency={(amount) => formatCurrency(amount, valueSummary?.currency)} items={collection.value.bySet || []} nameKey="setName" title="Valor por set" />
          <ValuationBreakdown formatCurrency={(amount) => formatCurrency(amount, valueSummary?.currency)} items={collection.value.byGradingCompany || []} nameKey="gradingCompanyName" title="Valor por grading" />
        </div>
      )}

      <article className={styles.listCard}>
        <header className={styles.sectionHeader}>
          <div><p className={styles.eyebrow}>Inventario</p><h2>Items de colección</h2></div>
          <span className={styles.total}>{collection.pagination.total} resultados</span>
        </header>
        <form className={styles.filters} onSubmit={handleFilterSubmit}>
          <label>
            Condición
            <select onChange={(event) => setDraft((current) => ({ ...current, condition: event.target.value || undefined }))} value={draft.condition || ""}>
              <option value="">Todas</option>
              {CARD_CONDITION_OPTIONS.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <SelectField label="Estado" onChange={(event) => setDraft((current) => ({ ...current, isGraded: event.target.value || undefined }))} options={[["", "Todas"], ["false", "Sin grading"], ["true", "Gradadas"]]} value={draft.isGraded || ""} />
          <SelectField label="Empresa" onChange={(event) => setDraft((current) => ({ ...current, gradingCompanyId: event.target.value || undefined }))} options={[["", "Todas"], ...grading.companies.map((company) => [company.id, company.name])]} value={draft.gradingCompanyId || ""} />
          <SelectField label="Set" onChange={(event) => setDraft((current) => ({ ...current, setId: event.target.value || undefined }))} options={[["", "Todos los sets"], ...catalog.sets.map((set) => [set.id, set.name])]} value={draft.setId || ""} />
          <SelectField label="Ordenar por" onChange={(event) => setDraft((current) => ({ ...current, sortBy: event.target.value }))} options={[["card_name", "Carta"], ["quantity", "Cantidad"], ["grade", "Nota"], ["created_at", "Más recientes"]]} value={draft.sortBy} />
          <SelectField label="Dirección" onChange={(event) => setDraft((current) => ({ ...current, sortOrder: event.target.value }))} options={[["ASC", "Ascendente"], ["DESC", "Descendente"]]} value={draft.sortOrder} />
          <div className={styles.filterActions}><button className={styles.applyButton} type="submit">Aplicar</button><button className={styles.resetButton} onClick={() => { setDraft(initialQuery); setQuery(initialQuery); }} type="button">Limpiar</button></div>
        </form>

        {collection.items.length === 0 && !isLoading ? (
          <p className={styles.empty}>No hay items que coincidan con los filtros.</p>
        ) : (
          <div className={styles.items}>
            {collection.items.map((item) => (
              <Link className={styles.item} key={item.id} to={`/collection/${item.id}`}>
                {item.card?.image_url ? <img alt="" src={item.card.image_url} /> : <span className={styles.placeholder}>TCG</span>}
                <span className={styles.itemContent}>
                  <strong>{item.card?.name || item.card_id}</strong>
                  <small>{item.set?.name || "Set desconocido"} · {getConditionLabel(item.condition)}</small>
                  <span className={styles.tags}>{item.quantity} unidades {item.is_graded ? `· ${item.grading_company?.name || "Graded"} ${item.grade}` : "· Sin grading"}</span>
                </span>
              </Link>
            ))}
          </div>
        )}
        <Pagination disabled={isLoading} onPageChange={(page) => setQuery((current) => ({ ...current, offset: (page - 1) * current.limit }))} page={Math.floor(collection.pagination.offset / collection.pagination.limit) + 1} totalPages={Math.ceil(collection.pagination.total / collection.pagination.limit)} />
      </article>
    </section>
  );
}

function Metric({ label, value, caption, accent = false }) {
  return <article className={`${styles.metric} ${accent ? styles.metricAccent : ""}`}><span>{label}</span><strong>{value}</strong>{caption && <small>{caption}</small>}</article>;
}

function SelectField({ label, options, value, onChange }) {
  return <label>{label}<select onChange={onChange} value={value || ""}>{options.map(([optionValue, optionLabel]) => <option key={optionValue || optionLabel} value={optionValue}>{optionLabel}</option>)}</select></label>;
}

export default CollectionPage;
